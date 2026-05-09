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
import { getVendorsByMarket, getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// ALL 8 ACCRA MARKETS (enum-driven, always shown)
// ─────────────────────────────────────────────
const ALL_MARKETS = [
  { id: 'Madina Market',       icon: '🏬', palette: { bg: '#E8F5E9', accent: '#1B5E20', border: '#A5D6A7' } },
  { id: 'Makola Market',       icon: '🛒', palette: { bg: '#FFF3E0', accent: '#E65100', border: '#FFCC80' } },
  { id: 'Agbogbloshie Market', icon: '🌳', palette: { bg: '#FFF9C4', accent: '#F57F17', border: '#FFF176' } },
  { id: 'Kaneshie Market',     icon: '🏪', palette: { bg: '#E3F2FD', accent: '#1565C0', border: '#90CAF9' } },
  { id: 'Mallam Market',       icon: '🌿', palette: { bg: '#E0F2F1', accent: '#00695C', border: '#80CBC4' } },
  { id: 'Tema Market',         icon: '🏭', palette: { bg: '#F3E5F5', accent: '#6A1B9A', border: '#CE93D8' } },
  { id: 'Dome Market',         icon: '🏙️', palette: { bg: '#EFEBE9', accent: '#4E342E', border: '#BCAAA4' } },
];

// ─────────────────────────────────────────────
// HERO SLIDES
// ─────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893983/makola_img_3_dbeymr.jpg',
    tag: '📍  Accra Markets',
    title: 'Your Favourite\nMarkets, Online',
    subtitle: 'Shop from vendors across Madina, Makola, Kaneshie & more',
    btnText: 'Browse Markets',
    accentColor: '#fff',
    overlayColor: 'rgba(0,0,0,0.38)',
    nav: { screen: 'Markets' },
  },
  {
    id: '2',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
    tag: '🥦  Farm Fresh',
    title: 'Straight From\nThe Markets',
    subtitle: 'Hand-picked vegetables delivered fresh daily',
    btnText: 'Shop Veggies',
    accentColor: '#A5D6A7',
    overlayColor: 'rgba(0,60,0,0.44)',
    nav: { screen: 'Products', params: { category: 'vegetables' } },
  },
  {
    id: '3',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
    tag: '🍎  Seasonal Picks',
    title: 'Juicy Fruits,\nEvery Season',
    subtitle: 'Tropical & local fruits sourced weekly',
    btnText: 'Explore Fruits',
    accentColor: '#FFCC80',
    overlayColor: 'rgba(80,20,0,0.38)',
    nav: { screen: 'Products', params: { category: 'fruits' } },
  },
  {
    id: '4',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989775/free_delivery_tsytih.jpg',
    tag: '⚡  Special Deal',
    title: 'Free Delivery\nOver GH₵ 500',
    subtitle: 'Stock up on staples and save on shipping',
    btnText: 'Shop Staples',
    accentColor: '#FFE082',
    overlayColor: 'rgba(20,10,0,0.44)',
    nav: { screen: 'Products', params: { category: 'staples' } },
  },
];

const AUTO_SCROLL_INTERVAL = 4200;

