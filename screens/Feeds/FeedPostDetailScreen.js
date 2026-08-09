// src/screens/feed/FeedPostDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getPostDetail } from '../../apis/feedApi';
import { toggleLike, toggleSave, addComment } from '../../apis/feedApi';
import { followUser } from '../../apis/userApi';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');
const MEDIA_HEIGHT = width * 0.9;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  danger: '#DC2626',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
  goldBg: '#FFFBEB',
  purple: '#7C3AED',
  info: '#0284C7',
  success: '#059669',
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
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ─── Comment Item ──────────────────────────────────────────────────────────
const CommentItem = ({ comment }) => {
  const userName = comment.user
    ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim()
    : 'Unknown';
  const userInitial = (comment.user?.firstName || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {comment.user?.profileImage ? (
          <Image source={{ uri: comment.user.profileImage }} style={styles.commentAvatarImg} />
        ) : (
          <Text style={styles.commentAvatarText}>{userInitial}</Text>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUserName}>{userName}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
        <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const FeedPostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;
  const { user: currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactions
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);

  const typeCfg = FEED_TYPE_CONFIG[post?.type] || FEED_TYPE_CONFIG.product_reel;
  const media = post?.media?.[0];
  const isVideo = media?.type === 'video' || media?.url?.includes('playlist.m3u8');
  const isImage = media?.url && !isVideo;
  const authorName = post?.author
    ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim()
    : 'Unknown';
  const authorInitial = (post?.author?.firstName || '?').charAt(0).toUpperCase();

  // Video player
  const player = useVideoPlayer(isVideo ? media?.url : null, p => {
    p.loop = true;
    p.muted = false;
  });

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPostDetail(postId);
      const data = res.data?.data;
      if (data) {
        setPost(data);
        setLikeCount(data.likes?.length || 0);
        setComments(data.comments || []);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Failed to load post');
      console.error('Fetch post error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchPost(); }, [postId]);

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount(prev => next ? prev + 1 : Math.max(0, prev - 1));
    try { await toggleLike(postId); } catch {}
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try { await toggleSave(postId); } catch {}
  };

  const handleFollow = async () => {
    if (!post?.author?._id) return;
    setIsFollowing(!isFollowing);
    try { await followUser(post.author._id); } catch {}
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const res = await addComment(postId, text);
      const newComment = res.data?.data;
      if (newComment) {
        setComments(prev => [{
          ...newComment,
          user: currentUser,
          text,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      setCommentText('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductPress = () => {
    if (post?.linkedProduct) {
      navigation.navigate('ProductDetail', { productId: post.linkedProduct._id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={styles.errorText}>{error || 'Post not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPost}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={[styles.typeBadge, { backgroundColor: typeCfg.color + '18' }]}>
            <Ionicons name={typeCfg.icon} size={12} color={typeCfg.color} />
            <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
          </View>
          <TouchableOpacity style={styles.headerAction} onPress={handleSave}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? C.gold : C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Media */}
          {isVideo ? (
            <View style={styles.mediaWrap}>
              <VideoView
                style={styles.mediaFull}
                player={player}
                contentFit="contain"
                nativeControls={true}
              />
            </View>
          ) : isImage ? (
            <Image source={{ uri: media.url }} style={styles.mediaFull} resizeMode="contain" />
          ) : null}

          {/* Content */}
          <View style={styles.contentSection}>
            {/* Author Row */}
            <View style={styles.authorRow}>
              <TouchableOpacity style={styles.authorInfo} activeOpacity={0.7}>
                <View style={styles.authorAvatar}>
                  {post.author?.profileImage ? (
                    <Image source={{ uri: post.author.profileImage }} style={styles.authorAvatarImg} />
                  ) : (
                    <Text style={styles.authorAvatarText}>{authorInitial}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.authorName}>{authorName}</Text>
                  <Text style={styles.postMeta}>
                    {getTimeAgo(post.createdAt)}
                    {post.campus !== 'ALL' ? ` · ${post.campus}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={handleFollow}
                activeOpacity={0.85}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>{post.title}</Text>

            {/* Description */}
            {post.description ? (
              <Text style={styles.description}>{post.description}</Text>
            ) : null}

            {/* Linked Product */}
            {post.linkedProduct && (
              <TouchableOpacity style={styles.linkedProduct} onPress={handleProductPress} activeOpacity={0.85}>
                <View style={styles.linkedProductTop}>
                  <Ionicons name="pricetag-outline" size={14} color={C.brand} />
                  <Text style={styles.linkedProductLabel}>Linked Product</Text>
                </View>
                <View style={styles.linkedProductContent}>
                  {post.linkedProduct.images?.[0] ? (
                    <Image source={{ uri: post.linkedProduct.images[0] }} style={styles.productImg} />
                  ) : (
                    <View style={[styles.productImg, styles.productImgPlaceholder]}>
                      <Ionicons name="image-outline" size={18} color={C.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={2}>{post.linkedProduct.name}</Text>
                    <Text style={styles.productPrice}>GH₵ {Number(post.linkedProduct.price).toFixed(2)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </View>
              </TouchableOpacity>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? C.danger : C.textOff} />
                <Text style={[styles.actionText, isLiked && { color: C.danger }]}>{formatCount(likeCount)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={C.textOff} />
                <Text style={styles.actionText}>{formatCount(comments.length)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={20} color={C.textOff} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? C.gold : C.textOff} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>

            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Ionicons name="chatbubble-outline" size={32} color={C.textMuted} />
                <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <CommentItem key={comment._id || index} comment={comment} />
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={C.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              maxLength={500}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleAddComment}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surface },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  headerAction: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  // Media
  mediaWrap: { width: '100%', height: MEDIA_HEIGHT, backgroundColor: '#000' },
  mediaFull: { width: '100%', height: '100%' },

  // Content
  contentSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },

  // Author
  authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  authorAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.brandDim,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  authorAvatarImg: { width: '100%', height: '100%' },
  authorAvatarText: { fontSize: 16, fontWeight: '700', color: C.brand },
  authorName: { fontSize: 14, fontWeight: '700', color: C.text },
  postMeta: { fontSize: 11.5, color: C.textMuted, marginTop: 2 },
  followBtn: {
    backgroundColor: C.brand, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 18,
  },
  followBtnActive: { backgroundColor: C.brandDim, borderWidth: 1, borderColor: C.brand },
  followBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  followBtnTextActive: { color: C.brand },

  // Title & Description
  title: { fontSize: 18, fontWeight: '800', color: C.text, lineHeight: 25, marginBottom: 8 },
  description: { fontSize: 14.5, color: C.textOff, lineHeight: 22 },

  // Linked Product
  linkedProduct: {
    backgroundColor: C.brandDim, borderRadius: 14, padding: 12, marginTop: 16,
    borderWidth: 1, borderColor: '#99F6E4',
  },
  linkedProductTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  linkedProductLabel: { fontSize: 11, fontWeight: '700', color: C.brand, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkedProductContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F1F5F9' },
  productImgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 13.5, fontWeight: '600', color: C.text },
  productPrice: { fontSize: 14, fontWeight: '800', color: C.brand, marginTop: 3 },

  // Actions
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '600', color: C.textOff },

  // Comments
  commentsSection: { paddingHorizontal: 16, paddingTop: 20 },
  commentsTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 16 },
  noComments: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  noCommentsText: { fontSize: 13.5, color: C.textMuted },

  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.brandDim,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0, marginTop: 2,
  },
  commentAvatarImg: { width: '100%', height: '100%' },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: C.brand },
  commentContent: { flex: 1 },
  commentBubble: { backgroundColor: C.bg, borderRadius: 14, borderTopLeftRadius: 4, padding: 10 },
  commentUserName: { fontSize: 12, fontWeight: '700', color: C.brand, marginBottom: 3 },
  commentText: { fontSize: 13.5, color: C.text, lineHeight: 19 },
  commentTime: { fontSize: 11, color: C.textMuted, marginTop: 4, marginLeft: 4 },

  // Input
  inputBar: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.surface, paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: C.bg, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 14, color: C.text, maxHeight: 100, paddingVertical: 8 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(13,148,136,0.3)' },

  // Loaders & Errors
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  errorText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: C.brand, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default FeedPostDetailScreen;