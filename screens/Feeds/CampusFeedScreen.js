// src/screens/feed/CampusFeedScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Alert,
  RefreshControl,
  AppState,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getFeed, toggleLike, toggleSave, incrementView } from '../../apis/feedApi';
import {followUser} from '../../apis/userApi'
import { useAuth } from '../../context/AuthContext';
import CommentsSheet from '../../components/feed/CommentsSheet';
import ReportSheet from '../../components/ReportSheet'
import {ActionRail} from '../../components/feed/ActionRail'
import {FeedPostItem} from '../../components/feed/FeedPostItem'
import {TypeFilter} from '../../components/feed/TypeFilter'
import {styles} from '../../styles/campusfeed'
import feedPrefetchService from '../../services/feedPrefetchService'
import ReelSkeleton from '../../components/feed/ReelSkeleton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  brand: '#14B8A6',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  faint: 'rgba(255,255,255,0.55)',
  red: '#FF3B5C',
  overlayTop: 'rgba(0,0,0,0.45)',
  overlayBottom: 'rgba(0,0,0,0.75)',
  chipBg: 'rgba(255,255,255,0.16)',
  chipActive: 'rgba(255,255,255,0.95)',
};

const FEED_TYPES = [
  { key: '', label: 'For You' },
  { key: 'product_reel', label: 'Products' },
  { key: 'campus_event', label: 'Events' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'campus_hack', label: 'Hacks' },
  { key: 'achievement', label: 'Wins' },
  { key: 'funny_moment', label: 'Funny' },
];

const getBackgroundGradient = (type) => {
  const gradients = {
    product_reel: ['#0D9488', '#14B8A6'],
    service_reel: ['#7C3AED', '#8B5CF6'],
    lifestyle: ['#F97316', '#FB923C'],
    campus_event: ['#0284C7', '#38BDF8'],
    campus_hack: ['#F59E0B', '#FBBF24'],
    achievement: ['#059669', '#34D399'],
    funny_moment: ['#EC4899', '#F472B6'],
  };
  return gradients[type] || ['#1E293B', '#334155'];
};

// ─── Main Screen ─────────────────────────────────────────────────────────
const CampusFeedScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [showReport, setShowReport] = useState(false)
  const [reportPost, setReportPost] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const flatListRef = useRef(null);

  const itemHeight = SCREEN_H;

  const fetchFeed = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await getFeed({ page: pageNum, limit: 5, type: activeType || undefined });
      const newPosts = res.data?.data?.posts || [];
      const pagination = res.data?.data?.pagination || {};

      setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(pageNum < pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Feed fetch error:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [activeType]);

  const handleRefresh = () => fetchFeed(1, true);

  useEffect(() => {
    fetchFeed(1);
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeType]);

  useEffect(() => {
    if (posts.length > 0) {
      feedPrefetchService.updatePostIndexMap(posts);
    }
  }, [posts]);

  useEffect(() => {
    if (posts.length > 0 && activeIndex >= 0) {
      feedPrefetchService.prefetchNext(activeIndex, posts);
    }
  }, [activeIndex, posts]);

  useEffect(() => {
    if (!isFocused) {
      feedPrefetchService.pauseAll();
    }
  }, [isFocused]);

  // ── Pause videos when app goes to background ──────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState === 'active' && nextAppState !== 'active') {
        // App is going to background - pause all videos
        feedPrefetchService.pauseAll();
        // Force re-render to pause active video
        setAppState(nextAppState);
      } else if (nextAppState === 'active') {
        // App is coming back to foreground
        setAppState(nextAppState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchFeed(page + 1);
  };

  const handleFollow = async (authorId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login or sign up to Follow.');
      return;
    }
    if (!authorId) return;
    try {
      await followUser(authorId);
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login or sign up to like this posts.');
      return;
    }
    try { await toggleLike(postId); } catch (err) { console.error('Like error:', err); }
  };

  const handleSave = async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login or sign up to save this posts.');
      return;
    }
    try { await toggleSave(postId); } catch (err) { console.error('Save error:', err); }
  };

  const handleComment = (post) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login or sign up to comment.');
      return;
    }
    setCommentPost(post);
  };

  const handleCloseComments = () => {
    setCommentPost(null);
  };

  const handleShare = async (post) => {
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Check out this post on CediMart: ${post.title}`,
        url: `https://cedimart.com/feed/${post._id}`,
      });
    } catch (err) {}
  };

  const handleProductPress = (product) =>
    navigation.navigate('ProductDetail', { productId: product._id });

  const handleVendorPress = (vendorId) =>
    navigation.navigate('VendorDetail', {vendorId:vendorId });

  const handleCreatePost = () => navigation.navigate('CreateFeedPost');

  const viewedIds = useRef(new Set());
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      const idx = viewableItems[0].index ?? 0;
      setActiveIndex(idx);
      if (!viewedIds.current.has(item._id)) {
        viewedIds.current.add(item._id);
        incrementView(item._id).catch(() => {});
      }
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  const handleReport = (post) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to report posts.');
      return;
    }
    setReportPost(post);
  };

  const handleCloseReport = () => {
    setReportPost(null);
  };

  const renderItem = ({ item, index }) => (
    <FeedPostItem
      post={item}
      isActive={index === activeIndex}
      screenFocused={isFocused && appState === 'active'}
      onLike={handleLike}
      onComment={() => handleComment(item)}
      onSave={handleSave}
      onFollow={handleFollow}
      onReport={() => handleReport(item)}
      onShare={() => handleShare(item)}
      onProductPress={() => item.linkedProduct && handleProductPress(item.linkedProduct)}
      onVendorPress={item.vendorId ? () => handleVendorPress(item.vendorId) : undefined}
      itemHeight={itemHeight}
      useCache={true}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={[styles.emptyContainer, { height: itemHeight }]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="newspaper-outline" size={40} color={C.faint} />
        </View>
        <Text style={styles.emptyTitle}>
          {activeType ? `No ${FEED_TYPES.find((t) => t.key === activeType)?.label} posts yet` : 'No posts yet'}
        </Text>
        <Text style={styles.emptySubtitle}>Market your brand, products and services with videos!</Text>
        <TouchableOpacity style={styles.createFirstBtn} onPress={handleCreatePost} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#0F172A" />
          <Text style={styles.createFirstBtnText}>Create a Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={1.2}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.white}
            colors={[C.brand]}
            progressBackgroundColor="#111"
          />
        }
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
      />

      {/* Floating header */}
      <SafeAreaView style={styles.floatingHeader} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Feed</Text>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
            <Ionicons name="notifications-outline" size={20} color={C.white} />
          </TouchableOpacity>
        </View>
        <TypeFilter types={FEED_TYPES} activeType={activeType} onSelect={setActiveType} />
      </SafeAreaView>

      <CommentsSheet
        visible={!!commentPost}
        onClose={handleCloseComments}
        postId={commentPost?._id}
      />
      <ReportSheet
        visible={!!reportPost}
        onClose={handleCloseReport}
        contentType="FeedPost"
        contentId={reportPost?._id}
      />

      {/* Create Post FAB - Dynamic bottom position using safe area insets */}
      <TouchableOpacity 
        style={[
          styles.fab, 
          { bottom: insets.bottom + 8 }
        ]} 
        onPress={handleCreatePost} 
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#0F172A" />
      </TouchableOpacity>

      {loading && posts.length === 0 && <ReelSkeleton />}
    </View>
  );
};

export default CampusFeedScreen;