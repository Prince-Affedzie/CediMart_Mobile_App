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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import productService from '../services/productService';
import {styles} from '../styles/guesthome'

const { width } = Dimensions.get('window');

const ALL_CAMPUSES = [
  { id: 'UG',     label: 'University of Ghana',           icon: '🎓', palette: { bg: '#E8F5E9', accent: '#1B5E20', border: '#A5D6A7' } },
  { id: 'KNUST',  label: 'KNUST',                         icon: '⚙️', palette: { bg: '#FFF3E0', accent: '#E65100', border: '#FFCC80' } },
  { id: 'UCC',    label: 'Univ. of Cape Coast',           icon: '🌊', palette: { bg: '#E3F2FD', accent: '#1565C0', border: '#90CAF9' } },
  { id: 'ASHESI', label: 'Ashesi University',             icon: '💡', palette: { bg: '#F3E5F5', accent: '#6A1B9A', border: '#CE93D8' } },
  { id: 'GIMPA',  label: 'GIMPA',                         icon: '📊', palette: { bg: '#E0F2F1', accent: '#00695C', border: '#80CBC4' } },
  { id: 'UEW',    label: 'Univ. of Education',            icon: '📚', palette: { bg: '#FFF9C4', accent: '#F57F17', border: '#FFF176' } },
  { id: 'UPSA',   label: 'UPSA',                         icon: '📈', palette: { bg: '#FCE4EC', accent: '#880E4F', border: '#F48FB1' } },
  { id: 'ATU',    label: 'Accra Technical Univ.',         icon: '🔧', palette: { bg: '#EFEBE9', accent: '#4E342E', border: '#BCAAA4' } },
];

const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780782982/flyer13_1_fyp0xj.png',
    tag: '🎓  Campus Marketplace',
    title: 'Buy & Sell on\n Campus',
    subtitle: "Connect with students across Ghana's top universities",
    btnText: 'Start Shopping',
    accentColor: '#fff',
    overlayColor: 'rgba(0,0,0,0.45)',
    nav: { screen: 'Products', params: {} },
  },
  {
    id: '2',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780771354/flyer11_qkxwpv.jpg',
    tag: '💻  Electronics & Gadgets',
    title: 'Laptops, Phones\n& More',
    subtitle: 'Student-priced tech from trusted campus sellers',
    btnText: 'Browse Electronics',
    accentColor: '#90CAF9',
    overlayColor: 'rgba(10,20,60,0.50)',
    nav: { screen: 'Products', params: { category: 'electronics' } },
  },
  {
    id: '3',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781101245/fashion_banner_ibwmaz.png',
    tag: '👗  Fashion & Style',
    title: 'Upgrade Your\nWardrobe',
    subtitle: 'Trendy outfits, accessories & vintage finds at great prices',
    btnText: 'Shop Fashion',
    accentColor: '#FFCC80',
    overlayColor: 'rgba(60,30,0,0.46)',
    nav: { screen: 'Products', params: { category: 'fashion' } },
  },
  {
     id: '4',
     image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781891792/food_nad_provisions_1_m6fvfn.png',
      tag: '🍽️  Food & Provisions',
      title: 'Stock Up on\nFood & Provisions',
      subtitle: 'Groceries, snacks, drinks and daily essentials delivered to your doorstep',
      btnText: 'Shop Food Items',
      accentColor: '#FFB74D',  // Warm orange/amber for food
      overlayColor: 'rgba(40,20,0,0.50)',
      nav: { screen: 'Products', params: { category: 'food and drinks' } },
  },
];
const CATEGORY_CONFIG = {
  electronics:   { icon: '🔌', label: 'Electronics',    color: '#E3F2FD', accent: '#1565C0' },
  'phones and tablets':        { icon: '📱', label: 'Phones & Tablets',          color: '#F3E5F5', accent: '#6A1B9A' },
  'computers and laptops':       { icon: '💻', label: 'Computers & Laptops',         color: '#E8EAF6', accent: '#283593' },
  gaming:        { icon: '🎮', label: 'Gaming',          color: '#FCE4EC', accent: '#880E4F' },
  fashion:       { icon: '👗', label: 'Fashion',         color: '#FFF3E0', accent: '#E65100' },
  'books-course-materials': { icon: '📚', label: 'Books', color: '#FFF9C4', accent: '#F57F17' },
  'hostel-items':{ icon: '🛏️', label: 'Hostel Items',   color: '#E8F5E9', accent: '#2E7D32' },
  appliances:    { icon: '🔧', label: 'Appliances',      color: '#EFEBE9', accent: '#4E342E' },
  furniture:     { icon: '🪑', label: 'Furniture',       color: '#F1F8E9', accent: '#33691E' },
  'beauty and grooming': { icon: '💄', label: 'Beauty', color: '#FCE4EC', accent: '#AD1457' },
  'sports and fitness': { icon: '⚽', label: 'Sports', color: '#E8F5E9', accent: '#1B5E20' },
  accessories:   { icon: '👜', label: 'Accessories',     color: '#FFF9C4', accent: '#827717' },
  'food and drinks': { icon: '🍱', label: 'Food', color: '#FBE9E7', accent: '#BF360C' },
  services:      { icon: '🛠️', label: 'Services',        color: '#E3F2FD', accent: '#01579B' },
  other:         { icon: '📦', label: 'Other',           color: '#F5F5F5', accent: '#616161' },
};

