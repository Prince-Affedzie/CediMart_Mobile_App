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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getFeed, toggleLike, toggleSave, incrementView } from '../../apis/feedApi';
import {followUser} from '../../apis/userApi'
import { useAuth } from '../../context/AuthContext';
import CommentsSheet from '../../components/feed/CommentsSheet';

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

const TYPE_CONFIG = {
  product_reel: { icon: 'pricetag-outline', label: 'Product' },
  service_reel: { icon: 'construct-outline', label: 'Service' },
  lifestyle: { icon: 'camera-outline', label: 'Lifestyle' },
  campus_event: { icon: 'calendar-outline', label: 'Event' },
  campus_hack: { icon: 'bulb-outline', label: 'Campus Hack' },
  funny_moment: { icon: 'happy-outline', label: 'Funny' },
  achievement: { icon: 'trophy-outline', label: 'Achievement' },
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

// ─── Helpers ──────────────────────────────────────────────────────────────
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

const formatCount = (count) => {
  if (!count) return '';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

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

// ─── Top Filter Bar ──────────────────────────────────────────────────────
const TypeFilter = ({ types, activeType, onSelect }) => (
  <FlatList
    data={types}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterContent}
    keyExtractor={(item) => item.key}
    renderItem={({ item }) => {
      const isActive = activeType === item.key;
      return (
        <TouchableOpacity
          onPress={() => onSelect(item.key)}
          activeOpacity={0.8}
          style={[styles.filterChip, isActive && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }}
  />
);

// ─── Action Rail (right side) ───────────────────────────────────────────
const ActionRail = ({ post, isLiked, isSaved, onLike, onComment, onFollow, onSave, onShare, isFollowing,authorInitial, authorImage }) => (
  <View style={styles.rail}>
    <TouchableOpacity style={styles.railAvatarWrap} onPress={onFollow} activeOpacity={0.85}>
      <View style={styles.railAvatar}>
        {authorImage ? (
          <Image source={{ uri: authorImage }} style={styles.railAvatarImg} />
        ) : (
          <Text style={styles.railAvatarText}>{authorInitial}</Text>
        )}
      </View>
      <View style={[styles.railAvatarPlus, isFollowing && styles.railAvatarPlusFollowing]}>
        <Ionicons 
          name={isFollowing ? 'checkmark' : 'add'} 
          size={12} 
          color="#fff" 
        />
      </View>
    </TouchableOpacity>

    <TouchableOpacity style={styles.railBtn} onPress={onLike} activeOpacity={0.7}>
      <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? C.red : C.white} />
      <Text style={styles.railLabel}>{formatCount((post.likes?.length || 0) + (isLiked ? 1 : 0))}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.railBtn} onPress={onComment} activeOpacity={0.7}>
      <Ionicons name="chatbubble-ellipses-outline" size={28} color={C.white} />
      <Text style={styles.railLabel}>{formatCount(post.comments?.length || 0)}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.railBtn} onPress={onSave} activeOpacity={0.7}>
      <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={27} color={isSaved ? C.brand : C.white} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.railBtn} onPress={onShare} activeOpacity={0.7}>
      <Ionicons name="arrow-redo-outline" size={27} color={C.white} />
      <Text style={styles.railLabel}>Share</Text>
    </TouchableOpacity>
  </View>
);

