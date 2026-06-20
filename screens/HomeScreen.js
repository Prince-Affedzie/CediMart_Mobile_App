// src/screens/main/HomeScreen.js
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
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
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import {styles} from '../styles/home'

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// CAMPUS DATA
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// HERO SLIDES  – campus marketplace themed
// ─────────────────────────────────────────────
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

const AUTO_SCROLL_INTERVAL = 4200;

// ─────────────────────────────────────────────
// CATEGORY CONFIG
// Matches the product schema enum exactly
// ─────────────────────────────────────────────
const CATEGORY_CONFIG = {
  electronics:   { icon: '🔌', label: 'Electronics',    color: '#E3F2FD', accent: '#1565C0' },
  'phones and tablets':        { icon: '📱', label: 'Phones & Tablets',          color: '#F3E5F5', accent: '#6A1B9A' },
  'computers and laptops':       { icon: '💻', label: 'Computers & Laptops',         color: '#E8EAF6', accent: '#283593' },
  gaming:        { icon: '🎮', label: 'Gaming',          color: '#FCE4EC', accent: '#880E4F' },
  fashion:       { icon: '👗', label: 'Fashion',         color: '#FFF3E0', accent: '#E65100' },
  'books-course-materials':         { icon: '📚', label: 'Books',           color: '#FFF9C4', accent: '#F57F17' },
  'hostel-items':{ icon: '🛏️', label: 'Hostel Items',   color: '#E8F5E9', accent: '#2E7D32' },
  appliances:    { icon: '🔧', label: 'Appliances',      color: '#EFEBE9', accent: '#4E342E' },
  furniture:     { icon: '🪑', label: 'Furniture',       color: '#F1F8E9', accent: '#33691E' },
  'beauty and grooming':        { icon: '💄', label: 'Beauty',          color: '#FCE4EC', accent: '#AD1457' },
  'sports and fitness':        { icon: '⚽', label: 'Sports',          color: '#E8F5E9', accent: '#1B5E20' },
  accessories:   { icon: '👜', label: 'Accessories',     color: '#FFF9C4', accent: '#827717' },
  food:          { icon: '🍱', label: 'Food',            color: '#FBE9E7', accent: '#BF360C' },
  services:      { icon: '🛠️', label: 'Services',        color: '#E3F2FD', accent: '#01579B' },
  other:         { icon: '📦', label: 'Other',           color: '#F5F5F5', accent: '#616161' },
};

// Condition display map
const CONDITION_LABELS = {
  'new':          { label: 'Brand New',    color: '#1B5E20', bg: '#E8F5E9' },
  'like-new':     { label: 'Like New',     color: '#1565C0', bg: '#E3F2FD' },
  'excellent':    { label: 'Excellent',    color: '#4527A0', bg: '#EDE7F6' },
  'good':         { label: 'Good',         color: '#E65100', bg: '#FFF3E0' },
  'fair':         { label: 'Fair',         color: '#827717', bg: '#F9FBE7' },
  'slightly-used':{ label: 'Slight Used',  color: '#4E342E', bg: '#EFEBE9' },
  'for-parts':    { label: 'For Parts',    color: '#B71C1C', bg: '#FFEBEE' },
};

// ─────────────────────────────────────────────
// HERO CAROUSEL
// ─────────────────────────────────────────────
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

  const renderSlide = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onSlidePress(item)}
      style={[styles.slideWrapper, { width: SLIDE_W }]}
    >
      <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
      <View style={[styles.slideScrim, { backgroundColor: item.overlayColor }]} />
      <View style={styles.slideContent}>
        {/*<View style={styles.slideTagPill}>
          <Text style={styles.slideTagText}>{item.tag}</Text>
        </View>*/}
        <Text style={styles.slideTitle}>{item.title}</Text>
        {/*<Text style={styles.slideSubtitle}>{item.subtitle}</Text>*/}
        <TouchableOpacity
          style={[styles.slideBtn, { borderColor: item.accentColor }]}
          onPress={() => onSlidePress(item)}
          activeOpacity={0.85}
        >
          <Text style={[styles.slideBtnText, { color: item.accentColor }]}>{item.btnText}</Text>
          <Ionicons name="arrow-forward" size={13} color={item.accentColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.carouselWrap}>
        <FlatList
          ref={flatListRef}
          data={HERO_SLIDES}
          renderItem={renderSlide}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: SLIDE_W, offset: SLIDE_W * index, index })}
        />
      </View>
      <View style={styles.dotsRow}>
        {HERO_SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
              clearInterval(timerRef.current);
              startAutoScroll();
            }}
          >
            <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// CAMPUS CARD  (horizontal strip)