const CONDITION_LABELS = {
  'new': { label: 'Brand New', color: '#1B5E20', bg: '#E8F5E9' },
  'like-new': { label: 'Like New', color: '#1565C0', bg: '#E3F2FD' },
  'excellent': { label: 'Excellent', color: '#4527A0', bg: '#EDE7F6' },
  'good': { label: 'Good', color: '#E65100', bg: '#FFF3E0' },
  'fair': { label: 'Fair', color: '#827717', bg: '#F9FBE7' },
  'slightly-used': { label: 'Slight Used', color: '#4E342E', bg: '#EFEBE9' },
  'for-parts': { label: 'For Parts', color: '#B71C1C', bg: '#FFEBEE' },
};

const AUTO_SCROLL_INTERVAL = 4200;

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
        {/*<View style={styles.slideTagPill}><Text style={styles.slideTagText}>{item.tag}</Text></View>*/}
        <Text style={styles.slideTitle}>{item.title}</Text>
        {/*<Text style={styles.slideSubtitle}>{item.subtitle}</Text>*/}
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

const CampusCard = ({ config, count, onPress }) => {
  const { id, icon, palette } = config;
  return (
    <TouchableOpacity style={[styles.campusCard, { backgroundColor: palette.bg, borderColor: palette.border }]} onPress={() => onPress(id)} activeOpacity={0.82}>
      <View style={[styles.campusIconBadge, { backgroundColor: palette.accent + '22' }]}><Text style={styles.campusIcon}>{icon}</Text></View>
      <Text style={[styles.campusName, { color: palette.accent }]} numberOfLines={2}>{id}</Text>
      {count > 0 ? (
        <View style={[styles.campusCountChip, { borderColor: palette.border }]}>
          <View style={[styles.campusCountDot, { backgroundColor: palette.accent }]} />
          <Text style={[styles.campusCountText, { color: palette.accent }]}>{count} listing{count !== 1 ? 's' : ''}</Text>
        </View>
      ) : <Text style={styles.campusNoListings}>No listings yet</Text>}
    </TouchableOpacity>
  );
};

