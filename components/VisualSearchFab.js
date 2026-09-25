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

const FAB_HEIGHT = 52;

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
      toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4,
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
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
    transform: [
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
    ],
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom, right }]}
    >
      {/* Pulsing halo — pulses the same pill shape as the FAB */}
      <Animated.View pointerEvents="none" style={[styles.pulse, pulseStyle]} />

      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Visual search — find products by photo"
      >
        <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
          {/* Camera icon on the left */}
          <Ionicons name="camera" size={18} strokeWidth={2.4} color="#fff" />

          {/* Label to the right */}
          <Text style={styles.label} numberOfLines={1}>Visual Search</Text>

          {/* Sparkle badge pinned to the top-right of the pill */}
          <View style={styles.sparkle} pointerEvents="none">
            <Ionicons name="sparkles" size={9} color="#fff" />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  // Position wrapper — sized to content so the pill's width is auto
  wrap: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Pulsing halo. Matches the pill's height and border radius, and
  // stretches to match the pill's width via `inset: 0` on the wrap.
  pulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FAB_HEIGHT / 2,
    backgroundColor: C.brand,
  },

  // ── The single pill: icon + label ───────────────────────────────────────
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    height: FAB_HEIGHT,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: FAB_HEIGHT / 2,

    backgroundColor: C.brand,
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

  label: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  // Sparkle badge on top-right of the pill
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
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