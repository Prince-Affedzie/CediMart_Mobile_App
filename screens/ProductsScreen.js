// src/screens/main/ProductsScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
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
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import { styles, Colors as C } from '../styles/products';
import {
  CONDITION_CONFIG, SUBCATEGORIES, CATEGORIES,
  CITY_OPTIONS, getSuburbs, GHANA_LOCATIONS,
} from '../data/General';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import VisualSearchFab from '../components/VisualSearchFab';
import AIFAB from '../components/AIFAB';

const { width } = Dimensions.get('window');

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest First',        icon: 'time-outline' },
  { id: 'oldest',     label: 'Oldest First',         icon: 'hourglass-outline' },
  { id: 'price-asc',  label: 'Price: Low → High',   icon: 'arrow-up-outline' },
  { id: 'price-desc', label: 'Price: High → Low',   icon: 'arrow-down-outline' },
  { id: 'popular',    label: 'Most Popular',         icon: 'trending-up-outline' },
  { id: 'rating',     label: 'Top Rated',            icon: 'star-outline' },
];

const CONDITION_FILTER_OPTIONS = [
  { id: '', label: 'Any' },
  ...Object.entries(CONDITION_CONFIG).map(([k, v]) => ({ id: k, label: v.label })),
];

// Location can arrive as a plain string, as the current { area, city } shape,
// or — for older listings — as the legacy { campusArea, hostel } shape. This
// always resolves it down to a single displayable string, never an object.
const getLocationLabel = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  // Prefer the canonical lookup so ACCRA → "Accra" instead of the raw id.
  if (location.city) {
    const cityLabel = GHANA_LOCATIONS[location.city]?.label || location.city;
    return location.area ? `${location.area}, ${cityLabel}` : cityLabel;
  }
  if (location.campusArea) return location.hostel ? `${location.hostel}, ${location.campusArea}` : location.campusArea;
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Animated toast notification
const CartToast = React.memo(({ visible, productName }) => {
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
      style={[styles.toastContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        <View style={styles.toastIcon}>
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
        <Text style={styles.toastText} numberOfLines={1}>
          <Text style={styles.toastBold}>{productName}</Text> saved to cart
        </Text>
      </View>
    </Animated.View>
  );
});

// Condition pill badge
const ConditionBadge = React.memo(({ condition }) => {
  const cfg = CONDITION_CONFIG[condition];
  if (!cfg) return null;
  return (
    <View style={[styles.condBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.condBadgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  );
});

// Negotiable tag
const NegotiableTag = React.memo(() => (
  <View style={styles.negTag}>
    <Text style={styles.negTagText}>Nego</Text>
  </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// GRID CARD
// ─────────────────────────────────────────────────────────────────────────────
const GridCard = React.memo(({ item, onPress, onAddToCart, onQtyChange, qtyInCart, isAdding, isUpdating }) => {
  const imageUri = item.images?.[0];
  const catCfg = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const outOfStock = (item.countInStock ?? 0) <= 0;
  const isLoading = isAdding || isUpdating;

  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale &&
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());

  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

  const locationLabel = getLocationLabel(item.location);

  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
      disabled={isLoading}
    >
      <View style={styles.gridImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.gridImg} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImgPlaceholder, { backgroundColor: catCfg.color }]}>
            <Ionicons name={catCfg.icon} size={32} color={catCfg.accent} />
          </View>
        )}

        {outOfStock && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosOverlayText}>Unavailable</Text>
          </View>
        )}

        {hasActiveDiscount && !outOfStock && (
          <View style={styles.discountBadgeGrid}>
            <Text style={styles.discountBadgeGridText}>-{discountPercentage}%</Text>
          </View>
        )}

        {item.condition && !outOfStock && (
          <View style={styles.gridCondPos}>
            <ConditionBadge condition={item.condition} />
          </View>
        )}

        {item.negotiable && !outOfStock && (
          <View style={styles.gridNegPos}>
            <NegotiableTag />
          </View>
        )}
      </View>

      <View style={styles.gridBody}>
        <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>

        <View style={styles.gridMetaRow}>
          {locationLabel && (
            <View style={styles.locationMicroPill}>
              <Ionicons name="location-outline" size={8} color="#0D9488" />
              <Text style={styles.locationMicroText} numberOfLines={1}>{locationLabel}</Text>
            </View>
          )}
          {item.subcategory && (
            <Text style={styles.subCatMicro} numberOfLines={1}>
              {item.subcategory.replace(/-/g, ' ')}
            </Text>
          )}
        </View>

        <View style={styles.gridFooter}>
          {hasActiveDiscount ? (
            <View style={styles.gridPriceStack}>
              <View style={styles.gridPriceRow}>
                <Text style={styles.gridPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.gridDiscountPill}>
                  <Text style={styles.gridDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.gridOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.gridPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
          )}

          {qtyInCart === 0 ? (
            <TouchableOpacity
              style={[styles.gridAddBtn, outOfStock && styles.gridAddBtnDisabled]}
              onPress={() => onAddToCart(item)}
              disabled={isLoading || outOfStock}
              activeOpacity={0.8}
            >
              {isAdding
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="add" size={18} color="#fff" />}
            </TouchableOpacity>
          ) : (
            <View style={styles.gridQtyPill}>
              <TouchableOpacity
                style={styles.gridQtyBtn}
                onPress={() => onQtyChange(item, 'decrease')}
                disabled={isLoading}
              >
                <Ionicons name="remove" size={12} color="#0D9488" />
              </TouchableOpacity>
              {isUpdating
                ? <ActivityIndicator size="small" color="#0D9488" style={{ width: 22 }} />
                : <Text style={styles.gridQtyNum}>{qtyInCart}</Text>}
              <TouchableOpacity
                style={styles.gridQtyBtn}
                onPress={() => onQtyChange(item, 'increase')}
                disabled={isLoading || qtyInCart >= (item.countInStock ?? 0)}
              >
                <Ionicons name="add" size={12} color="#0D9488" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LIST CARD
// ─────────────────────────────────────────────────────────────────────────────
const ListCard = React.memo(({ item, onPress, onAddToCart, onQtyChange, qtyInCart, isAdding, isUpdating }) => {
  const imageUri = item.images?.[0];
  const catCfg = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const outOfStock = (item.countInStock ?? 0) <= 0;
  const isLoading = isAdding || isUpdating;

  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale &&
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());

  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

  const locationLabel = getLocationLabel(item.location);

  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      disabled={isLoading}
    >
      <View style={styles.listImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.listImg} resizeMode="cover" />
        ) : (
          <View style={[styles.listImgPlaceholder, { backgroundColor: catCfg.color }]}>
            <Ionicons name={catCfg.icon} size={28} color={catCfg.accent} />
          </View>
        )}
        {outOfStock && (
          <View style={styles.listOosOverlay}>
            <Text style={styles.listOosText}>N/A</Text>
          </View>
        )}

        {hasActiveDiscount && !outOfStock && (
          <View style={styles.discountBadgeList}>
            <Text style={styles.discountBadgeListText}>-{discountPercentage}% OFF</Text>
          </View>
        )}
      </View>

      <View style={styles.listContent}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.listCatChip, { backgroundColor: catCfg.color }]}>
            <Ionicons name={catCfg.icon} size={16} color={catCfg.accent} />
          </View>
        </View>

        <View style={styles.listMetaRow}>
          {locationLabel && (
            <View style={styles.locationMicroPill}>
              <Ionicons name="location-outline" size={8} color="#0D9488" />
              <Text style={styles.locationMicroText} numberOfLines={1}>{locationLabel}</Text>
            </View>
          )}
          {item.condition && <ConditionBadge condition={item.condition} />}
          {item.negotiable && <NegotiableTag />}
        </View>

        {item.subcategory && (
          <Text style={styles.listSubCat} numberOfLines={1}>
            {item.subcategory.replace(/-/g, ' ')}
          </Text>
        )}

        <View style={styles.listBottomRow}>
          {hasActiveDiscount ? (
            <View style={styles.listPriceStack}>
              <View style={styles.listPriceRow}>
                <Text style={styles.listPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.listDiscountPill}>
                  <Text style={styles.listDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.listOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.listPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
          )}

          {qtyInCart === 0 ? (
            <TouchableOpacity
              style={[styles.listCartBtn, outOfStock && styles.listCartBtnOos]}
              onPress={() => onAddToCart(item)}
              disabled={isLoading || outOfStock}
              activeOpacity={0.8}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={outOfStock ? 'close-circle-outline' : 'bag-add-outline'} size={13} color="#fff" />
                  <Text style={styles.listCartBtnText}>{outOfStock ? 'Unavailable' : 'Add to Cart'}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.listQtyPill}>
              <TouchableOpacity
                style={styles.listQtyBtn}
                onPress={() => onQtyChange(item, 'decrease')}
                disabled={isLoading}
              >
                <Ionicons name="remove" size={13} color="#0D9488" />
              </TouchableOpacity>
              {isUpdating
                ? <ActivityIndicator size="small" color="#0D9488" style={{ width: 28 }} />
                : <Text style={styles.listQtyNum}>{qtyInCart}</Text>}
              <TouchableOpacity
                style={styles.listQtyBtn}
                onPress={() => onQtyChange(item, 'increase')}
                disabled={isLoading || qtyInCart >= (item.countInStock ?? 0)}
              >
                <Ionicons name="add" size={13} color="#0D9488" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
const BottomSheet = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>{title}</Text>
      {children}
      <View style={{ height: 24 }} />
    </View>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const ProductsScreen = ({ navigation, route }) => {
  const { addToCart, updateQuantity, removeFromCart, cartCount, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pagination, setPagination]       = useState({});

  // Filters
  const [selectedCategory, setSelectedCategory]       = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedLocation, setSelectedLocation]       = useState('');  // city id
  const [selectedSuburb, setSelectedSuburb]           = useState('');  // area string
  const [selectedSort, setSelectedSort]               = useState('newest');
  const [selectedCondition, setSelectedCondition]     = useState('');
  const [negotiableOnly, setNegotiableOnly]           = useState(false);
  const [minPrice, setMinPrice]                       = useState('');
  const [maxPrice, setMaxPrice]                       = useState('');
  const [currentPage, setCurrentPage]                 = useState(1);

  // Search
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchFocused, setSearchFocused]     = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [liveSearching, setLiveSearching]     = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  // UI
  const [viewMode, setViewMode]                 = useState('grid');
  const [sortSheetVisible, setSortSheetVisible]     = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [addingProductId, setAddingProductId]   = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [toastVisible, setToastVisible]         = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const searchInputRef  = useRef(null);
  const fetchIdRef      = useRef(0);
  const isMountedRef    = useRef(true);
  const toastTimeoutRef = useRef(null);

  //  Derived from the canonical data/General location structure. These feed
  //  the picker UI and never need updating by hand — add a city or suburb in
  //  General.js and it shows up here.
  const cityOptions = useMemo(
    () => CITY_OPTIONS.map((c) => ({ id: c.id, label: c.label, region: c.region })),
    []
  );
  const suburbOptions = useMemo(
    () => getSuburbs(selectedLocation),   // array of plain strings
    [selectedLocation]
  );

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    if (route.params?.category) setSelectedCategory(route.params.category);
    if (route.params?.location) setSelectedLocation(route.params.location);
    if (route.params?.search)   setSearchQuery(route.params.search);
    if (route.params?.sort)     setSelectedSort(route.params.sort);

    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ── Live search debounce ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) performLiveSearch();
      else {
        setLiveSearchResults([]);
        setShowLiveDropdown(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Reload on filter changes ───────────────────────────────────────────────
  useEffect(() => {
    setSelectedSubcategory('');
    loadProducts({ page: 1, filterChange: true });
  }, [selectedCategory]);

  useEffect(() => {
    //  Skip the very first run so we don't double-fetch on mount.
    if (!loading) loadProducts({ page: 1, filterChange: true });
  }, [selectedSubcategory, selectedLocation, selectedSuburb, selectedSort, selectedCondition, negotiableOnly, minPrice, maxPrice]);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const buildParams = (overrides = {}, searchOverride) => {
    const effectiveSearch = searchOverride !== undefined ? searchOverride : searchQuery;
    const base = {
      category:    selectedCategory !== 'all' ? selectedCategory : undefined,
      subcategory: selectedSubcategory || undefined,
      //  `location` is the city id (e.g. 'ACCRA'); `suburb` is the area
      //  string (e.g. 'Madina'). Both are optional — a user can filter by
      //  city alone, suburb alone (rare), or both.
      location:    selectedLocation || undefined,
      suburb:      selectedSuburb || undefined,
      sort:        selectedSort,
      condition:   selectedCondition || undefined,
      negotiable:  negotiableOnly || undefined,
      minPrice:    minPrice || undefined,
      maxPrice:    maxPrice || undefined,
      search:      effectiveSearch.trim() || undefined,
      limit:       20,
    };
    return { ...base, ...overrides };
  };

  const loadProducts = useCallback(async ({ page = 1, append = false, searchOverride, filterChange = false } = {}) => {
    fetchIdRef.current += 1;
    const myId = fetchIdRef.current;

    if (!append) {
      if (filterChange) setFilterLoading(true);
      else setLoading(true);
    }

    try {
      const params = buildParams({ page }, searchOverride);
      const res = await productService.getProducts(params);

      if (myId !== fetchIdRef.current || !isMountedRef.current) return;

      if (res?.success) {
        setProducts(append ? (prev) => [...prev, ...(res.data || [])] : (res.data || []));
        setTotalProducts(res.total || 0);
        setPagination(res.pagination || {});
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Load products error:', err);
    } finally {
      if (myId !== fetchIdRef.current || !isMountedRef.current) return;
      setLoading(false);
      setFilterLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedSubcategory, selectedLocation, selectedSuburb, selectedSort, selectedCondition, negotiableOnly, minPrice, maxPrice, searchQuery]);

  const performLiveSearch = async () => {
    setLiveSearching(true);
    try {
      const res = await productService.getProducts({
        search: searchQuery.trim(),
        limit: 6,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        location: selectedLocation || undefined,
        suburb: selectedSuburb || undefined,
      });
      if (isMountedRef.current) {
        setLiveSearchResults(res?.data || []);
        setShowLiveDropdown(true);
      }
    } catch { /* silent */ }
    finally { setLiveSearching(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts({ page: 1 });
  }, [loadProducts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !filterLoading && pagination.hasNextPage) {
      loadProducts({ page: currentPage + 1, append: true });
    }
  }, [loading, filterLoading, pagination.hasNextPage, currentPage, loadProducts]);

  const handleSearchSubmit = useCallback(() => {
    setShowLiveDropdown(false);
    loadProducts({ page: 1, filterChange: true, searchOverride: searchQuery });
  }, [loadProducts, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setLiveSearchResults([]);
    setShowLiveDropdown(false);
    loadProducts({ page: 1, filterChange: true, searchOverride: '' });
  }, [loadProducts]);

  const handleUseCurrentLocation = useCallback(() => {
    Alert.alert(
      'Location detection',
      'Automatic location detection is coming soon. For now, pick your location from the list below.'
    );
  }, []);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const cartQtyMap = useMemo(() => {
    const map = {};
    (cartItems || []).forEach(i => {
      const id = i.product?._id || i.productId;
      if (id) map[id] = i.quantity ?? 0;
    });
    return map;
  }, [cartItems]);

  const showToast = useCallback((name) => {
    setAddedProductName(name);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to save items.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if ((product.countInStock ?? 0) <= 0) {
      Alert.alert('Unavailable', `${product.name} is no longer available.`);
      return;
    }
    try {
      setAddingProductId(product._id);
      await addToCart(product._id, 1);
      showToast(product.name);
    } catch {
      Alert.alert('Error', 'Could not add item. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  }, [isAuthenticated, addToCart, showToast, navigation]);

  const handleQtyChange = useCallback(async (product, action) => {
    const productId = product._id;
    const qty = cartQtyMap[productId] || 0;
    try {
      if (action === 'increase') {
        if (qty >= (product.countInStock ?? 0)) {
          Alert.alert('Stock Limit', `Only ${product.countInStock} unit(s) available.`);
          return;
        }
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
      } else if (action === 'decrease' && qty > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, qty - 1);
      } else if (action === 'decrease' && qty === 1) {
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
    } catch {
      Alert.alert('Error', 'Could not update cart.');
    } finally {
      setUpdatingProductId(null);
    }
  }, [cartQtyMap, addToCart, updateQuantity, removeFromCart]);

  const navigateToDetail = useCallback((p) => {
    navigation.navigate('ProductDetail', { productId: p._id, product: p });
  }, [navigation]);

  // ── Computed values ────────────────────────────────────────────────────────
  const activeCatConfig   = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
  const subcatsForCat     = SUBCATEGORIES[selectedCategory] || [];
  const activeSortLabel   = SORT_OPTIONS.find(s => s.id === selectedSort)?.label || 'Sort';
  const activeLocationLabel = selectedLocation
    ? (GHANA_LOCATIONS[selectedLocation]?.label || selectedLocation)
    : 'All Cities';

  const activeFilterCount = [
    selectedCondition, negotiableOnly, minPrice, maxPrice,
  ].filter(Boolean).length;

  const hasAnyActiveFilter = !!(
    selectedLocation || selectedSuburb ||
    selectedCondition || negotiableOnly || minPrice || maxPrice
  );

  const clearAllFilters = useCallback(() => {
    setSelectedLocation('');
    setSelectedSuburb('');
    setSelectedCondition('');
    setNegotiableOnly(false);
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const handleResetEverything = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('');
    clearAllFilters();
    setSelectedSort('newest');
    loadProducts({ page: 1, filterChange: true, searchOverride: '' });
  }, [clearAllFilters, loadProducts]);

  const renderItem = useCallback(({ item }) => {
    const qty = cartQtyMap[item._id] || 0;
    const commonProps = {
      item,
      onPress: navigateToDetail,
      onAddToCart: handleAddToCart,
      onQtyChange: handleQtyChange,
      qtyInCart: qty,
      isAdding: addingProductId === item._id,
      isUpdating: updatingProductId === item._id,
    };
    return viewMode === 'grid' ? <GridCard {...commonProps} /> : <ListCard {...commonProps} />;
  }, [viewMode, cartQtyMap, navigateToDetail, handleAddToCart, handleQtyChange, addingProductId, updatingProductId]);

  const keyExtractor = useCallback((item) => item._id, []);

  const extraData = useMemo(
    () => ({ cartQtyMap, addingProductId, updatingProductId, viewMode }),
    [cartQtyMap, addingProductId, updatingProductId, viewMode]
  );

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderEmptyState = () => {
    if (loading) return <ProductGridSkeleton />;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconBg}>
          <Ionicons name="search-outline" size={38} color={C.brandL} />
        </View>
        <Text style={styles.emptyTitle}>No listings found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? `No results for "${searchQuery}"`
            : selectedCategory !== 'all'
              ? `Nothing in ${activeCatConfig.label} yet`
              : 'Try adjusting your filters'}
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetEverything}>
          <Ionicons name="refresh-outline" size={15} color="#fff" />
          <Text style={styles.resetBtnText}>Clear All Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const listHeader = (
    <>
      <View style={styles.headerCardWrap}>
        <View style={styles.topBar}>
          <View style={styles.topBarTitleWrap}>
            <Text style={styles.topBarTitle}>
              {activeCatConfig.id === 'all' ? 'Shop' : activeCatConfig.label}
            </Text>
            {totalProducts > 0 && (
              <Text style={styles.topBarCount}>{totalProducts} items</Text>
            )}
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.deliveryPill}
              onPress={() => setLocationSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={13} color="#0D9488" />
              <View style={styles.deliveryPillTextWrap}>
                <Text style={styles.deliveryPillLabel}>Deliver to</Text>
                <Text style={styles.deliveryPillValue} numberOfLines={1}>
                  {selectedSuburb ? `${selectedSuburb}, ${activeLocationLabel}` : activeLocationLabel}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topBarCartBtn}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name={cartCount > 0 ? 'cart' : 'cart-outline'} size={22} color="#0D9488" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBarWrap}>
          <View style={[styles.searchBarActive, searchFocused && styles.searchBarActiveFocused]}>
            <Ionicons name="search-outline" size={17} color="#0D9488" style={{ marginLeft: 13 }} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchBarInput}
              placeholder="Search listings…"
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <>
                <TouchableOpacity style={{ padding: 10 }} onPress={clearSearch}>
                  <Ionicons name="close-circle" size={17} color="#BDBDBD" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchGoBtn} onPress={handleSearchSubmit} activeOpacity={0.8}>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {showLiveDropdown && (
            <View style={styles.liveDropdown}>
              {liveSearching ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0D9488" />
                </View>
              ) : liveSearchResults.length > 0 ? (
                <>
                  {liveSearchResults.map(p => {
                    const catCfg = CATEGORIES.find(c => c.id === p.category) || CATEGORIES[CATEGORIES.length - 1];
                    return (
                      <TouchableOpacity
                        key={p._id}
                        style={styles.liveRow}
                        onPress={() => {
                          setShowLiveDropdown(false);
                          navigation.navigate('ProductDetail', { productId: p._id, product: p });
                        }}
                      >
                        {p.images?.[0] ? (
                          <Image source={{ uri: p.images[0] }} style={styles.liveThumb} />
                        ) : (
                          <View style={[styles.liveThumb, { backgroundColor: catCfg.color, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name={catCfg.icon} size={16} color={catCfg.accent} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.liveRowName} numberOfLines={1}>{p.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={styles.liveRowPrice}>GH₵ {p.price?.toFixed(2)}</Text>
                            {getLocationLabel(p.location) && (
                              <Text style={styles.liveRowLocation} numberOfLines={1}>{getLocationLabel(p.location)}</Text>
                            )}
                          </View>
                        </View>
                        {p.condition && <ConditionBadge condition={p.condition} />}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={styles.liveViewAll} onPress={handleSearchSubmit}>
                    <Text style={styles.liveViewAllText}>See all results for "{searchQuery}"</Text>
                    <Ionicons name="arrow-forward" size={13} color="#0D9488" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Ionicons name="search-outline" size={28} color={C.brandBorder} />
                  <Text style={styles.liveEmptyText}>No results found</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── CATEGORY TABS ── */}
        <View style={styles.catStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catStripInner}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catTab}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.75}
                  disabled={loading || filterLoading}
                >
                  <View style={[styles.catIconWrap, isActive && styles.catIconWrapActive]}>
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={isActive ? C.brand : cat.accent}
                    />
                  </View>
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── SUBCATEGORY ROW ── */}
        {subcatsForCat.length > 0 && (
          <View style={styles.subCatStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatStripInner}>
              <TouchableOpacity
                style={[styles.subCatPill, selectedSubcategory === '' && styles.subCatPillActive]}
                onPress={() => setSelectedSubcategory('')}
                disabled={filterLoading}
              >
                <Text style={[styles.subCatPillText, selectedSubcategory === '' && styles.subCatPillTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {subcatsForCat.map(sub => {
                const isActive = selectedSubcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subCatPill, isActive && styles.subCatPillActive]}
                    onPress={() => setSelectedSubcategory(isActive ? '' : sub.id)}
                    activeOpacity={0.75}
                    disabled={filterLoading}
                  >
                    <Text style={[styles.subCatPillText, isActive && styles.subCatPillTextActive]}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── RESULTS META + SORT/FILTER BAR ── */}
      <View style={styles.resultsMetaRow}>
        <View style={styles.resultsMetaLeft}>
          <Text style={styles.toolbarCount}>
            <Text style={styles.toolbarCountBold}>{totalProducts}</Text> results
          </Text>
          {searchQuery ? (
            <View style={styles.searchActiveTag}>
              <Text style={styles.searchActiveTagText} numberOfLines={1}>"{searchQuery}"</Text>
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={11} color="#0284C7" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.viewGroup}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnOn]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={15} color={viewMode === 'grid' ? '#0D9488' : '#BDBDBD'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnOn]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={15} color={viewMode === 'list' ? '#0D9488' : '#BDBDBD'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sortFilterBar}>
        <TouchableOpacity
          style={[styles.sortFilterSegment, selectedSort !== 'newest' && styles.sortFilterSegmentActive]}
          onPress={() => setSortSheetVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={selectedSort !== 'newest' ? '#0F766E' : '#0D9488'} />
          <Text style={[styles.sortFilterText, selectedSort !== 'newest' && styles.sortFilterTextActive]} numberOfLines={1}>
            Sort{selectedSort !== 'newest' ? `: ${activeSortLabel.split(':')[0].split('→')[0].trim()}` : ' by'}
          </Text>
        </TouchableOpacity>

        <View style={styles.sortFilterDivider} />

        <TouchableOpacity
          style={[styles.sortFilterSegment, activeFilterCount > 0 && styles.sortFilterSegmentActive]}
          onPress={() => setFilterSheetVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? '#0F766E' : '#0D9488'} />
          <Text style={[styles.sortFilterText, activeFilterCount > 0 && styles.sortFilterTextActive]}>
            Filter
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {hasAnyActiveFilter && (
        <View style={styles.activeFiltersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContent}>
            {selectedLocation && (
              <View style={styles.activeFChip}>
                <Ionicons name="location-outline" size={11} color="#0284C7" />
                <Text style={styles.activeFChipText}>
                  {selectedSuburb ? `${selectedSuburb}, ${activeLocationLabel}` : activeLocationLabel}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedLocation(''); setSelectedSuburb(''); }}>
                  <Ionicons name="close" size={11} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
            {selectedSuburb && !selectedLocation && (
              <View style={styles.activeFChip}>
                <Ionicons name="location-outline" size={11} color="#0284C7" />
                <Text style={styles.activeFChipText}>{selectedSuburb}</Text>
                <TouchableOpacity onPress={() => setSelectedSuburb('')}>
                  <Ionicons name="close" size={11} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
            {selectedCondition && (
              <View style={styles.activeFChip}>
                <Text style={styles.activeFChipText}>{CONDITION_CONFIG[selectedCondition]?.label}</Text>
                <TouchableOpacity onPress={() => setSelectedCondition('')}>
                  <Ionicons name="close" size={11} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
            {negotiableOnly && (
              <View style={styles.activeFChip}>
                <Text style={styles.activeFChipText}>Negotiable</Text>
                <TouchableOpacity onPress={() => setNegotiableOnly(false)}>
                  <Ionicons name="close" size={11} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
            {(minPrice || maxPrice) && (
              <View style={styles.activeFChip}>
                <Text style={styles.activeFChipText}>
                  GH₵{minPrice || '0'} – {maxPrice || '∞'}
                </Text>
                <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); }}>
                  <Ionicons name="close" size={11} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters}>
              <Text style={styles.clearAllChipText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </>
  );

  const listFooter = (
    <>
      {!loading && !filterLoading && pagination.hasNextPage && (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
          <Ionicons name="chevron-down-circle-outline" size={17} color="#0D9488" />
          <Text style={styles.loadMoreText}>Load More Listings</Text>
        </TouchableOpacity>
      )}
      {loading && products.length > 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#0D9488" />
        </View>
      )}
      <View style={{ height: 100 }} />
    </>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <CartToast visible={toastVisible} productName={addedProductName} />

      {/* ── SORT SHEET ── */}
      <BottomSheet visible={sortSheetVisible} onClose={() => setSortSheetVisible(false)} title="Sort Listings">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {SORT_OPTIONS.map(opt => {
            const isActive = selectedSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                onPress={() => { setSelectedSort(opt.id); setSortSheetVisible(false); }}
              >
                <View style={[styles.sheetRowIcon, isActive && styles.sheetRowIconActive]}>
                  <Ionicons name={opt.icon} size={16} color={isActive ? '#fff' : '#757575'} />
                </View>
                <Text style={[styles.sheetRowText, isActive && styles.sheetRowTextActive]}>{opt.label}</Text>
                {isActive && <Ionicons name="checkmark-circle" size={20} color="#0D9488" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* ── LOCATION SHEET (City + Suburb picker) ── */}
      <BottomSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        title="Deliver To"
      >
        <TouchableOpacity style={styles.useLocationRow} onPress={handleUseCurrentLocation} activeOpacity={0.8}>
          <View style={styles.useLocationIcon}>
            <Ionicons name="navigate" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.useLocationText}>Use my current location</Text>
            <Text style={styles.useLocationSub}>Automatically detect where you are</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0D9488" />
        </TouchableOpacity>

        <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
          {/* Step 1 — City */}
          <Text style={styles.sheetSubHeading}>City</Text>
          <View style={styles.locationChipsWrap}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedLocation && styles.filterChipActive]}
              onPress={() => { setSelectedLocation(''); setSelectedSuburb(''); }}
            >
              <Text style={[styles.filterChipText, !selectedLocation && styles.filterChipTextActive]}>
                All Cities
              </Text>
            </TouchableOpacity>
            {cityOptions.map(opt => {
              const isActive = selectedLocation === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => {
                    setSelectedLocation(opt.id);
                    setSelectedSuburb('');   // reset suburb when city changes
                  }}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Step 2 — Suburb (only after a city is picked) */}
          {selectedLocation && suburbOptions.length > 0 && (
            <>
              <Text style={[styles.sheetSubHeading, { marginTop: 20 }]}>
                Area in {GHANA_LOCATIONS[selectedLocation]?.label}
              </Text>
              <View style={styles.locationChipsWrap}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedSuburb && styles.filterChipActive]}
                  onPress={() => setSelectedSuburb('')}
                >
                  <Text style={[styles.filterChipText, !selectedSuburb && styles.filterChipTextActive]}>
                    All Areas
                  </Text>
                </TouchableOpacity>
                {suburbOptions.map(sub => {
                  const isActive = selectedSuburb === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setSelectedSuburb(isActive ? '' : sub)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {selectedLocation && suburbOptions.length === 0 && (
            <Text style={[styles.sheetSubHeading, { marginTop: 20, fontStyle: 'italic', color: '#94A3B8' }]}>
              No specific areas listed for this city — showing everything in {GHANA_LOCATIONS[selectedLocation]?.label}.
            </Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => setLocationSheetVisible(false)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.applyBtnText}>Done</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* ── ADVANCED FILTER SHEET ── */}
      <BottomSheet visible={filterSheetVisible} onClose={() => setFilterSheetVisible(false)} title="Filters">
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetSubHeading}>Condition</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
            {CONDITION_FILTER_OPTIONS.map(opt => {
              const isActive = selectedCondition === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedCondition(opt.id)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sheetSubHeading}>Price Range (GH₵)</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Min</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={styles.priceDash} />
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Max</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Any"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setNegotiableOnly(v => !v)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.toggleRowLabel}>Negotiable Only</Text>
              <Text style={styles.toggleRowSub}>Show listings open to price discussion</Text>
            </View>
            <View style={[styles.toggleSwitch, negotiableOnly && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, negotiableOnly && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.applyBtn, filterLoading && { opacity: 0.6 }]}
            onPress={() => { setFilterSheetVisible(false); loadProducts({ page: 1, filterChange: true }); }}
            disabled={filterLoading}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.applyBtnText}>{filterLoading ? 'Applying…' : 'Apply Filters'}</Text>
          </TouchableOpacity>

          {(selectedCondition || negotiableOnly || minPrice || maxPrice) ? (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                setSelectedCondition('');
                setNegotiableOnly(false);
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              <Text style={styles.clearFiltersBtnText}>Clear Advanced Filters</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </BottomSheet>

      {/* ── MAIN LIST ── */}
      {filterLoading ? (
        <FlatList
          data={[]}
          keyExtractor={() => 'skeleton'}
          renderItem={null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<ProductGridSkeleton />}
          contentContainerStyle={viewMode === 'grid' ? styles.gridListContent : styles.listWrap}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          key={viewMode}
          data={products}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={extraData}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={viewMode === 'grid' ? styles.gridListContent : styles.listWrap}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={renderEmptyState}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" colors={['#0D9488']} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <VisualSearchFab navigation={navigation} bottom={118} right={20} />
      <AIFAB style={{ position: 'absolute', bottom: 24, right: 16 }} />
    </SafeAreaView>
  );
};

export default ProductsScreen;