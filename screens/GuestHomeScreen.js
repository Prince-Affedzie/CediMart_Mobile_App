// src/screens/auth/GuestHomeScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import productService from '../services/productService';
import { getVendorsByMarket, getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─────────────────────────────────────────────
// HERO SLIDES
// ─────────────────────────────────────────────
const HERO_SLIDES = [
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893982/makola_img_1_ryp6no.jpg',
    eyebrow: "Accra's Markets · Online",
    headline: 'Your Favourite\nMarkets,\nIn Your Pocket',
    sub: 'Madina, Makola, Kaneshie & more — shop from 8 major markets without leaving home',
    cta: 'Explore Markets',
    accentColor: '#69F0AE',
  },
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
    eyebrow: 'Farm Fresh · Daily',
    headline: 'Crisp Vegetables\nEvery Morning',
    sub: 'Harvested fresh daily — no cold storage, no compromise on quality',
    cta: 'See Vegetables',
    accentColor: '#A5D6A7',
  },
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773488413/fruits_1_shqhh2.jpg',
    eyebrow: 'Seasonal Picks',
    headline: 'Sun-Ripened\nFruits & More',
    sub: 'Handpicked at peak ripeness from trusted local farmers',
    cta: 'Explore Fruits',
    accentColor: '#FFCC80',
  },
  {
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989775/free_delivery_tsytih.jpg',
    eyebrow: 'Stock Up · Save More',
    headline: 'Free Delivery\nOver GH₵ 500',
    sub: 'Fill your pantry with staples from local vendors at fair market prices',
    cta: 'Shop Staples',
    accentColor: '#FFE082',
  },
];

const SLIDE_INTERVAL = 4800;

