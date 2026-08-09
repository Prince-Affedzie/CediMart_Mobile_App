// src/components/ProductHeroCarousel.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SLIDE_W = width - 32;
const SLIDE_H = 240;
const AUTO_SCROLL_INTERVAL = 4500;

const ProductHeroCarousel = ({ products = [], onProductPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const startAutoScroll = useCallback(() => {
    if (products.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % products.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [products.length]);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [startAutoScroll]);

  const handleMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    setActiveIndex(index);
    clearInterval(timerRef.current);
    startAutoScroll();
  };

  const handleDotPress = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
    clearInterval(timerRef.current);
    startAutoScroll();
  };

  const formatPrice = (price) => `GH₵ ${Number(price).toFixed(2)}`;

  const getDiscountInfo = (product) => {
    const discountInfo = product.discountInfo;
    if (!discountInfo?.isOnSale) return null;
    const currentPrice = Number(product.price);
    const originalPrice = discountInfo.originalPrice;
    const percentage = discountInfo.discountPercentage ?? 
      (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
    return { currentPrice, originalPrice, percentage };
  };

  const renderSlide = ({ item: product }) => {
    const imageUri = product.images?.[0];
    const discount = getDiscountInfo(product);
    const campus = product.campus || '';
    const condition = product.condition || '';

    return (
      <TouchableOpacity
        activeOpacity={0.97}
        onPress={() => onProductPress?.(product)}
        style={[styles.slideWrapper, { width: SLIDE_W }]}
      >
        {/* Background Image - fills entire slide */}
        <Image
          source={{ uri: imageUri }}
          style={styles.slideImage}
          resizeMode="cover"
        />

        {/* Dark overlay for text readability */}
        <View style={styles.slideOverlay} />

        {/* Top-left: Condition badge */}
        {condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionBadgeText} numberOfLines={1}>
              {condition.replace(/-/g, ' ')}
            </Text>
          </View>
        )}

        {/* Top-right: Discount badge */}
        {discount && (
          <View style={styles.discountBadge}>
            <Ionicons name="pricetag" size={10} color="#fff" />
            <Text style={styles.discountBadgeText}>-{discount.percentage}%</Text>
          </View>
        )}

        {/* Bottom Content */}
        <View style={styles.slideContent}>
          {/* Campus & Category row */}
          <View style={styles.metaRow}>
            {campus ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.75)" />
                <Text style={styles.metaChipText} numberOfLines={1}>{campus}</Text>
              </View>
            ) : null}
            {product.category ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {product.category.replace(/-/g, ' ')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Price & CTA */}
          <View style={styles.bottomRow}>
            <View style={styles.priceBlock}>
              {discount ? (
                <>
                  <Text style={styles.priceText}>{formatPrice(discount.currentPrice)}</Text>
                  <Text style={styles.originalPrice}>{formatPrice(discount.originalPrice)}</Text>
                </>
              ) : (
                <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => onProductPress?.(product)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewBtnText}>View</Text>
              <Ionicons name="arrow-forward" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!products || products.length === 0) {
    return (
      <View style={styles.emptyCarousel}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="image-outline" size={32} color="#BDBDBD" />
        </View>
        <Text style={styles.emptyTitle}>No featured products</Text>
        <Text style={styles.emptySubtitle}>Check back soon for curated picks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderSlide}
        keyExtractor={item => item._id || Math.random().toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={SLIDE_W + 10}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        getItemLayout={(_, index) => ({ length: SLIDE_W + 10, offset: (SLIDE_W + 10) * index, index })}
      />

      {/* Dots + Counter */}
      <View style={styles.footerRow}>
        <View style={styles.dotsRow}>
          {products.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleDotPress(i)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.counter}>
          {activeIndex + 1} / {products.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  // Carousel content
  carouselContent: {
    paddingHorizontal: 16,
    gap: 10,
  },

  // Slide
  slideWrapper: {
    height: SLIDE_H,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },

  // Image fills the entire slide
  slideImage: {
    width: '100%',
    height: '120%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Dark gradient overlay (bottom-heavy for text readability)
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: SLIDE_H * 0.6,
    borderBottomColor: 'rgba(0,0,0,0.55)',
    borderLeftWidth: SLIDE_W,
    borderLeftColor: 'transparent',
  },

  // Top-left condition badge
  conditionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  conditionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
    maxWidth: 100,
  },

  // Top-right discount badge
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Bottom content
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 14,
  },

  // Meta row (campus + category)
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Product name
  productName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Bottom row: price + CTA
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceBlock: {
    flex: 1,
    marginRight: 12,
  },
  priceText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: 'System',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },

  // View button
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer: dots + counter
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: {
    backgroundColor: '#0D9488',
    width: 22,
    borderRadius: 4,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
  },

  // Empty state
  emptyCarousel: {
    height: SLIDE_H,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#757575',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});

export default ProductHeroCarousel;