// src/components/stories/StoriesBar.js
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getActiveStories } from '../../apis/storyApi';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from './StoryViewer'; // We'll create this next

const { width } = Dimensions.get('window');
const STORY_RING_SIZE = 68;
const STORY_RING_INNER = 60;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  brand: '#14B8A6',
  brandDim: 'rgba(20,184,166,0.1)',
  white: '#FFFFFF',
  text: '#FFF',
  textOff: '#475569',
  textMuted: '#94A3B8',
  skeleton: '#EEF2F6',
  unviewedGradient: ['#F97316', '#EC4899', '#8B5CF6', '#14B8A6'],
  viewedBorder: 'rgba(255,255,255,0.3)',
};

// ─── Story Ring Component ──────────────────────────────────────────────────
const StoryRing = ({ vendor, hasUnviewed, onPress, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const avatarUri = vendor?.profileImage || vendor?.vendor?.profileImage;

  return (
    <Animated.View
      style={[
        styles.storyItem,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={styles.storyTouchable}
      >
        {/* Ring */}
        {hasUnviewed ? (
          <LinearGradient
            colors={C.unviewedGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyRing}
          >
            <View style={styles.storyRingInner}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.storyAvatar}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
                  <Text style={styles.storyAvatarInitial}>
                    {(vendor?.name || vendor?.storeName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.storyRing, styles.storyRingViewed]}>
            <View style={styles.storyRingInner}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.storyAvatar}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
                  <Text style={styles.storyAvatarInitial}>
                    {(vendor?.name || vendor?.storeName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Verified badge */}
        {vendor?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
          </View>
        )}

        {/* Story count badge */}
        {vendor?.stories?.length > 1 && (
          <View style={styles.storyCountBadge}>
            <Text style={styles.storyCountText}>{vendor.stories.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Vendor name */}
      <Text style={styles.storyName} numberOfLines={1}>
        {vendor?.storeName || vendor?.name || 'Vendor'}
      </Text>
    </Animated.View>
  );
};

// ─── Skeleton Story Ring ──────────────────────────────────────────────────
const SkeletonStoryRing = ({ delay = 0 }) => {
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.8, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.storyItem}>
      <Animated.View style={[styles.storyRing, styles.storyRingSkeleton, { opacity: shimmer }]} />
      <Animated.View style={[styles.storyNameSkeleton, { opacity: shimmer }]} />
    </View>
  );
};

// ─── Add Story Button (for vendors) ───────────────────────────────────────
const AddStoryButton = ({ onPress }) => {
  return (
    <View style={styles.storyItem}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.storyTouchable}
      >
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
      <Text style={styles.storyName} numberOfLines={1}>
        Your Story
      </Text>
    </View>
  );
};

// ─── Main Stories Bar ──────────────────────────────────────────────────────
const StoriesBar = ({ onStoryPress, onAddStoryPress }) => {
  const { user, isAuthenticated } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendorIndex, setSelectedVendorIndex] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  const isVendor = user?.role === 'vendor';

  const fetchStories = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setStories([]);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getActiveStories();
      const storyGroups = res.data?.data || [];
      setStories(storyGroups);
    } catch (err) {
      console.error('Fetch stories error:', err?.response?.data?.message || err.message);
      setStories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleStoryPress = (vendorIndex) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedVendorIndex(vendorIndex);
    setShowViewer(true);
    onStoryPress?.(stories[vendorIndex]);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedVendorIndex(null);
    // Refresh stories after viewing
    fetchStories(true);
  };

  const handleAddStory = () => {
    Haptics.selectionAsync().catch(() => {});
    onAddStoryPress?.();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[0, 100, 200, 300, 400].map((delay, i) => (
            <SkeletonStoryRing key={i} delay={delay} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (stories.length === 0 && !isVendor) {
    return null; // Don't show stories bar if no stories and not a vendor
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => setShowViewer(false)}
        scrollEventThrottle={16}
      >
        {/* Add Story button for vendors */}
        {isVendor && <AddStoryButton onPress={handleAddStory} />}

        {/* Story rings */}
        {stories.map((vendor, index) => (
          <StoryRing
            key={vendor.vendor?._id || index}
            vendor={vendor.vendor}
            hasUnviewed={vendor.hasUnviewed}
            onPress={() => handleStoryPress(index)}
            index={index}
          />
        ))}
      </ScrollView>

      {/* Story Viewer Modal */}
      {showViewer && selectedVendorIndex !== null && stories[selectedVendorIndex] && (
        <StoryViewer
          visible={showViewer}
          onClose={handleCloseViewer}
          vendorStories={stories[selectedVendorIndex]}
        />
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
    alignItems: 'center',
  },
  storyRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingViewed: {
    borderWidth: 2,
    borderColor: C.viewedBorder,
    backgroundColor: 'transparent',
  },
  storyRingSkeleton: {
    backgroundColor: C.skeleton,
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
  storyAvatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: C.brand,
  },
  storyName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    maxWidth: 70,
    textAlign: 'center',
  },
  storyNameSkeleton: {
    width: 50,
    height: 10,
    backgroundColor: C.skeleton,
    borderRadius: 5,
    marginTop: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
  },
  storyCountBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: C.brand,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  storyCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
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
    borderColor: '#000',
  },
});

export default StoriesBar;