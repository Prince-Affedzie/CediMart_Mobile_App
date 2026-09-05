// src/components/stories/StoryViewer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import * as Haptics from 'expo-haptics';
import { viewStory, reactToStory } from '../../apis/storyApi';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  brand: '#14B8A6',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  faint: 'rgba(255,255,255,0.55)',
  red: '#FF3B5C',
  progressBg: 'rgba(255,255,255,0.25)',
  progressActive: '#FFFFFF',
};

const STORY_DURATION = 5000; // 5 seconds per story (for images)
const VIDEO_LOAD_TIMEOUT = 10000; // 10 seconds max wait for video load
const QUICK_REACTIONS = ['🔥', '❤️', '👏', '😮', '💰'];

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

// ─── Main Story Viewer ─────────────────────────────────────────────────────
const StoryViewer = ({ visible, onClose, vendorStories }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionSent, setReactionSent] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showProductCard, setShowProductCard] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const stories = vendorStories?.stories || [];
  const currentStory = stories[currentIndex];
  const vendor = vendorStories?.vendor;
  const isVideoStory = currentStory?.media?.type === 'video';

  // ─── Video Player ────────────────────────────────────────────────────────
  const player = useVideoPlayer(
    isVideoStory && currentStory?.media?.url ? currentStory.media.url : null,
    (player) => {
      player.loop = false;
    }
  );

  // ─── Listen for video status changes ────────────────────────────────────
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      setVideoLoaded(true);
      setMediaReady(true);
      // Start playing the video
      if (!paused && visible) {
        player.play();
      }
    } else if (status === 'error') {
      console.error('Video error');
      setVideoLoaded(false);
      setMediaReady(true); // Allow progress even if video fails
    }
  });

  // ─── Reset state when story changes ─────────────────────────────────────
  useEffect(() => {
    if (!currentStory) return;
    
    // Reset media loading states
    setVideoLoaded(false);
    setImageLoaded(false);
    setMediaReady(false);
    setProgress(0);
    setReactionSent(false);
    setShowProductCard(false);
    setCaptionExpanded(false);
    
    progressAnim.setValue(0);
    
    // For images, mark as ready immediately
    if (currentStory.media?.type === 'image') {
      setImageLoaded(true);
      setMediaReady(true);
    } else if (currentStory.media?.type === 'video') {
      // For videos, set a timeout in case video doesn't load
      const timeout = setTimeout(() => {
        setMediaReady(true);
      }, VIDEO_LOAD_TIMEOUT);
      
      return () => clearTimeout(timeout);
    }
  }, [currentStory?._id]);

  // ─── Record View on Story Change ─────────────────────────────────────────
  useEffect(() => {
    if (currentStory && visible && mediaReady) {
      viewStory(currentStory._id).catch(() => {});
    }
  }, [currentStory?._id, visible, mediaReady]);

  // ─── Progress Animation (only when media is ready) ─────────────────────
  useEffect(() => {
    if (!visible || !currentStory || paused || !mediaReady) {
      // Stop animation if paused or not ready
      if (animationRef.current) {
        animationRef.current.stop();
      }
      return;
    }

    // Determine duration based on media type
    let duration = STORY_DURATION;
    if (isVideoStory) {
      // For videos, use the video duration if available, otherwise default
      duration = player?.duration && player.duration > 0 
        ? player.duration * 1000 
        : STORY_DURATION;
    }

    setProgress(0);
    progressAnim.setValue(0);

    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });

    animationRef.current.start();

    const listener = progressAnim.addListener(({ value }) => {
      setProgress(value);
    });

    return () => {
      if (animationRef.current) animationRef.current.stop();
      progressAnim.removeListener(listener);
    };
  }, [currentIndex, visible, paused, mediaReady, isVideoStory, player?.duration]);

  // ─── Auto-advance (only when media is ready) ────────────────────────────
  useEffect(() => {
    if (!visible || paused || !mediaReady) return;

    let duration = STORY_DURATION;
    if (isVideoStory) {
      duration = player?.duration && player.duration > 0 
        ? player.duration * 1000 
        : STORY_DURATION;
    }

    const timer = setTimeout(() => {
      handleNext();
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, visible, paused, mediaReady, isVideoStory, player?.duration]);

  // ─── Reset when viewer opens ────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setProgress(0);
      setPaused(false);
      setShowReactions(false);
      setReactionSent(false);
      setVideoLoaded(false);
      setImageLoaded(false);
      setShowProductCard(false);
      setCaptionExpanded(false);
      setMediaReady(false);
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
      if (newPaused) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const handleReaction = async (emoji) => {
    if (reactionSent || !currentStory) return;
    setReactionSent(true);
    setShowReactions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    try {
      await reactToStory(currentStory._id, emoji);
    } catch (err) {
      console.error('Reaction error:', err);
      setReactionSent(false);
    }
  };

  const handleProductPress = () => {
    if (currentStory?.linkedProduct) {
      onClose();
    }
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
      <View style={styles.container}>
        {/* Background */}
        <View style={styles.background}>
          {isVideoStory ? (
            <View style={styles.media}>
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
              style={styles.media}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                setMediaReady(true);
              }}
            />
          )}

          {/* Gradients for legibility */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
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
            <View style={styles.vendorInfo}>
              {vendor?.profileImage ? (
                <Image source={{ uri: vendor.profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(vendor?.storeName || vendor?.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.vendorNameRow}>
                  <Text style={styles.vendorName} numberOfLines={1}>
                    {vendor?.storeName || vendor?.name || 'Vendor'}
                  </Text>
                  {vendor?.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
                  )}
                </View>
                <Text style={styles.timeAgo}>
                  {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
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

        {/* Sticker Badge */}
        {currentStory?.sticker && (
          <View style={styles.stickerContainer}>
            <View style={styles.stickerBadge}>
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.stickerText}>
                {currentStory.sticker.replace(/-/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Touch areas for navigation */}
        <View style={styles.touchArea}>
          <Pressable style={styles.touchLeft} onPress={handlePrevious} />
          <Pressable style={styles.touchRight} onPress={handleNext} />
        </View>

        {/* Product Card */}
        {currentStory?.linkedProduct && showProductCard && (
          <TouchableOpacity
            style={styles.productCard}
            onPress={handleProductPress}
            activeOpacity={0.85}
          >
            {currentStory.linkedProduct?.images?.[0] ? (
              <Image
                source={{ uri: currentStory.linkedProduct.images[0] }}
                style={styles.productImage}
              />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="image-outline" size={20} color={C.dim} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {currentStory.linkedProduct.name}
              </Text>
              <Text style={styles.productPrice}>
                GH₵ {Number(currentStory.linkedProduct.price).toFixed(2)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.white} />
          </TouchableOpacity>
        )}

        {/* Bottom Content */}
        <SafeAreaView style={styles.bottomContent} edges={['bottom']}>
          {currentStory?.caption && (
            <TouchableOpacity onPress={() => setCaptionExpanded(!captionExpanded)} activeOpacity={0.8}>
              <Text
                style={styles.caption}
                numberOfLines={captionExpanded ? undefined : 2}
              >
                {currentStory.caption}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRow}>
            {currentStory?.linkedProduct && (
              <TouchableOpacity
                style={styles.productBtn}
                onPress={() => setShowProductCard(!showProductCard)}
                activeOpacity={0.8}
              >
                <Ionicons name="pricetag-outline" size={16} color={C.white} />
                <Text style={styles.productBtnText}>View Product</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.reactBtn}
              onPress={() => setShowReactions(!showReactions)}
              activeOpacity={0.8}
            >
              {reactionSent ? (
                <Ionicons name="heart" size={20} color={C.red} />
              ) : (
                <Ionicons name="heart-outline" size={20} color={C.white} />
              )}
            </TouchableOpacity>
          </View>

          {showReactions && !reactionSent && (
            <View style={styles.reactionsRow}>
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBtn}
                  onPress={() => handleReaction(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {reactionSent && (
            <View style={styles.reactionSentIndicator}>
              <Ionicons name="checkmark-circle" size={14} color={C.brand} />
              <Text style={styles.reactionSentText}>Reaction sent!</Text>
            </View>
          )}
        </SafeAreaView>

        {/* Loading indicator - shows while media is loading */}
        {!mediaReady && (
          <View style={styles.videoLoading}>
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

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  media: {
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
    height: 200,
  },

  // Progress bars
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

  // Header
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
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: C.white,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
    flexShrink: 1,
  },
  timeAgo: {
    fontSize: 11,
    color: C.dim,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Sticker
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

  // Touch areas
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

  // Product card
  productCard: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    padding: 10,
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  productPrice: {
    fontSize: 12,
    color: C.brand,
    fontWeight: '800',
    marginTop: 2,
  },

  // Bottom content
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 15,
  },
  caption: {
    fontSize: 14,
    color: C.white,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  productBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },
  productBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  reactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 22,
  },
  reactionSentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginTop: 12,
  },
  reactionSentText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.brand,
  },

  // Video loading
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    fontSize: 13,
    color: C.white,
    marginTop: 10,
    fontWeight: '500',
  },
});

export default StoryViewer;