// ─────────────────────────────────────────────
const CampusCard = ({ config, count, onPress }) => {
  const { id, icon, palette, label } = config;
  return (
    <TouchableOpacity
      style={[styles.campusCard, { backgroundColor: palette.bg, borderColor: palette.border }]}
      onPress={() => onPress(id)}
      activeOpacity={0.82}
    >
      <View style={[styles.campusIconBadge, { backgroundColor: palette.accent + '22' }]}>
        <Text style={styles.campusIcon}>{icon}</Text>
      </View>
      <Text style={[styles.campusName, { color: palette.accent }]} numberOfLines={2}>{id}</Text>
      {count > 0 ? (
        <View style={[styles.campusCountChip, { borderColor: palette.border }]}>
          <View style={[styles.campusCountDot, { backgroundColor: palette.accent }]} />
          <Text style={[styles.campusCountText, { color: palette.accent }]}>{count} listing{count !== 1 ? 's' : ''}</Text>
        </View>
      ) : (
        <Text style={styles.campusNoListings}>No listings yet</Text>
      )}
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// CONDITION BADGE
// ─────────────────────────────────────────────
const ConditionBadge = ({ condition }) => {
  const cfg = CONDITION_LABELS[condition] || { label: condition, color: '#616161', bg: '#F5F5F5' };
  return (
    <View style={[styles.conditionBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.conditionBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// PRODUCT CARD  – grid layout (2-col)
// Adapted for campus marketplace: shows condition, campus, negotiable tag
// ─────────────────────────────────────────────
const ProductCard = ({ product, onPress, onAddToCart, isAdding, isInCart }) => {
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
        
        {/* Condition badge overlay */}
        {product.condition && !hasActiveDiscount && (
          <View style={styles.conditionOverlay}>
            <ConditionBadge condition={product.condition} />
          </View>
        )}
        
        {/* Condition badge when discount is active - smaller, repositioned */}
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

        {/* Campus pill */}
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
            <View>
              <Text style={styles.productPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.addBtn, isInCart && styles.addBtnActive]}
            onPress={() => onAddToCart(product)}
            disabled={isAdding}
          >
            {isAdding
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={isInCart ? 'checkmark' : 'add'} size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// DEAL CARD  – horizontal scroll (urgent-sale / popular)
// ─────────────────────────────────────────────
const DealCard = ({ product, onPress, onAddToCart, isAdding, isInCart }) => {
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
    <TouchableOpacity
      style={styles.dealCard}
      onPress={() => onPress(product)}
      activeOpacity={0.85}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.dealImg} resizeMode="cover" />
      ) : (
        <View style={[styles.dealImgPlaceholder, { backgroundColor: catCfg.color }]}>
          <Text style={{ fontSize: 34 }}>{catCfg.icon}</Text>
        </View>
      )}
      
      {/* Tags strip - discount takes priority over urgent */}
      {hasActiveDiscount &&  (
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
          
          <TouchableOpacity
            style={[styles.dealAddBtn, isInCart && styles.dealAddBtnActive]}
            onPress={() => onAddToCart(product)}
            disabled={isAdding}
          >
            {isAdding
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={isInCart ? 'checkmark' : 'add'} size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
// ─────────────────────────────────────────────
// STATS BANNER  (live platform stats)
// ─────────────────────────────────────────────
const StatsBanner = ({ stats }) => {
  if (!stats) return null;
  return (
    <View style={styles.statsBanner}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalProducts?.toLocaleString() ?? '—'}</Text>
        <Text style={styles.statLabel}>Listings</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.byCampus?.length ?? '—'}</Text>
        <Text style={styles.statLabel}>Campuses</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.byCategory?.length ?? '—'}</Text>
        <Text style={styles.statLabel}>Categories</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartCount, cartItems } = useCart();
  const { notifications } = useContext(NotificationContext);

  // Data
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [urgentSales, setUrgentSales] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [studentFavorites, setStudentFavorites] = useState([]);
  const [campusStats, setCampusStats] = useState({});  // { UG: count, KNUST: count, ... }
  const [platformStats, setPlatformStats] = useState(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  useEffect(() => { loadHomeData(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length > 1) performSearch();
      else clearSearchResults();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── DATA ──────────────────────────────────────
  const loadHomeData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProductData(), loadStatsData()]);
    } catch (err) {
      console.error('HomeScreen load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProductData = async () => {
    try {
      // Tags from schema: "featured" | "urgent-sale" | "popular" | "discounted" | "new-arrival" | "student-favorite"
      const [featuredRes, urgentRes, popularRes, newRes, favRes] = await Promise.all([
        productService.getProductByTag('featured'),
        productService.getProductByTag('urgent-sale'),
        productService.getProductByTag('popular'),
        productService.getProductByTag('new-arrival'),
        productService.getProductByTag('student-favorite'),
      ]);
      if (featuredRes?.data?.data) setFeaturedProducts(featuredRes.data.data);
      if (urgentRes?.data?.data)   setUrgentSales(urgentRes.data.data);
      if (popularRes?.data?.data)  setPopularProducts(popularRes.data.data);
      if (newRes?.data?.data)      setNewArrivals(newRes.data.data);
      if (favRes?.data?.data)      setStudentFavorites(favRes.data.data);
    } catch (err) {
      console.error('Product data error:', err);
    }
  };

  const loadStatsData = async () => {
    try {
      const statsRes = await productService.getProductStats?.();
      if (statsRes?.data?.success) {
        const stats = statsRes.data;
        setPlatformStats(stats);
        // Build campusStats map { UG: 12, KNUST: 8, ... }
        const map = {};
        (stats.byCampus || []).forEach(c => { map[c._id] = c.count; });
        setCampusStats(map);
      }
    } catch (err) {
      // Stats are non-critical; fail silently
      console.log('Stats load skipped:', err.message);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadHomeData(); }, []);

  // ── SEARCH ───────────────────────────────────
  const performSearch = async () => {
    setSearching(true);
    const q = searchQuery.trim();
    try {
      const res = await productService.getProducts({ search: q, limit: 8 });
      if (res?.data) setSearchResults(res.data);
      else setSearchResults([]);
    } catch {
      setSearchResults([]);
    }
    setShowSearchResults(true);
    setSearching(false);
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    clearSearchResults();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Products', { search: searchQuery });
      clearSearch();
    }
  };

  // ── CART ─────────────────────────────────────
  const getQtyInCart = (productId) => {
    const item = cartItems?.find(i => i.product?._id === productId || i.productId === productId);
    return item?.quantity ?? 0;
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to save or contact sellers.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    const stock = product.countInStock ?? 0;
    if (stock <= 0) {
      Alert.alert('Unavailable', `${product.name} is no longer available.`);
      return;
    }
    try {
      setAddingProductId(product._id);
      setAddedProductName(product.name);
      await addToCart(product._id, 1);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2200);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  // ── NAVIGATION HELPERS ────────────────────────
  const handleSlidePress = (slide) => {
    const { screen, params } = slide.nav;
    navigation.navigate(screen, params);
  };

  const handleCampusPress = (campusId) => {
    navigation.navigate('Campus', { campus: campusId });
  };

  const handleCategoryPress = (category,categoryName) => {
    navigation.navigate('Category', {category,categoryName });
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  };

  // ── LOADING ───────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ── Cart / interest success modal ── */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={52} color="#2E7D32" />
            <Text style={styles.successTitle}>Saved!</Text>
            <Text style={styles.successMessage}>{addedProductName} has been added to your list</Text>
            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={() => { setModalVisible(false); navigation.navigate('Cart'); }}
            >
              <Text style={styles.viewCartBtnText}>View Saved Items</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.continueBtnText}>Continue Browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSearchResults(false)}
        scrollEventThrottle={16}
      >
        {/* ════════════════════════════════
            HEADER
            ════════════════════════════════ */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerGreeting}>
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
                {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text style={styles.headerTitle}>CediMart</Text>
              <View style={styles.locationPill}>
                <View style={styles.locationDot} />
                <Text style={styles.locationText}>Ghana's Campus Marketplace</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Favorites')}>
                <Ionicons name="heart-outline" size={20} color="#E8F5E9" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
                <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={20} color="#E8F5E9" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="cart-outline" size={20} color="#E8F5E9" />
                {cartCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search ── */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={17} color="#9E9E9E" />
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
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={17} color="#BDBDBD" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.navigate('Products')}>
                  <Ionicons name="options-outline" size={15} color="#2E7D32" />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Search dropdown ── */}
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
                          <TouchableOpacity
                            key={p._id}
                            style={styles.searchRow}
                            onPress={() => { handleProductPress(p); clearSearch(); }}
                          >
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
                        <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ════════════════════════════════
            HERO CAROUSEL
            ════════════════════════════════ */}
        <View style={styles.carouselSection}>
          <HeroCarousel onSlidePress={handleSlidePress} />
        </View>

        {/* ════════════════════════════════
            PLATFORM STATS STRIP
            ════════════════════════════════ */}
        {platformStats && <StatsBanner stats={platformStats} />}

        {/* ════════════════════════════════
            QUICK CATEGORY PILLS
            ════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            {/*<TouchableOpacity onPress={() => navigation.navigate('Products')} style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
            </TouchableOpacity>*/}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={styles.categoryPill}
                onPress={() => handleCategoryPress(key,cfg.label)}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cfg.color, borderColor: cfg.color }]}>
                  <Text style={styles.categoryEmoji}>{cfg.icon}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════
            SHOP BY CAMPUS
            ════════════════════════════════ 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shop by Campus</Text>
              <Text style={styles.sectionSubtitle}>Find listings near your school</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Products')} style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campusScrollContent}>
            {ALL_CAMPUSES.map(config => (
              <CampusCard
                key={config.id}
                config={config}
                count={campusStats[config.id] ?? 0}
                onPress={handleCampusPress}
              />
            ))}
          </ScrollView>
        </View>
        */}


        {/* ════════════════════════════════
            FEATURED PRODUCTS  (2-col grid)
            ════════════════════════════════ */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Featured Listings</Text>
                <Text style={styles.sectionSubtitle}>Hand-picked by our team</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'featured' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {featuredProducts.slice(0, 10).map(p => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === p._id}
                  isInCart={getQtyInCart(p._id) > 0}
                />
              ))}
            </View>
          </View>
        )}

        {/* ════════════════════════════════
            URGENT SALES  (horizontal deal cards)
            ════════════════════════════════ */}
        {urgentSales.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.urgentDot} />
                <View>
                  <Text style={styles.sectionTitle}>Urgent Sales</Text>
                  <Text style={styles.sectionSubtitle}>Grab them before they're gone</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'urgent-sale' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {urgentSales.map(p => (
                <DealCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === p._id}
                  isInCart={getQtyInCart(p._id) > 0}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ════════════════════════════════
            POPULAR ON CAMPUS  (2-col grid)
            ════════════════════════════════ */}
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Popular on Campus</Text>
                <Text style={styles.sectionSubtitle}>Most viewed this week</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'popular', sort: 'popular' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {popularProducts.slice(0, 10).map(p => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === p._id}
                  isInCart={getQtyInCart(p._id) > 0}
                />
              ))}
            </View>
          </View>
        )}

        {/* ════════════════════════════════
            NEW ARRIVALS  (horizontal)
            ════════════════════════════════ */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>New Arrivals</Text>
                <Text style={styles.sectionSubtitle}>Just listed by students</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'new-arrival', sort: 'newest' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {newArrivals.map(p => (
                <DealCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === p._id}
                  isInCart={getQtyInCart(p._id) > 0}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ════════════════════════════════
            STUDENT FAVORITES  (2-col grid)
            ════════════════════════════════ */}
        {studentFavorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Student Favorites</Text>
                <Text style={styles.sectionSubtitle}>Loved by campus shoppers</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'student-favorite' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {studentFavorites.slice(0, 10).map(p => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === p._id}
                  isInCart={getQtyInCart(p._id) > 0}
                />
              ))}
            </View>
          </View>
        )}

        {/* ════════════════════════════════
    ESCROW TRUST BANNER
    ════════════════════════════════ */}