// ─── Single Full-Screen Post ─────────────────────────────────────────────
const FeedPostItem = ({
  post,
  isActive,
  screenFocused,
  onLike,
  onComment,
  onSave,
  onShare,
  onFollow,
  onProductPress,
  itemHeight,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const media = post.media?.[0];
  const isVideo = media?.type === 'video' || media?.url?.match(/\.(mp4|mov|webm)/i);
  const isImage = media && !isVideo;
  const isTextOnly = !media && !post.linkedProduct;
  const hasOnlyProduct = !media && post.linkedProduct;
  const typeCfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.product_reel;
  const authorName = post.author
    ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim()
    : 'Unknown';
  const authorInitial = (post.author?.firstName || '?').charAt(0).toUpperCase();

  // Video player — only for video posts
  const player = useVideoPlayer(isVideo ? media.url : null, (p) => {
    p.loop = true;
    p.muted = false;
    p.bufferOptions = {
    preferredForwardBufferDuration: 10,  // Buffer 10s ahead
    maxBufferDuration: 20,               // Max buffer
  };
  });

  //console.log(media.url)

  useEffect(() => {
    if (!player || !isVideo) return;
    if (isActive && screenFocused && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, screenFocused, paused, player, isVideo]);

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
      if (!isLiked) {
        setIsLiked(true);
        onLike?.(post._id);
      }
      bumpHeart();
    } else {
      if (isVideo) setPaused((p) => !p);
    }
    lastTap.current = now;
  };

   const handleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    onFollow?.(post.author?._id);
  };

  const handleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    onLike?.(post._id);
  };

  const handleSave = () => {
    setIsSaved((s) => !s);
    onSave?.(post._id);
  };

  // ─── Render background based on content type ────────────────────────────
  const renderBackground = () => {
    // Video post — cover works because clips are almost always shot  9:16
    if (isVideo) {
      return (
        <>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
          {paused && (
            <View style={styles.pauseOverlay}>
              <View style={styles.playBtnLarge}>
                <Ionicons name="play" size={40} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}
        </>
      );
    }

    // Image post — never crop. Show the full image via "contain", and fill
    // the surrounding space with a blurred, darkened copy of the same image
    // so it still reads as full-bleed without losing any of the actual photo.
    if (isImage) {
      return (
        <>
          <Image
            source={{ uri: media.url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={Platform.OS === 'ios' ? 40 : 22}
          />
          <View style={styles.imageBackdropScrim} pointerEvents="none" />
          <Image
            source={{ uri: media.url }}
            style={styles.imageForeground}
            resizeMode="contain"
          />
        </>
      );
    }

    // Text-only or product-only — branded gradient background
    return (
      <LinearGradient
        colors={getBackgroundGradient(post.type)}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.textOnlyPattern}>
          <Ionicons name={typeCfg.icon} size={180} color="rgba(255,255,255,0.06)" style={styles.decorIcon1} />
          <Ionicons name={typeCfg.icon} size={100} color="rgba(255,255,255,0.04)" style={styles.decorIcon2} />
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={[styles.page, { height: itemHeight }]}>
      {/* Background */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={StyleSheet.absoluteFill}>
        {renderBackground()}
        <Animated.View
          pointerEvents="none"
          style={[styles.bigHeart, { opacity: heartScale, transform: [{ scale: heartScale }] }]}
        >
          <Ionicons name="heart" size={100} color={C.white} />
        </Animated.View>
      </TouchableOpacity>

      {/* Top gradient + type badge (video/image only) 
      {(isVideo || isImage) && (
        <>
          <LinearGradient colors={[C.overlayTop, 'transparent']} style={styles.topGradient} pointerEvents="none" />
          <View style={styles.topRow} pointerEvents="none">
            <View style={styles.typePill}>
              <Ionicons name={typeCfg.icon} size={12} color={C.white} />
              <Text style={styles.typePillText}>{typeCfg.label}</Text>
            </View>
          </View>
        </>
      )}*/}
      

      {/* Bottom gradient (video/image only) */}
      {(isVideo || isImage) && (
        <LinearGradient colors={['transparent', C.overlayBottom]} style={styles.bottomGradient} pointerEvents="none" />
      )}

      

      {/* Content area */}
      <View style={[styles.bottomContent, (isTextOnly || hasOnlyProduct) && styles.bottomContentTextOnly]}>
        <View style={styles.bottomLeft}>
            {/* Linked Product */}
          {post.linkedProduct && (
            <TouchableOpacity
              style={[styles.productChip, (isTextOnly || hasOnlyProduct) && styles.productChipTextOnly]}
              onPress={onProductPress}
              activeOpacity={0.85}
            >
              {post.linkedProduct.images?.[0] ? (
                <Image source={{ uri: post.linkedProduct.images[0] }} style={styles.productChipImg} />
              ) : (
                <View style={[styles.productChipImg, styles.productChipImgPlaceholder]}>
                  <Ionicons name="image-outline" size={14} color={isTextOnly || hasOnlyProduct ? 'rgba(0,0,0,0.3)' : C.dim} />
                </View>
              )}
              <Text
                style={[styles.productChipName, (isTextOnly || hasOnlyProduct) && { color: '#0F172A' }]}
                numberOfLines={1}
              >
                {post.linkedProduct.name}
              </Text>
              <Text style={[styles.productChipPrice, (isTextOnly || hasOnlyProduct) && { color: '#0D9488' }]}>
                GH₵ {Number(post.linkedProduct.price).toFixed(2)}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={isTextOnly || hasOnlyProduct ? '#64748B' : C.white} />
            </TouchableOpacity>
          )}
          {/* Type badge for text-only posts */}
          {(isTextOnly || hasOnlyProduct) && (
            <View style={[styles.typePill, styles.typePillTextOnly, { marginBottom: 10 }]}>
              <Ionicons name={typeCfg.icon} size={12} color={C.white} />
              <Text style={styles.typePillText}>{typeCfg.label}</Text>
            </View>
          )}

          <Text style={styles.authorLine}>
            @{authorName.replace(/\s+/g, '').toLowerCase() || 'user'}
            <Text style={styles.metaDot}>  ·  {getTimeAgo(post.createdAt)}</Text>
            {post.campus !== 'ALL' && (
              <Text style={styles.metaDot}>  ·  {post.campus}</Text>
            )}
          </Text>

          <Text style={[styles.title, (isTextOnly || hasOnlyProduct) && styles.titleTextOnly]} numberOfLines={2}>
            {post.title}
          </Text>

          {!!post.description && (
            <TouchableOpacity onPress={() => setShowFullDesc((v) => !v)} activeOpacity={0.8}>
              <Text
                style={[styles.description, (isTextOnly || hasOnlyProduct) && styles.descriptionTextOnly]}
                numberOfLines={showFullDesc ? undefined : 2}
              >
                {post.description}
              </Text>
              {post.description.length > 150 && (
                <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
              )}
            </TouchableOpacity>
          )}

          
        </View>

        <ActionRail
          post={post}
          isLiked={isLiked}
          isFollowing={isFollowing} 
          isSaved={isSaved}
          onLike={handleLike}
          onComment={onComment}
          onSave={handleSave}
          onFollow={handleFollow}
          onShare={onShare}
          authorInitial={authorInitial}
          authorImage={post.author?.profileImage}
        />
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────
const CampusFeedScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const itemHeight = SCREEN_H;

  const fetchFeed = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await getFeed({ page: pageNum, limit: 8, type: activeType || undefined });
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

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchFeed(page + 1);
  };


  const handleFollow = async (authorId) => {
  if (!authorId) return;
  try {
    await followUser(authorId);
  } catch (err) {
    console.error('Follow error:', err);
  }
};

  const handleLike = async (postId) => {
    try { await toggleLike(postId); } catch (err) { console.error('Like error:', err); }
  };
  const handleSave = async (postId) => {
    try { await toggleSave(postId); } catch (err) { console.error('Save error:', err); }
  };
  const handleComment = (post) => {
  // Pause video when opening comments
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

  const renderItem = ({ item, index }) => (
    <FeedPostItem
      post={item}
      isActive={index === activeIndex}
      screenFocused={isFocused}
      onLike={handleLike}
      onComment={() => handleComment(item)}
      onSave={handleSave}
      onFollow={handleFollow}
      onShare={() => handleShare(item)}
      onProductPress={() => item.linkedProduct && handleProductPress(item.linkedProduct)}
      itemHeight={itemHeight}
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
        <Text style={styles.emptySubtitle}>Be the first to share something on campus!</Text>
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
        maxToRenderPerBatch={3}
        windowSize={3}
        initialNumToRender={2}
      />

      {/* Floating header */}
      <SafeAreaView style={styles.floatingHeader} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Campus Feed</Text>
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

      {/* Create Post FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color="#0F172A" />
      </TouchableOpacity>

      {loading && posts.length === 0 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={C.white} />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Page
  page: { width: SCREEN_W, backgroundColor: '#000' },

  // Background
  textOnlyPattern: { ...StyleSheet.absoluteFillObject },
  decorIcon1: { position: 'absolute', right: -40, bottom: -40 },
  decorIcon2: { position: 'absolute', left: -20, top: '20%' },

  // Image background — full photo shown via "contain" over a blurred backdrop
  imageBackdropScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  imageForeground: { ...StyleSheet.absoluteFillObject },

  // Video
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playBtnLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingLeft: 3,
  },
  bigHeart: {
    position: 'absolute', top: '42%', left: '50%',
    marginLeft: -50, marginTop: -50,
  },

  // Top gradient
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  topRow: { position: 'absolute', top: Platform.OS === 'ios' ? 130 : 118, left: 14 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(2, 2, 2, 0.35)', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  typePillText: { color: C.white, fontSize: 10.5, fontWeight: '700' },
  typePillTextOnly: { backgroundColor: 'rgba(0,0,0,0.15)' },

  // Bottom gradient
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 },

  // Content area
  bottomContent: {
    position: 'absolute', bottom: 68, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    paddingHorizontal: 14,
  },
  bottomContentTextOnly: { paddingBottom: 30 },
  bottomLeft: { flex: 1, paddingRight: 12 },
  authorLine: { color: C.white, fontSize: 14, fontWeight: '800' },
  metaDot: { color: C.dim, fontSize: 12, fontWeight: '500' },
  title: { color: C.white, fontSize: 14.5, fontWeight: '600', marginTop: 6, lineHeight: 20 },
  titleTextOnly: { fontSize: 18, lineHeight: 26, fontWeight: '800' },
  description: { color: C.dim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  descriptionTextOnly: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)' },
  readMore: { color: C.brand, fontSize: 12.5, fontWeight: '600', marginTop: 4 },

  // Product chip
  productChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  productChipTextOnly: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productChipImg: { width: 32, height: 32, borderRadius: 8 },
  productChipImgPlaceholder: { backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  productChipName: { color: C.white, fontSize: 12.5, fontWeight: '600', flexShrink: 1 },
  productChipPrice: { color: C.brand, fontSize: 12.5, fontWeight: '800' },

  // Action rail
  rail: { alignItems: 'center', gap: 18, paddingBottom: 4, marginBottom: 76 },
  railAvatarWrap: { alignItems: 'center', marginBottom: 4 },
  railAvatar: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  railAvatarImg: { width: '100%', height: '100%' },
  railAvatarText: { color: C.white, fontSize: 17, fontWeight: '800' },
  railAvatarPlus: {
    position: 'absolute', bottom: -8, alignSelf: 'center',
    width: 18, height: 18, borderRadius: 9, backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000',
  },
  railBtn: { alignItems: 'center', gap: 3 },
  railLabel: { color: C.white, fontSize: 11, fontWeight: '700' },
  railAvatarPlusFollowing: {
  backgroundColor: '#059669', // Green when following
},

  // Floating header
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4,
  },
  headerTitle: { color: C.white, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter
  filterContent: { paddingHorizontal: 12, gap: 6, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 16, backgroundColor: C.chipBg },
  filterChipActive: { backgroundColor: C.chipActive },
  filterChipText: { fontSize: 12.5, fontWeight: '700', color: C.white },
  filterChipTextActive: { color: '#0F172A' },

  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.dim, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  createFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25,
  },
  createFirstBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  // Loaders
  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', gap: 12,
  },
  loadingText: { fontSize: 14, color: C.dim, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 16,
    width: 52, height: 52, borderRadius: 26, backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});

export default CampusFeedScreen;