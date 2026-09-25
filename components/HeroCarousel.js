// src/components/HeroCarousel.js
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

//  ── Slide geometry ──────────────────────────────────────────────────────
//  SLIDE_SIDE_MARGIN  → outer margin of the carousel from the screen edges
//  SLIDE_GAP          → space between two adjacent slides
//  SLIDE_W            → width of a single slide
//  SLIDE_H            → height of a single slide
//
//  Everything that needs "slide + gap" for scroll maths derives from
//  SLIDE_SNAP below, so changing the gap keeps the carousel in sync.
const SLIDE_SIDE_MARGIN = 16;
const SLIDE_GAP = 12;
const SLIDE_W = width - SLIDE_SIDE_MARGIN * 2;
const SLIDE_H = Math.round(SLIDE_W * 0.72);
const SLIDE_SNAP = SLIDE_W + SLIDE_GAP;

const AUTO_SCROLL_INTERVAL = 5000;

// ─── Hero slides ──────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'hero-1',
    src: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1790335121/hero_flyer_1_1_ney3mo.png',
    alt: 'CediMart promotion',
    target: { stack: 'Products' },
  },
  {
    key: 'hero-2',
    src: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1790335131/hero_flyer_2_1_av33wr.png',
    alt: 'CediMart promotion',
    target: { tab: 'Feeds', stack: 'Feeds' },
  },
  {
    key: 'hero-3',
    src: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1790335211/hero_flyer_3_1_lrktad.png',
    alt: 'CediMart promotion',
    target: { stack: 'Discover' },
  },
  {
    key: 'hero-4',
    src: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1790335121/hero_flyer_4_1_elq4l8.png',
    alt: 'CediMart promotion',
    target: { stack: 'Products', params: { tag: 'urgent-sale' } },
  },
];

const HeroCarousel = ({ navigation, onSlidePress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const { user } = useAuth();

  // ── Auto-advance ────────────────────────────────────────────────────────
  const startAutoScroll = useCallback(() => {
    if (SLIDES.length <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [startAutoScroll]);

  const pauseAutoScroll = () => clearInterval(timerRef.current);

  //  Content offset now divides by SLIDE_SNAP (slide + gap) instead of
  //  SLIDE_W, so the index calculation stays correct after adding the gap.
  const handleMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_SNAP);
    setActiveIndex(index);
    pauseAutoScroll();
    startAutoScroll();
  };

  const handleDotPress = (index) => {
    Haptics.selectionAsync().catch(() => {});
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
    pauseAutoScroll();
    startAutoScroll();
  };

  // ── Target resolution (unchanged) ──────────────────────────────────────
  const navigateToTarget = (target) => {
    if (!navigation || !target) return;
    const { stack, tab, params } = target;

    if (tab) {
      try {
        navigation.navigate(tab, params);
        return;
      } catch {
        // fall through to stack navigation
      }
    }

    if (stack) {
      try {
        navigation.navigate(stack, params);
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[HeroCarousel] No route "${stack}" in this navigator.`, err?.message);
      }
    }
  };

  const handleSlidePress = (slide) => {
    Haptics.selectionAsync().catch(() => {});
    if (onSlidePress) {
      onSlidePress(slide);
      return;
    }
    navigateToTarget(slide.target);
  };

  const renderSlide = ({ item: slide }) => (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={() => handleSlidePress(slide)}
      style={styles.slideWrapper}
    >
      <Image
        source={{ uri: slide.src }}
        style={styles.slideImage}
        resizeMode="contain"
        accessibilityLabel={slide.alt}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={pauseAutoScroll}
        scrollEventThrottle={16}
        //  snapToInterval = slide width + gap, so paging lands exactly on
        //  each slide's left edge after the gap.
        snapToInterval={SLIDE_SNAP}
        //  decelerationRate 'fast' + snapToInterval gives the "snap-to-page"
        //  feel that pagingEnabled would give, but works correctly with gaps.
        decelerationRate="fast"
        //  Padding on both ends so the first slide starts flush with the
        //  margin and the last slide ends flush with the margin. Without
        //  this, the trailing gap looks asymmetric.
        contentContainerStyle={styles.carouselContent}
        getItemLayout={(_, index) => ({
          length: SLIDE_SNAP,
          offset: SLIDE_SNAP * index,
          index,
        })}
      />

      {SLIDES.length > 1 && (
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleDotPress(i)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel={`Go to slide ${i + 1}`}
            >
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 8 },

  //  Content padding: side margin + half the gap on each end so the
  //  first and last slides align with the carousel's outer edges.
  carouselContent: {
    paddingHorizontal: SLIDE_SIDE_MARGIN,
    gap: SLIDE_GAP,
  },

  slideWrapper: {
    width: SLIDE_W,
    height: SLIDE_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0FDFA',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },

  slideImage: { width: '100%', height: '100%' },

  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#D0D0D0',
  },
  dotActive: {
    backgroundColor: '#0D9488', width: 22, borderRadius: 4,
  },
});

export default HeroCarousel;