const CATEGORY_ICONS = {
  fruits: '🍎', vegetables: '🥦', dairy: '🥛', meat: '🥩',
  seafood: '🐟', bakery: '🍞', beverages: '🥤', staples: '🌾',
  herb: '🌿', tuber: '🥔', organic: '🌱', snacks: '🍪', default: '🛒',
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
        <View style={styles.slideTagPill}>
          <Text style={styles.slideTagText}>{item.tag}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
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
// MARKET GRID CARD
// Shows live data if vendors exist, "Coming soon" if not
// ─────────────────────────────────────────────
const MarketGridCard = ({ config, liveData, onPress }) => {
  const { id, icon, palette } = config;
  const hasVendors = liveData && (liveData.count ?? liveData.vendors?.length ?? 0) > 0;
  const vendorCount = liveData?.count ?? liveData?.vendors?.length ?? 0;
  const previewVendors = (liveData?.vendors || []).slice(0, 3);
  const extra = vendorCount > 3 ? vendorCount - 3 : 0;

  if (!hasVendors) {
    return (
      <TouchableOpacity onPress={() => onPress(liveData || { _id: id })} style={[styles.marketCard, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        <View style={styles.marketCardTop}>
          <View style={[styles.marketIconBadge, { backgroundColor: '#F5F5F5' }]}>
            <Text style={styles.marketIcon}>{icon}</Text>
          </View>
          <View style={styles.comingSoonChip}>
            <Text style={styles.comingSoonChipText}>Soon</Text>
          </View>
        </View>
        <Text style={[styles.marketName, { color: palette.accent }]} numberOfLines={2}>{id}</Text>
        <Text style={styles.marketNoVendors}>No vendors yet</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.marketCard, { backgroundColor: palette.bg, borderColor: palette.border }]}
      onPress={() => onPress(liveData || { _id: id })}
      activeOpacity={0.82}
    >
      <View style={styles.marketCardTop}>
        <View style={[styles.marketIconBadge, { backgroundColor: palette.accent + '22' }]}>
          <Text style={styles.marketIcon}>{icon}</Text>
        </View>
        <View style={[styles.vendorCountChip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <View style={[styles.vendorCountDot, { backgroundColor: palette.accent }]} />
          <Text style={[styles.vendorCountText, { color: palette.accent }]}>
            {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <Text style={[styles.marketName, { color: palette.accent }]} numberOfLines={2}>
        {id}
      </Text>

      {/* Stacked vendor avatars */}
      {previewVendors.length > 0 && (
        <View style={styles.avatarStack}>
          {previewVendors.map((v, vi) => (
            <View key={v._id} style={[styles.avatarItem, { left: vi * 19, zIndex: 3 - vi }]}>
              {v.profile_image ? (
                <Image
                  source={{ uri: v.profile_image }}
                  style={[styles.avatarImg, { borderColor: palette.bg }]}
                />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder, { backgroundColor: palette.accent, borderColor: palette.bg }]}>
                  <Text style={styles.avatarInitial}>{v.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
            </View>
          ))}
          {extra > 0 && (
            <View style={[styles.avatarItem, { left: 3 * 19, zIndex: 0 }]}>
              <View style={[styles.avatarImg, styles.avatarMore, { backgroundColor: palette.accent, borderColor: palette.bg }]}>
                <Text style={styles.avatarMoreText}>+{extra}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// VENDOR CARD
// ─────────────────────────────────────────────
const VendorCard = ({ vendor, onPress }) => (
  <TouchableOpacity style={styles.vendorCard} onPress={() => onPress(vendor)} activeOpacity={0.85}>
    <View style={styles.vendorImgWrap}>
      {vendor.profile_image ? (
        <Image source={{ uri: vendor.profile_image }} style={styles.vendorImg} resizeMode="cover" />
      ) : (
        <View style={styles.vendorImgPlaceholder}>
          <Text style={styles.vendorInitial}>{vendor.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
      )}
      <View style={styles.openBadge}>
        <View style={styles.openDot} />
        <Text style={styles.openText}>Open</Text>
      </View>
    </View>
    <View style={styles.vendorInfo}>
      <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
      {vendor.location ? (
        <View style={styles.vendorLocRow}>
          <Ionicons name="location-outline" size={11} color="#9E9E9E" />
          <Text style={styles.vendorLoc} numberOfLines={1}>{vendor.location}</Text>
        </View>
      ) : null}
      {vendor.market_name ? (
        <View style={styles.vendorMktPill}>
          <Text style={styles.vendorMktText}>{vendor.market_name}</Text>
        </View>
      ) : null}
      {vendor.products?.length > 0 ? (
        <Text style={styles.vendorProds}>
          {vendor.products.length} product{vendor.products.length !== 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// PRODUCT CARD (deal style, used in grid)
// ─────────────────────────────────────────────
const ProductCard = ({ product, onPress, onAddToCart, isAdding, isInCart }) => {
  const imageUri = product.image || product.images?.[0];
  const vendorInfo = product.vendor.market_name || product.vendor.location;
  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(product)} activeOpacity={0.85}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.productImg} resizeMode="cover" />
      ) : (
        <View style={styles.productImgPlaceholder}>
          <Ionicons name="image-outline" size={28} color="#C8E6C9" />
        </View>
      )}
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          {product.unit ? <Text style={styles.productUnit}>{product.unit}</Text> : null}
          
          
        </View>
         {/*{vendorInfo && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={10} color="#1fa326" />
                <Text style={[styles.productUnit1, { marginLeft: 2 }]} numberOfLines={1}>
                  {vendorInfo}
                </Text>
              </View>
            </>
          )}*/}
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>GH₵ {product.price?.toFixed(2)}</Text>
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
// MAIN HOME SCREEN
// ─────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartCount, cartItems } = useCart();
  const { notifications } = useContext(NotificationContext);

  // Data
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marketsMap, setMarketsMap] = useState({});   // keyed by market _id
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchProducts, setSearchProducts] = useState([]);
  const [searchVendors, setSearchVendors] = useState([]);
  const [searchMarkets, setSearchMarkets] = useState([]);
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
      await Promise.all([loadProductData(), loadVendorData()]);
    } catch (err) {
      console.error('HomeScreen load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProductData = async () => {
    try {
      const categoriesRes = await productService.getCategories();
      if (categoriesRes.success) setCategories(categoriesRes.data.slice(0, 8));

      const [featuredRes, bestRes,newRes] = await Promise.all([
        productService.getProductByTag('featured'),
        productService.getProductByTag('best_selling'),
        productService.getProductByTag('new_arrival'),
      ]);
      if (featuredRes.status === 200) setFeaturedProducts(featuredRes.data.data || []);
      if (bestRes.status === 200) setBestSellers(bestRes.data.data || []);
      if (newRes.status === 200) setNewArrivals(newRes.data.data);
    } catch (err) {
      console.error('Product data error:', err);
    }
  };

  const loadVendorData = async () => {
    try {
      const [marketsRes, vendorsRes] = await Promise.all([
        getVendorsByMarket(),
        getVendors(),
      ]);

      if (marketsRes?.data?.success) {
        // Build a lookup map by market name for O(1) access in render
        const map = {};
        (marketsRes.data.data || []).forEach(m => { map[m._id] = m; });
        setMarketsMap(map);
      }

      if (vendorsRes?.data?.success) {
        const vendors = vendorsRes.data.data || [];
        setFeaturedVendors(vendors.slice(0, 8));
        setAllVendors(vendors);
      }
    } catch (err) {
      console.error('Vendor data error:', err);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadHomeData(); }, []);

  // ── SEARCH ───────────────────────────────────
  const performSearch = async () => {
    setSearching(true);
    const q = searchQuery.trim().toLowerCase();
    try {
      const res = await productService.getProducts({ search: q, limit: 5 });
      if (res.success) setSearchProducts(res.data || []);
    } catch { /* silent */ }

    setSearchVendors(allVendors.filter(v =>
      v.name?.toLowerCase().includes(q) ||
      v.market_name?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q)
    ).slice(0, 3));

    setSearchMarkets(ALL_MARKETS.filter(m =>
      m.id.toLowerCase().includes(q) && marketsMap[m.id]
    ).slice(0, 3));

    setShowSearchResults(true);
    setSearching(false);
  };

  const clearSearchResults = () => {
    setSearchProducts([]);
    setSearchVendors([]);
    setSearchMarkets([]);
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
    const item = cartItems.find(i => i.product?._id === productId || i.productId === productId);
    return item?.quantity ?? 0;
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    const stock = product.stock ?? product.countInStock ?? 0;
    if (stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
      return;
    }
    try {
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      await addToCart(product.id || product._id, 1);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2000);
    } catch {
      Alert.alert('Error', 'Failed to add item to cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  // ── HELPERS ───────────────────────────────────
  const getCategoryIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('fruit')) return CATEGORY_ICONS.fruits;
    if (n.includes('vegetable') || n.includes('veggie')) return CATEGORY_ICONS.vegetables;
    if (n.includes('dairy') || n.includes('milk')) return CATEGORY_ICONS.dairy;
    if (n.includes('meat') || n.includes('chicken')) return CATEGORY_ICONS.meat;
    if (n.includes('seafood') || n.includes('fish')) return CATEGORY_ICONS.seafood;
    if (n.includes('bakery') || n.includes('bread')) return CATEGORY_ICONS.bakery;
    if (n.includes('beverage') || n.includes('drink')) return CATEGORY_ICONS.beverages;
    if (n.includes('staple')) return CATEGORY_ICONS.staples;
    if (n.includes('herb') || n.includes('spice')) return CATEGORY_ICONS.herb;
    if (n.includes('tuber') || n.includes('potato')) return CATEGORY_ICONS.tuber;
    if (n.includes('organic')) return CATEGORY_ICONS.organic;
    if (n.includes('snack')) return CATEGORY_ICONS.snacks;
    return CATEGORY_ICONS.default;
  };

  const handleSlidePress = (slide) => {
    const { screen, params } = slide.nav;
    navigation.navigate(screen, params);
  };

  const handleMarketPress = (market) => {
    navigation.navigate('MarketDetail', { marketName: market._id });
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

      {/* Cart success modal */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={52} color="#2E7D32" />
            <Text style={styles.successTitle}>Added to cart!</Text>
            <Text style={styles.successMessage}>{addedProductName} has been added to your cart</Text>
            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={() => { setModalVisible(false); navigation.navigate('Cart'); }}
            >
              <Text style={styles.viewCartBtnText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
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
        {/* ══════════════════════════════════════
            HEADER
            ══════════════════════════════════════ */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerGreeting}>
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
              </Text>
              <Text style={styles.headerTitle}>CediMart</Text>
              <View style={styles.locationPill}>
                <View style={styles.locationDot} />
                <Text style={styles.locationText}>Accra, Ghana</Text>
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

          {/* Search */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={17} color="#9E9E9E" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products, vendors, markets…"
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

            {/* Search results dropdown */}
            {showSearchResults && (
              <>
                <TouchableWithoutFeedback onPress={() => setShowSearchResults(false)}>
                  <View style={styles.searchBackdrop} />
                </TouchableWithoutFeedback>
                <View style={styles.searchDropdown}>
                  <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {searchProducts.length > 0 && (
                      <View style={styles.searchSection}>
                        <Text style={styles.searchSectionLabel}>Products</Text>
                        {searchProducts.map(p => (
                          <TouchableOpacity
                            key={p.id || p._id}
                            style={styles.searchRow}
                            onPress={() => { navigation.navigate('ProductDetail', { productId: p.id || p._id, product: p }); clearSearch(); }}
                          >
                            <Image source={{ uri: p.image || p.images?.[0] }} style={styles.searchThumb} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchRowName} numberOfLines={1}>{p.name}</Text>
                              <Text style={styles.searchRowSub}>GH₵ {p.price?.toFixed(2)}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {searchVendors.length > 0 && (
                      <View style={styles.searchSection}>
                        <Text style={styles.searchSectionLabel}>Vendors</Text>
                        {searchVendors.map(v => (
                          <TouchableOpacity
                            key={v._id}
                            style={styles.searchRow}
                            onPress={() => { navigation.navigate('VendorDetail', { vendorId: v._id, vendor: v }); clearSearch(); }}
                          >
                            <View style={styles.searchVendorAvatar}>
                              <Text style={styles.searchVendorInitial}>{v.name?.[0]?.toUpperCase() || '?'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchRowName} numberOfLines={1}>{v.name}</Text>
                              <Text style={styles.searchRowSub}>{v.market_name}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {searchMarkets.length > 0 && (
                      <View style={styles.searchSection}>
                        <Text style={styles.searchSectionLabel}>Markets</Text>
                        {searchMarkets.map(m => (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.searchRow}
                            onPress={() => { navigation.navigate('MarketDetail', { marketName: m.id }); clearSearch(); }}
                          >
                            <View style={styles.searchMarketIcon}>
                              <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchRowName}>{m.id}</Text>
                              <Text style={styles.searchRowSub}>{marketsMap[m.id]?.count ?? 0} vendors</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {searchProducts.length === 0 && searchVendors.length === 0 && searchMarkets.length === 0 && !searching && (
                      <View style={styles.noResults}>
                        <Ionicons name="search-outline" size={36} color="#C8E6C9" />
                        <Text style={styles.noResultsTitle}>No results</Text>
                        <Text style={styles.noResultsSub}>Try a different keyword</Text>
                      </View>
                    )}

                    {(searchProducts.length > 0 || searchVendors.length > 0 || searchMarkets.length > 0) && (
                      <TouchableOpacity style={styles.viewAllRow} onPress={handleSearchSubmit}>
                        <Text style={styles.viewAllText}>View all results for "{searchQuery}"</Text>
                        <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════
            HERO CAROUSEL
            ══════════════════════════════════════ */}
        <View style={styles.carouselSection}>
          <HeroCarousel onSlidePress={handleSlidePress} />
        </View>

        {/* ══════════════════════════════════════
            MARKETS IN ACCRA
            All 8 always shown; no vendors = "Soon"
            ══════════════════════════════════════ 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location-sharp" size={16} color="#2E7D32" />
                <Text style={styles.sectionTitle}>Markets you can shop from</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                {Object.keys(marketsMap).length} of {ALL_MARKETS.length} markets active
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Vendors')} style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
            </TouchableOpacity>
          </View>


         {/* MARKETS IN ACCRA – horizontal scroll 
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marketsScrollContent}
          >
            {ALL_MARKETS.map(config => (
              <MarketGridCard
                key={config.id}
                config={config}
                liveData={marketsMap[config.id] || null}
                onPress={handleMarketPress}
              />
            ))}
           
            <TouchableOpacity
              style={styles.marketSeeAllCard}
              onPress={() => navigation.navigate('Vendors')}
              activeOpacity={0.85}
            >
              <View style={styles.marketSeeAllIcon}>
                <Ionicons name="location-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.marketSeeAllText}>All Markets</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </View>  */}

        {/* ══════════════════════════════════════
            FEATURED VENDORS
            ══════════════════════════════════════ 
        {featuredVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Featured Vendors</Text>
                <Text style={styles.sectionSubtitle}>Top sellers from Accra markets</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Vendors')} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredVendors.map(v => (
                <VendorCard
                  key={v._id}
                  vendor={v}
                  onPress={(vendor) => navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor })}
                />
              ))}
            </ScrollView>
          </View>
        )}*/}

        {/* ══════════════════════════════════════
            SHOP BY CATEGORY
            ══════════════════════════════════════ */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id || cat._id}
                  style={styles.categoryPill}
                  onPress={() => navigation.navigate('Category', { category: cat.name })}
                >
                  <View style={styles.categoryIconCircle}>
                    <Text style={styles.categoryEmoji}>{getCategoryIcon(cat.name)}</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ══════════════════════════════════════
            FEATURED PRODUCTS
            ══════════════════════════════════════ */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products', { tag: 'featured' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {featuredProducts.slice(0, 6).map(p => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  onPress={(prod) => navigation.navigate('ProductDetail', { productId: prod.id || prod._id, product: prod })}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === (p.id || p._id)}
                  isInCart={getQtyInCart(p.id || p._id) > 0}
                />
              ))}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════
            POPULAR DEALS (best sellers horizontal)
            ══════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Deals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products', { sortBy: 'stock-desc' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {bestSellers.map(p => (
                <TouchableOpacity
                  key={p.id || p._id}
                  style={styles.dealCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: p.id || p._id, product: p })}
                  activeOpacity={0.85}
                >
                  {(p.image || p.images?.[0]) ? (
                    <Image source={{ uri: p.image || p.images[0] }} style={styles.dealImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.dealImgPlaceholder} />
                  )}
                  <View style={styles.dealOverlay}>
                    <Text style={styles.dealName} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.dealBottom}>
                      <Text style={styles.dealPrice}>GH₵ {p.price?.toFixed(2)}</Text>
                      <TouchableOpacity
                        style={[styles.dealAddBtn, getQtyInCart(p.id || p._id) > 0 && styles.dealAddBtnActive]}
                        onPress={() => handleAddToCart(p)}
                        disabled={addingProductId === (p.id || p._id)}
                      >
                        {addingProductId === (p.id || p._id)
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name={getQtyInCart(p.id || p._id) > 0 ? 'checkmark' : 'add'} size={16} color="#fff" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}



        {/* ── NEW ARRIVALS ── */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products', { tag: 'featured' })} style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {newArrivals.slice(0, 6).map(p => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  onPress={(prod) => navigation.navigate('ProductDetail', { productId: prod.id || prod._id, product: prod })}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === (p.id || p._id)}
                  isInCart={getQtyInCart(p.id || p._id) > 0}
                />
              ))}
            </View>
          </View>
        )}



        {/* ══════════════════════════════════════
            FREE DELIVERY BANNER
            ══════════════════════════════════════ */}
        <View style={styles.bannerSection}>
          <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={() => navigation.navigate('Products')}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerTag}>
                <Ionicons name="flash" size={11} color="#fff" />
                <Text style={styles.bannerTagText}>SPECIAL OFFER</Text>
              </View>
              <Text style={styles.bannerTitle}>Free Delivery</Text>
              <Text style={styles.bannerSub}>On orders over GH₵ 500 from any Accra market</Text>
              <View style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={13} color="#2E7D32" />
              </View>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1601600571002-6e1e0c6e3d6f?w=400' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

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
    borderTopRightRadius:12,
    borderTopLeftRadius:12,
    backgroundColor: '#1B5E20',
    marginHorizontal:4,
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
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#69F0AE',
  },
  locationText: {
    fontSize: 11,
    color: '#E8F5E9',
    fontWeight: '500',
  },
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
  searchThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E8F5E9' },
  searchRowName: { fontSize: 13, fontWeight: '600', color: '#1B2714' },
  searchRowSub: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  searchVendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchVendorInitial: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  searchMarketIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
  slideWrapper: { height: 186, position: 'relative', backgroundColor: '#1B5E20' },
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

  // ── Section ──
  section: { backgroundColor: '#FFFFFF', marginTop: 10, paddingTop: 18, paddingBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1B2714' },
  sectionSubtitle: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  // ── Markets grid ──
  marketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  marketCard: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  marketCardSoon: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    opacity: 0.65,
  },
  marketCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marketIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketIcon: { fontSize: 18 },
  vendorCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  vendorCountDot: { width: 5, height: 5, borderRadius: 3 },
  vendorCountText: { fontSize: 9, fontWeight: '700' },
  comingSoonChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  comingSoonChipText: { fontSize: 9, fontWeight: '700', color: '#9E9E9E' },
  marketName: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  marketNameSoon: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', lineHeight: 18 },
  marketNoVendors: { fontSize: 10, color: '#BDBDBD' },
  avatarStack: { flexDirection: 'row', height: 26, position: 'relative' },
  avatarItem: { position: 'absolute', top: 0 },
  avatarImg: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 9, fontWeight: '800', color: '#fff' },
  avatarMore: { justifyContent: 'center', alignItems: 'center' },
  avatarMoreText: { fontSize: 8, fontWeight: '800', color: '#fff' },

  // ── Vendor card ──
  horizontalScroll: { paddingHorizontal: 16, gap: 12 },
  vendorCard: {
    width: 136,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  vendorImgWrap: { position: 'relative' },
  vendorImg: { width: '100%', height: 100 },
  vendorImgPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInitial: { fontSize: 30, fontWeight: '800', color: '#2E7D32' },
  openBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  openDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#69F0AE' },
  openText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  vendorInfo: { padding: 10 },
  vendorName: { fontSize: 13, fontWeight: '700', color: '#1B2714', marginBottom: 4 },
  vendorLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 },
  vendorLoc: { fontSize: 11, color: '#9E9E9E', flex: 1 },
  vendorMktPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  vendorMktText: { fontSize: 10, fontWeight: '600', color: '#2E7D32' },
  vendorProds: { fontSize: 10, color: '#9E9E9E' },

  // ── Category ──
  categoryScroll: { paddingHorizontal: 16, gap: 10 },
  categoryPill: { alignItems: 'center', width: 70 },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  categoryEmoji: { fontSize: 24 },
  categoryName: { fontSize: 11, fontWeight: '600', color: '#424242', textAlign: 'center' },

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
  productImg: { width: '100%', height: 110 },
  productImgPlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: '#1B2714', marginBottom: 3, lineHeight: 17 },
  productUnit: { fontSize: 11, color: '#9E9E9E', marginBottom: 8 },
  productUnit1: { fontSize: 11, color: '#1fa326', marginBottom: 8 },
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

  // ── Deal card (horizontal) ──
  dealCard: {
    width: 158,
    height: 185,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  dealImg: { width: '100%', height: '100%', position: 'absolute' },
  dealImgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#C8E6C9' },
  dealOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  dealName: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 6 },
  dealBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealPrice: { fontSize: 14, fontWeight: '800', color: '#A5D6A7' },
  dealAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealAddBtnActive: { backgroundColor: '#1B5E20' },

  // ── Banner ──
  bannerSection: { paddingHorizontal: 16, marginTop: 10 },
  banner: {
    backgroundColor: '#1B5E20',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 140,
  },
  bannerLeft: { flex: 1, padding: 18, justifyContent: 'center' },
  bannerTag: {
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
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 12, color: '#A5D6A7', marginBottom: 14, lineHeight: 16 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerBtnText: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  bannerImage: { width: '38%', opacity: 0.22 },

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
  marketsScrollContent: {
  paddingLeft: 16,
  paddingRight: 16,
  gap: 10,
},
// Modify the marketCard to have a fixed width (instead of (width-42)/2)
marketCard: {
  width: 158,             // fixed width for horizontal scroll
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  gap: 8,
},
marketSeeAllCard: {
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
marketSeeAllIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#E8F5E9',
  justifyContent: 'center',
  alignItems: 'center',
},
marketSeeAllText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#2E7D32',
  textAlign: 'center',
  lineHeight: 17,
},
});

export default HomeScreen;