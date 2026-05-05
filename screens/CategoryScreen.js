// src/screens/main/CategoryScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductsByCategory } from '../apis/productApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─── Category images ──────────────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  vegetables: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  fruits: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
  staples: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770886305/staple_food_xlgo92.jpg',
  herb: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885919/spices_and_herbs_srdlvf.jpg',
  tuber: 'https://res.cloudinary.com/duv3qvvjz/image/upload/fresh-potato-kitchen-ready-be-cooked_jndkde.jpg',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  beverages: 'https://images.unsplash.com/photo-1543255255-b03b8f7a6d39?w=800&q=80',
  organic: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
  default: 'https://res.cloudinary.com/duv3qvvjz/image/upload/grains_iijbmq.jpg',
};

// ─── Cart Toast (same pattern as ProductsScreen) ──────────────────────────────
const CartToast = ({ visible, productName }) => {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[styles.toastWrap, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        <View style={styles.toastIcon}>
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
        <Text style={styles.toastText} numberOfLines={1}>
          <Text style={styles.toastBold}>{productName}</Text> added to cart
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ value, label, color = '#1B5E20' }) => (
  <View style={styles.statPill}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category: routeCategory, categoryName } = route.params || {};
  const { token, isAuthenticated } = useAuth();
  const { addToCart, updateQuantity, removeFromCart, cartItems } = useCart();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [showSortModal, setShowSortModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const searchInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const heroScaleAnim = useRef(new Animated.Value(1.05)).current;

  const sortOptions = [
    { id: 'name', label: 'Name A–Z', icon: 'text-outline' },
    { id: 'price-asc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
    { id: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
    { id: 'stock-desc', label: 'Most in Stock', icon: 'trending-up-outline' },
  ];

  useEffect(() => {
    Animated.spring(heroScaleAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  useEffect(() => {
    if (routeCategory) loadCategoryProducts();
  }, [routeCategory, sortBy]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const getCategoryImage = (key) => {
    const k = key?.toLowerCase() || 'default';
    return CATEGORY_IMAGES[k] || CATEGORY_IMAGES.default;
  };

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductsByCategory(routeCategory, { sort: sortBy, limit: 100 }, token);
      if (response.status === 200) {
        const data = response.data.data || [];
        setProducts(data);
        setFilteredProducts(data);
        setCategory(response.category);
        setStats(response.stats);
      } else {
        Alert.alert('Error', response.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading category products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const q = searchQuery.toLowerCase().trim();
    setFilteredProducts(
      products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q) ||
        p.unitDisplay?.toLowerCase().includes(q) ||
        p.priceDisplay?.toLowerCase().includes(q) ||
        p.price?.toString().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q)
      )
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      const trimmed = text.trim();
      if (!recentSearches.includes(trimmed.toLowerCase())) {
        setRecentSearches(prev => [trimmed, ...prev.slice(0, 4)]);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setFilteredProducts(products);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategoryProducts();
    clearSearch();
  }, [routeCategory, sortBy]);

  const getQuantityInCart = (productId) => {
    const item = cartItems.find(i => i.product?._id === productId || i.productId === productId);
    return item ? item.quantity : 0;
  };

  const showToast = (name) => {
    setAddedProductName(name);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2200);
  };

  const handleAddToCart = async (product) => {
    if (!product.inStock || product.countInStock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    setAddingProductId(product.id);
    try {
      await addToCart(product.id, 1);
      showToast(product.name);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleQuantityUpdate = async (product, action) => {
    const productId = product.id;
    const currentQty = getQuantityInCart(productId);
    try {
      if (action === 'increase') {
        const stock = product.stock || product.countInStock;
        if (currentQty >= stock) { Alert.alert('Stock Limit', `Only ${stock} units available.`); return; }
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
      } else if (action === 'decrease' && currentQty > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, currentQty - 1);
      } else if (action === 'decrease' && currentQty === 1) {
        Alert.alert('Remove Item?', `Remove ${product.name} from cart?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove', style: 'destructive',
            onPress: async () => {
              setUpdatingProductId(productId);
              await removeFromCart(productId);
              setUpdatingProductId(null);
            },
          },
        ]);
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const displayName = category?.displayName || categoryName || routeCategory || '';

  // ── PRODUCT CARD ────────────────────────────────────────────────────────────
  const renderProductItem = ({ item }) => {
    const qty = getQuantityInCart(item.id);
    const isInCart = qty > 0;
    const isAdding = addingProductId === item.id;
    const isUpdating = updatingProductId === item.id;
    const busy = isAdding || isUpdating;
    const oos = !item.inStock || item.countInStock <= 0;
    const vendorInfo = item.market_name || item.location

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
        activeOpacity={0.88}
        disabled={busy}
      >
        {/* Image */}
        <View style={styles.cardImageWrap}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {oos && (
            <View style={styles.oosOverlay}>
              <Text style={styles.oosText}>Out of Stock</Text>
            </View>
          )}
          {item.isLowStock && item.inStock && (
            <View style={styles.lowStockBadge}>
              <Ionicons name="alert-circle" size={10} color="#fff" />
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cardUnit}>per {item.unitDisplay || item.unit || 'piece'}</Text>
          <Text style={styles.cardUnit1}>{vendorInfo}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>
              {item.priceDisplay || `GH₵${item.price?.toFixed(2)}`}
            </Text>

            {!isInCart ? (
              <TouchableOpacity
                style={[styles.cardAddBtn, oos && styles.cardAddBtnOos]}
                onPress={() => handleAddToCart(item)}
                disabled={busy || oos}
                activeOpacity={0.8}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyPill}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={busy}
                >
                  <Ionicons name="remove" size={13} color="#2E7D32" />
                </TouchableOpacity>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#4CAF50" style={{ width: 22 }} />
                ) : (
                  <Text style={styles.qtyNum}>{qty}</Text>
                )}
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={busy || qty >= (item.stock || item.countInStock)}
                >
                  <Ionicons name="add" size={13} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── EMPTY STATE ─────────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="search-outline" size={36} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>
        {isSearching ? 'Nothing found' : 'No Products Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSearching
          ? `No results for "${searchQuery}". Try different keywords.`
          : `There are no products in this category at the moment.`}
      </Text>
      {isSearching ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={clearSearch}>
          <Ionicons name="close-circle-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Clear Search</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Back to Categories</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (loading && !refreshing && products.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIconWrap}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
        <Text style={styles.loadingTitle}>Loading {displayName}</Text>
        <Text style={styles.loadingSubtitle}>Fetching the freshest items for you…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      {/* Toast */}
      <CartToast visible={toastVisible} productName={addedProductName} />

      {/* ── SORT MODAL ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.sortBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={styles.sortSheet}>
          <View style={styles.sortHandle} />
          <Text style={styles.sortSheetTitle}>Sort by</Text>
          {sortOptions.map((opt) => {
            const active = sortBy === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortRow, active && styles.sortRowActive]}
                onPress={() => { setSortBy(opt.id); setShowSortModal(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.sortRowIcon, active && styles.sortRowIconActive]}>
                  <Ionicons name={opt.icon} size={16} color={active ? '#fff' : '#666'} />
                </View>
                <Text style={[styles.sortRowText, active && styles.sortRowTextActive]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 24 }} />
        </View>
      </Modal>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        extraData={[isSearching, searchQuery, cartItems]}
        ListHeaderComponent={
          <>
            {/* ══════════════════════════════
                HERO
                ══════════════════════════════ */}
            <View style={styles.heroWrap}>
              <Animated.Image
                source={{ uri: getCategoryImage(routeCategory) }}
                style={[styles.heroImage, { transform: [{ scale: heroScaleAnim }] }]}
                resizeMode="cover"
              />
              {/* Two-layer scrim (no LinearGradient) */}
              <View style={styles.heroScrimTop} />
              <View style={styles.heroScrimBottom} />

              {/* Nav */}
              <View style={styles.heroNav}>
                <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.heroTitleWrap}>
                  <Text style={styles.heroTitle}>{displayName}</Text>
                  {!loading && stats && (
                    <Text style={styles.heroCount}>{stats.total} products</Text>
                  )}
                </View>
                <View style={styles.heroNavRight}>
                  <TouchableOpacity
                    style={styles.heroIconBtn}
                    onPress={() => setShowSortModal(true)}
                  >
                    <Ionicons name="swap-vertical-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.heroIconBtn, { marginLeft: 8 }]}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
                  >
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search bar floating at hero bottom */}
              <View style={styles.heroSearchWrap}>
                {showSearch ? (
                  <View style={styles.heroSearchActive}>
                    <Ionicons name="search-outline" size={17} color="#4CAF50" style={{ marginLeft: 14 }} />
                    <TextInput
                      ref={searchInputRef}
                      style={styles.heroSearchInput}
                      placeholder={`Search in ${displayName}…`}
                      placeholderTextColor="#9E9E9E"
                      value={searchQuery}
                      onChangeText={handleSearch}
                      autoCapitalize="none"
                      returnKeyType="search"
                      autoFocus
                    />
                    {searchQuery ? (
                      <TouchableOpacity onPress={clearSearch} style={{ padding: 8 }}>
                        <Ionicons name="close-circle" size={18} color="#BDBDBD" />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={styles.heroSearchCloseBtn}
                      onPress={() => { setShowSearch(false); clearSearch(); }}
                    >
                      <Text style={styles.heroSearchCloseTxt}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.heroSearchInactive}
                    onPress={() => setShowSearch(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="search-outline" size={17} color="#9E9E9E" style={{ marginRight: 8 }} />
                    <Text style={styles.heroSearchPlaceholder}>
                      Search in {displayName}…
                    </Text>
                    <View style={styles.heroSearchMic}>
                      <Ionicons name="mic-outline" size={15} color="#4CAF50" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ══════════════════════════════
                STATS BAR
                ══════════════════════════════ */}
            {stats && (
              <View style={styles.statsBar}>
                <StatPill value={stats.total} label="Products" color="#1B5E20" />
                <View style={styles.statsDivider} />
                <StatPill value={stats.inStock} label="In Stock" color="#4CAF50" />
                <View style={styles.statsDivider} />
                <StatPill value={stats.lowStock} label="Low Stock" color="#FF9800" />
                {stats.priceRange && (
                  <>
                    <View style={styles.statsDivider} />
                    <StatPill
                      value={`GH₵${Math.round(stats.priceRange.min)}`}
                      label="From"
                      color="#2E7D32"
                    />
                  </>
                )}
              </View>
            )}

            {/* ══════════════════════════════
                SEARCH RESULTS / RECENT SEARCHES
                ══════════════════════════════ */}
            {isSearching && (
              <View style={styles.searchResultBanner}>
                <Ionicons name="search" size={14} color="#4CAF50" />
                <Text style={styles.searchResultText}>
                  {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for{' '}
                  <Text style={styles.searchResultQuery}>"{searchQuery}"</Text>
                </Text>
                <TouchableOpacity onPress={clearSearch} style={styles.searchResultClear}>
                  <Ionicons name="close-circle" size={16} color="#9E9E9E" />
                </TouchableOpacity>
              </View>
            )}

            {showSearch && recentSearches.length > 0 && !searchQuery && (
              <View style={styles.recentWrap}>
                <Text style={styles.recentTitle}>Recent Searches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {recentSearches.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.recentChip}
                      onPress={() => handleSearch(s)}
                    >
                      <Ionicons name="time-outline" size={13} color="#2E7D32" />
                      <Text style={styles.recentChipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Toolbar */}
            <View style={styles.toolbar}>
              <Text style={styles.toolbarCount}>
                {loading ? 'Loading…' : `${filteredProducts.length} of ${stats?.total || products.length} products`}
              </Text>
              <TouchableOpacity
                style={styles.toolbarSortBtn}
                onPress={() => setShowSortModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-vertical-outline" size={14} color="#2E7D32" />
                <Text style={styles.toolbarSortText}>
                  {sortOptions.find(s => s.id === sortBy)?.label.split(':')[0].trim() || 'Sort'}
                </Text>
                <Ionicons name="chevron-down" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  listContent: { paddingBottom: 20 },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 2,
  },

  // ── LOADING ──────────────────────────────────────────────────────────────────
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F7F9F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 6,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },

  // ── HERO ─────────────────────────────────────────────────────────────────────
  heroWrap: {
    height: 260,
    overflow: 'hidden',
    backgroundColor: '#1B5E20',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  heroScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  heroSearchWrap: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
  },
  heroSearchInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  heroSearchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#BDBDBD',
  },
  heroSearchMic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSearchActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  heroSearchCloseBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  heroSearchCloseTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── STATS BAR ─────────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statPill: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  statsDivider: { width: 1, height: 30, backgroundColor: '#F0F0F0' },

  // ── SEARCH RESULT BANNER ──────────────────────────────────────────────────────
  searchResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  searchResultText: { flex: 1, fontSize: 13, color: '#555', fontWeight: '500' },
  searchResultQuery: { color: '#2E7D32', fontWeight: '700' },
  searchResultClear: { padding: 2 },

  // ── RECENT SEARCHES ───────────────────────────────────────────────────────────
  recentWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentTitle: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 5,
  },
  recentChipText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // ── TOOLBAR ───────────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  toolbarSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  toolbarSortText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // ── PRODUCT CARD ──────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageWrap: {
    height: 148,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  cardImage: { width: '100%', height: '100%' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 12, paddingTop: 10 },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
   // marginBottom: 1,
    lineHeight: 15,
    minHeight: 36,
  },
  //#4CAF50
  cardUnit: { fontSize: 11, color: '#BDBDBD', marginBottom: 5, fontWeight: '500' },
  cardUnit1: { fontSize: 11, color: '#4CAF50', marginBottom: 10, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20' },
  cardAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  cardAddBtnOos: { backgroundColor: '#BDBDBD', shadowOpacity: 0 },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    gap: 2,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    minWidth: 22,
    textAlign: 'center',
  },

  // ── EMPTY STATE ───────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── SORT SHEET ────────────────────────────────────────────────────────────────
  sortBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sortSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  sortHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sortSheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 16 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  sortRowActive: { backgroundColor: '#F1F8E9' },
  sortRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortRowIconActive: { backgroundColor: '#4CAF50' },
  sortRowText: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  sortRowTextActive: { color: '#2E7D32', fontWeight: '700' },

  // ── TOAST ─────────────────────────────────────────────────────────────────────
  toastWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingTop: 54,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: width - 60,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 },
  toastBold: { fontWeight: '700', color: '#fff' },
});

export default CategoryScreen;