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
import ShopFAB from '../components/ShopFAB'
import ProductHeroCarousel from '../components/ProductHeroCarousel';
import {CATEGORY_CONFIG,CONDITION_LABELS,ALL_CAMPUSES} from '../data/General'
import RecommendEarnBanner from '../components/RecommendEarnNotice'
import {ProductGridSkeleton} from '../components/SkeletonLoader'

const { width } = Dimensions.get('window');

// ─── Category sections to display ─────────────────────────────────────────────
const FEATURED_CATEGORIES = [
  { key: 'fashion', label: 'Fashion', icon: '👗', color: '#E91E63' },
  { key: 'computers and laptops', label: 'Computers & Laptops', icon: '💻', color: '#2196F3' },
  { key: 'phones and tablets', label: 'Phones & Tablets', icon: '📱', color: '#0D9488' },
  { key: 'beauty and grooming', label: 'Beauty & Grooming', icon: '💄', color: '#9C27B0' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonProductCard = () => (
  <View style={styles.productCard}>
    <View style={[styles.productImgWrap, { backgroundColor: '#E8E8E8' }]} />
    <View style={styles.productBody}>
      <View style={{ height: 13, backgroundColor: '#E8E8E8', borderRadius: 4, width: '80%', marginBottom: 8 }} />
      <View style={{ height: 11, backgroundColor: '#E8E8E8', borderRadius: 3, width: '50%', marginBottom: 6 }} />
      <View style={{ height: 16, backgroundColor: '#E8E8E8', borderRadius: 4, width: '60%', marginTop: 4 }} />
    </View>
  </View>
);

const SkeletonCategorySection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View>
        <View style={{ height: 16, backgroundColor: '#E8E8E8', borderRadius: 4, width: 140, marginBottom: 4 }} />
        <View style={{ height: 11, backgroundColor: '#E8E8E8', borderRadius: 3, width: 80 }} />
      </View>
    </View>
    <View style={styles.productsGrid}>
      {[1, 2, 3, 4, 5, 6].map(i => <SkeletonProductCard key={i} />)}
    </View>
  </View>
);

// ─── Condition Badge ──────────────────────────────────────────────────────────
const ConditionBadge = ({ condition }) => {
  const cfg = CONDITION_LABELS[condition] || { label: condition, color: '#616161', bg: '#F5F5F5' };
  return (
    <View style={[styles.conditionBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.conditionBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onPress, onAddToCart, isAdding, isInCart }) => {
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
            <View><Text style={styles.productPrice}>GH₵ {currentPrice.toFixed(2)}</Text></View>
          )}
          <TouchableOpacity
            style={[styles.addBtn, isInCart && styles.addBtnActive]}
            onPress={() => onAddToCart(product)}
            disabled={isAdding}
          >
            {isAdding ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={isInCart ? 'checkmark' : 'add'} size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Deal Card ────────────────────────────────────────────────────────────────
const DealCard = ({ product, onPress, onAddToCart, isAdding, isInCart }) => {
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
              {originalPrice && <Text style={styles.dealOriginalPrice}>GH₵ {originalPrice.toFixed(2)}</Text>}
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
            {isAdding ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={isInCart ? 'checkmark' : 'add'} size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Stats Banner ─────────────────────────────────────────────────────────────
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

// ─── Category Product Section ─────────────────────────────────────────────────
const CategoryProductSection = ({ category, products, loading, onProductPress, onAddToCart, addingProductId, getQtyInCart, onSeeAll }) => {
  if (loading) return <SkeletonCategorySection />;
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
          <ProductCard
            key={p._id}
            product={p}
            onPress={onProductPress}
            onAddToCart={onAddToCart}
            isAdding={addingProductId === p._id}
            isInCart={getQtyInCart(p._id) > 0}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Main Home Screen ─────────────────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartCount, cartItems } = useCart();
  const { notifications } = useContext(NotificationContext);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [urgentSales, setUrgentSales] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [studentFavorites, setStudentFavorites] = useState([]);
  const [campusStats, setCampusStats] = useState({});
  const [platformStats, setPlatformStats] = useState(null);

  // Category products
  const [categoryProducts, setCategoryProducts] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const {totalUnread} = useChat();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  useEffect(() => { loadHomeData(); }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (searchQuery.trim().length > 1) performSearch(); else clearSearchResults(); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadHomeData = async () => {
    try { setLoading(true); await Promise.all([loadProductData(), loadStatsData(), loadCategoryProducts()]); }
    catch (err) { console.error('HomeScreen load error:', err); }
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

  const loadCategoryProducts = async () => {
    const initialLoading = {};
    FEATURED_CATEGORIES.forEach(cat => { initialLoading[cat.key] = true; });
    setCategoryLoading(initialLoading);

    const results = await Promise.all(
      FEATURED_CATEGORIES.map(async (cat) => {
        try {
          const res = await productService.getProductsByCategory(cat.key, { limit: 6, sort: 'newest' });
          return { key: cat.key, products: res?.data?.data || res?.data?.products || res?.data || [] };
        } catch (err) { return { key: cat.key, products: [] }; }
      })
    );

    const productsMap = {};
    const loadingMap = {};
    results.forEach(({ key, products }) => { productsMap[key] = products; loadingMap[key] = false; });
    setCategoryProducts(productsMap);
    setCategoryLoading(loadingMap);
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

  const performSearch = async () => { /* ... same as before ... */ };
  const clearSearchResults = () => { setSearchResults([]); setShowSearchResults(false); };
  const clearSearch = () => { setSearchQuery(''); clearSearchResults(); };
  const handleSearchSubmit = () => { if (searchQuery.trim()) { navigation.navigate('Products', { search: searchQuery }); clearSearch(); } };

  const getQtyInCart = (productId) => { const item = cartItems?.find(i => i.product?._id === productId || i.productId === productId); return item?.quantity ?? 0; };

  const handleAddToCart = async (product) => { /* ... same as before ... */ };

  const handleProductPress = (product) => { navigation.navigate('ProductDetail', { productId: product._id, product }); };
  const handleCategoryPress = (category, categoryName) => { navigation.navigate('Category', { category, categoryName }); };
  const handleCategorySeeAll = (category) => {
    const catCfg = FEATURED_CATEGORIES.find(c => c.key === category);
    navigation.navigate('Category', { category, categoryName: catCfg?.label || category });
  };

  if (loading && !refreshing) {
    return (
      <ProductGridSkeleton/>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#0D9488" barStyle="light-content" />

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        {/* ... same modal ... */}
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" colors={['#2E7D32']} />}
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
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
                <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={24} color="#3a3b3a" />
                {unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Inbox')}>
                <Ionicons name="mail-outline" size={24} color="#3a3b3a" />
                {totalUnread > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{totalUnread > 9 ? '9+' : totalUnread}</Text></View>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
              <TextInput style={styles.searchInput} placeholder="Search products, categories…" placeholderTextColor="#BDBDBD" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearchSubmit} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
              {searching ? <ActivityIndicator size="small" color="#0D9488" /> : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={17} color="#BDBDBD" /></TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearchSubmit} activeOpacity={0.8}><Ionicons name="search-outline" size={16} color="#FFFFFF" /></TouchableOpacity>
              )}
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
                            {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.searchThumb} /> : (
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
                      <View style={styles.noResults}><Ionicons name="search-outline" size={36} color="#C8E6C9" /><Text style={styles.noResultsTitle}>No results</Text><Text style={styles.noResultsSub}>Try a different keyword</Text></View>
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

        {/* PRODUCT HERO CAROUSEL */}
        <View style={styles.carouselSection}>
          <ProductHeroCarousel
            products={featuredProducts.slice(0, 6)}
            onProductPress={handleProductPress}
          />
        </View>

        {/* STATS BANNER */}
        {platformStats && <StatsBanner stats={platformStats} />}

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity key={key} style={styles.categoryPill} onPress={() => handleCategoryPress(key, cfg.label)} activeOpacity={0.8}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cfg.color, borderColor: cfg.color }]}><Ionicons style={styles.categoryEmoji} name ={cfg.icon}  size={14}/></View>
                <Text style={styles.categoryName} numberOfLines={1}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/*  FASHION */}
        <CategoryProductSection
          category="fashion"
          products={categoryProducts['fashion']}
          loading={categoryLoading['fashion']}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          getQtyInCart={getQtyInCart}
          onSeeAll={handleCategorySeeAll}
        />

        {/* FEATURED */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Featured Listings</Text><Text style={styles.sectionSubtitle}>Hand-picked by our team</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'featured' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{featuredProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} onAddToCart={handleAddToCart} isAdding={addingProductId === p._id} isInCart={getQtyInCart(p._id) > 0} />)}</View>
          </View>
        )}

        {/*  COMPUTERS & LAPTOPS */}
        <CategoryProductSection
          category="computers and laptops"
          products={categoryProducts['computers and laptops']}
          loading={categoryLoading['computers and laptops']}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          getQtyInCart={getQtyInCart}
          onSeeAll={handleCategorySeeAll}
        />

        {/* URGENT SALES */}
        {urgentSales.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}><View style={styles.urgentDot} /><View><Text style={styles.sectionTitle}>Urgent Sales</Text><Text style={styles.sectionSubtitle}>Grab them before they're gone</Text></View></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'urgent-sale' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{urgentSales.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} onAddToCart={handleAddToCart} isAdding={addingProductId === p._id} isInCart={getQtyInCart(p._id) > 0} />)}</ScrollView>
          </View>
        )}

        {/*  PHONES & TABLETS */}
        <CategoryProductSection
          category="phones and tablets"
          products={categoryProducts['phones and tablets']}
          loading={categoryLoading['phones and tablets']}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          getQtyInCart={getQtyInCart}
          onSeeAll={handleCategorySeeAll}
        />

        {/* POPULAR */}
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Popular on Campus</Text><Text style={styles.sectionSubtitle}>Most viewed this week</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'popular', sort: 'popular' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{popularProducts.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} onAddToCart={handleAddToCart} isAdding={addingProductId === p._id} isInCart={getQtyInCart(p._id) > 0} />)}</View>
          </View>
        )}

        {/*  BEAUTY & GROOMING */}
        <CategoryProductSection
          category="beauty and grooming"
          products={categoryProducts['beauty and grooming']}
          loading={categoryLoading['beauty and grooming']}
          onProductPress={handleProductPress}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          getQtyInCart={getQtyInCart}
          onSeeAll={handleCategorySeeAll}
        />

        {/* NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>New Arrivals</Text><Text style={styles.sectionSubtitle}>Just listed by students</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'new-arrival', sort: 'newest' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>{newArrivals.map(p => <DealCard key={p._id} product={p} onPress={handleProductPress} onAddToCart={handleAddToCart} isAdding={addingProductId === p._id} isInCart={getQtyInCart(p._id) > 0} />)}</ScrollView>
          </View>
        )}

        {/* STUDENT FAVORITES */}
        {studentFavorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>Student Favorites</Text><Text style={styles.sectionSubtitle}>Loved by campus shoppers</Text></View>
              <TouchableOpacity onPress={() => navigation.navigate('TagProducts', { tag: 'student-favorite' })} style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><Ionicons name="chevron-forward" size={13} color="#0D9488" /></TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>{studentFavorites.slice(0, 10).map(p => <ProductCard key={p._id} product={p} onPress={handleProductPress} onAddToCart={handleAddToCart} isAdding={addingProductId === p._id} isInCart={getQtyInCart(p._id) > 0} />)}</View>
          </View>
        )}

        {/* ESCROW BANNER */}
        <View style={styles.bannerSection}>
          <TouchableOpacity style={styles.sellBanner} activeOpacity={0.9}>
            <View style={styles.sellBannerContent}>
              <View style={styles.sellBannerTag}><Ionicons name="shield-checkmark" size={11} color="#fff" /><Text style={styles.sellBannerTagText}>ENJOY SECURED TRANSACTIONS</Text></View>
              <Text style={styles.sellBannerTitle}>Your money is{'\n'}safe with us</Text>
              <Text style={styles.sellBannerSub}>We hold your payment securely until you receive your order. Sellers only get paid after you confirm delivery.</Text>
              <View style={styles.sellBannerBtn}><Text style={styles.sellBannerBtnText}>Shop with confidence</Text><Ionicons name="arrow-forward" size={13} color="#0D9488" /></View>
            </View>
            <View style={styles.sellBannerIllustration}><Text style={{ fontSize: 56 }}>🛍️</Text></View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
       <ShopFAB 
        onPress={() => navigation.navigate('Products')} 
        bottomOffset={30} // Push up if there's another FAB
      />

      <AIFAB style={{ position: 'absolute', bottom: 24, right: 16 }} />
    </SafeAreaView>
  );
};

export default HomeScreen;