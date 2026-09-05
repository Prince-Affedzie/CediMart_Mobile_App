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
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getFeed, searchFeed, toggleLike, toggleSave, incrementView } from '../../apis/feedApi';
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

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false); // NEW: drives the focus ring below
  const searchInputRef = useRef(null);
  const searchTimerRef = useRef(null);

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
    if (posts.length > 0 && activeIndex >= 0 && !isSearchMode) {
      feedPrefetchService.prefetchNext(activeIndex, posts);
    }
  }, [activeIndex, posts, isSearchMode]);

  useEffect(() => {
    if (!isFocused) {
      feedPrefetchService.pauseAll();
    }
  }, [isFocused]);

  // ── Pause videos when app goes to background ──────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState === 'active' && nextAppState !== 'active') {
        feedPrefetchService.pauseAll();
        setAppState(nextAppState);
      } else if (nextAppState === 'active') {
        setAppState(nextAppState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // ── Search handling with debounce ─────────────────────────────────────
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!text.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchPage(1);
      return;
    }

    // Debounce search
    searchTimerRef.current = setTimeout(() => {
      performSearch(text.trim(), 1);
    }, 500);
  };

  const performSearch = async (query, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setSearchLoading(true);
        setIsSearchMode(true);
      } else {
        setLoadingMore(true);
      }

      const res = await searchFeed({ 
        query, 
        page: pageNum, 
        limit: 5,
        type: activeType || undefined,
      });
      
      const newPosts = res.data?.data?.posts || [];
      const pagination = res.data?.data?.pagination || {};

      if (append) {
        setSearchResults(prev => [...prev, ...newPosts]);
      } else {
        setSearchResults(newPosts);
      }
      
      setSearchHasMore(pageNum < pagination.totalPages);
      setSearchPage(pageNum);
    } catch (err) {
      console.error('Search error:', err?.response?.data?.message || err.message);
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchLoadMore = () => {
    if (searchHasMore && !loadingMore && !searchLoading && searchQuery.trim()) {
      performSearch(searchQuery.trim(), searchPage + 1, true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
    setSearchHasMore(false);
    setSearchPage(1);
    setShowSearch(false);
    Keyboard.dismiss();
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setShowSearch(false);
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  const handleLoadMore = () => {
    if (isSearchMode) {
      handleSearchLoadMore();
    } else if (hasMore && !loadingMore && !loading) {
      fetchFeed(page + 1);
    }
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
      distanceFromActive={Math.abs(index - activeIndex)}
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
    if (loading || searchLoading) return null;
    
    if (isSearchMode) {
      return (
        <View style={[styles.emptyContainer, { height: itemHeight }]}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search-outline" size={40} color={C.faint} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>No posts match "{searchQuery}"</Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={clearSearch} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={16} color="#0F172A" />
            <Text style={styles.createFirstBtnText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
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

  // Determine which data to show
  const displayPosts = isSearchMode ? searchResults : posts;
  const isInitialLoading = (loading && posts.length === 0) || (searchLoading && searchResults.length === 0 && isSearchMode);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={displayPosts}
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
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {/* Floating header */}
      <SafeAreaView style={styles.floatingHeader} edges={['top']} pointerEvents="box-none">
        {showSearch ? (
          // FIX: these four were pointing at `styles.*` (the shared campusfeed
          // stylesheet), which has no color set on its input — that's why the
          // text rendered in the system default (black) over the dark overlay.
          // `searchStyles` below already had the correct white/branded look
          // defined, it just wasn't wired up. Switched these to searchStyles,
          // and added a focus ring + matching dark keyboard/cursor.
          <View style={searchStyles.searchHeaderRow}>
            <TouchableOpacity style={searchStyles.searchBackBtn} onPress={closeSearch}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>
            <View style={[searchStyles.searchInputWrap, searchFocused && searchStyles.searchInputWrapFocused]}>
              <Ionicons name="search-outline" size={16} color={searchFocused ? C.brand : C.faint} />
              <TextInput
                ref={searchInputRef}
                style={searchStyles.searchInput}
                placeholder="Search posts..."
                placeholderTextColor={C.faint}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                keyboardAppearance="dark"
                cursorColor={C.brand}
                selectionColor={C.brand}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    performSearch(searchQuery.trim(), 1);
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={C.faint} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Feed</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 300); }}>
                <Ionicons name="search-outline" size={20} color={C.white} />
              </TouchableOpacity>
              
            </View>
          </View>
        )}
        
        {!showSearch && (
          <TypeFilter types={FEED_TYPES} activeType={activeType} onSelect={setActiveType} />
        )}
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

      {/* Create Post FAB - Hidden during search 
      {!isSearchMode && (
        <TouchableOpacity 
          style={[
            styles.fab, 
            { bottom: insets.bottom + 18 }
          ]} 
          onPress={handleCreatePost} 
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#0F172A" />
        </TouchableOpacity>
      )} */}

      {isInitialLoading && <ReelSkeleton />}
    </View>
  );
};

// Additional styles for search
const searchStyles = StyleSheet.create({
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  searchBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  // NEW: subtle brand-colored focus ring so the field feels responsive
  // and premium instead of a flat static box.
  searchInputWrapFocused: {
    borderColor: C.brand,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: C.white,
    height: '100%',
  },
});

export default CampusFeedScreen;