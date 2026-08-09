// src/screens/feed/SavedPostsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getSavedPosts } from '../../apis/feedApi';
import { toggleSave } from '../../apis/feedApi';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 2;
const GRID_ITEM_SIZE = (width - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
};

const FEED_TYPE_CONFIG = {
  product_reel: { icon: 'pricetag-outline', color: '#0D9488', label: 'Product' },
  service_reel: { icon: 'construct-outline', color: '#7C3AED', label: 'Service' },
  lifestyle: { icon: 'camera-outline', color: '#F97316', label: 'Lifestyle' },
  campus_event: { icon: 'calendar-outline', color: '#0284C7', label: 'Event' },
  campus_hack: { icon: 'bulb-outline', color: '#F59E0B', label: 'Campus Hack' },
  funny_moment: { icon: 'happy-outline', color: '#EC4899', label: 'Funny' },
  achievement: { icon: 'trophy-outline', color: '#059669', label: 'Achievement' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatCount = (count) => {
  if (!count && count !== 0) return '0';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
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

// ─── Grid Item ─────────────────────────────────────────────────────────────
const SavedGridItem = ({ post, onPress, onRemove }) => {
  const typeCfg = FEED_TYPE_CONFIG[post.type] || FEED_TYPE_CONFIG.product_reel;
  const media = post.media?.[0];
  const isVideo = media?.type === 'video' || media?.url?.includes('playlist.m3u8');
  const isImage = media?.url && !isVideo;
  const authorName = post.author
    ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim()
    : 'Unknown';

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.85}>
      {/* Media */}
      {isVideo ? (
        <View style={styles.gridMediaWrap}>
          <VideoView
            style={styles.gridMedia}
            player={useVideoPlayer(media.url, p => { p.loop = true; p.muted = true; })}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
          />
        </View>
      ) : isImage ? (
        <Image source={{ uri: media.thumbnailUrl || media.url }} style={styles.gridMedia} resizeMode="cover" />
      ) : (
        <View style={[styles.gridMedia, styles.gridPlaceholder, { backgroundColor: typeCfg.color + '1c' }]}>
          <Ionicons name={typeCfg.icon} size={24} color={typeCfg.color} />
        </View>
      )}

      {/* Top overlay */}
      <View style={styles.gridTopRow} pointerEvents="box-none">
        {isVideo && (
          <View style={styles.gridVideoBadge}>
            <Ionicons name="play" size={9} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.gridRemoveBtn}
          onPress={() => onRemove(post)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bookmark" size={16} color={C.gold} />
        </TouchableOpacity>
      </View>

      {/* Bottom overlay */}
      <View style={styles.gridBottomOverlay} pointerEvents="none">
        <View style={[styles.gridTypeBadge, { backgroundColor: typeCfg.color + 'CC' }]}>
          <Ionicons name={typeCfg.icon} size={9} color="#fff" />
          <Text style={styles.gridTypeText}>{typeCfg.label}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Ionicons name="heart" size={10} color="#fff" />
        <Text style={styles.gridStatsText}>{formatCount(post.likes?.length || 0)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const SavedPostsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchSavedPosts = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await getSavedPosts({ page: pageNum, limit: 20 });
      const data = res.data?.data;
      const newPosts = data?.posts || [];

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setTotal(data?.total || 0);
      setHasMore(data?.hasMore ?? (pageNum * 20 < (data?.total || 0)));
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch saved posts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchSavedPosts(1);
  }, [isFocused]);

  const handleRefresh = () => fetchSavedPosts(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchSavedPosts(page + 1);
  };

  const handleRemove = async (post) => {
    try {
      await toggleSave(post._id);
      setPosts(prev => prev.filter(p => p._id !== post._id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Remove saved post error:', err);
    }
  };

  const handlePostPress = (post) => {
    navigation.navigate('FeedPostDetail', { postId: post._id });
  };

  const renderItem = ({ item }) => (
    <SavedGridItem
      post={item}
      onPress={() => handlePostPress(item)}
      onRemove={handleRemove}
    />
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Saved Posts</Text>
          {total > 0 && (
            <Text style={styles.headerCount}>{total} {total === 1 ? 'post' : 'posts'} saved</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="bookmark-outline" size={44} color={C.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No saved posts</Text>
        <Text style={styles.emptySubtitle}>
          When you save posts, they'll appear here for easy access.
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('CampusFeed')}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={16} color="#fff" />
          <Text style={styles.exploreBtnText}>Browse Campus Feed</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={C.brand} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        numColumns={GRID_COLS}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && !loading && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {loading && posts.length === 0 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading saved posts...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40, paddingHorizontal: GRID_GAP },
  listContentEmpty: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerCount: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Grid
  gridItem: {
    width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, marginBottom: GRID_GAP,
    backgroundColor: '#F1F5F9', position: 'relative', overflow: 'hidden',
    borderRadius: 4,
  },
  gridMediaWrap: { width: '100%', height: '100%' },
  gridMedia: { width: '100%', height: '100%' },
  gridPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  gridTopRow: {
    position: 'absolute', top: 6, left: 6, right: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  gridVideoBadge: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingLeft: 1,
  },
  gridRemoveBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  gridBottomOverlay: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  gridTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  gridTypeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  gridStatsText: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 3 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 25, marginTop: 20,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  exploreBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Loaders
  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg, gap: 12,
  },
  loadingText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

export default SavedPostsScreen;