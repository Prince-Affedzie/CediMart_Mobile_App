// src/screens/feed/MyFeedPostsScreen.js
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
  Alert,
  Dimensions,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getMyFeedPosts, deleteFeedPost } from '../../apis/feedApi';

const { width } = Dimensions.get('window');
const GRID_COLS = 2;
const GRID_GAP = 4;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_ITEM_SIZE = (width - GRID_GAP * (GRID_COLS - 1) - GRID_HORIZONTAL_PADDING) / GRID_COLS;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#EFEFEF',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandD: '#0F766E',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  purple: '#7C3AED',
  info: '#0284C7',
  gold: '#F59E0B',
  heart: '#FF3B5C',
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
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

// ─── Profile Stats Header ─────────────────────────────────────────────────
const ProfileStatsHeader = ({ stats }) => {
  if (!stats) return null;
  
  const statItems = [
    { key: 'totalPosts', label: 'Posts', icon: 'grid-outline', color: C.brand },
    { key: 'totalLikes', label: 'Likes', icon: 'heart', color: C.heart },
    { key: 'totalComments', label: 'Comments', icon: 'chatbubble', color: C.info },
    { key: 'totalViews', label: 'Views', icon: 'eye', color: C.purple },
  ];

  return (
    <View style={styles.statsContainer}>
      {statItems.map((item, i) => (
        <React.Fragment key={item.key}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: item.color }]}>
              {formatCount(stats[item.key] || 0)}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
          {i < statItems.length - 1 && <View style={styles.statDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

// ─── Grid Item ─────────────────────────────────────────────────────────────
const GridItem = ({ post, onPress, onMenu }) => {
  const typeCfg = FEED_TYPE_CONFIG[post.type] || FEED_TYPE_CONFIG.product_reel;
  const media = post.media?.[0];
  const isVideo = media?.type === 'video' || media?.url?.includes('playlist.m3u8');
  const isImage = media?.url && !isVideo;
  const likeCount = post.likes?.length || 0;
  const commentCount = post.commentCount || 0;
  
  // Use a stable player per item
  const player = useVideoPlayer(
    isVideo && media?.url ? media.url : null,
    (p) => {
      p.loop = true;
      p.muted = true;
    }
  );

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.85}>
      {/* Media */}
      {isVideo ? (
        <View style={styles.gridMediaWrap}>
          <VideoView
            style={styles.gridMedia}
            player={player}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
          />
          <View style={styles.playIconCenter}>
            <Ionicons name="play" size={22} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      ) : isImage ? (
        <Image source={{ uri: media.thumbnailUrl || media.url }} style={styles.gridMedia} resizeMode="cover" />
      ) : (
        <View style={[styles.gridMedia, styles.gridPlaceholder, { backgroundColor: typeCfg.color + '15' }]}>
          <Ionicons name={typeCfg.icon} size={28} color={typeCfg.color} />
        </View>
      )}

      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeCfg.color + 'E6' }]}>
        <Text style={styles.typeBadgeText}>{typeCfg.label}</Text>
      </View>

      {/* Menu button */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={onMenu}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="ellipsis-horizontal" size={14} color="#fff" />
      </TouchableOpacity>

      {/* Hover overlay with stats */}
      <View style={styles.overlayStats} pointerEvents="none">
        <View style={styles.overlayStat}>
          <Ionicons name="heart" size={13} color="#fff" />
          <Text style={styles.overlayStatText}>{formatCount(likeCount)}</Text>
        </View>
        <View style={styles.overlayStat}>
          <Ionicons name="chatbubble" size={12} color="#fff" />
          <Text style={styles.overlayStatText}>{formatCount(commentCount)}</Text>
        </View>
      </View>

      {/* Multiple media indicator */}
      {post.media?.length > 1 && (
        <View style={styles.multiMediaBadge}>
          <Ionicons name="copy-outline" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Action Sheet ─────────────────────────────────────────────────────────
const PostActionSheet = ({ visible, post, onClose, onEdit, onShare, onDelete }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose}>
      <View style={styles.sheetCard}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle} numberOfLines={1}>
          {post?.title || 'Post Actions'}
        </Text>

        <TouchableOpacity style={styles.sheetItem} onPress={onEdit} activeOpacity={0.7}>
          <View style={[styles.sheetIconWrap, { backgroundColor: C.brandDim }]}>
            <Ionicons name="create-outline" size={18} color={C.brand} />
          </View>
          <Text style={styles.sheetItemText}>Edit post</Text>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetItem} onPress={onShare} activeOpacity={0.7}>
          <View style={[styles.sheetIconWrap, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="share-outline" size={18} color={C.info} />
          </View>
          <Text style={styles.sheetItemText}>Share</Text>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <View style={styles.sheetDivider} />

        <TouchableOpacity style={styles.sheetItem} onPress={onDelete} activeOpacity={0.7}>
          <View style={[styles.sheetIconWrap, { backgroundColor: C.dangerBg }]}>
            <Ionicons name="trash-outline" size={18} color={C.danger} />
          </View>
          <Text style={[styles.sheetItemText, { color: C.danger }]}>Delete post</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const MyFeedPostsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [actionPost, setActionPost] = useState(null);

  const fetchPosts = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await getMyFeedPosts({ page: pageNum, limit: 18 });
      if (res.status === 200 || res.success) {
        const data = res.data?.data;
        const newPosts = data?.posts || [];

        if (pageNum === 1) {
          setPosts(newPosts);
          setStats(data?.stats || null);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        const pagination = data?.pagination || {};
        setHasMore(pageNum < pagination.totalPages);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch my posts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchPosts(1);
  }, [isFocused]);

  const handleRefresh = () => fetchPosts(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchPosts(page + 1);
  };

  const handleDelete = async (postId) => {
    setDeletingId(postId);
    try {
      await deleteFeedPost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setStats(prev => prev ? {
        ...prev,
        totalPosts: Math.max(0, (prev.totalPosts || 1) - 1),
      } : null);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (post) => {
    setActionPost(null);
    Alert.alert('Delete Post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(post._id) },
    ]);
  };

  const handleSharePost = async (post) => {
    setActionPost(null);
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Check out this post on CediMart: ${post.title}`,
      });
    } catch {}
  };

  const handleEditPost = (post) => {
    setActionPost(null);
    navigation.navigate('EditFeedPost', { postId: post._id });
  };

  const handlePostPress = (post) => {
    navigation.navigate('FeedPostDetail', { postId: post._id });
  };

  const renderGridItem = ({ item }) => (
    <GridItem post={item} onPress={() => handlePostPress(item)} onMenu={() => setActionPost(item)} />
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateFeedPost')}>
          <Ionicons name="add-circle" size={30} color={C.brand} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && <ProfileStatsHeader stats={stats} />}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="newspaper-outline" size={44} color={C.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>Share your first post with the campus community!</Text>
        <TouchableOpacity
          style={styles.createFirstBtn}
          onPress={() => navigation.navigate('CreateFeedPost')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createFirstBtnText}>Create a Post</Text>
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
  key={`posts-grid-${posts.length === 0 ? 'empty' : 'grid'}`} // Force fresh render
  data={posts}
  renderItem={renderGridItem}
  keyExtractor={item => item._id}
  numColumns={GRID_COLS}
  columnWrapperStyle={{ gap: GRID_GAP }}
  ListHeaderComponent={renderHeader}
  ListEmptyComponent={renderEmpty}
  ListFooterComponent={renderFooter}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.4}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.brand} colors={[C.brand]} />
  }
  contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listContentEmpty]}
  showsVerticalScrollIndicator={false}
/>

      {loading && posts.length === 0 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.initialLoaderText}>Loading your posts...</Text>
        </View>
      )}

      {deletingId && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={C.danger} />
        </View>
      )}

      <PostActionSheet
        visible={!!actionPost}
        post={actionPost}
        onClose={() => setActionPost(null)}
        onEdit={() => handleEditPost(actionPost)}
        onShare={() => handleSharePost(actionPost)}
        onDelete={() => confirmDelete(actionPost)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { 
  paddingBottom: 40, 
  paddingHorizontal: 8, // 8px each side = 16px total
},
  listContentEmpty: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, backgroundColor: C.bg,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  createBtn: { padding: 4 },

  // Stats - Instagram-style
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  // Grid
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: GRID_GAP,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    borderRadius:14
  },
  gridMediaWrap: { width: '100%', height: '100%' },
  gridMedia: { width: '100%', height: '100%' },
  gridPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  
  // Play icon for videos
  playIconCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Type badge
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Menu button
  menuBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Overlay stats at bottom
  overlayStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  overlayStatText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Multiple media badge
  multiMediaBadge: {
    position: 'absolute',
    bottom: 26,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 3,
  },

  // Action sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheetCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, marginBottom: 12, textAlign: 'center' },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sheetItemText: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
  sheetDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  sheetCancel: { marginTop: 10, backgroundColor: C.bg, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  sheetCancelText: { fontSize: 14.5, fontWeight: '700', color: C.text },

  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 30 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  createFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 25, shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  createFirstBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Loading states
  initialLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 12 },
  initialLoaderText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  deletingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' },
});

export default MyFeedPostsScreen;