// src/components/VisualSearchFab.js
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── Design Tokens (mirrors VisualSearchScreen) ────────────────────────────
const C = {
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandD: '#0F766E',
  brandBg: '#F0FDFA',
  brandBorder: '#99F6E4',
  text: '#0F172A',
  textMuted: '#94A3B8',
  surface: '#FFFFFF',
};

const VisualSearchFab = ({ navigation, bottom = 24, right = 20 }) => {
  // Press scale
  const scale = useRef(new Animated.Value(1)).current;
  // Gentle idle pulse ring
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1, duration: 2000, useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0, duration: 0, useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 4,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6,
    }).start();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('VisualSearch');
  };

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    transform: [
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) },
    ],
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom, right }]}
    >
      {/* Pulsing halo */}
      <Animated.View pointerEvents="none" style={[styles.pulse, pulseStyle]} />

      {/* Small sparkle accent */}
      <View style={styles.sparkle} pointerEvents="none">
        <Ionicons name="sparkles" size={11} color="#fff" />
      </View>

      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
          <Ionicons name="camera" size={24} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pulsing halo behind the FAB
  pulse: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: C.brand,
  },

  // The button itself
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // Shadow — iOS
    shadowColor: C.brandD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    // Shadow — Android
    elevation: 8,
  },

  // Little sparkle badge on top-right of FAB
  sparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.brandL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
});

export default VisualSearchFab;