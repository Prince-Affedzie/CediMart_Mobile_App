// src/components/SkeletonLoader.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─── Design tokens ──────────────────────────────────────────────────────────
// Kept in one place so every skeleton reads as one system rather than a pile
// of ad-hoc grays — matches the brand teal used elsewhere in the app.
const TOKENS = {
  brand: '#14B8A6',
  light: {
    base: '#E9EEF2',       // resting block color on white/light surfaces
    baseAlt: '#DFE6EC',    // slightly deeper, for blocks that sit on a base block (e.g. price pill)
    sweep: ['transparent', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.0)', 'transparent'],
  },
  dark: {
    base: '#1B2027',       // resting block color on the dark feed background
    baseAlt: '#252B33',
    sweep: ['transparent', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.0)', 'transparent'],
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 },
};

const SWEEP_DURATION = 1350;

// ─── Reduced motion awareness ──────────────────────────────────────────────
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => mounted && setReduced(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduced(!!v));
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
};

// ─── Shimmer block ──────────────────────────────────────────────────────────
// A moving highlight band sweeps across each block (the technique used by
// Instagram/LinkedIn-style loaders), rather than the whole block pulsing
// opacity in place. Falls back to a gentle opacity pulse when the user has
// Reduce Motion enabled.
const ShimmerBlock = ({ style, tone = 'light' }) => {
  const [blockWidth, setBlockWidth] = useState(0);
  const reducedMotion = useReducedMotion();
  const translateX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  const theme = TOKENS[tone];

  const onLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    setBlockWidth((prev) => (prev !== w ? w : prev));
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }

    if (!blockWidth) return;
    translateX.setValue(-blockWidth);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: blockWidth,
        duration: SWEEP_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [blockWidth, reducedMotion]);

  return (
    <View
      onLayout={onLayout}
      style={[style, { backgroundColor: theme.base, overflow: 'hidden' }]}
    >
      {reducedMotion ? (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.baseAlt, opacity: pulse }]} />
      ) : (
        blockWidth > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: blockWidth,
              transform: [{ translateX }],
            }}
          >
            <LinearGradient
              colors={theme.sweep}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )
      )}
    </View>
  );
};