<View style={styles.bannerSection}>
  <TouchableOpacity
    style={styles.sellBanner}
    activeOpacity={0.9}
  >
    <View style={styles.sellBannerContent}>
      <View style={styles.sellBannerTag}>
        <Ionicons name="shield-checkmark" size={11} color="#fff" />
        <Text style={styles.sellBannerTagText}>ENJOY SECURED TRANSACTIONS</Text>
      </View>
      <Text style={styles.sellBannerTitle}>Your money is{'\n'}safe with us</Text>
      <Text style={styles.sellBannerSub}>
        We hold your payment securely until you receive your order. Sellers only get paid after you confirm delivery.
      </Text>
      <View style={styles.sellBannerBtn}>
        <Text style={styles.sellBannerBtnText}>Shop with confidence</Text>
        <Ionicons name="arrow-forward" size={13} color="#1B5E20" />
      </View>
    </View>
    <View style={styles.sellBannerIllustration}>
      <Text style={{ fontSize: 56 }}>🛍️</Text>
    </View>
  </TouchableOpacity>
</View>


        {/* ════════════════════════════════
            SAFETY & TRUST TIPS
            ════════════════════════════════ 
        <View style={styles.safetySection}>
          <Text style={styles.safetySectionTitle}>Safe Trading Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.safetyScroll}>
            {[
              { icon: '🤝', title: 'Meet on Campus', desc: 'Always meet in a public campus area' },
              { icon: '👀', title: 'Inspect First', desc: 'Check items before paying any money' },
              { icon: '🚫', title: 'Avoid Transfers', desc: 'Never pay before seeing the item' },
              { icon: '📞', title: 'Use In-App Chat', desc: 'Communicate via the app for safety' },
            ].map((tip, i) => (
              <View key={i} style={styles.safetyCard}>
                <Text style={styles.safetyCardIcon}>{tip.icon}</Text>
                <Text style={styles.safetyCardTitle}>{tip.title}</Text>
                <Text style={styles.safetyCardDesc}>{tip.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View> */}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};



export default HomeScreen;