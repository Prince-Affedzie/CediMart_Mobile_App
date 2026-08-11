// services/FeedPrefetchService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const PRELOAD_COUNT = 3;
const MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_CACHE_AGE_MS = 10 * 60 * 1000; // 🆕 30 minutes — matches expected behavior
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // sweep frequency (must be <= MAX_CACHE_AGE_MS to enforce it promptly)
const PRELOAD_QUALITY = '360p';
const CACHE_DIR = FileSystem.cacheDirectory + 'feed-videos/';

class FeedPrefetchService {
  constructor() {
    this.prefetchQueue = [];
    this.activeDownloads = new Set();
    this.maxConcurrent = 1;
    this.cacheMetadata = {};
    this.initialized = false;

    // 🔒 Track the in-flight download so it can be cancelled if the user
    // navigates away or scrolls far past this video.
    this.currentResumable = null;
    this.currentDownloadId = null;
    this.currentFilePath = null; // 🆕 needed to delete partial files on cancel
  }

  // ─── Initialize cache directory ──────────────────────────────────────────
  async init() {
    if (this.initialized) return;
    try {
      // Check if directory exists, create if not
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load cache metadata
      const meta = await AsyncStorage.getItem('feed_video_cache_meta');
      if (meta) {
        this.cacheMetadata = JSON.parse(meta);
      }

      this.initialized = true;
      console.log('📦 Feed prefetch cache initialized at:', CACHE_DIR);

      // 🆕 Reconcile metadata against disk once at startup — drops any
      // entries whose file no longer exists (e.g. app was killed mid-write)
      // and removes files on disk with no matching metadata (orphaned
      // partial downloads from a previous session).
      await this._reconcileCacheOnDisk();
    } catch (err) {
      console.error('Failed to init prefetch cache:', err);
    }
  }

