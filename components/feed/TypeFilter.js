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


// ─── Top Filter Bar ──────────────────────────────────────────────────────
export const TypeFilter = ({ types, activeType, onSelect }) => (
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