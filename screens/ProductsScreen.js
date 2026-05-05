import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Image,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FullScreenLoader from '../components/FullScreenLoader';
import productService from '../services/productService';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {HERO_IMAGES} from '../data/Hero_Images';
import {ACCRA_MARKETS} from '../data/Accra_Markets'
import {CATEGORY_ICONS} from '../data/Category_Icons'

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;


// ─── Cart Added Toast ──────────────────────────────────────────────────────────
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
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        <View style={styles.toastIcon}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
        <Text style={styles.toastText} numberOfLines={1}>
          <Text style={styles.toastBold}>{productName}</Text> added to cart
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const ProductsScreen = ({ navigation, route }) => {
  const { addToCart, updateQuantity, removeFromCart, cartCount, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalProducts, setTotalProducts] = useState(0);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    inStockOnly: false,
    sortBy: 'name',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 100,
  });
  const [marketFilter, setMarketFilter] = useState('');  
  const [marketModalVisible, setMarketModalVisible] = useState(false)
  const [viewMode, setViewMode] = useState('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const searchInputRef = useRef(null);
  const fetchIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const toastTimeoutRef = useRef(null);
  const heroScaleAnim = useRef(new Animated.Value(1.05)).current;

  useEffect(() => {
    isMountedRef.current = true;
    Animated.spring(heroScaleAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category.toLowerCase());
    }
  }, [route.params?.category]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  const mapCategoryForBackend = (categoryId) => {
    if (categoryId === 'all') return undefined;
    const categoryMap = {
      vegetables: 'vegetable',
      fruits: 'fruit',
      staples: 'staple',
      herb: 'herb',
      tuber: 'tuber',
      other: 'other',
    };
    return categoryMap[categoryId] || categoryId;
  };

  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success && isMountedRef.current) setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = useCallback(async (opts = {}) => {
    const {
      reset = false,
      category = selectedCategory,
      query = searchQuery,
      filterOverrides = {},
      page = 1,
      append = false,
    } = opts;

    fetchIdRef.current += 1;
    const myFetchId = fetchIdRef.current;

    if (!append) setLoading(true);

    try {
      const backendCategory = mapCategoryForBackend(category);
      const mergedFilters = { ...filters, ...filterOverrides };
      const params = {
      category: backendCategory,
      search: query || undefined,
      ...mergedFilters,
      market: marketFilter || undefined,  
      page,
      };

      const response = await productService.getProducts(params);

      if (myFetchId !== fetchIdRef.current) return;
      if (!isMountedRef.current) return;

      if (response.success) {
        if (append) {
          setProducts(prev => [...prev, ...response.data]);
        } else {
          setProducts(response.data);
        }
        setTotalProducts(response.total || 0);
        setPagination(response.pagination || {});
      }
    } catch (error) {
      if (myFetchId !== fetchIdRef.current) return;
      console.error('Error loading products:', error);
    } finally {
      if (myFetchId !== fetchIdRef.current) return;
      if (!isMountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, filters,marketFilter]);

  useEffect(() => {
    loadCategories();
    loadProducts({ reset: true });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts({ reset: true, category: selectedCategory });
    }, 200);
    return () => clearTimeout(t);
  }, [selectedCategory]);

  useEffect(() => {
    if (!loading) {
      loadProducts({ reset: true });
    }
  }, [filters.inStockOnly, filters.sortBy, filters.minPrice, filters.maxPrice]);

   useEffect(() => {
    if (!loading) {
    loadProducts({ reset: true });
    }
   }, [marketFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts({ reset: true });
  }, [loadProducts]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2 || searchQuery.trim() === '') {
      loadProducts({ reset: true, query: searchQuery });
      setShowSearch(false);
    }
  }, [searchQuery, loadProducts]);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  const showToast = (name) => {
    setAddedProductName(name);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2200);
  };

  const handleAddToCart = async (product) => {
    if (product.stock <= 0 || product.countInStock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    try {
      setAddingProductId(product.id || product._id);
      await addToCart(product.id || product._id, 1);
      showToast(product.name);
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleQuantityUpdate = async (product, action) => {
    const productId = product.id || product._id;
    const currentQuantity = getQuantityInCart(productId);
    try {
      if (action === 'increase') {
        const availableStock = product.stock || product.countInStock;
        if (currentQuantity >= availableStock) {
          Alert.alert('Stock Limit', `Only ${availableStock} units available.`);
          return;
        }
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
      } else if (action === 'decrease' && currentQuantity > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, currentQuantity - 1);
      } else if (action === 'decrease' && currentQuantity === 1) {
        Alert.alert('Remove Item?', `Remove ${product.name} from cart?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
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
      console.error('Quantity update error:', error);
      Alert.alert('Error', 'Failed to update quantity.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const getQuantityInCart = (productId) => {
    const cartItem = cartItems.find(
      item => item.product?._id === productId || item.productId === productId,
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id || product._id, product });
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      const nextPage = filters.page + 1;
      setFilters(prev => ({ ...prev, page: nextPage }));
      loadProducts({ append: true, page: nextPage });
    }
  };

  const sortOptions = [
    { id: 'name', label: 'Name A–Z', icon: 'text-outline' },
    { id: 'name-desc', label: 'Name Z–A', icon: 'text-outline' },
    { id: 'price', label: 'Price: Low to High', icon: 'arrow-up-outline' },
    { id: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
    { id: 'newest', label: 'Newest First', icon: 'time-outline' },
    { id: 'popular', label: 'Most Popular', icon: 'trending-up-outline' },
  ];

  const handleSortSelect = (sortId) => {
    setFilters(prev => ({ ...prev, sortBy: sortId }));
    setSortModalVisible(false);
  };

  const getHeroImage = () => HERO_IMAGES[selectedCategory] || HERO_IMAGES.all;

  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Fresh Food Stuffs';
    const cat = categories.find(c => c.id === selectedCategory || c.name?.toLowerCase() === selectedCategory);
    return cat ? `Fresh ${cat.name}` : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  };

  const getCategoryNameForLoader = () => {
    if (selectedCategory === 'all') return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : selectedCategory;
  };

  const activeSortLabel = sortOptions.find(s => s.id === filters.sortBy)?.label || 'Sort';

  // ── GRID CARD ────────────────────────────────────────────────────────────────
  const renderGridCard = (item) => {
    const productId = item.id || item._id;
    const quantityInCart = getQuantityInCart(productId);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === productId;
    const isUpdating = updatingProductId === productId;
    const isLoading = isAdding || isUpdating;
    const outOfStock = item.stock <= 0 || item.countInStock <= 0;
    const vendorInfo = item.market_name || item.location;

    return (
      <TouchableOpacity
        key={productId}
        style={styles.gridCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.9}
        disabled={isLoading}
      >
        {/* Image */}
        <View style={styles.gridImageWrap}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
          {outOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
            </View>
          )}
          {/* Category chip */}
          <View style={styles.gridCatChip}>
            <Text style={styles.gridCatChipText}>
              {item.category?.charAt(0).toUpperCase() + (item.category?.slice(1) || '')}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.gridInfo}>
          <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.gridUnit}>per {item.unit || 'piece'}</Text>
          <Text style={[styles.gridUnit1, { marginLeft: 2 }]} numberOfLines={1}>
              {vendorInfo}
           </Text>
          <View style={styles.gridFooter}>
            <Text style={styles.gridPrice}>GH₵{item.price?.toFixed(2)}</Text>

            {!isInCart ? (
              <TouchableOpacity
                style={[styles.gridAddBtn, outOfStock && styles.disabledBtn]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || outOfStock}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.gridQtyPill}>
                <TouchableOpacity
                  style={styles.gridQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading}
                >
                  <Ionicons name="remove" size={13} color="#2E7D32" />
                </TouchableOpacity>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" style={{ width: 22 }} />
                ) : (
                  <Text style={styles.gridQtyNum}>{quantityInCart}</Text>
                )}
                <TouchableOpacity
                  style={styles.gridQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || quantityInCart >= (item.stock || item.countInStock)}
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

  // ── LIST ITEM ────────────────────────────────────────────────────────────────
  const renderProductListItem = ({ item }) => {
    const productId = item.id || item._id;
    const quantityInCart = getQuantityInCart(productId);
    const isInCart = quantityInCart > 0;
    const isAdding = addingProductId === productId;
    const isUpdating = updatingProductId === productId;
    const isLoading = isAdding || isUpdating;
    const outOfStock = item.stock <= 0 || item.countInStock <= 0;
    const vendorInfo = item.market_name || item.location;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.85}
        disabled={isLoading}
      >
        <View style={styles.listImageWrap}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.listImage}
            resizeMode="cover"
          />
          {outOfStock && (
            <View style={styles.listOutOfStockOverlay}>
              <Text style={styles.listOutOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listTopRow}>
            <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.listCatChip, outOfStock && styles.listCatChipOOS]}>
              <Text style={[styles.listCatText, outOfStock && styles.listCatTextOOS]}>
                {outOfStock ? 'Out of Stock' : (item.category?.charAt(0).toUpperCase() + (item.category?.slice(1) || ''))}
              </Text>
            </View>
          </View>

          <Text style={styles.listUnit}>per {item.unit || 'piece'}</Text>
           <Text style={styles.listUnit1}> {vendorInfo}</Text>

          <View style={styles.listBottomRow}>
            <Text style={styles.listPrice}>
              GH₵ {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
            </Text>

            {isInCart ? (
              <View style={styles.listQtyPill}>
                <TouchableOpacity
                  style={styles.listQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'decrease')}
                  disabled={isLoading}
                >
                  <Ionicons name="remove" size={14} color="#2E7D32" />
                </TouchableOpacity>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" style={{ width: 28 }} />
                ) : (
                  <Text style={styles.listQtyNum}>{quantityInCart}</Text>
                )}
                <TouchableOpacity
                  style={styles.listQtyBtn}
                  onPress={() => handleQuantityUpdate(item, 'increase')}
                  disabled={isLoading || quantityInCart >= (item.stock || item.countInStock)}
                >
                  <Ionicons name="add" size={14} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.listCartBtn, outOfStock && styles.listCartBtnOOS]}
                onPress={() => handleAddToCart(item)}
                disabled={isLoading || outOfStock}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name={outOfStock ? 'close-outline' : 'cart-outline'} size={14} color="#fff" />
                    <Text style={styles.listCartBtnText}>{outOfStock ? 'Unavailable' : 'Add to Cart'}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="search-outline" size={36} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>Nothing found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : selectedCategory !== 'all'
            ? 'No products in this category yet'
            : 'Try adjusting your filters or search terms'}
      </Text>
      <TouchableOpacity
        style={styles.resetBtn}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setFilters({ inStockOnly: false, sortBy: 'name', minPrice: '', maxPrice: '', page: 1, limit: 20 });
          loadProducts({ reset: true });
        }}
      >
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={styles.resetBtnText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      <FullScreenLoader
        visible={loading}
        loadingType={loading ? 'category' : 'default'}
        categoryName={getCategoryNameForLoader()}
        searchQuery={searchQuery}
        loadedCount={products.length}
        totalCount={totalProducts}
        loadingText="Loading Fresh Products..."
        subText="Getting the freshest items for you"
        icon="leaf"
        iconColor="#4CAF50"
      />

      {/* ── CART TOAST ── */}
      <CartToast visible={toastVisible} productName={addedProductName} />

      {/* ── SORT MODAL ── */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.sortBackdrop}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        />
        <View style={styles.sortSheet}>
          <View style={styles.sortHandle} />
          <Text style={styles.sortSheetTitle}>Sort by</Text>
          {sortOptions.map((option) => {
            const isActive = filters.sortBy === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.sortRow, isActive && styles.sortRowActive]}
                onPress={() => handleSortSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.sortRowIcon, isActive && styles.sortRowIconActive]}>
                  <Ionicons name={option.icon} size={16} color={isActive ? '#fff' : '#666'} />
                </View>
                <Text style={[styles.sortRowText, isActive && styles.sortRowTextActive]}>
                  {option.label}
                </Text>
                {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </View>
      </Modal>

      {/* MARKET MODAL */}
<Modal
  visible={marketModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setMarketModalVisible(false)}
>
  <TouchableOpacity
    style={styles.sortBackdrop}
    activeOpacity={1}
    onPress={() => setMarketModalVisible(false)}
  />
  <View style={styles.sortSheet}>
    <View style={styles.sortHandle} />
    <Text style={styles.sortSheetTitle}>Filter by Market</Text>

    {/* "All" option */}
    <TouchableOpacity
      style={[styles.sortRow, marketFilter === '' && styles.sortRowActive]}
      onPress={() => { setMarketFilter(''); setMarketModalVisible(false); }}
    >
      <Ionicons name="storefront-outline" size={16} color={marketFilter === '' ? '#2E7D32' : '#666'} />
      <Text style={[styles.sortRowText, marketFilter === '' && styles.sortRowTextActive]}>
        All Markets
      </Text>
      {marketFilter === '' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
    </TouchableOpacity>

    {/* Market items */}
    {ACCRA_MARKETS.map(market => {
      const isActive = marketFilter === market;
      return (
        <TouchableOpacity
          key={market}
          style={[styles.sortRow, isActive && styles.sortRowActive]}
          onPress={() => { setMarketFilter(market); setMarketModalVisible(false); }}
        >
          <Ionicons name="storefront-outline" size={16} color={isActive ? '#2E7D32' : '#666'} />
          <Text style={[styles.sortRowText, isActive && styles.sortRowTextActive]}>
            {market}
          </Text>
          {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
        </TouchableOpacity>
      );
    })}
  </View>
</Modal>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollEndDrag={() => { if (pagination.hasNextPage) handleLoadMore(); }}
      >

        {/* ════════════════════════════════════
            HERO — full bleed with gradient scrim
            ════════════════════════════════════ */}
        <View style={styles.heroWrap}>
          <Animated.Image
            source={{ uri: getHeroImage() }}
            style={[styles.heroImage, { transform: [{ scale: heroScaleAnim }] }]}
            resizeMode="cover"
          />
          {/* Top scrim — light darkening for nav legibility */}
          <View style={styles.heroScrimTop} />
          {/* Bottom scrim — heavy green fade for text/search area */}
          <View style={styles.heroScrimBottom} />

          {/* Nav row */}
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>{getCategoryLabel()}</Text>
              {!loading && (
                <Text style={styles.heroCount}>{totalProducts} items</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
            >
              <Ionicons name={cartCount > 0 ? 'cart' : 'cart-outline'} size={22} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar floating at hero bottom */}
          <View style={styles.heroSearchWrap}>
            {showSearch ? (
              <View style={styles.heroSearchActive}>
                <Ionicons name="search-outline" size={18} color="#4CAF50" style={{ marginLeft: 14 }} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.heroSearchInput}
                  placeholder="Search fresh products..."
                  placeholderTextColor="#9E9E9E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSearch} style={styles.heroSearchBtn}>
                  <Text style={styles.heroSearchBtnText}>Go</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    loadProducts({ reset: true, query: '' });
                  }}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.heroSearchInactive}
                onPress={() => setShowSearch(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={18} color="#9E9E9E" style={{ marginRight: 8 }} />
                <Text style={styles.heroSearchPlaceholder}>Search fresh products...</Text>
                <View style={styles.heroSearchMic}>
                  <Ionicons name="mic-outline" size={16} color="#4CAF50" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ════════════════════════════════════
            CATEGORY TABS
            ════════════════════════════════════ */}
        <View style={styles.catStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catStripInner}
          >
            {/* "All" tab */}
            {[{ id: 'all', name: 'All' }, ...categories].map((cat) => {
              const isActive =
                selectedCategory === cat.id ||
                selectedCategory === cat.name?.toLowerCase();
              const iconName = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS[cat.name?.toLowerCase()] || 'apps';
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  onPress={() => handleCategorySelect(cat.id)}
                  disabled={loading}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isActive ? iconName : `${iconName}-outline`}
                    size={15}
                    color={isActive ? '#fff' : '#666'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════
            TOOLBAR — count, sort, view mode
            ════════════════════════════════════ */}
        <View style={styles.toolbar}>
          

      <View style={styles.toolbarRight}>

             {/* ── Market Filter Button ── */}
    <TouchableOpacity
      style={styles.toolbarSortBtn}
      onPress={() => setMarketModalVisible(true)}
      activeOpacity={0.8}
     >
    <Ionicons name="location-outline" size={15} color="#2E7D32" />
    <Text style={styles.toolbarSortText} numberOfLines={1}>
      {marketFilter || 'Market'}
    </Text>
    <Ionicons name="chevron-down" size={13} color="#2E7D32" />
  </TouchableOpacity>
            {/* Sort */}
            <TouchableOpacity
              style={styles.toolbarSortBtn}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical-outline" size={15} color="#2E7D32" />
              <Text style={styles.toolbarSortText} numberOfLines={1}>
                {activeSortLabel.split(':')[0].split('–')[0].trim()}
              </Text>
              <Ionicons name="chevron-down" size={13} color="#2E7D32" />
            </TouchableOpacity>

            {/* View mode */}
            <View style={styles.viewModeGroup}>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnOn]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnOn]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════
            PRODUCT GRID / LIST
            ════════════════════════════════════ */}
        {products.length === 0 && !loading ? (
          renderEmptyState()
        ) : viewMode === 'list' ? (
          <View style={styles.listWrap}>
            {products.map(item => (
              <View key={item.id || item._id}>
                {renderProductListItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {products.map(item => renderGridCard(item))}
          </View>
        )}

        {/* Load more */}
        {pagination.hasNextPage && !loading && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
            <Ionicons name="chevron-down-circle-outline" size={18} color="#4CAF50" />
            <Text style={styles.loadMoreText}>Load More Products</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  scrollContent: { paddingBottom: 20 },

  // ── HERO ────────────────────────────────────────────────────────────────────
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
  // Two-layer scrim replaces LinearGradient:
  // top layer darkens slightly so the nav icons stay readable
  heroScrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  // bottom layer fades to deep green so the search bar area has contrast
  heroScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
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
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#D32F2F',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', paddingHorizontal: 2 },

  // Hero search
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
  heroSearchPlaceholder: { flex: 1, fontSize: 15, color: '#BDBDBD', fontWeight: '400' },
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
    fontSize: 15,
    color: '#212121',
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  heroSearchBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  heroSearchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── CATEGORY STRIP ──────────────────────────────────────────────────────────
  catStrip: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  catStripInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catTabActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  catTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catTabTextActive: { color: '#fff' },

  // ── TOOLBAR ─────────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
    maxWidth: 130,
  },
  toolbarSortText: { fontSize: 12, color: '#2E7D32', fontWeight: '700', flex: 1 },
  viewModeGroup: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  viewModeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  viewModeBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── GRID ────────────────────────────────────────────────────────────────────
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
    paddingTop: 4,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 2,
  },
  gridImageWrap: {
    height: 148,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  gridImage: { width: '100%', height: '100%' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gridCatChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gridCatChipText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },
  gridInfo: { padding: 12, paddingTop: 10 },
  gridName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2, lineHeight: 18 },
  gridUnit: { fontSize: 11, color: '#BDBDBD', marginBottom: 10, fontWeight: '500' },
  gridUnit1: { fontSize: 11, color: '#2E7D32', marginBottom: 10, fontWeight: '500' },
  gridFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20' },
  gridAddBtn: {
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
  disabledBtn: { backgroundColor: '#BDBDBD', shadowOpacity: 0 },
  gridQtyPill: {
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
  gridQtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  gridQtyNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    minWidth: 22,
    textAlign: 'center',
  },

  // ── LIST ────────────────────────────────────────────────────────────────────
  listWrap: { paddingHorizontal: 12, gap: 10, paddingTop: 4 },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  listImageWrap: {
    width: 100,
    height: 100,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  listImage: { width: '100%', height: '100%' },
  listOutOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listOutOfStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  listContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  listTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 },
  listName: { fontSize: 14, fontWeight: '700', color: '#212121', flex: 1, marginRight: 8 },
  listCatChip: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  listCatChipOOS: { backgroundColor: '#FFEBEE' },
  listCatText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },
  listCatTextOOS: { color: '#E53935' },
  listUnit: { fontSize: 11, color: '#BDBDBD', fontWeight: '500', marginBottom: 8 },
  listUnit1: { fontSize: 11, color: '#2E7D32', fontWeight: '500', marginBottom: 8 },
  listBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listPrice: { fontSize: 17, fontWeight: '800', color: '#1B5E20' },
  listQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    gap: 4,
  },
  listQtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  listQtyNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    minWidth: 26,
    textAlign: 'center',
  },
  listCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  listCartBtnOOS: { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  listCartBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40 },
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
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  resetBtn: {
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
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── LOAD MORE ────────────────────────────────────────────────────────────────
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F8E9',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  loadMoreText: { color: '#2E7D32', fontSize: 14, fontWeight: '700' },

  // ── SORT SHEET ───────────────────────────────────────────────────────────────
  sortBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
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
  sortSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 16,
  },
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

  // ── TOAST ────────────────────────────────────────────────────────────────────
  toastContainer: {
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

export default ProductsScreen;