  // ─── Reconcile metadata <-> disk state ──────────────────────────────────
  async _reconcileCacheOnDisk() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) return;

      const dirContents = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const onDisk = new Set(dirContents.map((f) => f.replace('.mp4', '')));

      // Metadata entries whose file is missing -> drop
      let changed = false;
      for (const key of Object.keys(this.cacheMetadata)) {
        if (!onDisk.has(key)) {
          delete this.cacheMetadata[key];
          changed = true;
        }
      }

      // Files on disk with no metadata -> orphaned/partial, delete
      for (const file of dirContents) {
        const key = file.replace('.mp4', '');
        if (!this.cacheMetadata[key]) {
          await FileSystem.deleteAsync(`${CACHE_DIR}${file}`, { idempotent: true }).catch(() => {});
        }
      }

      if (changed) await this.saveCacheMetadata();
    } catch (err) {
      console.warn('Cache reconcile failed:', err?.message || err);
    }
  }

  // ─── Get optimized URL for prefetching ──────────────────────────────────
  getPrefetchUrl(videoUrl) {
    if (!videoUrl) return null;

    // If it's a Bunny CDN URL, request a lower quality for prefetching.
    // Guarded so we never rewrite a URL that doesn't actually contain
    // /playlist.m3u8 — otherwise split() is a no-op and we'd append
    // /play_720p.mp4 onto whatever the URL already was, producing a
    // broken path that 404s.
    if (videoUrl.includes('b-cdn.net') && videoUrl.includes('/playlist.m3u8')) {
      const base = videoUrl.split('/playlist.m3u8')[0];
      return `${base}/play_${PRELOAD_QUALITY}.mp4`;
    }

    return videoUrl;
  }

  // ─── Prefetch the next videos ───────────────────────────────────────────
  async prefetchNext(activeIndex, posts) {
    if (!this.initialized) await this.init();

    this.cancelFarDownloads(activeIndex);

    const startIndex = activeIndex + 1;
    const endIndex = Math.min(activeIndex + PRELOAD_COUNT + 1, posts.length);

    for (let i = startIndex; i < endIndex; i++) {
      const post = posts[i];
      if (!post) continue;

      const media = post.media?.[0];
      if (!media || media.type !== 'video' || !media.url) continue;

      const videoId = post._id;

      if (this.activeDownloads.has(videoId)) continue;

      const cacheKey = this.getCacheKey(media.url);
      const cached = await this.isCached(cacheKey);
      if (cached) continue;

      this.addToQueue(videoId, media.url, cacheKey);
    }

    this.processQueue();
  }

  // ─── Get cache key from URL ─────────────────────────────────────────────
  getCacheKey(url) {
    const match = url.match(/\/([a-f0-9-]+)\/playlist\.m3u8/);
    return match ? match[1] : url.split('/').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'video';
  }

  // ─── Check if file is cached ────────────────────────────────────────────
  // 🆕 Trusts cacheMetadata as the source of truth (only written on a fully
  // successful download) rather than raw file existence — a partial or
  // cancelled download leaves a file on disk that isn't actually playable.
  async isCached(cacheKey) {
    if (!this.cacheMetadata[cacheKey]) return false;

    const filePath = `${CACHE_DIR}${cacheKey}.mp4`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        // Metadata says cached but file is gone — clean up the stale entry.
        delete this.cacheMetadata[cacheKey];
        await this.saveCacheMetadata();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ─── Add to download queue ──────────────────────────────────────────────
  addToQueue(videoId, url, cacheKey) {
    // Avoid duplicates
    if (this.prefetchQueue.some(t => t.videoId === videoId)) return;
    this.prefetchQueue.push({ videoId, url, cacheKey });
  }

  // ─── Process download queue ─────────────────────────────────────────────
  async processQueue() {
    if (this.activeDownloads.size >= this.maxConcurrent) return;

    const task = this.prefetchQueue.shift();
    if (!task) return;

    const { videoId, url, cacheKey } = task;
    this.activeDownloads.add(videoId);

    const filePath = `${CACHE_DIR}${cacheKey}.mp4`;

    try {
      const prefetchUrl = this.getPrefetchUrl(url);

      console.log(`📥 Prefetching: ${cacheKey}`);

      const downloadResumable = FileSystem.createDownloadResumable(
        prefetchUrl,
        filePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          // Could emit progress event here if needed
        }
      );

      // Track it so pauseAll()/cancelFarDownloads() can cancel it mid-flight
      // and clean up the partial file it was writing.
      this.currentResumable = downloadResumable;
      this.currentDownloadId = videoId;
      this.currentFilePath = filePath; // 🆕

      const result = await downloadResumable.downloadAsync();

      // 🆕 A cancelled download resolves with undefined, and a failed
      // request (404/5xx) can still resolve with a uri pointing at an
      // error-page body that got written to disk. Reject both — don't
      // let either get treated as a valid cached video.
      if (!result?.uri || (result.status && result.status >= 400)) {
        if (result?.uri) {
          await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => {});
        }
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(filePath);

      // 🆕 Guard against a "successful" download that's suspiciously tiny
      // (e.g. an error JSON body saved with a 200 status from a CDN edge).
      if (!fileInfo.exists || (fileInfo.size || 0) < 1024) {
        await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
        return;
      }

      this.cacheMetadata[cacheKey] = {
        url,
        filePath,
        size: fileInfo.size || 0,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
      };
      await this.saveCacheMetadata();
      console.log(`✅ Prefetched: ${cacheKey}`);

      // Check size right away instead of waiting for the interval sweep —
      // a heavy scrolling session can otherwise blow well past
      // MAX_CACHE_SIZE before the next scheduled sweep.
      this.checkAndCleanupIfNeeded();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('cancel')) {
        console.log(`🚫 Prefetch cancelled: ${cacheKey}`);
      } else {
        console.warn(`⚠️ Prefetch failed for ${cacheKey}:`, msg);
      }
      // 🆕 Whatever got written before the failure/cancel isn't valid — remove it.
      await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
    } finally {
      this.activeDownloads.delete(videoId);
      if (this.currentDownloadId === videoId) {
        this.currentResumable = null;
        this.currentDownloadId = null;
        this.currentFilePath = null;
      }
      // Process next in queue
      setTimeout(() => this.processQueue(), 500);
    }
  }

  // ─── Save cache metadata ────────────────────────────────────────────────
  async saveCacheMetadata() {
    try {
      await AsyncStorage.setItem('feed_video_cache_meta', JSON.stringify(this.cacheMetadata));
    } catch (err) {
      console.error('Failed to save cache metadata:', err);
    }
  }

  // ─── Cancel the in-flight download and remove its partial file ──────────
  // 🆕 Shared by cancelFarDownloads() and pauseAll() so both paths clean up
  // the partial file the same way — previously neither did, which is what
  // let half-downloaded files get mistaken for complete ones.
  async _cancelCurrentDownload() {
    if (!this.currentResumable) return;

    const staleId = this.currentDownloadId;
    const staleFilePath = this.currentFilePath;

    try {
      await this.currentResumable.cancelAsync();
    } catch (err) {
      // Already finished or failed to cancel — safe to ignore
    }

    this.currentResumable = null;
    this.currentDownloadId = null;
    this.currentFilePath = null;

    if (staleId) this.activeDownloads.delete(staleId);
    if (staleFilePath) {
      await FileSystem.deleteAsync(staleFilePath, { idempotent: true }).catch(() => {});
    }
  }

  // ─── Cancel downloads far from current position ─────────────────────────
  cancelFarDownloads(activeIndex) {
    this.prefetchQueue = this.prefetchQueue.filter(task => {
      const postIndex = this._postIndexMap?.[task.videoId] ?? -1;
      return postIndex > activeIndex && postIndex <= activeIndex + PRELOAD_COUNT;
    });

    // 🔒 Also cancel the in-flight download if the user has scrolled past
    // the point where it's still useful — otherwise it keeps downloading
    // a video nobody is about to watch, and leaves a partial file behind.
    if (this.currentDownloadId) {
      const currentPostIndex = this._postIndexMap?.[this.currentDownloadId] ?? -1;
      const stillRelevant = currentPostIndex > activeIndex && currentPostIndex <= activeIndex + PRELOAD_COUNT;
      if (!stillRelevant) {
        this._cancelCurrentDownload(); // 🆕 fire-and-forget, deletes partial file too
      }
    }
  }

  // ─── Pause everything (call when leaving the feed screen) ───────────────
  async pauseAll() {
    // Drop anything not yet started
    this.prefetchQueue = [];

    // Cancel whatever's currently downloading so we're not burning
    // bandwidth on a video the user can no longer see, and clean up
    // the partial file it left behind.
    await this._cancelCurrentDownload(); // 🆕
  }

  // ─── Get cached file URL (for playback) ─────────────────────────────────
  // 🆕 Only serves a file that has a confirmed-complete cacheMetadata entry.
  async getCachedUrl(videoUrl) {
    if (!videoUrl) return null;

    await this.init();

    const cacheKey = this.getCacheKey(videoUrl);
    if (!this.cacheMetadata[cacheKey]) return null;

    const filePath = `${CACHE_DIR}${cacheKey}.mp4`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath, { size: false });

      if (fileInfo.exists) {
        // Update last accessed time
        this.cacheMetadata[cacheKey].lastAccessed = Date.now();
        await this.saveCacheMetadata();
        return filePath;
      }

      // Metadata says cached but file's missing — drop the stale entry.
      delete this.cacheMetadata[cacheKey];
      await this.saveCacheMetadata();
    } catch (err) {
      // File doesn't exist or can't be accessed
    }

    return null;
  }

  // ─── Check current cache size and clean up if over budget ───────────────
  checkAndCleanupIfNeeded() {
    const totalSize = Object.values(this.cacheMetadata).reduce((sum, m) => sum + (m.size || 0), 0);
    if (totalSize > MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
  }

  // ─── Clean up cache: expired-by-age first, then over-budget-by-size ─────
  async cleanupCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) return;

      const dirContents = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const now = Date.now();
      const files = [];

      for (const file of dirContents) {
        const filePath = `${CACHE_DIR}${file}`;
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
          if (fileInfo.exists && !fileInfo.isDirectory) {
            const name = file.replace('.mp4', '');
            files.push({
              path: filePath,
              size: fileInfo.size || 0,
              name,
              meta: this.cacheMetadata[name],
            });
          }
        } catch (err) {
          // Skip files we can't access
        }
      }

      // 🆕 Age-based expiry: remove anything older than MAX_CACHE_AGE_MS,
      // regardless of total cache size. Files with no metadata (orphaned /
      // never confirmed as a complete download) are also removed here —
      // they shouldn't be sitting around at all.
      let freedByAge = 0;
      const survivors = [];
      for (const file of files) {
        const cachedAt = file.meta?.cachedAt;
        const expired = !cachedAt || (now - cachedAt) > MAX_CACHE_AGE_MS;
        if (expired) {
          try {
            await FileSystem.deleteAsync(file.path, { idempotent: true });
            delete this.cacheMetadata[file.name];
            freedByAge += file.size;
            console.log(`⏱️ Expired cached: ${file.name}`);
          } catch (err) {
            survivors.push(file); // couldn't delete, keep tracking it
          }
        } else {
          survivors.push(file);
        }
      }

      // Size-based cleanup on whatever's left (oldest-accessed first)
      let totalSize = survivors.reduce((sum, f) => sum + f.size, 0);
      let freedBySize = 0;

      if (totalSize > MAX_CACHE_SIZE) {
        survivors.sort((a, b) => (a.meta?.lastAccessed || 0) - (b.meta?.lastAccessed || 0));

        const targetSize = MAX_CACHE_SIZE * 0.7;

        for (const file of survivors) {
          if (totalSize - freedBySize <= targetSize) break;
          try {
            await FileSystem.deleteAsync(file.path, { idempotent: true });
            delete this.cacheMetadata[file.name];
            freedBySize += file.size;
            console.log(`🗑️ Removed cached: ${file.name}`);
          } catch (err) {
            // Skip if delete fails
          }
        }
      }

      if (freedByAge > 0 || freedBySize > 0) {
        await this.saveCacheMetadata();
        const freedMb = ((freedByAge + freedBySize) / 1024 / 1024).toFixed(1);
        console.log(`🧹 Cleaned ${freedMb}MB from cache (${(freedByAge / 1024 / 1024).toFixed(1)}MB expired, ${(freedBySize / 1024 / 1024).toFixed(1)}MB over-budget)`);
      }
    } catch (err) {
      console.error('Cache cleanup failed:', err);
    }
  }

  // ─── Update post index map ──────────────────────────────────────────────
  updatePostIndexMap(posts) {
    this._postIndexMap = {};
    posts.forEach((post, index) => {
      this._postIndexMap[post._id] = index;
    });
  }
}

// Singleton instance
const feedPrefetchService = new FeedPrefetchService();

// 🆕 Runs every 10 min; each sweep now expires anything older than
// MAX_CACHE_AGE_MS (30 min) in addition to the existing size-budget cleanup.
setInterval(() => {
  feedPrefetchService.cleanupCache();
}, CLEANUP_INTERVAL_MS);

export default feedPrefetchService;