// ─────────────────────────────────────────────
// ACCRA MARKETS
// ─────────────────────────────────────────────
const ACCRA_MARKETS = [
  { name: 'Madina Market',       icon: '🏬', color: '#2E7D32', bg: '#E8F5E9' },
  { name: 'Makola Market',       icon: '🏪', color: '#1565C0', bg: '#E3F2FD' },
  { name: 'Kaneshie Market',     icon: '🛍️', color: '#6A1B9A', bg: '#F3E5F5' },
  { name: 'Mallam Market',       icon: '🌿', color: '#00695C', bg: '#E0F7FA' },
  { name: 'Tema Market',         icon: '🏙️', color: '#E65100', bg: '#FFF3E0' },
  { name: 'Dome Market',         icon: '🏘️', color: '#AD1457', bg: '#FCE4EC' },
  { name: 'Dansoman Market',     icon: '🌳', color: '#558B2F', bg: '#F1F8E9' },
  { name: 'Agbogbloshie Market', icon: '🐟', color: '#0277BD', bg: '#E1F5FE' },
];

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'vegetable', label: 'Vegetables', icon: 'leaf',      color: '#2E7D32', bg: '#E8F5E9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg' },
  { id: 'fruit',     label: 'Fruits',     icon: 'nutrition', color: '#F57F17', bg: '#FFF8E1', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773488413/fruits_1_shqhh2.jpg' },
  { id: 'staple',    label: 'Staples',    icon: 'bag',       color: '#5D4037', bg: '#EFEBE9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg' },
  { id: 'herb',      label: 'Herbs',      icon: 'flower',    color: '#1B5E20', bg: '#F1F8E9', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg' },
  { id: 'tuber',     label: 'Tubers',     icon: 'earth',     color: '#BF360C', bg: '#FBE9E7', image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1773487837/thomas-le-pRJhn4MbsMM-unsplash_xoh451.jpg' },
];

// ─────────────────────────────────────────────
// TRUST BADGES
// ─────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: 'leaf',             label: 'Farm Fresh',      sub: 'Direct from farms' },
  { icon: 'bicycle-outline',  label: 'Fast Delivery',   sub: 'Same-day available' },
  { icon: 'shield-checkmark', label: 'Quality Assured', sub: '100% satisfaction' },
  { icon: 'wallet-outline',   label: 'Fair Prices',     sub: 'No hidden charges' },
];

// ─────────────────────────────────────────────
// FULL-SCREEN LOADING STATE
// Shown on first load before any data arrives.
// Replaces the blank white flash users see.
// ─────────────────────────────────────────────
const LoadingScreen = () => {
  // Pulse animation for the skeleton shimmer
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={loadingStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" translucent />

      {/* Header skeleton */}
      <View style={loadingStyles.header}>
        <Animated.View style={[loadingStyles.skeletonBrand, { opacity: pulseAnim }]} />
        <View style={loadingStyles.headerBtns}>
          <Animated.View style={[loadingStyles.skeletonBtn, { opacity: pulseAnim }]} />
          <Animated.View style={[loadingStyles.skeletonBtnFilled, { opacity: pulseAnim }]} />
        </View>
      </View>

      {/* Hero skeleton */}
      <Animated.View style={[loadingStyles.heroSkeleton, { opacity: pulseAnim }]}>
        {/* Progress bars */}
        <View style={loadingStyles.progressRow}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={loadingStyles.progressBar} />
          ))}
        </View>
        <View style={loadingStyles.heroTextBlock}>
          <View style={loadingStyles.eyebrowSkeleton} />
          <View style={loadingStyles.titleSkeleton} />
          <View style={loadingStyles.titleSkeletonShort} />
          <View style={loadingStyles.subSkeleton} />
        </View>
      </Animated.View>

      {/* Trust strip skeleton */}
      <Animated.View style={[loadingStyles.trustStrip, { opacity: pulseAnim }]}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={loadingStyles.trustItem}>
            <View style={loadingStyles.trustCircle} />
            <View style={loadingStyles.trustLine} />
            <View style={loadingStyles.trustLineSub} />
          </View>
        ))}
      </Animated.View>

      {/* Centre indicator with message — clear signal that loading is happening */}
      <View style={loadingStyles.centreBlock}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={loadingStyles.centreTitle}>Loading fresh products…</Text>
        <Text style={loadingStyles.centreSub}>Fetching from Accra's markets</Text>
        {/* Animated dots */}
        <Animated.View style={[loadingStyles.dotRow, { opacity: pulseAnim }]}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[loadingStyles.dot, i === 1 && loadingStyles.dotMid]} />
          ))}
        </Animated.View>
      </View>

      {/* Card skeleton grid */}
      <Animated.View style={[loadingStyles.cardGrid, { opacity: pulseAnim }]}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={loadingStyles.cardSkeleton}>
            <View style={loadingStyles.cardImgSkeleton} />
            <View style={loadingStyles.cardBodySkeleton}>
              <View style={loadingStyles.cardLineLong} />
              <View style={loadingStyles.cardLineShort} />
              <View style={loadingStyles.cardLineMid} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  // Header skeleton
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#2E7D32',
  },
  skeletonBrand: { width: 110, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  skeletonBtn: {
    width: 64, height: 32, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  skeletonBtnFilled: { width: 78, height: 32, borderRadius: 20, backgroundColor: 'rgba(255,213,79,0.4)' },

  // Hero skeleton
  heroSkeleton: {
    height: 380, backgroundColor: '#1B4A20',
    justifyContent: 'flex-end', padding: 24, paddingBottom: 28,
  },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  progressBar: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroTextBlock: { gap: 10 },
  eyebrowSkeleton: { width: 120, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  titleSkeleton: { width: '85%', height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)' },
  titleSkeletonShort: { width: '65%', height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)' },
  subSkeleton: { width: '90%', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 4 },

  // Trust strip
  trustStrip: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 16, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 6 },
  trustCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9' },
  trustLine: { width: 54, height: 8, borderRadius: 4, backgroundColor: '#E8E8E8' },
  trustLineSub: { width: 40, height: 7, borderRadius: 4, backgroundColor: '#F0F0F0' },

  // Centre block
  centreBlock: {
    paddingVertical: 32, alignItems: 'center', gap: 8,
  },
  centreTitle: { fontSize: 16, fontWeight: '700', color: '#1B2714', marginTop: 8 },
  centreSub: { fontSize: 13, color: '#9E9E9E' },
  dotRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C8E6C9' },
  dotMid: { backgroundColor: '#2E7D32' },

  // Card grid
  cardGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16,
  },
  cardSkeleton: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardImgSkeleton: { width: '100%', height: 130, backgroundColor: '#E8F5E9' },
  cardBodySkeleton: { padding: 12, gap: 8 },
  cardLineLong: { width: '85%', height: 11, borderRadius: 6, backgroundColor: '#F0F0F0' },
  cardLineShort: { width: '50%', height: 9, borderRadius: 5, backgroundColor: '#F5F5F5' },
  cardLineMid: { width: '65%', height: 14, borderRadius: 7, backgroundColor: '#EAFBEA' },
});

