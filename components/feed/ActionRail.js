
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
import { useVideoPlayer, VideoView } from 'expo-video'

import {styles} from '../../styles/campusfeed'

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

export const ActionRail = ({ post, isLiked, isSaved, onLike, onComment, onFollow, onSave, onShare,onReport, isFollowing,authorInitial, authorImage }) => (
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
      
    </TouchableOpacity>
    <TouchableOpacity style={styles.railBtn} onPress={onReport} activeOpacity={0.7}>
      <Ionicons name="flag-outline" size={22} color={C.white} />
    </TouchableOpacity>
  </View>
);