const ProductCard = ({ product, onPress }) => {
  const imageUri = product.images?.[0];
  const catCfg = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.other;

  // ─── Discount calculations ──────────────────────────────────────────────
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
        
        {/* Discount badge - shows first if active */}
        {hasActiveDiscount && (
          <View style={styles.discountBadgeProduct}>
            <Text style={styles.discountBadgeProductText}>-{discountPercentage}%</Text>
          </View>
        )}
        
        {/* Condition badge - reposition when discount is active */}
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
        
        {/* Negotiable tag */}
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
          {/* Price section with discount */}
          {hasActiveDiscount ? (
            <View style={styles.productPriceStack}>
              <View style={styles.productPriceRow}>
                <Text style={styles.productPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.productDiscountPill}>
                  <Text style={styles.productDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.productOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
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

  // ─── Discount calculations ──────────────────────────────────────────────
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
      
      {/* Tags strip - discount takes priority over urgent */}
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
          {/* Price section with discount */}
          {hasActiveDiscount ? (
            <View style={styles.dealPriceStack}>
              <View style={styles.dealPriceRow}>
                <Text style={styles.dealPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.dealDiscountPill}>
                  <Text style={styles.dealDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.dealOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
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

  useEffect(() => { loadHomeData(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (searchQuery.trim().length > 1) performSearch(); else clearSearchResults(); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadHomeData = async () => {
    try { setLoading(true); await Promise.all([loadProductData(), loadStatsData()]); }
    catch (err) { console.error('GuestHome load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadProductData = async () => {
    try {
      const [featuredRes, urgentRes, popularRes, newRes, favRes] = await Promise.all([
        productService.getProductByTag('featured'),
        productService.getProductByTag('urgent-sale'),
        productService.getProductByTag('popular'),
        productService.getProductByTag('new-arrival'),
        productService.getProductByTag('student-favorite'),
      ]);
      if (featuredRes?.data?.data) setFeaturedProducts(featuredRes.data.data);
      if (urgentRes?.data?.data) setUrgentSales(urgentRes.data.data);
      if (popularRes?.data?.data) setPopularProducts(popularRes.data.data);
      if (newRes?.data?.data) setNewArrivals(newRes.data.data);
      if (favRes?.data?.data) setStudentFavorites(favRes.data.data);
    } catch (err) { console.error('Product data error:', err); }
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSearchResults(false)}
        scrollEventThrottle={16}
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
              <Ionicons name="search-outline" size={17} color="#9E9E9E" />
              <TextInput style={styles.searchInput} placeholder="Search products, categories…" placeholderTextColor="#BDBDBD" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearchSubmit} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
              {searching ? <ActivityIndicator size="small" color="#2E7D32" /> : searchQuery.length > 0 ? <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={17} color="#BDBDBD" /></TouchableOpacity> : <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate('GuestProducts')}><Ionicons name="options-outline" size={15} color="#2E7D32" /></TouchableOpacity>}
            </View>
            {showSearchResults && (
              <>
                <TouchableWithoutFeedback onPress={() => setShowSearchResults(false)}><View style={styles.searchBackdrop} /></TouchableWithoutFeedback>
                <View style={styles.searchDropdown}>
                  <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {searchResults.length > 0 ? (
                      <View style={styles.searchSection}>
                        <Text style={styles.searchSectionLabel}>Products</Text>
                        {searchResults.map(p => (
                          <TouchableOpacity key={p._id} style={styles.searchRow} onPress={() => { handleProductPress(p); clearSearch(); }}>
                            {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.searchThumb} /> : <View style={[styles.searchThumb, { backgroundColor: CATEGORY_CONFIG[p.category]?.color || '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 18 }}>{CATEGORY_CONFIG[p.category]?.icon || '📦'}</Text></View>}
                            <View style={{ flex: 1 }}><Text style={styles.searchRowName} numberOfLines={1}>{p.name}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}><Text style={styles.searchRowPrice}>GH₵ {p.price?.toFixed(2)}</Text>{p.campus && <Text style={styles.searchRowCampus}>{p.campus}</Text>}</View></View>
                            {p.condition && <ConditionBadge condition={p.condition} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : !searching ? (
                      <View style={styles.noResults}><Ionicons name="search-outline" size={36} color="#C8E6C9" /><Text style={styles.noResultsTitle}>No results</Text><Text style={styles.noResultsSub}>Try a different keyword</Text></View>
                    ) : null}
                    {searchResults.length > 0 && (
                      <TouchableOpacity style={styles.viewAllRow} onPress={handleSearchSubmit}><Text style={styles.viewAllText}>See all results for "{searchQuery}"</Text><Ionicons name="arrow-forward" size={14} color="#2E7D32" /></TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>

        {/* HERO CAROUSEL */}
        <View style={styles.carouselSection}><HeroCarousel onSlidePress={handleSlidePress} /></View>

        {/* STATS BANNER */}
        {platformStats && <StatsBanner stats={platformStats} />}

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            {/*<TouchableOpacity onPress={() => navigation.navigate('GuestProducts')} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>*/}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity key={key} style={styles.categoryPill} onPress={() => handleCategoryPress(key)} activeOpacity={0.8}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cfg.color, borderColor: cfg.color }]}><Text style={styles.categoryEmoji}>{cfg.icon}</Text></View>
                <Text style={styles.categoryName} numberOfLines={1}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SHOP BY CAMPUS 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>Shop by Campus</Text><Text style={styles.sectionSubtitle}>Find listings near your school</Text></View>
            <TouchableOpacity onPress={() => navigation.navigate('GuestProducts')} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campusScrollContent}>
            {ALL_CAMPUSES.map(config => <CampusCard key={config.id} config={config} count={campusStats[config.id] ?? 0} onPress={handleCampusPress} />)}
          </ScrollView>
        </View>
        */}


        {/* FEATURED PRODUCTS */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Featured Listings</Text><Text style={styles.sectionSubtitle}>Hand-picked by our team</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'featured' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{featuredProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* URGENT SALES */}
        {urgentSales.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}><View style={styles.urgentDot} /><View><Text style={styles.sectionTitle}>Urgent Sales</Text><Text style={styles.sectionSubtitle}>Grab them before they're gone</Text></View></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'urgent-sale' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{urgentSales.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} />)}</ScrollView>
          </View>
        )}

        {/* POPULAR ON CAMPUS */}
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Popular on Campus</Text><Text style={styles.sectionSubtitle}>Most viewed this week</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'popular', sort: 'popular' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{popularProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>New Arrivals</Text><Text style={styles.sectionSubtitle}>Just listed by students</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'new-arrival', sort: 'newest' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{newArrivals.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} />)}</ScrollView>
          </View>
        )}

        {/* STUDENT FAVORITES */}
        {studentFavorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Student Favorites</Text><Text style={styles.sectionSubtitle}>Loved by campus shoppers</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'student-favorite' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#2E7D32" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{studentFavorites.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} />)}</View>
          </View>
        )}

        {/* SELL YOUR STUFF BANNER */}
        <View style={styles.bannerSection}>
          <TouchableOpacity style={styles.sellBanner} activeOpacity={0.9} onPress={()=>navigation.navigate("VendorSignUp")}>
            <View style={styles.sellBannerContent}>
              <View style={styles.sellBannerTag}><Ionicons name="storefront-outline" size={11} color="#fff" /><Text style={styles.sellBannerTagText}>FOR SELLERS</Text></View>
              <Text style={styles.sellBannerTitle}>Got something{'\n'}to sell?</Text>
              <Text style={styles.sellBannerSub}>List your items for free and reach thousands of students across campuses</Text>
              <View style={styles.sellBannerBtn}><Text style={styles.sellBannerBtnText}>Start Selling</Text><Ionicons name="arrow-forward" size={13} color="#1B5E20" /></View>
            </View>
            <View style={styles.sellBannerIllustration}><Text style={{ fontSize: 60 }}>🛍️</Text></View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};



export default GuestHomeScreen;