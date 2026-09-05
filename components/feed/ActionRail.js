// src/components/feed/ActionRail.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFollowStore } from '../../stores/useFollowStore';
import { styles } from '../../styles/campusfeed';

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

const formatCount = (count) => {
  if (!count) return '';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

export const ActionRail = ({ 
  post, 
  isLiked, 
  isSaved, 
  onLike, 
  onComment, 
  onFollow, 
  onSave, 
  onShare,
  onReport, 
  authorInitial, 
  authorImage 
}) => {
  const [followLoading, setFollowLoading] = useState(false);
  const { followingIds, isFollowing: checkIsFollowing, follow, unfollow } = useFollowStore();
  
  // Get author ID from post
  const authorId = post?.author?._id || post?.author;
  
  // Check if following this author
  const isFollowingAuthor = authorId ? checkIsFollowing(authorId) : false;

  const handleFollowPress = async () => {
    if (!authorId) return;
    
    setFollowLoading(true);
    try {
      if (isFollowingAuthor) {
        await unfollow(authorId);
      } else {
        await follow(authorId);
      }
      // Call the parent's onFollow handler if provided
      onFollow?.(authorId);
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View style={styles.rail}>
      <TouchableOpacity 
        style={styles.railAvatarWrap} 
        onPress={handleFollowPress} 
        activeOpacity={0.85}
        disabled={followLoading}
      >
        <View style={styles.railAvatar}>
          {authorImage ? (
            <Image source={{ uri: authorImage }} style={styles.railAvatarImg} />
          ) : (
            <Text style={styles.railAvatarText}>{authorInitial}</Text>
          )}
        </View>
        <View style={[
          styles.railAvatarPlus, 
          isFollowingAuthor && styles.railAvatarPlusFollowing
        ]}>
          {followLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name={isFollowingAuthor ? 'checkmark' : 'add'} 
              size={12} 
              color="#fff" 
            />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.railBtn} onPress={onLike} activeOpacity={0.7}>
        <Ionicons name="heart" size={30} color={isLiked ? C.red : C.white} />
        <Text style={styles.railLabel}>{formatCount((post.likes?.length || 0) + (isLiked ? 1 : 0))}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.railBtn} onPress={onComment} activeOpacity={0.7}>
        <Ionicons name="chatbubble-ellipses" size={30} color={C.white} />
        <Text style={styles.railLabel}>{formatCount(post.commentCount || 0)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.railBtn} onPress={onSave} activeOpacity={0.7}>
        <Ionicons name="bookmark" size={30} color={isSaved ? C.brand : C.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.railBtn} onPress={onShare} activeOpacity={0.7}>
        <Ionicons name="arrow-redo" size={30} color={C.white} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.railBtn} onPress={onReport} activeOpacity={0.7}>
        <Ionicons name="flag" size={22} color={C.white} />
      </TouchableOpacity>
    </View>
  );
};