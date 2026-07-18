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
import { useChat } from '../context/ChatContext';
import { NotificationContext } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import {styles} from '../styles/home'
import AIFAB from '../components/AIFAB';
import {CATEGORY_CONFIG,CONDITION_LABELS,ALL_CAMPUSES,HERO_SLIDES} from '../data/General'

const { width } = Dimensions.get('window');

const AUTO_SCROLL_INTERVAL = 4200;


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
  const {totalUnread} = useChat()

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
            {/*<TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Favorites')}>
                <Ionicons name="heart-outline" size={24} color="#2E7D32" />
              </TouchableOpacity>*/}
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
                <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={24} color="#2E7D32" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Inbox')}>
                <Ionicons name="mail-outline" size={24} color="#2E7D32" />
                {totalUnread > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search ── */}
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
                <ActivityIndicator size="small" color="#2E7D32" />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity 
                  onPress={clearSearch} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color="#BDBDBD" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.searchIconBtn}
                  onPress={handleSearchSubmit}
                  activeOpacity={0.8}
                >
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
                  <ScrollView 
                    style={{ maxHeight: 380 }} 
                    keyboardShouldPersistTaps="handled" 
                    nestedScrollEnabled 
                    showsVerticalScrollIndicator={false}
                  >
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
                              <View style={[styles.searchThumb, { 
                                backgroundColor: CATEGORY_CONFIG[p.category]?.color || '#F5F5F5', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                              }]}>
                                <Text style={{ fontSize: 18 }}>
                                  {CATEGORY_CONFIG[p.category]?.icon || '📦'}
                                </Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchRowName} numberOfLines={1}>
                                {p.name}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <Text style={styles.searchRowPrice}>
                                  GH₵ {p.price?.toFixed(2)}
                                </Text>
                                {p.campus && (
                                  <Text style={styles.searchRowCampus}>{p.campus}</Text>
                                )}
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
                        <Text style={styles.viewAllText}>
                          See all results for "{searchQuery}"
                        </Text>
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
        <View style={{ height: 100 }} />
      </ScrollView>
      <AIFAB 
      style={{ 
      position: 'absolute', 
      bottom: 24, 
      right: 16,
     }}
    />
    </SafeAreaView>
  );
};



export default HomeScreen;