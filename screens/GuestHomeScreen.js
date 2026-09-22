// src/screens/auth/GuestHomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import productService from '../services/productService';
import {styles} from '../styles/guesthome'
import SupportFAB from '../components/SupportFAB';
import AIFAB from '../components/AIFAB';
import {CATEGORY_CONFIG,CONDITION_LABELS,ALL_CAMPUSES,HERO_SLIDES} from '../data/General'
import RecommendEarnBanner from '../components/RecommendEarnNotice'
import ProductHeroCarousel from '../components/ProductHeroCarousel';
import {ProductGridSkeleton} from '../components/SkeletonLoader'
import ShopFAB from '../components/ShopFAB'
import VisualSearchFab from '../components/VisualSearchFab';

const { width } = Dimensions.get('window');

const AUTO_SCROLL_INTERVAL = 4200;
const LAZY_LOAD_THRESHOLD = 700;
const BATCH_SIZE = 2;
const SECTION_STAGGER_MS = 400;

// ─── Category sections to display ─────────────────────────────────────────────
const FEATURED_CATEGORIES = [
  { key: 'fashion', label: 'Fashion', icon: '👗', color: '#E91E63' },
  { key: 'computers and laptops', label: 'Computers & Laptops', icon: '💻', color: '#2196F3' },
  { key: 'phones and tablets', label: 'Phones & Tablets', icon: '📱', color: '#0D9488' },
  { key: 'beauty and grooming', label: 'Beauty & Grooming', icon: '💄', color: '#9C27B0' },
];

// ─── Skeleton Components ──────────────────────────────────────────────────────
const SkeletonProductCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
  };

  return (
    <View style={styles.productCard}>
      <Animated.View style={[styles.skeletonImg, { backgroundColor: '#E0E0E0' }, shimmerStyle]} />
      <View style={styles.productBody}>
        <Animated.View style={[styles.skeletonLine, { width: '80%', height: 13, marginBottom: 8 }, shimmerStyle]} />
        <Animated.View style={[styles.skeletonLine, { width: '50%', height: 11, marginBottom: 6 }, shimmerStyle]} />
        <Animated.View style={[styles.skeletonLine, { width: '60%', height: 16, marginTop: 4 }, shimmerStyle]} />
      </View>
    </View>
  );
};

const SkeletonDealCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
  };

  return (
    <View style={styles.dealCard}>
      <Animated.View style={[styles.dealImg, { backgroundColor: '#E0E0E0' }, shimmerStyle]} />
      <View style={styles.dealOverlay}>
        <Animated.View style={[styles.skeletonLine, { width: '70%', height: 12, marginBottom: 8 }, shimmerStyle]} />
        <Animated.View style={[styles.skeletonLine, { width: '45%', height: 15, marginBottom: 6 }, shimmerStyle]} />
        <Animated.View style={[styles.skeletonLine, { width: '55%', height: 11 }, shimmerStyle]} />
      </View>
    </View>
  );
};

const SkeletonSectionHeader = ({ titleWidth = 140 }) => (
  <View style={styles.sectionHeader}>
    <View>
      <View style={{ height: 16, backgroundColor: '#E0E0E0', borderRadius: 4, width: titleWidth, marginBottom: 4 }} />
      <View style={{ height: 11, backgroundColor: '#E0E0E0', borderRadius: 3, width: 80 }} />
    </View>
  </View>
);

const SkeletonCategorySection = ({ isHorizontal = false }) => (
  <View style={styles.section}>
    <SkeletonSectionHeader />
    {isHorizontal ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
        {[1, 2, 3, 4].map(i => <SkeletonDealCard key={i} />)}
      </ScrollView>
    ) : (
      <View style={styles.productsGrid}>
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonProductCard key={i} />)}
      </View>
    )}
  </View>
);

