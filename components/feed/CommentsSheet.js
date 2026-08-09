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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {addComment, getPostDetail } from '../../apis/feedApi';
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

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setReplyingTo(null);
      setCommentText('');
      onClose();
    });
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getPostDetail(postId);
      setComments(res.data?.data?.comments || []);
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
      const res = await addComment(postId, text);
      const newComment = res.data?.data;
      
      if (newComment) {
        // Add the new comment with user info to the list
        setComments(prev => [{
          ...newComment,
          user: { _id: user?._id, firstName: user?.firstName, lastName: user?.lastName, profileImage: user?.profileImage },
          text,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      } else {
        // Refetch to get the updated list
        await fetchComments();
      }
      
      setCommentText('');
      setReplyingTo(null);
      Keyboard.dismiss();
      
      // Scroll to top to show new comment
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const renderComment = ({ item }) => {
    const userName = item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() : 'Unknown';
    const userInitial = (item.user?.firstName || '?').charAt(0).toUpperCase();

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          {item.user?.profileImage ? (
            <Image source={{ uri: item.user.profileImage }} style={styles.commentAvatarImg} />
          ) : (
            <Text style={styles.commentAvatarText}>{userInitial}</Text>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentUserName}>{userName}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
            <TouchableOpacity onPress={() => handleReply(item)}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>
          </View>
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

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetInner}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
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
          />

          {/* Reply indicator */}
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <View style={styles.replyIndicatorLeft}>
                <Ionicons name="arrow-undo-outline" size={14} color={C.brand} />
                <Text style={styles.replyIndicatorText} numberOfLines={1}>
                  Replying to {replyingTo.user?.firstName || 'User'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Comment input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={replyingTo ? `Reply to ${replyingTo.user?.firstName || 'User'}...` : 'Add a comment...'}
                placeholderTextColor={C.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                maxLength={500}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
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
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
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
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingLeft: 4,
  },
  commentTime: {
    fontSize: 11,
    color: C.textMuted,
  },
  replyBtn: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textOff,
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
    bottom:44,
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