// ─── Feed Skeleton (full-screen, mirrors FeedPostItem) ─────────────────────
export const FeedSkeleton = ({ count = 1 }) => {
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={feedStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[feedStyles.page, { height: screenHeight }]}>
          <View style={feedStyles.darkBg} />

          {/* Type pill, top right — matches FeedPostItem's badge position */}
          <View style={feedStyles.typePillWrap}>
            <ShimmerBlock tone="dark" style={feedStyles.typePill} />
          </View>

          <View style={feedStyles.bottomContent}>
            <View style={feedStyles.bottomLeft}>
              <ShimmerBlock tone="dark" style={feedStyles.productChip} />
              <ShimmerBlock tone="dark" style={feedStyles.authorLine} />
              <ShimmerBlock tone="dark" style={[feedStyles.textLine, { width: '82%', height: 17 }]} />
              <ShimmerBlock tone="dark" style={[feedStyles.textLine, { width: '58%', height: 13, marginTop: 2 }]} />
            </View>

            <View style={feedStyles.rail}>
              <ShimmerBlock tone="dark" style={feedStyles.avatarCircle} />
              <ShimmerBlock tone="dark" style={feedStyles.iconCircle} />
              <ShimmerBlock tone="dark" style={feedStyles.iconCircle} />
              <ShimmerBlock tone="dark" style={feedStyles.iconCircle} />
              <ShimmerBlock tone="dark" style={feedStyles.iconCircle} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── Product Grid Skeleton ──────────────────────────────────────────────────
export const ProductGridSkeleton = ({ count = 6, columns = 2 }) => {
  const cardWidth = (width - 32 - (columns - 1) * 10) / columns;

  return (
    <View style={gridStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[gridStyles.card, { width: cardWidth }]}>
          <View style={gridStyles.imageWrap}>
            <ShimmerBlock style={gridStyles.image} />
            <ShimmerBlock style={gridStyles.favBadge} />
          </View>
          <View style={gridStyles.body}>
            <ShimmerBlock style={[gridStyles.line, { width: '90%' }]} />
            <ShimmerBlock style={[gridStyles.line, { width: '55%' }]} />
            <View style={gridStyles.priceRow}>
              <ShimmerBlock style={gridStyles.price} />
              <ShimmerBlock style={gridStyles.ratingDot} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── List Item Skeleton (products, notifications, orders, etc.) ────────────
export const ListItemSkeleton = ({ count = 5 }) => (
  <View style={listStyles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={listStyles.row}>
        <ShimmerBlock style={listStyles.avatar} />
        <View style={listStyles.content}>
          <ShimmerBlock style={[listStyles.line, { width: '68%' }]} />
          <ShimmerBlock style={[listStyles.line, { width: '42%', height: 11 }]} />
        </View>
        <ShimmerBlock style={listStyles.chevron} />
      </View>
    ))}
  </View>
);

// ─── Chat Skeleton ───────────────────────────────────────────────────────────
export const ChatSkeleton = ({ count = 8 }) => {
  // Seeded per-render widths so bubbles don't re-randomize on re-render
  const bubbleWidths = useRef(
    Array.from({ length: count }).map((_, i) => {
      const isMe = i % 3 === 0 || i % 4 === 0;
      return isMe ? 100 + Math.random() * 100 : 120 + Math.random() * 80;
    })
  ).current;

  return (
    <View style={chatStyles.container}>
      {Array.from({ length: count }).map((_, i) => {
        const isMe = i % 3 === 0 || i % 4 === 0;
        return (
          <View key={i} style={[chatStyles.bubbleRow, isMe && chatStyles.bubbleRowMe]}>
            {!isMe && <ShimmerBlock style={chatStyles.avatarSmall} />}
            <ShimmerBlock
              style={[
                chatStyles.bubble,
                { width: bubbleWidths[i] },
                isMe ? chatStyles.bubbleMe : chatStyles.bubbleThem,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

// ─── Discover Card Skeleton ──────────────────────────────────────────────────
export const DiscoverCardSkeleton = ({ count = 4 }) => (
  <View style={discoverStyles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={discoverStyles.card}>
        <View style={discoverStyles.cardHeader}>
          <ShimmerBlock style={discoverStyles.badge} />
          <ShimmerBlock style={discoverStyles.badgeSmall} />
        </View>
        <ShimmerBlock style={[discoverStyles.line, { width: '88%', height: 15, marginTop: 10 }]} />
        <ShimmerBlock style={[discoverStyles.line, { width: '48%', height: 13 }]} />
        <ShimmerBlock style={[discoverStyles.line, { width: '72%', height: 11 }]} />
        <View style={discoverStyles.tags}>
          <ShimmerBlock style={discoverStyles.tag} />
          <ShimmerBlock style={discoverStyles.tag} />
        </View>
      </View>
    ))}
  </View>
);

// ─── Profile Header Skeleton ─────────────────────────────────────────────────
export const ProfileHeaderSkeleton = () => (
  <View style={profileStyles.container}>
    <ShimmerBlock style={profileStyles.banner} />
    <View style={profileStyles.avatarRow}>
      <ShimmerBlock style={profileStyles.avatar} />
      <View style={profileStyles.stats}>
        <ShimmerBlock style={profileStyles.statItem} />
        <ShimmerBlock style={profileStyles.statItem} />
        <ShimmerBlock style={profileStyles.statItem} />
      </View>
    </View>
    <ShimmerBlock style={[profileStyles.line, { width: '38%', marginTop: 14 }]} />
    <ShimmerBlock style={[profileStyles.line, { width: '68%', marginTop: 8, height: 12 }]} />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────

const feedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  page: { width, backgroundColor: '#000', position: 'relative' },
  darkBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0B0E12' },
  typePillWrap: { position: 'absolute', top: 118, right: 14 },
  typePill: { width: 74, height: 24, borderRadius: TOKENS.radius.pill },
  bottomContent: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingBottom: 22,
  },
  bottomLeft: { flex: 1, paddingRight: 12, gap: 10 },
  productChip: { width: '74%', height: 44, borderRadius: TOKENS.radius.lg },
  authorLine: { width: '38%', height: 13, borderRadius: TOKENS.radius.sm },
  textLine: { borderRadius: TOKENS.radius.sm },
  rail: { alignItems: 'center', gap: 20, marginBottom: 76 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23 },
  iconCircle: { width: 30, height: 30, borderRadius: 15 },
});

const gridStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10,
  },
  card: {
    backgroundColor: '#fff', borderRadius: TOKENS.radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EEF1F4',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 140 },
  favBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
  },
  body: { padding: 10, gap: 8 },
  line: { height: 12, borderRadius: TOKENS.radius.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { width: '42%', height: 18, borderRadius: TOKENS.radius.sm },
  ratingDot: { width: 34, height: 14, borderRadius: TOKENS.radius.sm },
});

const listStyles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  content: { flex: 1, gap: 6 },
  line: { height: 13, borderRadius: TOKENS.radius.sm },
  chevron: { width: 16, height: 16, borderRadius: 8 },
});

const chatStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowMe: { flexDirection: 'row-reverse' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14 },
  bubble: { height: 38, borderRadius: 18 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
});

const discoverStyles = StyleSheet.create({
  container: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: TOKENS.radius.xl, padding: 16,
    borderWidth: 1, borderColor: '#EEF1F4', gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { width: 80, height: 22, borderRadius: TOKENS.radius.md },
  badgeSmall: { width: 50, height: 20, borderRadius: TOKENS.radius.md },
  line: { borderRadius: TOKENS.radius.sm },
  tags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { width: 60, height: 22, borderRadius: TOKENS.radius.sm },
});

const profileStyles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  banner: { width: '100%', height: 160, borderRadius: TOKENS.radius.xl },
  avatarRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: -30, paddingHorizontal: 10,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 16 },
  statItem: { width: 50, height: 30, borderRadius: TOKENS.radius.md },
  line: { height: 13, borderRadius: TOKENS.radius.sm },
});