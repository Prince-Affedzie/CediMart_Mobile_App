// src/components/stories/MyStoriesBar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { getMyStories, getStoryStats, deleteStory, viewStory } from '../../apis/storyApi';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_RING_SIZE = 68;
const STORY_RING_INNER = 60;
const STORY_DURATION = 5000;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  brand: '#14B8A6',
  brandDim: 'rgba(20,184,166,0.1)',
  white: '#FFFFFF',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  skeleton: '#EEF2F6',
  unviewedGradient: ['#F97316', '#EC4899', '#8B5CF6', '#14B8A6'],
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  success: '#059669',
  accent: '#F97316',
  progressBg: 'rgba(255,255,255,0.25)',
  progressActive: '#FFFFFF',
};

const STICKER_LABELS = {
  'new-arrival': 'New Arrival',
  'flash-sale': 'Flash Sale',
  'restock': 'Restock',
  'limited-time': 'Limited Time',
  'back-in-stock': 'Back in Stock',
};

const formatTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
};

// ─── Progress Bar ──────────────────────────────────────────────────────────
const ProgressBar = ({ progress, active }) => (
  <View style={styles.progressBarTrack}>
    <View 
      style={[
        styles.progressBarFill, 
        { width: `${progress * 100}%` },
        active && styles.progressBarFillActive,
      ]} 
    />
  </View>
);

