// src/components/feed/ReelSkeleton.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

/**
 * A skeleton shaped like the actual reel layout (full-bleed media block,
 * bottom-left text bars, right-side action rail circles) rather than a
 * generic list-card skeleton — a card skeleton doesn't visually map to a
 * full-screen video feed, so reusing one elsewhere in the app would still
 * look wrong here even once positioning is fixed.
 *
 * Self-positions with `...StyleSheet.absoluteFillObject` so it always
 * covers the full screen regardless of what's happening in the parent's
 * flex layout (e.g. an empty FlatList collapsing to near-zero height while
 * there's no data yet) — this is what actually fixes the "only fills the
 * bottom" bug, not just giving it a fixed height.
 */
const ReelSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.mediaBlock, { opacity }]} />

      <View style={styles.bottomContent}>
        <View style={styles.bottomLeft}>
          <Animated.View style={[styles.bar, styles.authorBar, { opacity }]} />
          <Animated.View style={[styles.bar, styles.titleBar, { opacity }]} />
          <Animated.View style={[styles.bar, styles.titleBarShort, { opacity }]} />
          <Animated.View style={[styles.bar, styles.descBar, { opacity }]} />
        </View>

        <View style={styles.rail}>
          <Animated.View style={[styles.railAvatar, { opacity }]} />
          {[0, 1, 2, 3].map((i) => (
            <Animated.View key={i} style={[styles.railIcon, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  mediaBlock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#2A2A2E' },
  bottomContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    paddingHorizontal: 14,
  },
  bottomLeft: { flex: 1, paddingRight: 12, gap: 8 },
  bar: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6 },
  authorBar: { width: 120, height: 13 },
  titleBar: { width: '85%', height: 15, marginTop: 4 },
  titleBarShort: { width: '55%', height: 15 },
  descBar: { width: '70%', height: 12, marginTop: 2 },
  rail: { alignItems: 'center', gap: 18, marginBottom: 76 },
  railAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)' },
  railIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)' },
});

export default ReelSkeleton;