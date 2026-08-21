// src/screens/feed/FeedPostItem.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { ActionRail } from './ActionRail';
import { styles } from '../../styles/campusfeed';
import feedPrefetchService from '../../services/feedPrefetchService';

const C = {
  brand: '#14B8A6',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  faint: 'rgba(255,255,255,0.55)',
  red: '#FF3B5C',
  overlayTop: 'rgba(0,0,0,0.45)',
  overlayBottom: 'rgba(0,0,0,0.75)',
};

const TYPE_CONFIG = {
  product_reel: { icon: 'pricetag-outline', label: 'Product' },
  service_reel: { icon: 'construct-outline', label: 'Service' },
  lifestyle: { icon: 'camera-outline', label: 'Lifestyle' },
  campus_event: { icon: 'calendar-outline', label: 'Event' },
  campus_hack: { icon: 'bulb-outline', label: 'Campus Hack' },
  funny_moment: { icon: 'happy-outline', label: 'Funny' },
  achievement: { icon: 'trophy-outline', label: 'Achievement' },
};

const getTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const formatTime = (secs) => {
  if (!secs || !isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const BUFFERING_DEBOUNCE_MS = 350;
const THUMBNAIL_HIDE_DELAY = 400;
const TIME_UPDATE_INTERVAL = 0.25;

// How many rows away from the active one still get a real, loaded video
// player. 1 means "previous, current, next" — anything further only shows
// its thumbnail. This is the whole fix: mobile devices cap concurrent
// hardware video decoder sessions (often as few as 4–6), and a *paused*
// player still holds its decoder — it doesn't release it. With enough rows
// mounted in the FlatList's render window, you blow past that cap and
// video silently stops producing frames (audio keeps playing off the
// cheap software audio decoder, which has no such limit) — that's the
// black-screen-with-sound bug.
const LOAD_DISTANCE = 1;

// ─── Single Full-Screen Video Post ────────────────────────────────────────
export const FeedPostItem = ({
  post,
  isActive,
  screenFocused,
  distanceFromActive = 99, // how many rows away from activeIndex this item is
  onLike,
  onComment,
  onSave,
  onShare,
  onFollow,
  onReport,
  onProductPress,
  onVendorPress,
  itemHeight,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const bufferingTimerRef = useRef(null);
  const thumbnailTimerRef = useRef(null);

  const media = post.media?.[0];
  const isVideo = media?.type === 'video' || media?.url?.includes('playlist.m3u8');
  const typeCfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.product_reel;
  const authorName = post.author
    ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim()
    : 'Unknown';
  const authorInitial = (post.author?.firstName || '?').charAt(0).toUpperCase();
  const isVendor = post.author?.role === 'vendor';
  // Same condition the chip's own text/color variants already key off of —
  // reused here so the new Buy Now button flips to the right contrast.
  const isProductChipLightVariant = !post.media?.[0] && post.linkedProduct;

  // Only rows within LOAD_DISTANCE of the active one are allowed to
  // actually load a video source and get a real player + decoder.
  const shouldLoadVideo = isVideo && distanceFromActive <= LOAD_DISTANCE;

  // ── Cache check (only runs for rows close enough to load) ───────────────
  useEffect(() => {
    if (!isVideo || !media?.url) return;

    // Reset every time we cross the load/no-load boundary, or the video
    // itself changes. This is what actually frees the decoder for rows
    // scrolling out of range — clearing videoUrl back to null makes
    // useVideoPlayer tear down its underlying native player, not just
    // pause it.
    setCacheChecked(false);
    setVideoUrl(null);
    setShowThumbnail(true);
    setVideoReady(false);
    setDuration(0);
    setCurrentTime(0);

    if (!shouldLoadVideo) return; // stay deferred — thumbnail only, no player

    feedPrefetchService.getCachedUrl(media.url).then(cached => {
      setVideoUrl(cached || media.url);
      setCacheChecked(true);
    });
  }, [post._id, media?.url, isVideo, shouldLoadVideo]);

  // ── Video player ─────────────────────────────────────────────────────────
  // videoUrl is null for any row outside the load window, so no player /
  // decoder is created for it at all — this is the key resource-capping
  // mechanism, stronger than just pausing.
  const player = useVideoPlayer(
    isVideo && videoUrl ? videoUrl : null,
    (player) => {
      player.loop = true;
      player.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
      if (isActive && screenFocused) player.play();
      else player.pause();
    }
  );

  // ── Status changes ───────────────────────────────────────────────────────
  useEventListener(player, 'statusChange', ({ status }) => {
    if (!isVideo) return;
    clearTimeout(bufferingTimerRef.current);

    if (status === 'loading') {
      bufferingTimerRef.current = setTimeout(() => setIsBuffering(true), BUFFERING_DEBOUNCE_MS);
    } else {
      setIsBuffering(false);
    }

    if (status === 'readyToPlay' || status === 'playing') {
      if (!videoReady) {
        setVideoReady(true);
        clearTimeout(thumbnailTimerRef.current);
        thumbnailTimerRef.current = setTimeout(() => setShowThumbnail(false), THUMBNAIL_HIDE_DELAY);
      }
      if (player?.duration && player.duration !== duration) {
        setDuration(player.duration);
      }
    }
  });

  // ── Time updates ─────────────────────────────────────────────────────────
  useEventListener(player, 'timeUpdate', ({ currentTime: t }) => {
    if (!isVideo) return;
    setCurrentTime(t);
    if (player?.duration && player.duration !== duration) {
      setDuration(player.duration);
    }
  });

  // ── Active state changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      setShowThumbnail(true);
      setVideoReady(false);
      clearTimeout(thumbnailTimerRef.current);
    }
    return () => clearTimeout(thumbnailTimerRef.current);
  }, [isActive]);

  useEffect(() => {
    if (!player || !isVideo || !videoUrl) return;
    player.bufferOptions = {
      preferredForwardBufferDuration: isActive ? 15 : 5,
      maxBufferDuration: isActive ? 30 : 10,
    };
  }, [isActive, player, isVideo, videoUrl]);

  // ── Play/Pause based on active state, screen focus, and app state ─────
  useEffect(() => {
    if (!player || !isVideo || !videoUrl) return;
    if (isActive && screenFocused && !paused) player.play();
    else player.pause();
  }, [isActive, screenFocused, paused, player, isVideo, videoUrl]);

  useEffect(() => {
    if (!isActive) {
      clearTimeout(bufferingTimerRef.current);
      setIsBuffering(false);
    }
    return () => clearTimeout(bufferingTimerRef.current);
  }, [isActive]);

  useEffect(() => () => clearTimeout(thumbnailTimerRef.current), []);

  // ── Interactions ─────────────────────────────────────────────────────────
  const bumpHeart = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(heartScale, { toValue: 0, duration: 250, delay: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!isLiked) { setIsLiked(true); onLike?.(post._id); }
      bumpHeart();
    } else {
      if (isVideo) setPaused(p => !p);
    }
    lastTap.current = now;
  };

  const handleFollow = () => { const n = !isFollowing; setIsFollowing(n); onFollow?.(post.author?._id); };
  const handleLike = () => { const n = !isLiked; setIsLiked(n); onLike?.(post._id); };
  const handleSave = () => { setIsSaved(s => !s); onSave?.(post._id); };

  // The Buy Now button navigates to the same place tapping the chip does —
  // it's just a much more explicit, higher-intent call to action than
  // relying on people to realize the whole chip is tappable.
  const handleBuyNow = (e) => {
    e?.stopPropagation?.();
    onProductPress?.();
  };

  const progressFraction = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;

  // ── Render background ────────────────────────────────────────────────────
  const renderBackground = () => (
    <>
      {/* Thumbnail — shown for the deferred state AND while the real
          player is still warming up */}
      {showThumbnail && media?.thumbnailUrl && (
        <Image source={{ uri: media.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'ios' ? 15 : 8} />
      )}
      {showThumbnail && media?.thumbnailUrl && <View style={localStyles.thumbnailOverlay} />}

      {shouldLoadVideo ? (
        cacheChecked && videoUrl ? (
          <View style={StyleSheet.absoluteFill}>
            <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="cover" nativeControls={false} pointerEvents="none" allowsFullscreen={false} allowsPictureInPicture={false} />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10 }}>Loading video...</Text>
          </View>
        )
      ) : (
        // Deferred row: no player, no decoder — just the thumbnail above,
        // or a plain dark fallback if there's no thumbnail yet.
        !media?.thumbnailUrl && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {/* Pause overlay */}
      {paused && !showThumbnail && (
        <View style={styles.pauseOverlay}>
          <View style={styles.playBtnLarge}>
            <Ionicons name="play" size={40} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      )}

      {/* Buffering */}
      {isBuffering && isActive && screenFocused && !paused && !showThumbnail && (
        <View style={localStyles.bufferingOverlay} pointerEvents="none">
          <View style={localStyles.bufferingSpinnerWrap}><ActivityIndicator size="large" color="#fff" /></View>
        </View>
      )}

      {/* Cached badge */}
      {videoUrl && !videoUrl.includes('http') && (
        <View style={[styles.typePill, { position: 'absolute', top: Platform.OS === 'ios' ? 130 : 118, right: 14, backgroundColor: 'rgba(5,150,105,0.7)' }]}>
          <Ionicons name="download-outline" size={10} color="#fff" />
          <Text style={[styles.typePillText, { fontSize: 9 }]}>Cached</Text>
        </View>
      )}

      {/* Progress bar — positioned above the bottom content area */}
      {shouldLoadVideo && !showThumbnail && duration > 0 && (
        <View style={localStyles.progressWrap} pointerEvents="none">
          <View style={localStyles.progressTrack}>
            <Animated.View style={[localStyles.progressFill, { width: `${progressFraction * 100}%` }]} />
          </View>
          <View style={localStyles.progressTimeRow}>
            <Text style={localStyles.progressTimeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.page, { height: itemHeight }]}>
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={StyleSheet.absoluteFill}>
        {renderBackground()}
        <Animated.View pointerEvents="none" style={[styles.bigHeart, { opacity: heartScale, transform: [{ scale: heartScale }] }]}>
          <Ionicons name="heart" size={100} color={C.white} />
        </Animated.View>
      </TouchableOpacity>

      {isVideo && <LinearGradient colors={['transparent', C.overlayBottom]} style={styles.bottomGradient} pointerEvents="none" />}

      <View style={[styles.bottomContent, (!post.media?.[0] && !post.linkedProduct) && styles.bottomContentTextOnly]}>
        <View style={styles.bottomLeft}>
          {/* Vendor Shop Button */}
          {isVendor && onVendorPress && (
            <TouchableOpacity style={localStyles.viewShopBtn} onPress={onVendorPress} activeOpacity={0.85}>
              <Ionicons name="storefront-outline" size={14} color="#fff" />
              <Text style={localStyles.viewShopText}>View Shop</Text>
              <Ionicons name="chevron-forward" size={12} color="#fff" />
            </TouchableOpacity>
          )}

          {post.linkedProduct && (
            <TouchableOpacity style={[styles.productChip, isProductChipLightVariant && styles.productChipTextOnly]} onPress={onProductPress} activeOpacity={0.85}>
              {post.linkedProduct.images?.[0] ? (
                <Image source={{ uri: post.linkedProduct.images[0] }} style={styles.productChipImg} />
              ) : (
                <View style={[styles.productChipImg, styles.productChipImgPlaceholder]}>
                  <Ionicons name="image-outline" size={14} color={C.dim} />
                </View>
              )}
              <View style={localStyles.productChipTextCol}>
                <Text style={[styles.productChipName, isProductChipLightVariant && { color: '#0F172A' }]} numberOfLines={1}>{post.linkedProduct.name}</Text>
                <Text style={[styles.productChipPrice, isProductChipLightVariant && { color: '#0D9488' }]}>GH₵ {Number(post.linkedProduct.price).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[localStyles.buyNowBtn, isProductChipLightVariant ? localStyles.buyNowBtnDark : localStyles.buyNowBtnLight]}
                onPress={handleBuyNow}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="bag-handle-outline" size={12} color={isProductChipLightVariant ? '#fff' : '#0D9488'} />
                <Text style={[localStyles.buyNowText, { color: isProductChipLightVariant ? '#fff' : '#0D9488' }]}>Buy Now</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          <Text style={styles.authorLine}>
            @{authorName.replace(/\s+/g, '').toLowerCase() || 'user'}
            <Text style={styles.metaDot}>  ·  {getTimeAgo(post.createdAt)}</Text>
            {post.campus !== 'ALL' && <Text style={styles.metaDot}>  ·  {post.campus}</Text>}
          </Text>

          <Text style={[styles.title]} numberOfLines={2}>{post.title}</Text>

          {!!post.description && (
            <TouchableOpacity onPress={() => setShowFullDesc(v => !v)} activeOpacity={0.8}>
              <Text style={[styles.description]} numberOfLines={showFullDesc ? undefined : 2}>{post.description}</Text>
              {post.description.length > 150 && <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>}
            </TouchableOpacity>
          )}
        </View>

        <ActionRail
          post={post} isLiked={isLiked} isFollowing={isFollowing} isSaved={isSaved}
          onLike={handleLike} onComment={onComment} onSave={handleSave}
          onFollow={handleFollow} onShare={onShare} onReport={onReport}
          authorInitial={authorInitial} authorImage={post.author?.profileImage}
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  bufferingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  bufferingSpinnerWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  progressWrap: { position: 'absolute', left: 0, right: 0, bottom: 80 },
  progressTrack: { height: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.4)', marginHorizontal: 8, borderRadius: 1.5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 1.5 },
  progressTimeRow: { alignItems: 'flex-end', paddingHorizontal: 10, paddingTop: 4 },
  progressTimeText: { color: '#fff', fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  viewShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 184, 166, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  viewShopText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Product chip now has three zones: image | name+price (flex) | Buy Now.
  // productChipName/productChipPrice keep their existing shared styles —
  // this just stacks them in a column instead of them being direct chip
  // children, freeing horizontal space for the new button.
  productChipTextCol: {
    flex: 1,
    marginRight: 8,
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  // Light pill (white bg, brand-teal text/icon) for use over the dark
  // translucent chip — video/image posts.
  buyNowBtnLight: {
    backgroundColor: '#fff',
  },
  // Dark pill (brand-teal bg, white text/icon) for use over the light
  // chip variant — text-only / product-only posts (styles.productChipTextOnly).
  buyNowBtnDark: {
    backgroundColor: '#0D9488',
  },
  buyNowText: {
    fontSize: 11,
    fontWeight: '800',
  },
});