// ─────────────────────────────────────────────
// PRODUCT CARD
// ── CHANGE: onPress now navigates to ProductDetailScreen
//    instead of going straight to sign-in.
//    Guests can view product details freely.
// ─────────────────────────────────────────────
const ProductCard = ({ item, onPress }) => {
  const outOfStock = (item.stock ?? item.countInStock ?? 0) <= 0;
  const navigation = useNavigation();

  const handlePress = () => {
    // ── Navigate to the guest-accessible product detail screen.
    //    Pass the full product object so the detail screen can
    //    render immediately while silently refreshing from API.
    navigation.navigate('GuestProductDetail', {
      productId: item._id || item.id,
      product: item,
    });
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handlePress} activeOpacity={0.88}>
      <View style={cardStyles.imageWrap}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/150' }}
          style={cardStyles.image}
          resizeMode="cover"
        />
        {outOfStock && (
          <View style={cardStyles.oosOverlay}>
            <Text style={cardStyles.oosText}>Out of Stock</Text>
          </View>
        )}
        {item.category && (
          <View style={cardStyles.catChip}>
            <Text style={cardStyles.catChipText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
        )}
      </View>
      <View style={cardStyles.body}>
        <Text style={cardStyles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={cardStyles.unit}>per {item.unit || 'piece'}</Text>
        <View style={cardStyles.footer}>
          <Text style={cardStyles.price}>GH₵ {item.price?.toFixed(2)}</Text>
          {/* Lock icon signals guests they need to sign in to buy,
              but tapping the card still goes to the detail screen */}
          <View style={cardStyles.viewBtn}>
            <Ionicons name="eye-outline" size={14} color="#2E7D32" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 8, elevation: 4, marginBottom: 2,
  },
  imageWrap: { height: 140, position: 'relative', backgroundColor: '#F5F5F5' },
  image: { width: '100%', height: '100%' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  catChip: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  catChipText: {
    fontSize: 9, color: '#2E7D32', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  body: { padding: 12, paddingTop: 10 },
  name: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 2, lineHeight: 18 },
  unit: { fontSize: 11, color: '#BDBDBD', marginBottom: 10, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '900', color: '#1B5E20' },
  // ── CHANGE: replaced green lock button with a lighter "view" icon
  //    so it's clear tapping opens the product, not signs them in.
  viewBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
});

// ─────────────────────────────────────────────
// HERO CAROUSEL
// ─────────────────────────────────────────────
const HeroCarousel = ({ onSignUp, onSignIn }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const progressAnims = useRef(HERO_SLIDES.map(() => new Animated.Value(0))).current;
  const eyebrowAnim  = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const subAnim      = useRef(new Animated.Value(0)).current;
  const eyebrowSlide  = useRef(new Animated.Value(20)).current;
  const headlineSlide = useRef(new Animated.Value(28)).current;
  const subSlide      = useRef(new Animated.Value(16)).current;

  const animateTextIn = useCallback(() => {
    [eyebrowAnim, headlineAnim, subAnim].forEach(a => a.setValue(0));
    [eyebrowSlide, headlineSlide, subSlide].forEach(a => a.setValue(20));
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(eyebrowAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(eyebrowSlide, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(headlineAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(headlineSlide, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subAnim,  { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(subSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const startProgress = useCallback((idx) => {
    progressAnims.forEach(a => a.setValue(0));
    for (let i = 0; i < idx; i++) progressAnims[i].setValue(1);
    Animated.timing(progressAnims[idx], {
      toValue: 1, duration: SLIDE_INTERVAL, useNativeDriver: false,
    }).start();
  }, [progressAnims]);

  const goTo = useCallback((idx) => {
    clearInterval(timerRef.current);
    setActiveIdx(idx);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    startProgress(idx);
    animateTextIn();
    timerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % HERO_SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        startProgress(next);
        animateTextIn();
        return next;
      });
    }, SLIDE_INTERVAL);
  }, [startProgress, animateTextIn]);

  useEffect(() => {
    goTo(0);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleMomentumEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIdx) goTo(idx);
  };

  const slide = HERO_SLIDES[activeIdx];

  return (
    <View style={heroStyles.wrap}>
      <FlatList
        ref={flatListRef}
        data={HERO_SLIDES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={StyleSheet.absoluteFill}
        renderItem={({ item }) => (
          <View style={{ width, height: '100%' }}>
            <Image source={{ uri: item.image }} style={heroStyles.bgImage} resizeMode="cover" />
          </View>
        )}
      />
      <View style={heroStyles.scrimTop} />
      <View style={heroStyles.scrimBottom} />
      <View style={heroStyles.contentPanel}>
        <View style={heroStyles.progressRow}>
          {HERO_SLIDES.map((_, i) => (
            <TouchableOpacity key={i} style={heroStyles.progressTrack} onPress={() => goTo(i)}>
              <Animated.View
                style={[
                  heroStyles.progressFill,
                  {
                    width: progressAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: slide.accentColor,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View style={[heroStyles.eyebrowRow, { opacity: eyebrowAnim, transform: [{ translateY: eyebrowSlide }] }]}>
          <View style={[heroStyles.eyebrowDot, { backgroundColor: slide.accentColor }]} />
          <Text style={[heroStyles.eyebrow, { color: slide.accentColor }]}>{slide.eyebrow}</Text>
        </Animated.View>
        <Animated.Text style={[heroStyles.headline, { opacity: headlineAnim, transform: [{ translateY: headlineSlide }] }]}>
          {slide.headline}
        </Animated.Text>
        <Animated.Text style={[heroStyles.sub, { opacity: subAnim, transform: [{ translateY: subSlide }] }]} numberOfLines={2}>
          {slide.sub}
        </Animated.Text>
      </View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  wrap: { height: 380, position: 'relative', overflow: 'hidden', backgroundColor: '#0A2E10' },
  bgImage: { width: '100%', height: '90%', position: 'absolute' },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, backgroundColor: 'rgba(0,0,0,0.38)' },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, backgroundColor: 'rgba(0,0,0,0.48)' },
  contentPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 28, paddingTop: 20 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  progressTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  eyebrowDot: { width: 5, height: 5, borderRadius: 3 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
  headline: { fontSize: 30, fontWeight: '900', color: '#fff', lineHeight: 44, letterSpacing: -1, marginBottom: 10 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 21, marginBottom: 22 },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const GuestHomeScreen = () => {
  const navigation = useNavigation();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [markets, setMarkets]                   = useState([]);
  const [vendors, setVendors]                   = useState([]);

  // ── CHANGE: separate first-load from pull-to-refresh.
  //    `loading` gates the full LoadingScreen.
  //    `refreshing` only shows the pull-to-refresh spinner.
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const featRes = await productService.getProducts({ limit: 12, sortBy: 'popular', page: 1 });
      if (featRes.success) setFeaturedProducts(featRes.data || []);

      const catResults = await Promise.allSettled(
        CATEGORIES.map(cat => productService.getProducts({ category: cat.id, limit: 6, page: 1 }))
      );
      const catMap = {};
      catResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.success) {
          catMap[CATEGORIES[i].id] = result.value.data || [];
        }
      });
      setCategoryProducts(catMap);

      try {
        const marketsRes = await getVendorsByMarket();
        if (marketsRes?.data?.success) setMarkets(marketsRes.data.data || []);
        const vendorsRes = await getVendors();
        if (vendorsRes?.data?.success) setVendors((vendorsRes.data.data || []).slice(0, 8));
      } catch (e) {
        console.warn('Vendor/market fetch failed:', e);
      }
    } catch (err) {
      console.error('GuestHome load error:', err);
    } finally {
      // ── CHANGE: clear both flags, then fade in
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Animated.spring(bannerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const goToSignIn = () => navigation.navigate('Login');
  const goToSignUp = () => navigation.navigate('SignUp');

  const marketsWithData = ACCRA_MARKETS.map(m => {
    const live = markets.find(lm => lm._id === m.name);
    return { ...m, count: live?.count ?? 0, vendors: live?.vendors ?? [] };
  });

  // ── CHANGE: show skeleton/loading screen on first load
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" translucent />

      {/* ── STICKY HEADER ── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View>
              <Text style={styles.headerBrandName}>CediMart</Text>
              <Text style={styles.headerBrandSub}>Ghana's freshest marketplace</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerSignInBtn} onPress={goToSignIn} activeOpacity={0.85}>
              <Text style={styles.headerSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerSignUpBtn} onPress={goToSignUp} activeOpacity={0.85}>
              <Text style={styles.headerSignUpText}>Join Free</Text>
              <Ionicons name="arrow-forward" size={12} color="#1B5E20" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
      >
        {/* HERO */}
        <HeroCarousel onSignUp={goToSignUp} onSignIn={goToSignIn} />

        {/* TRUST STRIP */}
        <View style={styles.trustStrip}>
          {TRUST_ITEMS.map((t, i) => (
            <View key={i} style={styles.trustItem}>
              <View style={styles.trustIconWrap}>
                <Ionicons name={t.icon} size={17} color="#2E7D32" />
              </View>
              <Text style={styles.trustLabel}>{t.label}</Text>
              <Text style={styles.trustSub}>{t.sub}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>

         {/* MARKETS – now horizontal scroll 
<View style={styles.sectionWrap}>
  <View style={styles.sectionHeaderRow}>
    <View>
      <View style={styles.sectionEyebrowRow}>
        <Ionicons name="location-sharp" size={14} color="#4CAF50" />
        <Text style={styles.sectionEyebrow}>ACCRA, GHANA</Text>
      </View>
      <Text style={styles.sectionTitle}>8 Major Markets</Text>
      <Text style={styles.sectionSub}>Browse by your nearest market</Text>
    </View>
    <TouchableOpacity style={styles.seeAllBtn} onPress={goToSignUp} activeOpacity={0.8}>
      <Text style={styles.seeAllText}>Sign up to browse</Text>
      <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
    </TouchableOpacity>
  </View>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.marketsScrollContent}
  >
    {marketsWithData.map((market) => (
      <TouchableOpacity
        key={market.name}
        style={[styles.marketCard, { backgroundColor: market.bg }]}
        onPress={()=>navigation.navigate('GuestMarketDetail', { marketName: market.name })}
        activeOpacity={0.85}
      >
        <View style={styles.marketCardTop}>
          <View style={[styles.marketIconCircle, { backgroundColor: market.color + '18' }]}>
            <Text style={styles.marketIcon}>{market.icon}</Text>
          </View>
          {market.count > 0 && (
            <View style={[styles.marketCountBadge, { backgroundColor: market.color }]}>
              <Text style={styles.marketCountText}>{market.count}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.marketName, { color: market.color }]} numberOfLines={2}>
          {market.name.replace(' Market', '')}
        </Text>
        <Text style={styles.marketSuffix}>Market</Text>
        <View style={styles.marketFooter}>
          {market.count > 0 ? (
            <Text style={[styles.marketVendorCount, { color: market.color }]}>
              {market.count} vendor{market.count !== 1 ? 's' : ''}
            </Text>
          ) : (
            <Text style={styles.marketComingSoon}>Coming soon</Text>
          )}
          <View style={[styles.marketArrow, { backgroundColor: market.color }]}>
            <Ionicons name="arrow-forward" size={11} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    ))}

    
    <TouchableOpacity
      style={[styles.marketSeeMoreCard, { backgroundColor: '#F8F8F8' }]}
      onPress={goToSignUp}
      activeOpacity={0.85}
    >
      <View style={styles.marketSeeMoreIcon}>
        <Ionicons name="location-outline" size={22} color="#2E7D32" />
      </View>
      <Text style={styles.marketSeeMoreText}>All{'\n'}Markets</Text>
    </TouchableOpacity>
  </ScrollView>
</View>*/}

         
          {/* FEATURED VENDORS */}
          {vendors.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Meet Our Vendors</Text>
                  <Text style={styles.sectionSub}>Trusted sellers from Accra's markets</Text>
                </View>
                <TouchableOpacity style={styles.seeAllBtn} onPress={goToSignUp} activeOpacity={0.8}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorScroll}>
                {vendors.map(vendor => (
                  <TouchableOpacity key={vendor._id} style={styles.vendorCard} onPress={goToSignUp} activeOpacity={0.85}>
                    {vendor.profile_image ? (
                      <Image source={{ uri: vendor.profile_image }} style={styles.vendorImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.vendorImagePlaceholder}>
                        <Text style={styles.vendorInitial}>{vendor.name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    <View style={styles.vendorOpenBadge}>
                      <View style={styles.vendorOpenDot} />
                      <Text style={styles.vendorOpenText}>Open</Text>
                    </View>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                      {vendor.market_name && (
                        <View style={styles.vendorMarketPill}>
                          <Ionicons name="location-outline" size={10} color="#2E7D32" />
                          <Text style={styles.vendorMarketText} numberOfLines={1}>{vendor.market_name}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.vendorSeeMoreCard} onPress={goToSignUp} activeOpacity={0.85}>
                  <View style={styles.vendorSeeMoreIcon}>
                    <Ionicons name="people-outline" size={24} color="#2E7D32" />
                  </View>
                  <Text style={styles.vendorSeeMoreText}>All{'\n'}Vendors</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

            {/* PERSUASION BANNER */}
          <Animated.View style={[styles.persuasionBanner, { transform: [{ scale: bannerAnim }] }]}>
            <View style={styles.persuasionCircle1} />
            <View style={styles.persuasionCircle2} />
            <View style={styles.persuasionContent}>
              <Text style={styles.persuasionEyebrow}>🎉 New customers</Text>
              <Text style={styles.persuasionTitle}>Free delivery on{'\n'}your first order</Text>
              <Text style={styles.persuasionSub}>Sign up today and get started — it's free</Text>
            </View>
            <TouchableOpacity style={styles.persuasionBtn} onPress={goToSignUp} activeOpacity={0.85}>
              <Text style={styles.persuasionBtnText}>Join Free</Text>
              <Ionicons name="arrow-forward" size={13} color="#1B5E20" />
            </TouchableOpacity>
          </Animated.View>
 

          {/* FEATURED PRODUCTS */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <Text style={styles.sectionSub}>Today's most popular picks</Text>
              </View>
              <TouchableOpacity style={styles.seeAllBtn} onPress={goToSignIn} activeOpacity={0.8}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productGrid}>
              {featuredProducts.slice(0, 8).map(item => (
                <ProductCard key={item.id || item._id} item={item} />
              ))}
            </View>
          </View>

          {/* PER-CATEGORY ROWS */}
          {CATEGORIES.slice(0, 3).map(cat => {
            const products = categoryProducts[cat.id] || [];
            if (products.length === 0) return null;
            return (
              <View key={cat.id} style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Fresh {cat.label}</Text>
                    <Text style={styles.sectionSub}>Today's selection</Text>
                  </View>
                  <TouchableOpacity style={styles.seeAllBtn} onPress={goToSignIn} activeOpacity={0.8}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
                  {products.map(item => (
                    <View key={item.id || item._id} style={styles.hCardWrap}>
                      <ProductCard item={item} />
                    </View>
                  ))}
                  <TouchableOpacity style={styles.seeMoreCard} onPress={goToSignIn} activeOpacity={0.85}>
                    <View style={[styles.seeMoreIconWrap, { backgroundColor: cat.bg }]}>
                      <Ionicons name="arrow-forward" size={22} color={cat.color} />
                    </View>
                    <Text style={[styles.seeMoreText, { color: cat.color }]}>See all{'\n'}{cat.label}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            );
          })}

          {/* HOW IT WORKS */}
          <View style={styles.howWrap}>
            <View style={styles.howHeader}>
              <Text style={styles.howTitle}>How it Works</Text>
              <Text style={styles.howSub}>Fresh food from market to your door in 3 steps</Text>
            </View>
            <View style={styles.howSteps}>
              {[
                { step: '01', icon: 'storefront-outline', color: '#1565C0', bg: '#E3F2FD', label: ' Browse our  foodstuffs', desc: 'Picked from 8 Accra markets' },
                { step: '02', icon: 'cart-outline',       color: '#2E7D32', bg: '#E8F5E9', label: 'Make an Order ', desc: 'Shop directly from us' },
                { step: '03', icon: 'bicycle-outline',    color: '#F57F17', bg: '#FFF8E1', label: 'Receive Fresh',     desc: 'Delivered to your door' },
              ].map((s, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={[styles.howIconWrap, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={22} color={s.color} />
                  </View>
                  <Text style={[styles.howStepNum, { color: s.color }]}>{s.step}</Text>
                  <Text style={styles.howStepLabel}>{s.label}</Text>
                  <Text style={styles.howStepDesc}>{s.desc}</Text>
                  {i < 2 && <View style={styles.howConnector} />}
                </View>
              ))}
            </View>
          </View>

          {/* FINAL CTA */}
          <View style={styles.finalCta}>
            <View style={styles.finalCtaCircle1} />
            <View style={styles.finalCtaCircle2} />
            <Text style={styles.finalCtaEyebrow}>Ready to eat fresh?</Text>
            <Text style={styles.finalCtaTitle}>Join CediMart</Text>
            <Text style={styles.finalCtaSub}>
              Shop from 8 major Accra markets and get the freshest groceries delivered to your door.
            </Text>
            <TouchableOpacity style={styles.finalCtaBtn} onPress={goToSignUp} activeOpacity={0.88}>
              <Ionicons name="person-add-outline" size={17} color="#2E7D32" />
              <Text style={styles.finalCtaBtnText}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToSignIn} style={styles.finalCtaSignIn}>
              <Text style={styles.finalCtaSignInText}>
                Already a member? <Text style={styles.finalCtaSignInLink}>Sign in →</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <Ionicons name="leaf" size={13} color="#A5D6A7" />
            <Text style={styles.footerBrand}>CediMart</Text>
          </View>
          <Text style={styles.footerSub}>Accra, Ghana · © {new Date().getFullYear()}</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// STYLES (unchanged from original)
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6F4' },
  scroll: { flex: 1 },
  headerSafe: { backgroundColor: '#F4F6F4', zIndex: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#2E7D32',
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBrandName: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  headerBrandSub:  { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerSignInBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  headerSignInText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  headerSignUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#FFD54F',
  },
  headerSignUpText: { fontSize: 13, color: '#1B5E20', fontWeight: '900' },
  trustStrip: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 16, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  trustItem:    { flex: 1, alignItems: 'center', gap: 3 },
  trustIconWrap:{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  trustLabel: { fontSize: 10.5, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  trustSub:   { fontSize: 9.5, color: '#9E9E9E', textAlign: 'center', fontWeight: '500' },
  sectionWrap:       { paddingHorizontal: 16, marginTop: 26 },
  sectionHeaderRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  sectionEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  sectionEyebrow:    { fontSize: 10, fontWeight: '800', color: '#4CAF50', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionTitle:      { fontSize: 21, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.4 },
  sectionSub:        { fontSize: 12, color: '#9E9E9E', marginTop: 2, fontWeight: '500' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F8E9', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, marginTop: 4 },
  seeAllText: { fontSize: 11.5, color: '#2E7D32', fontWeight: '700' },
 // Horizontal scroll for markets
marketsScrollContent: {
  paddingLeft: 2,
  paddingRight: 16,
  gap: 10,
  marginBottom:12,
},
// Make each market card a fixed width (same as vendor card width)
marketCard: {
  width: 160,                           // was (width - 42) / 2, now fixed
  borderRadius: 18,
  padding: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 7,
  elevation: 3,
},
// "See All Markets" card at the end
marketSeeMoreCard: {
  width: 110,
  backgroundColor: '#fff',
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  padding: 16,
  borderWidth: 1.5,
  borderColor: '#E8E8E8',
  borderStyle: 'dashed',
  minHeight: 165,
},
marketSeeMoreIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#E8F5E9',
  justifyContent: 'center',
  alignItems: 'center',
},
marketSeeMoreText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#2E7D32',
  textAlign: 'center',
  lineHeight: 17,
},
  marketCard: { width: (width - 42) / 2, borderRadius: 18, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 7, elevation: 3 },
  marketCardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  marketIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  marketIcon:       { fontSize: 22 },
  marketCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  marketCountText:  { fontSize: 11, fontWeight: '800', color: '#fff' },
  marketName:       { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, lineHeight: 20 },
  marketSuffix:     { fontSize: 11, color: '#9E9E9E', fontWeight: '500', marginBottom: 10 },
  marketFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketVendorCount:{ fontSize: 11, fontWeight: '700' },
  marketComingSoon: { fontSize: 10, color: '#BDBDBD', fontWeight: '600' },
  marketArrow: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  persuasionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B5E20', marginHorizontal: 16, marginTop: 24, borderRadius: 20, padding: 20, gap: 12, overflow: 'hidden', shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 12, elevation: 7 },
  persuasionCircle1: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  persuasionCircle2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' },
  persuasionContent: { flex: 1 },
  persuasionEyebrow: { fontSize: 11, color: '#69F0AE', fontWeight: '800', marginBottom: 4 },
  persuasionTitle:   { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 23, marginBottom: 3 },
  persuasionSub:     { fontSize: 11.5, color: 'rgba(255,255,255,0.6)' },
  persuasionBtn:     { backgroundColor: '#FFD54F', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  persuasionBtnText: { color: '#1B5E20', fontWeight: '900', fontSize: 12 },
  vendorScroll: { paddingLeft: 2, paddingRight: 16, gap: 10 },
  vendorCard: { width: 130, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  vendorImage: { width: '100%', height: 105 },
  vendorImagePlaceholder: { width: '100%', height: 105, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  vendorInitial: { fontSize: 32, fontWeight: '900', color: '#2E7D32' },
  vendorOpenBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  vendorOpenDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CAF50' },
  vendorOpenText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  vendorInfo:     { padding: 10 },
  vendorName:     { fontSize: 12.5, fontWeight: '700', color: '#1A1A1A', marginBottom: 5 },
  vendorMarketPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  vendorMarketText: { fontSize: 9.5, fontWeight: '600', color: '#2E7D32' },
  vendorSeeMoreCard: { width: 110, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderWidth: 1.5, borderColor: '#E8E8E8', borderStyle: 'dashed', minHeight: 165 },
  vendorSeeMoreIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  vendorSeeMoreText: { fontSize: 12, fontWeight: '700', color: '#2E7D32', textAlign: 'center', lineHeight: 17 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: (width - 42) / 2, height: 110, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  catCardWide:    { width: width - 32, height: 130 },
  catCardImage:   { width: '100%', height: '100%' },
  catCardScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  catCardContent: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  catCardIconWrap:{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  catCardLabel:   { fontSize: 14, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  productGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hScrollContent: { paddingLeft: 2, paddingRight: 16, gap: 10 },
  hCardWrap:      { width: CARD_WIDTH },
  seeMoreCard: { width: 120, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1.5, borderColor: '#E8E8E8', borderStyle: 'dashed', minHeight: 190 },
  seeMoreIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  seeMoreText:     { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  howWrap: { marginHorizontal: 16, marginTop: 28, backgroundColor: '#fff', borderRadius: 22, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  howHeader: { marginBottom: 24 },
  howTitle:  { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.4 },
  howSub:    { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  howSteps:  { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  howStep:   { flex: 1, alignItems: 'center', gap: 7, position: 'relative' },
  howIconWrap: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  howStepNum:   { fontSize: 10, fontWeight: '900', opacity: 0.5 },
  howStepLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  howStepDesc:  { fontSize: 11, color: '#9E9E9E', textAlign: 'center', lineHeight: 15 },
  howConnector: { position: 'absolute', top: 28, right: -12, width: 24, height: 2, backgroundColor: '#E8E8E8', borderRadius: 1 },
  finalCta: { marginHorizontal: 16, marginTop: 28, marginBottom: 6, backgroundColor: '#2E7D32', borderRadius: 22, padding: 32, alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  finalCtaCircle1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  finalCtaCircle2: { position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)' },
  finalCtaEyebrow: { fontSize: 11, fontWeight: '800', color: '#69F0AE', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  finalCtaTitle:   { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 34, letterSpacing: -0.5, marginBottom: 12 },
  finalCtaSub:     { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 4 },
  finalCtaBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14, width: '100%', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  finalCtaBtnText:    { fontSize: 16, fontWeight: '900', color: '#1B5E20' },
  finalCtaSignIn:     { marginTop: 14 },
  finalCtaSignInText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  finalCtaSignInLink: { color: '#69F0AE', fontWeight: '800' },
  footer:        { alignItems: 'center', paddingVertical: 24, gap: 5, marginTop: 10 },
  footerBrandRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerBrand:   { fontSize: 13, fontWeight: '800', color: '#9E9E9E' },
  footerSub:     { fontSize: 11, color: '#BDBDBD' },
  footerLinks:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  footerLink:    { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  footerDot:     { fontSize: 12, color: '#D0D0D0' },
});

export default GuestHomeScreen;