// ─── My Story Viewer Modal ────────────────────────────────────────────────
const MyStoryViewer = ({ visible, stories, initialIndex, onClose, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  const currentStory = stories[currentIndex];
  const isVideoStory = currentStory?.media?.type === 'video';

  const player = useVideoPlayer(
    isVideoStory && currentStory?.media?.url ? currentStory.media.url : null,
    (player) => {
      player.loop = false;
    }
  );

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      setVideoLoaded(true);
      setMediaReady(true);
      if (!paused) player.play();
    } else if (status === 'error') {
      setMediaReady(true);
    }
  });

  // Fetch stats when story changes
  useEffect(() => {
    if (currentStory && visible) {
      setStats(null);
      setShowStats(false);
      fetchStats(currentStory._id);
    }
  }, [currentStory?._id, visible]);

  const fetchStats = async (storyId) => {
    try {
      const res = await getStoryStats(storyId);
      setStats(res.data?.data || null);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Reset state when story changes
  useEffect(() => {
    if (!currentStory) return;
    setVideoLoaded(false);
    setMediaReady(false);
    setProgress(0);
    progressAnim.setValue(0);
    
    if (currentStory.media?.type === 'image') {
      setMediaReady(true);
    }
  }, [currentStory?._id]);

  // Progress animation
  useEffect(() => {
    if (!visible || !currentStory || paused || !mediaReady) {
      if (animationRef.current) animationRef.current.stop();
      return;
    }

    let duration = STORY_DURATION;
    if (isVideoStory) {
      duration = player?.duration && player.duration > 0 ? player.duration * 1000 : STORY_DURATION;
    }

    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });
    animationRef.current.start();

    const listener = progressAnim.addListener(({ value }) => setProgress(value));
    return () => {
      if (animationRef.current) animationRef.current.stop();
      progressAnim.removeListener(listener);
    };
  }, [currentIndex, visible, paused, mediaReady, isVideoStory, player?.duration]);

  // Auto-advance
  useEffect(() => {
    if (!visible || paused || !mediaReady) return;
    const duration = isVideoStory && player?.duration > 0 ? player.duration * 1000 : STORY_DURATION;
    const timer = setTimeout(() => handleNext(), duration);
    return () => clearTimeout(timer);
  }, [currentIndex, visible, paused, mediaReady]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex || 0);
      setProgress(0);
      setPaused(false);
      setMediaReady(false);
      setVideoLoaded(false);
    }
  }, [visible]);

  const handleNext = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handlePauseToggle = () => {
    Haptics.selectionAsync().catch(() => {});
    const newPaused = !paused;
    setPaused(newPaused);
    if (player) {
      if (newPaused) player.pause();
      else player.play();
    }
  };

  const handleDelete = () => {
    if (!currentStory) return;
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete(currentStory._id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              if (currentIndex < stories.length - 1) {
                setCurrentIndex(prev => prev);
              } else {
                onClose();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete story');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.viewerContainer}>
        {/* Media */}
        <View style={styles.viewerBackground}>
          {isVideoStory ? (
            <View style={styles.viewerMedia}>
              <VideoView
                style={StyleSheet.absoluteFill}
                player={player}
                contentFit="cover"
                nativeControls={false}
                pointerEvents="none"
              />
            </View>
          ) : (
            <Image
              source={{ uri: currentStory.media.url }}
              style={styles.viewerMedia}
              resizeMode="cover"
              onLoad={() => setMediaReady(true)}
            />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.topGradient} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.bottomGradient} pointerEvents="none" />
        </View>

        {/* Progress Bars */}
        <SafeAreaView style={styles.progressContainer} edges={['top']}>
          <View style={styles.progressRow}>
            {stories.map((story, index) => (
              <ProgressBar
                key={story._id}
                progress={index < currentIndex ? 1 : index === currentIndex ? progress : 0}
                active={index === currentIndex}
              />
            ))}
          </View>
        </SafeAreaView>

        {/* Header */}
        <SafeAreaView style={styles.header} edges={['top']}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>My Story</Text>
              <Text style={styles.headerTime}>{formatTimeAgo(currentStory.createdAt)}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handlePauseToggle} style={styles.headerBtn}>
                <Ionicons name={paused ? 'play' : 'pause'} size={18} color={C.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                <Ionicons name="close" size={20} color={C.white} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Sticker */}
        {currentStory?.sticker && (
          <View style={styles.stickerContainer}>
            <View style={styles.stickerBadge}>
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.stickerText}>{STICKER_LABELS[currentStory.sticker]}</Text>
            </View>
          </View>
        )}

        {/* Touch areas */}
        <View style={styles.touchArea}>
          <Pressable style={styles.touchLeft} onPress={handlePrevious} />
          <Pressable style={styles.touchRight} onPress={handleNext} />
        </View>

        {/* Stats & Actions */}
        <SafeAreaView style={styles.bottomContent} edges={['bottom']}>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statChip}>
              <Ionicons name="eye-outline" size={14} color={C.white} />
              <Text style={styles.statChipText}>{stats?.uniqueViewCount || 0} views</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="heart-outline" size={14} color={C.white} />
              <Text style={styles.statChipText}>{stats?.reactionCount || 0} reactions</Text>
            </View>
            <TouchableOpacity 
              style={styles.statsToggleBtn}
              onPress={() => setShowStats(!showStats)}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart-outline" size={14} color={C.white} />
              <Text style={styles.statsToggleText}>{showStats ? 'Hide' : 'Details'}</Text>
            </TouchableOpacity>
          </View>

          {/* Expandable Stats */}
          {showStats && stats && (
            <View style={styles.statsExpanded}>
              {/* Reaction breakdown */}
              {stats.reactionSummary && stats.reactionSummary.length > 0 && (
                <View style={styles.reactionsRow}>
                  {stats.reactionSummary.map((r) => (
                    <View key={r.emoji} style={styles.reactionItem}>
                      <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                      <Text style={styles.reactionCount}>{r.count}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Recent viewers */}
              {stats.viewers && stats.viewers.length > 0 && (
                <View style={styles.viewersList}>
                  {stats.viewers.slice(0, 3).map((viewer, index) => (
                    <View key={index} style={styles.viewerRow}>
                      <Text style={styles.viewerName} numberOfLines={1}>
                        {viewer.user?.firstName || 'User'} {viewer.user?.lastName || ''}
                      </Text>
                      <Text style={styles.viewerTime}>{formatTimeAgo(viewer.viewedAt)}</Text>
                    </View>
                  ))}
                  {stats.viewers.length > 3 && (
                    <Text style={styles.moreViewers}>+{stats.viewers.length - 3} more viewers</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Caption */}
          {currentStory?.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {currentStory.caption}
            </Text>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete Story</Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>

        {/* Loading */}
        {!mediaReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.white} />
            <Text style={styles.loadingText}>
              {isVideoStory ? 'Loading video...' : 'Loading...'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── Main MyStoriesBar Component ──────────────────────────────────────────
const MyStoriesBar = ({ onAddStoryPress }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  const fetchStories = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getMyStories({ limit: 20, status: 'active' });
      const activeStories = res.data?.data?.stories || [];
      setStories(activeStories);
    } catch (err) {
      console.error('Fetch my stories error:', err?.response?.data?.message || err.message);
      setStories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleStoryPress = (index) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedIndex(index);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedIndex(null);
    fetchStories(true); // Refresh after viewing
  };

  const handleDeleteStory = async (storyId) => {
    await deleteStory(storyId);
    setStories(prev => prev.filter(s => s._id !== storyId));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {[0, 100, 200].map((delay, i) => (
            <View key={i} style={styles.skeletonItem}>
              <Animated.View style={[styles.skeletonRing, { opacity: 0.5 }]} />
              <View style={styles.skeletonLine} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Add Story */}
        <View style={styles.storyItem}>
          <TouchableOpacity onPress={onAddStoryPress} activeOpacity={0.8} style={styles.storyTouchable}>
            <View style={styles.storyRing}>
              <View style={styles.storyRingInner}>
                <View style={styles.addStoryCircle}>
                  <Ionicons name="add" size={24} color={C.brand} />
                </View>
              </View>
            </View>
            <View style={styles.addStoryBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.storyName}>Add Story</Text>
        </View>

        {/* Story rings */}
        {stories.map((story, index) => (
          <View key={story._id} style={styles.storyItem}>
            <TouchableOpacity 
              onPress={() => handleStoryPress(index)} 
              activeOpacity={0.8} 
              style={styles.storyTouchable}
            >
              <LinearGradient
                colors={C.unviewedGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyRingInner}>
                  {story.media?.type === 'image' ? (
                    <Image source={{ uri: story.media.url }} style={styles.storyAvatar} />
                  ) : story.media?.thumbnailUrl ? (
                    <Image source={{ uri: story.media.thumbnailUrl }} style={styles.storyAvatar} />
                  ) : (
                    <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
                      <Ionicons name="videocam" size={20} color={C.brand} />
                    </View>
                  )}
                </View>
              </LinearGradient>
              
            </TouchableOpacity>
            <Text style={styles.storyName} numberOfLines={1}>
              {story.caption || 'Story'}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Story Viewer */}
      <MyStoryViewer
        visible={showViewer}
        stories={stories}
        initialIndex={selectedIndex}
        onClose={handleCloseViewer}
        onDelete={handleDeleteStory}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  storyTouchable: {
    position: 'relative',
  },
  storyRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingInner: {
    width: STORY_RING_INNER,
    height: STORY_RING_INNER,
    borderRadius: STORY_RING_INNER / 2,
    backgroundColor: '#fff',
    padding: 2.5,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_RING_INNER - 5) / 2,
  },
  storyAvatarPlaceholder: {
    backgroundColor: C.brandDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryCircle: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_RING_INNER - 5) / 2,
    backgroundColor: C.brandDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.brand,
    borderStyle: 'dashed',
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  viewCountBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  viewCountText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  storyName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    maxWidth: 70,
    textAlign: 'center',
  },
  skeletonItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  skeletonRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    backgroundColor: C.skeleton,
  },
  skeletonLine: {
    width: 50,
    height: 10,
    backgroundColor: C.skeleton,
    borderRadius: 5,
  },

  // Viewer styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  viewerMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    zIndex: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressBarTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: C.progressBg,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.progressActive,
    borderRadius: 1.5,
  },
  progressBarFillActive: {
    backgroundColor: C.progressActive,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
  },
  headerTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    zIndex: 15,
  },
  stickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: {
    width: '35%',
    height: '100%',
  },
  touchRight: {
    width: '65%',
    height: '100%',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 15,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
  },
  statsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  statsToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
  },
  statsExpanded: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
  },
  viewersList: {
    gap: 4,
  },
  viewerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  viewerTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  moreViewers: {
    fontSize: 10,
    color: C.brand,
    marginTop: 4,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    color: C.white,
    lineHeight: 18,
    marginBottom: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.danger,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    fontSize: 13,
    color: C.white,
    marginTop: 10,
  },
});

export default MyStoriesBar;