// ─── Existing Components ──────────────────────────────────────────────────────
const ConditionBadge = ({ condition }) => {
  const cfg = CONDITION_LABELS[condition] || { label: condition, color: '#616161', bg: '#F5F5F5' };
  return (
    <View style={[styles.conditionBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.conditionBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const HeroCarousel = ({ onSlidePress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);
  const SLIDE_W = width - 32;

  const startAutoScroll = useCallback(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % HERO_SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  useEffect(() => { startAutoScroll(); return () => clearInterval(timerRef.current); }, [startAutoScroll]);

  const handleMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    setActiveIndex(index);
    clearInterval(timerRef.current);
    startAutoScroll();
  };

  const renderSlide = ({ item }) => (
    <TouchableOpacity activeOpacity={0.92} onPress={() => onSlidePress(item)} style={[styles.slideWrapper, { width: SLIDE_W }]}>
      <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
      <View style={[styles.slideScrim, { backgroundColor: item.overlayColor }]} />
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <TouchableOpacity style={[styles.slideBtn, { borderColor: item.accentColor }]} onPress={() => onSlidePress(item)} activeOpacity={0.85}>
          <Text style={[styles.slideBtnText, { color: item.accentColor }]}>{item.btnText}</Text>
          <Ionicons name="arrow-forward" size={13} color={item.accentColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.carouselWrap}>
        <FlatList ref={flatListRef} data={HERO_SLIDES} renderItem={renderSlide} keyExtractor={item => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleMomentumScrollEnd} scrollEventThrottle={16} getItemLayout={(_, index) => ({ length: SLIDE_W, offset: SLIDE_W * index, index })} />
      </View>
      <View style={styles.dotsRow}>
        {HERO_SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => { flatListRef.current?.scrollToIndex({ index: i, animated: true }); setActiveIndex(i); clearInterval(timerRef.current); startAutoScroll(); }}>
            <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ProductCard = ({ product, onPress }) => {
  const imageUri = product.images?.[0];
  const catCfg = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.other;

  const discountInfo = product.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale && 
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());
  
  const currentPrice = Number(product.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount 
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(product)} activeOpacity={0.85}>
      <View style={styles.productImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImg} resizeMode="cover" />
        ) : (
          <View style={[styles.productImgPlaceholder, { backgroundColor: catCfg.color }]}>
            <Text style={{ fontSize: 30 }}>{catCfg.icon}</Text>
          </View>
        )}
        {hasActiveDiscount && (
          <View style={styles.discountBadgeProduct}>
            <Text style={styles.discountBadgeProductText}>-{discountPercentage}%</Text>
          </View>
        )}
        {product.condition && !hasActiveDiscount && (
          <View style={styles.conditionOverlay}>
            <ConditionBadge condition={product.condition} />
          </View>
        )}
        {product.condition && hasActiveDiscount && (
          <View style={styles.conditionOverlaySecondary}>
            <ConditionBadge condition={product.condition} />
          </View>
        )}
        {product.negotiable && (
          <View style={styles.negotiableTag}>
            <Text style={styles.negotiableTagText}>Negotiable</Text>
          </View>
        )}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.campus && (
          <View style={styles.campusPill}>
            <Ionicons name="school-outline" size={9} color="#2E7D32" />
            <Text style={styles.campusPillText}>{product.campus}</Text>
          </View>
        )}
        <View style={styles.productFooter}>
          {hasActiveDiscount ? (
            <View style={styles.productPriceStack}>
              <View style={styles.productPriceRow}>
                <Text style={styles.productPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.productDiscountPill}>
                  <Text style={styles.productDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.productOriginalPrice}>GH₵ {originalPrice.toFixed(2)}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.productPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const DealCard = ({ product, onPress }) => {
  const imageUri = product.images?.[0];
  const catCfg = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.other;

  const discountInfo = product.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale && 
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());
  
  const currentPrice = Number(product.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount 
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

  return (
    <TouchableOpacity style={styles.dealCard} onPress={() => onPress(product)} activeOpacity={0.85}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.dealImg} resizeMode="cover" />
      ) : (
        <View style={[styles.dealImgPlaceholder, { backgroundColor: catCfg.color }]}>
          <Text style={{ fontSize: 34 }}>{catCfg.icon}</Text>
        </View>
      )}
      {hasActiveDiscount && (
        <View style={styles.dealDiscountBadge}>
          <Ionicons name="pricetag" size={9} color="#fff" />
          <Text style={styles.dealDiscountBadgeText}>-{discountPercentage}% OFF</Text>
        </View>
      )}
      <View style={styles.dealOverlay}>
        <Text style={styles.dealName} numberOfLines={1}>{product.name}</Text>
        {product.condition && <ConditionBadge condition={product.condition} />}
        <View style={styles.dealBottom}>
          {hasActiveDiscount ? (
            <View style={styles.dealPriceStack}>
              <View style={styles.dealPriceRow}>
                <Text style={styles.dealPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.dealDiscountPill}>
                  <Text style={styles.dealDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.dealOriginalPrice}>GH₵ {originalPrice.toFixed(2)}</Text>
              )}
              {product.negotiable && <Text style={styles.dealNeg}>Negotiable</Text>}
            </View>
          ) : (
            <View>
              <Text style={styles.dealPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
              {product.negotiable && <Text style={styles.dealNeg}>Negotiable</Text>}
            </View>
          )}
          <View style={styles.dealViewBtn}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatsBanner = ({ stats }) => {
  if (!stats) return null;
  return (
    <View style={styles.statsBanner}>
      <View style={styles.statItem}><Text style={styles.statValue}>{stats.totalProducts?.toLocaleString() ?? '—'}</Text><Text style={styles.statLabel}>Listings</Text></View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}><Text style={styles.statValue}>{stats.byCampus?.length ?? '—'}</Text><Text style={styles.statLabel}>Campuses</Text></View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}><Text style={styles.statValue}>{stats.byCategory?.length ?? '—'}</Text><Text style={styles.statLabel}>Categories</Text></View>
    </View>
  );
};

// ─── Category Section Component ────────────────────────────────────────────────
const CategoryProductSection = ({ category, products, loading, onProductPress, onSeeAll }) => {
  if (loading) {
    return <SkeletonCategorySection isHorizontal={false} />;
  }

  if (!products || products.length === 0) return null;

  const catCfg = FEATURED_CATEGORIES.find(c => c.key === category) || { label: category, icon: '📦', color: '#0D9488' };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.categoryDot, { backgroundColor: catCfg.color }]} />
          <View>
            <Text style={styles.sectionTitle}>{catCfg.icon} {catCfg.label}</Text>
            <Text style={styles.sectionSubtitle}>Shop {catCfg.label.toLowerCase()} from campus sellers</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onSeeAll(category)} style={styles.seeAllRow}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color="#0D9488" />
        </TouchableOpacity>
      </View>
      <View style={styles.productsGrid}>
        {products.slice(0, 6).map(p => (
          <ProductCard key={p._id} product={p} onPress={onProductPress} />
        ))}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const GuestHomeScreen = () => {
  const navigation = useNavigation();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [urgentSales, setUrgentSales] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [studentFavorites, setStudentFavorites] = useState([]);
  const [campusStats, setCampusStats] = useState({});
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Category products state
  const [categoryProducts, setCategoryProducts] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});
  // Loading flags for the lazy tag sections
  const [tagLoading, setTagLoading] = useState({
    urgentSales: true,
    popularProducts: true,
    newArrivals: true,
    studentFavorites: true,
  });

  // ── Lazy section queue with background chain ────────────────────────────
  const lazySections = useRef([
    { id: 'cat-fashion', type: 'category', key: 'fashion' },
    { id: 'cat-computers', type: 'category', key: 'computers and laptops' },
    { id: 'tag-urgent', type: 'tag', tag: 'urgent-sale', loadingKey: 'urgentSales', setter: setUrgentSales },
    { id: 'cat-phones', type: 'category', key: 'phones and tablets' },
    { id: 'tag-popular', type: 'tag', tag: 'popular', loadingKey: 'popularProducts', setter: setPopularProducts },
    { id: 'cat-beauty', type: 'category', key: 'beauty and grooming' },
    { id: 'tag-new', type: 'tag', tag: 'new-arrival', loadingKey: 'newArrivals', setter: setNewArrivals },
    { id: 'tag-fav', type: 'tag', tag: 'student-favorite', loadingKey: 'studentFavorites', setter: setStudentFavorites },
  ]).current;
  const nextSectionIndexRef = useRef(0);
  const isLoadingSectionRef = useRef(false);
  const backgroundTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const loadSection = useCallback(async (section) => {
    if (section.type === 'category') {
      try {
        const res = await productService.getProductsByCategory(section.key, { limit: 6, sort: 'newest' });
        const products = res?.data?.data || res?.data?.products || res?.data || [];
        if (isMountedRef.current) setCategoryProducts(prev => ({ ...prev, [section.key]: products }));
      } catch (err) {
        if (isMountedRef.current) setCategoryProducts(prev => ({ ...prev, [section.key]: [] }));
      } finally {
        if (isMountedRef.current) setCategoryLoading(prev => ({ ...prev, [section.key]: false }));
      }
    } else {
      try {
        const res = await productService.getProductByTag(section.tag);
        if (isMountedRef.current) section.setter(res?.data?.data || []);
      } catch (err) {
        if (isMountedRef.current) section.setter([]);
      } finally {
        if (isMountedRef.current) setTagLoading(prev => ({ ...prev, [section.loadingKey]: false }));
      }
    }
  }, []);

  // 🔥 Same background chain as HomeScreen: loads BATCH_SIZE sections
  // together, then auto-schedules the next batch after a short stagger —
  // no scrolling required for content to keep loading progressively.
  const triggerNextBatch = useCallback(() => {
    if (isLoadingSectionRef.current) return;
    clearTimeout(backgroundTimerRef.current);

    const startIdx = nextSectionIndexRef.current;
    if (startIdx >= lazySections.length) return;

    const batch = lazySections.slice(startIdx, startIdx + BATCH_SIZE);
    nextSectionIndexRef.current = startIdx + batch.length;
    isLoadingSectionRef.current = true;

    Promise.all(batch.map(loadSection)).finally(() => {
      isLoadingSectionRef.current = false;
      if (!isMountedRef.current) return;
      if (nextSectionIndexRef.current < lazySections.length) {
        backgroundTimerRef.current = setTimeout(triggerNextBatch, SECTION_STAGGER_MS);
      }
    });
  }, [lazySections, loadSection]);

  // Scroll fast-forward — if the guest scrolls near the bottom of what's
  // rendered before the background chain gets there, jump the queue ahead.
  const handleScroll = useCallback(({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < LAZY_LOAD_THRESHOLD) {
      triggerNextBatch();
    }
  }, [triggerNextBatch]);

  useEffect(() => {
    isMountedRef.current = true;
    loadHomeData();
    return () => {
      isMountedRef.current = false;
      clearTimeout(backgroundTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (searchQuery.trim().length > 1) performSearch(); else clearSearchResults(); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadInitialProducts(), loadStatsData()]);

      // Reset the lazy queue
      clearTimeout(backgroundTimerRef.current);
      nextSectionIndexRef.current = 0;
      isLoadingSectionRef.current = false;
      setCategoryLoading({
        fashion: true,
        'computers and laptops': true,
        'phones and tablets': true,
        'beauty and grooming': true,
      });
      setTagLoading({
        urgentSales: true,
        popularProducts: true,
        newArrivals: true,
        studentFavorites: true,
      });

      // Kick off the first batch right away
      triggerNextBatch();
    }
    catch (err) { console.error('GuestHome load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadInitialProducts = async () => {
    try {
      const featuredRes = await productService.getProductByTag('featured');
      if (featuredRes?.data?.data) setFeaturedProducts(featuredRes.data.data);
    } catch (err) { console.error('Featured products error:', err); }
  };

  const loadStatsData = async () => {
    try {
      const statsRes = await productService.getProductStats?.();
      if (statsRes?.data?.success) {
        const stats = statsRes.data;
        setPlatformStats(stats);
        const map = {};
        (stats.byCampus || []).forEach(c => { map[c._id] = c.count; });
        setCampusStats(map);
      }
    } catch (err) { console.log('Stats load skipped:', err.message); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadHomeData(); }, []);

  const performSearch = async () => {
    setSearching(true);
    try {
      const res = await productService.getProducts({ search: searchQuery.trim(), limit: 8 });
      if (res?.data) setSearchResults(res.data); else setSearchResults([]);
    } catch { setSearchResults([]); }
    setShowSearchResults(true);
    setSearching(false);
  };

  const clearSearchResults = () => { setSearchResults([]); setShowSearchResults(false); };
  const clearSearch = () => { setSearchQuery(''); clearSearchResults(); };
  const handleSearchSubmit = () => { if (searchQuery.trim()) { navigation.navigate('GuestProducts', { search: searchQuery }); clearSearch(); } };

  const goToSignIn = () => navigation.navigate('Login');
  const goToSignUp = () => navigation.navigate('SignUp');

  const handleSlidePress = (slide) => { navigation.navigate('Products', slide.nav.params); };
  const handleCampusPress = (campusId) => { navigation.navigate('Campus', { campus: campusId }); };
  const handleCategoryPress = (category) => { navigation.navigate('Category', { category, categoryName: CATEGORY_CONFIG[category]?.label }); };
  const handleProductPress = (product) => { navigation.navigate('GuestProductDetail', { productId: product._id, product }); };
  const handleCategorySeeAll = (category) => { navigation.navigate('Category', { category, categoryName: FEATURED_CATEGORIES.find(c => c.key === category)?.label }); };

  if (loading && !refreshing) {
    return (
      <ProductGridSkeleton/>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#0D9488" barStyle="light-content" />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" colors={['#0D9488']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSearchResults(false)}
        onScroll={handleScroll}
        scrollEventThrottle={150}
      >
       
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerGreeting}>Welcome to</Text>
              <Text style={styles.headerTitle}>CediMart</Text>
              <View style={styles.locationPill}>
                <View style={styles.locationDot} />
                <Text style={styles.locationText}>Ghana's Campus Marketplace</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerSignInBtn} onPress={goToSignIn} activeOpacity={0.85}>
                <Text style={styles.headerSignInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerSignUpBtn} onPress={goToSignUp} activeOpacity={0.85}>
                <Text style={styles.headerSignUpText}>Join Free</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search products, categories…" 
                placeholderTextColor="#BDBDBD" 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                onSubmitEditing={handleSearchSubmit} 
                returnKeyType="search" 
                autoCapitalize="none" 
                autoCorrect={false} 
              />
              {searching ? (
                <ActivityIndicator size="small" color="#0D9488" />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={17} color="#BDBDBD" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearchSubmit} activeOpacity={0.8}>
                  <Ionicons name="search-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            
            {showSearchResults && (
              <>
                <TouchableWithoutFeedback onPress={() => setShowSearchResults(false)}>
                  <View style={styles.searchBackdrop} />
                </TouchableWithoutFeedback>
                <View style={styles.searchDropdown}>
                  <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {searchResults.length > 0 ? (
                      <View style={styles.searchSection}>
                        <Text style={styles.searchSectionLabel}>Products</Text>
                        {searchResults.map(p => (
                          <TouchableOpacity key={p._id} style={styles.searchRow} onPress={() => { handleProductPress(p); clearSearch(); }}>
                            {p.images?.[0] ? (
                              <Image source={{ uri: p.images[0] }} style={styles.searchThumb} />
                            ) : (
                              <View style={[styles.searchThumb, { backgroundColor: CATEGORY_CONFIG[p.category]?.color || '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 18 }}>{CATEGORY_CONFIG[p.category]?.icon || '📦'}</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchRowName} numberOfLines={1}>{p.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Text style={styles.searchRowPrice}>GH₵ {p.price?.toFixed(2)}</Text>
                                {p.campus && <Text style={styles.searchRowCampus}>{p.campus}</Text>}
                              </View>
                            </View>
                            {p.condition && <ConditionBadge condition={p.condition} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : !searching ? (
                      <View style={styles.noResults}>
                        <Ionicons name="search-outline" size={36} color="#C8E6C9" />
                        <Text style={styles.noResultsTitle}>No results</Text>
                        <Text style={styles.noResultsSub}>Try a different keyword</Text>
                      </View>
                    ) : null}
                    {searchResults.length > 0 && (
                      <TouchableOpacity style={styles.viewAllRow} onPress={handleSearchSubmit}>
                        <Text style={styles.viewAllText}>See all results for "{searchQuery}"</Text>
                        <Ionicons name="arrow-forward" size={14} color="#0D9488" />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>

        <RecommendEarnBanner />

        {/* HERO CAROUSEL */}
        {featuredProducts.length > 0 ? (
          <View style={styles.carouselSection}>
            <ProductHeroCarousel 
              products={featuredProducts.slice(0, 6)} 
              onProductPress={handleProductPress} 
            />
          </View>
        ) : (
          <ProductHeroCarousel products={[]} onProductPress={handleProductPress} />
        )}

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity key={key} style={styles.categoryPill} onPress={() => handleCategoryPress(key)} activeOpacity={0.8}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cfg.color, borderColor: cfg.color }]}>
                  <Ionicons style={styles.categoryEmoji} name={cfg.icon} size={14} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FASHION CATEGORY */}
        <CategoryProductSection
          category="fashion"
          products={categoryProducts['fashion']}
          loading={categoryLoading['fashion']}
          onProductPress={handleProductPress}
          onSeeAll={handleCategorySeeAll}
        />

        {/* FEATURED PRODUCTS */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Featured Listings</Text><Text style={styles.sectionSubtitle}>Hand-picked by our team</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'featured' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{featuredProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* COMPUTERS & LAPTOPS */}
        <CategoryProductSection
          category="computers and laptops"
          products={categoryProducts['computers and laptops']}
          loading={categoryLoading['computers and laptops']}
          onProductPress={handleProductPress}
          onSeeAll={handleCategorySeeAll}
        />

        {/* URGENT SALES */}
        {tagLoading.urgentSales ? (
          <SkeletonCategorySection isHorizontal />
        ) : urgentSales.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}><View style={styles.urgentDot} /><View><Text style={styles.sectionTitle}>Urgent Sales</Text><Text style={styles.sectionSubtitle}>Grab them before they're gone</Text></View></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'urgent-sale' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{urgentSales.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} />)}</ScrollView>
          </View>
        )}

        {/* PHONES & TABLETS */}
        <CategoryProductSection
          category="phones and tablets"
          products={categoryProducts['phones and tablets']}
          loading={categoryLoading['phones and tablets']}
          onProductPress={handleProductPress}
          onSeeAll={handleCategorySeeAll}
        />

        {/* POPULAR ON CAMPUS */}
        {tagLoading.popularProducts ? (
          <SkeletonCategorySection isHorizontal={false} />
        ) : popularProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Popular on Campus</Text><Text style={styles.sectionSubtitle}>Most viewed this week</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'popular', sort: 'popular' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{popularProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* BEAUTY & GROOMING */}
        <CategoryProductSection
          category="beauty and grooming"
          products={categoryProducts['beauty and grooming']}
          loading={categoryLoading['beauty and grooming']}
          onProductPress={handleProductPress}
          onSeeAll={handleCategorySeeAll}
        />

        {/* NEW ARRIVALS */}
        {tagLoading.newArrivals ? (
          <SkeletonCategorySection isHorizontal />
        ) : newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>New Arrivals</Text><Text style={styles.sectionSubtitle}>Just listed by students</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'new-arrival', sort: 'newest' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{newArrivals.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} />)}</ScrollView>
          </View>
        )}

        {/* STUDENT FAVORITES */}
        {tagLoading.studentFavorites ? (
          <SkeletonCategorySection isHorizontal={false} />
        ) : studentFavorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Student Favorites</Text><Text style={styles.sectionSubtitle}>Loved by campus shoppers</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'student-favorite' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{studentFavorites.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* SELL YOUR STUFF BANNER */}
        <View style={styles.bannerSection}>
          <TouchableOpacity style={styles.sellBanner} activeOpacity={0.9} onPress={() => navigation.navigate("VendorSignUp")}>
            <View style={styles.sellBannerContent}>
              <View style={styles.sellBannerTag}><Ionicons name="storefront-outline" size={11} color="#fff" /><Text style={styles.sellBannerTagText}>FOR SELLERS</Text></View>
              <Text style={styles.sellBannerTitle}>Got something{'\n'}to sell?</Text>
              <Text style={styles.sellBannerSub}>List your items for free and reach thousands of students across campuses</Text>
              <View style={styles.sellBannerBtn}><Text style={styles.sellBannerBtnText}>Start Selling</Text><Ionicons name="arrow-forward" size={13} color="#0D9488" /></View>
            </View>
            <View style={styles.sellBannerIllustration}><Text style={{ fontSize: 60 }}>🛍️</Text></View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/*<ShopFAB
        onPress={() => navigation.navigate('Products')} 
        bottomOffset={60}  
      />*/}
      <VisualSearchFab navigation={navigation} bottom={128} right={20} />
      <AIFAB style={{ position: 'absolute', bottom: 34, right: 16 }} />
    </SafeAreaView>
  );
};

export default GuestHomeScreen;