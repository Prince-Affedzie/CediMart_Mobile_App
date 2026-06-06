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
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780692313/ChatGPT_Image_Jun_5_2026_08_37_eybjm8.png',
    tag: '🎓  Campus Marketplace',
    title: 'Buy & Sell on\nYour Campus',
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
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780695851/books_flyer_ljnqis.jpg',
    tag: '📚  Textbooks & Notes',
    title: 'Save on\nCampus Books',
    subtitle: 'Used textbooks, notes & past questions at low prices',
    btnText: 'Shop Books',
    accentColor: '#FFCC80',
    overlayColor: 'rgba(60,30,0,0.46)',
    nav: { screen: 'Products', params: { category: 'books' } },
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    tag: '🛏️  Hostel Essentials',
    title: 'Furnish Your\nHostel Room',
    subtitle: 'Beds, fans, fridges and everything you need',
    btnText: 'Explore Hostel Items',
    accentColor: '#A5D6A7',
    overlayColor: 'rgba(0,30,10,0.46)',
    nav: { screen: 'Products', params: { category: 'hostel-items' } },
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
        {/* Condition badge overlay */}
        {product.condition && (
          <View style={styles.conditionOverlay}>
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
          <View>
            <Text style={styles.productPrice}>GH₵ {product.price?.toFixed(2)}</Text>
          </View>
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
      {/* Tags strip */}
      {product.tags?.includes('urgent-sale') && (
        <View style={styles.urgentBadge}>
          <Ionicons name="flash" size={9} color="#fff" />
          <Text style={styles.urgentBadgeText}>Urgent</Text>
        </View>
      )}
      <View style={styles.dealOverlay}>
        <Text style={styles.dealName} numberOfLines={1}>{product.name}</Text>
        {product.condition && <ConditionBadge condition={product.condition} />}
        <View style={styles.dealBottom}>
          <View>
            <Text style={styles.dealPrice}>GH₵ {product.price?.toFixed(2)}</Text>
            {product.negotiable && <Text style={styles.dealNeg}>Negotiable</Text>}
          </View>
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
              {featuredProducts.slice(0, 6).map(p => (
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
              {popularProducts.slice(0, 6).map(p => (
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
              {studentFavorites.slice(0, 4).map(p => (
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
            SELL YOUR STUFF BANNER
            ════════════════════════════════ */}
        <View style={styles.bannerSection}>
          <TouchableOpacity
            style={styles.sellBanner}
            activeOpacity={0.9}
            onPress={() => isAuthenticated
              ? navigation.navigate('CreateProduct')
              : navigation.navigate('Login')
            }
          >
            <View style={styles.sellBannerContent}>
              <View style={styles.sellBannerTag}>
                <Ionicons name="storefront-outline" size={11} color="#fff" />
                <Text style={styles.sellBannerTagText}>FOR SELLERS</Text>
              </View>
              <Text style={styles.sellBannerTitle}>Got something{'\n'}to sell?</Text>
              <Text style={styles.sellBannerSub}>List your items for free and reach thousands of students across campuses</Text>
              <View style={styles.sellBannerBtn}>
                <Text style={styles.sellBannerBtnText}>Start Selling</Text>
                <Ionicons name="arrow-forward" size={13} color="#1B5E20" />
              </View>
            </View>
            <View style={styles.sellBannerIllustration}>
              <Text style={{ fontSize: 60 }}>🛍️</Text>
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

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },
  scrollContent: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2EE' },
  loadingText: { marginTop: 14, fontSize: 15, color: '#757575' },

  // ── Header ──
  header: {
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    backgroundColor: '#1B5E20',
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    zIndex: 100,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerGreeting: {
    fontSize: 11,
    color: '#81C784',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  locationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69F0AE' },
  locationText: { fontSize: 11, color: '#E8F5E9', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1B5E20',
  },
  notifBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', paddingHorizontal: 2 },

  // ── Search ──
  searchWrapper: { position: 'relative', zIndex: 200 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2714', paddingVertical: 0 },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBackdrop: {
    position: 'absolute',
    top: 0,
    left: -16,
    right: -16,
    bottom: -1200,
    zIndex: 998,
  },
  searchDropdown: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  searchSection: { paddingVertical: 6 },
  searchSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 12,
  },
  searchThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F5E9' },
  searchRowName: { fontSize: 13, fontWeight: '600', color: '#1B2714' },
  searchRowPrice: { fontSize: 12, fontWeight: '700', color: '#1B5E20' },
  searchRowCampus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noResults: { alignItems: 'center', padding: 28 },
  noResultsTitle: { fontSize: 15, fontWeight: '600', color: '#424242', marginTop: 10 },
  noResultsSub: { fontSize: 13, color: '#9E9E9E', marginTop: 3 },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
  },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  // ── Carousel ──
  carouselSection: { marginHorizontal: 16, marginTop: 16 },
  carouselWrap: { borderRadius: 20, overflow: 'hidden' },
  slideWrapper: { height: 200, position: 'relative', backgroundColor: '#1B5E20' },
  slideImage: { width: '100%', height: '100%', position: 'absolute' },
  slideScrim: { ...StyleSheet.absoluteFillObject },
  slideContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  slideTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  slideTagText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 25,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  slideSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginBottom: 12 },
  slideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  slideBtnText: { fontSize: 13, fontWeight: '700' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F0F2EE',
    gap: 5,
  },
  dot: { borderRadius: 4, height: 5 },
  dotActive: { width: 18, backgroundColor: '#1B5E20' },
  dotInactive: { width: 5, backgroundColor: '#C8E6C9' },

  // ── Stats Banner ──
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#1B5E20',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: '#A5D6A7', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // ── Section ──
  section: { backgroundColor: '#FFFFFF', marginTop: 10, paddingTop: 18, paddingBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1B2714' },
  sectionSubtitle: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginTop: 4,
  },

  // ── Campus cards ──
  campusScrollContent: { paddingHorizontal: 16, gap: 10 },
  campusCard: {
    width: 140,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    gap: 7,
  },
  campusIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campusIcon: { fontSize: 18 },
  campusName: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  campusCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  campusCountDot: { width: 5, height: 5, borderRadius: 3 },
  campusCountText: { fontSize: 10, fontWeight: '700' },
  campusNoListings: { fontSize: 10, color: '#BDBDBD' },

  // ── Category ──
  categoryScroll: { paddingHorizontal: 16, gap: 10 },
  categoryPill: { alignItems: 'center', width: 68 },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  categoryEmoji: { fontSize: 22 },
  categoryName: { fontSize: 10, fontWeight: '600', color: '#424242', textAlign: 'center' },

  // ── Product grid ──
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  productCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  productImgWrap: { position: 'relative' },
  productImg: { width: '100%', height: 120 },
  productImgPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionOverlay: { position: 'absolute', top: 6, left: 6 },
  negotiableTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#1B5E20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  negotiableTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: '#1B2714', marginBottom: 4, lineHeight: 17 },
  campusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  campusPillText: { fontSize: 10, fontWeight: '600', color: '#2E7D32' },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnActive: { backgroundColor: '#1B5E20' },

  // ── Condition badge ──
  conditionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  conditionBadgeText: { fontSize: 9, fontWeight: '700' },

  // ── Deal card (horizontal) ──
  horizontalScroll: { paddingHorizontal: 16, gap: 12 },
  dealCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  dealImg: { width: '100%', height: '100%', position: 'absolute' },
  dealImgPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF5252',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  dealOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    padding: 12,
    gap: 5,
  },
  dealName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dealBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealPrice: { fontSize: 14, fontWeight: '800', color: '#A5D6A7' },
  dealNeg: { fontSize: 9, color: '#81C784', fontWeight: '600', marginTop: 1 },
  dealAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealAddBtnActive: { backgroundColor: '#1B5E20' },

  // ── Sell Banner ──
  bannerSection: { paddingHorizontal: 16, marginTop: 10 },
  sellBanner: {
    backgroundColor: '#1B5E20',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 150,
  },
  sellBannerContent: { flex: 1, padding: 18, justifyContent: 'center' },
  sellBannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  sellBannerTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sellBannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4, lineHeight: 26 },
  sellBannerSub: { fontSize: 12, color: '#A5D6A7', marginBottom: 14, lineHeight: 17 },
  sellBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sellBannerBtnText: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  sellBannerIllustration: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Safety section ──
  safetySection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingTop: 18,
    paddingBottom: 20,
  },
  safetySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2714',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  safetyScroll: { paddingHorizontal: 16, gap: 10 },
  safetyCard: {
    width: 140,
    backgroundColor: '#F8FFF8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    gap: 5,
  },
  safetyCardIcon: { fontSize: 22 },
  safetyCardTitle: { fontSize: 12, fontWeight: '700', color: '#1B2714' },
  safetyCardDesc: { fontSize: 11, color: '#757575', lineHeight: 15 },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginTop: 14, marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  viewCartBtn: {
    backgroundColor: '#2E7D32',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewCartBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  continueBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  continueBtnText: { color: '#2E7D32', fontSize: 15, fontWeight: '600' },
});

export default HomeScreen;