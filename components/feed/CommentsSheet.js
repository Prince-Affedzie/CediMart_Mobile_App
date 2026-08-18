// src/components/feed/CommentsSheet.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getComments, 
  addComment, 
  toggleCommentLike, 
  updateComment, 
  deleteComment,
  reportComment,
  getReplies,
} from '../../apis/feedApi';
import { useAuth } from '../../context/AuthContext';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.75;

const C = {
  bg: '#1A1A2E',
  surface: '#16213E',
  surfaceAlt: '#0F3460',
  text: '#FFFFFF',
  textOff: '#A8A8B8',
  textMuted: '#6B7280',
  brand: '#14B8A6',
  border: 'rgba(255,255,255,0.08)',
  danger: '#FF3B5C',
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

const CommentsSheet = ({ visible, onClose, postId, postAuthor }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [likingCommentId, setLikingCommentId] = useState(null);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      fetchComments();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, postId]);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setReplyingTo(null);
      setCommentText('');
      setEditingComment(null);
      setKeyboardHeight(0);
      onClose();
    });
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getComments(postId, { page: 1, limit: 20, sort: 'newest' });
      
      setComments(res.data?.data.comments || []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      if (editingComment) {
        // Update existing comment
        const res = await updateComment(editingComment._id, text);
        const updatedComment = res.data?.data;
        if (updatedComment) {
          setComments(prev => prev.map(c => 
            c._id === updatedComment._id ? { ...c, ...updatedComment, author: c.author } : c
          ));
        }
        setEditingComment(null);
      } else if (replyingTo) {
        // Add reply
        const res = await addComment(postId, text, replyingTo._id);
        const newReply = res.data?.data;
        if (newReply) {
          setComments(prev => prev.map(c => {
            if (c._id === replyingTo._id) {
              return {
                ...c,
                replyCount: (c.replyCount || 0) + 1,
                replies: [...(c.replies || []), {
                  ...newReply,
                  author: { _id: user?._id, firstName: user?.firstName, lastName: user?.lastName, profileImage: user?.profileImage },
                }],
              };
            }
            return c;
          }));
        }
        setReplyingTo(null);
      } else {
        // Add top-level comment
        const res = await addComment(postId, text);
        const newComment = res.data?.data;
        if (newComment) {
          setComments(prev => [{
            ...newComment,
            author: { _id: user?._id, firstName: user?.firstName, lastName: user?.lastName, profileImage: user?.profileImage },
          }, ...prev]);
        }
      }
      
      setCommentText('');
      Keyboard.dismiss();
      
      if (!editingComment && !replyingTo) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (err) {
      console.error('Submit comment error:', err);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
    setCommentText('');
    inputRef.current?.focus();
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setReplyingTo(null);
    setCommentText(comment.text);
    inputRef.current?.focus();
  };

  const handleDelete = (comment) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment._id);
              setComments(prev => prev.filter(c => c._id !== comment._id));
            } catch (err) {
              console.error('Delete comment error:', err);
              Alert.alert('Error', 'Failed to delete comment.');
            }
          },
        },
      ]
    );
  };

  const handleReport = (comment) => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport(comment, 'spam') },
        { text: 'Harassment', onPress: () => submitReport(comment, 'harassment') },
        { text: 'Inappropriate', onPress: () => submitReport(comment, 'inappropriate') },
      ]
    );
  };

  const submitReport = async (comment, reason) => {
    try {
      await reportComment(comment._id, reason);
      Alert.alert('Reported', 'Thank you for your report. We will review this comment.');
    } catch (err) {
      console.error('Report comment error:', err);
      Alert.alert('Error', 'Failed to report comment.');
    }
  };

  const handleLike = async (comment) => {
    if (likingCommentId === comment._id) return;
    setLikingCommentId(comment._id);
    try {
      const res = await toggleCommentLike(comment._id);
      const { isLiked, likeCount } = res.data?.data || {};
      setComments(prev => prev.map(c => 
        c._id === comment._id ? { ...c, isLiked, likeCount } : c
      ));
    } catch (err) {
      console.error('Like comment error:', err);
    } finally {
      setLikingCommentId(null);
    }
  };

  const handleLoadReplies = async (comment) => {
    try {
      const res = await getReplies(comment._id, { page: 1, limit: 10 });
      const replies = res.data?.data?.replies || [];
      setComments(prev => prev.map(c => 
        c._id === comment._id ? { ...c, replies } : c
      ));
      setExpandedReplies(prev => ({ ...prev, [comment._id]: true }));
    } catch (err) {
      console.error('Load replies error:', err);
    }
  };

  const handleLongPress = (comment) => {
    const isAuthor = comment.author?._id === user?._id || comment.author === user?._id;
    
    if (isAuthor) {
      Alert.alert(
        'Comment Options',
        '',
        [
          { text: 'Edit', onPress: () => handleEdit(comment) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(comment) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Comment Options',
        '',
        [
          { text: 'Report', style: 'destructive', onPress: () => handleReport(comment) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const renderComment = ({ item }) => {
    const userName = item.author ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim() : 'Unknown';
    const userInitial = (item.author?.firstName || '?').charAt(0).toUpperCase();
    const isAuthor = item.author?._id === user?._id || item.author === user?._id;
    const isExpanded = expandedReplies[item._id];
    const replies = item.replies || [];

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          {item.author?.profileImage ? (
            <Image source={{ uri: item.author.profileImage }} style={styles.commentAvatarImg} />
          ) : (
            <Text style={styles.commentAvatarText}>{userInitial}</Text>
          )}
        </View>
        <View style={styles.commentContent}>
          <TouchableOpacity onLongPress={() => handleLongPress(item)} delayLongPress={400} activeOpacity={0.9}>
            <View style={styles.commentBubble}>
              <Text style={styles.commentUserName}>{userName}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
              {item.isEdited && (
                <Text style={styles.editedText}>edited</Text>
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
            <TouchableOpacity onPress={() => handleLike(item)} disabled={likingCommentId === item._id}>
              <Text style={[styles.actionBtn, item.isLiked && styles.actionBtnActive]}>
                {item.isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReply(item)}>
              <Text style={styles.actionBtn}>Reply</Text>
            </TouchableOpacity>
            {item.likeCount > 0 && (
              <Text style={styles.likeCount}>{item.likeCount} {item.likeCount === 1 ? 'like' : 'likes'}</Text>
            )}
          </View>

          {/* Replies */}
          {replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {replies.map(reply => (
                <View key={reply._id} style={styles.replyItem}>
                  <View style={[styles.commentAvatar, styles.replyAvatar]}>
                    {reply.author?.profileImage ? (
                      <Image source={{ uri: reply.author.profileImage }} style={styles.commentAvatarImg} />
                    ) : (
                      <Text style={[styles.commentAvatarText, { fontSize: 11 }]}>
                        {(reply.author?.firstName || '?').charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.replyContent}>
                    <View style={[styles.commentBubble, styles.replyBubble]}>
                      <Text style={styles.commentUserName}>
                        {reply.author ? `${reply.author.firstName || ''} ${reply.author.lastName || ''}`.trim() : 'Unknown'}
                      </Text>
                      <Text style={styles.commentText}>{reply.text}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>{getTimeAgo(reply.createdAt)}</Text>
                      {reply.author?._id === user?._id && (
                        <TouchableOpacity onPress={() => handleLongPress(reply)}>
                          <Text style={styles.actionBtn}>•••</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Load more replies */}
          {item.replyCount > replies.length && !isExpanded && (
            <TouchableOpacity onPress={() => handleLoadReplies(item)} style={styles.loadRepliesBtn}>
              <Text style={styles.loadRepliesText}>
                View {item.replyCount - replies.length} more {item.replyCount - replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetTitleRow}>
        <Text style={styles.sheetTitle}>
          Comments ({comments.length})
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.sheetCloseBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={0}
      >
        <Animated.View 
          style={[
            styles.sheet, 
            { 
              transform: [{ translateY: slideAnim }],
              height: keyboardHeight > 0 ? SHEET_HEIGHT - keyboardHeight + 60 : SHEET_HEIGHT,
            }
          ]}
        >
          <View style={styles.sheetInner}>
            <FlatList
              ref={flatListRef}
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item, index) => item._id || index.toString()}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyComments}>
                    <Ionicons name="chatbubble-ellipses-outline" size={40} color={C.textMuted} />
                    <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
                    <Text style={styles.emptyCommentsSub}>Be the first to comment</Text>
                  </View>
                ) : (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={C.brand} />
                  </View>
                )
              }
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            />

            {/* Reply/Edit indicator */}
            {(replyingTo || editingComment) && (
              <View style={styles.replyIndicator}>
                <View style={styles.replyIndicatorLeft}>
                  <Ionicons 
                    name={editingComment ? "pencil-outline" : "arrow-undo-outline"} 
                    size={14} 
                    color={C.brand} 
                  />
                  <Text style={styles.replyIndicatorText} numberOfLines={1}>
                    {editingComment 
                      ? 'Editing comment...' 
                      : `Replying to ${replyingTo.author?.firstName || 'User'}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { 
                  setReplyingTo(null); 
                  setEditingComment(null);
                  setCommentText('');
                }}>
                  <Ionicons name="close" size={16} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Comment input */}
            <View style={[
              styles.inputContainer,
              Platform.OS === 'ios' && keyboardHeight > 0 && { paddingBottom: 10 }
            ]}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder={
                    editingComment 
                      ? 'Edit your comment...' 
                      : replyingTo 
                        ? `Reply to ${replyingTo.author?.firstName || 'User'}...` 
                        : 'Add a comment...'
                  }
                  placeholderTextColor={C.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={1000}
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!commentText.trim() || submitting}
                  activeOpacity={0.7}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetInner: {
    flex: 1,
  },

  // Header
  sheetHeader: {
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Comments list
  commentsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    marginTop: 2,
  },
  commentAvatarImg: {
    width: '100%',
    height: '100%',
  },
  commentAvatarText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 10,
    paddingHorizontal: 12,
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
    marginBottom: 3,
  },
  commentText: {
    fontSize: 13.5,
    color: C.text,
    lineHeight: 19,
  },
  editedText: {
    fontSize: 9,
    color: C.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingLeft: 4,
    flexWrap: 'wrap',
  },
  commentTime: {
    fontSize: 11,
    color: C.textMuted,
  },
  actionBtn: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textOff,
  },
  actionBtnActive: {
    color: C.brand,
  },
  likeCount: {
    fontSize: 10,
    color: C.textMuted,
  },

  // Replies
  repliesContainer: {
    marginTop: 8,
    paddingLeft: 20,
    gap: 8,
  },
  replyItem: {
    flexDirection: 'row',
    gap: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 0,
  },
  replyContent: {
    flex: 1,
  },
  replyBubble: {
    backgroundColor: C.surfaceAlt,
  },
  loadRepliesBtn: {
    marginTop: 8,
    paddingLeft: 4,
  },
  loadRepliesText: {
    fontSize: 11,
    color: C.brand,
    fontWeight: '600',
  },

  // Empty
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyCommentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textOff,
  },
  emptyCommentsSub: {
    fontSize: 13,
    color: C.textMuted,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Reply indicator
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  replyIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  replyIndicatorText: {
    fontSize: 12.5,
    color: C.brand,
    fontWeight: '600',
    flex: 1,
  },

  // Input
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    bottom:28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default CommentsSheet;