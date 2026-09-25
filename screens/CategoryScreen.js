// src/screens/main/CategoryScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  FlatList, ActivityIndicator, RefreshControl, TextInput,
  Modal, StatusBar, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AIFAB from '../components/AIFAB';
import VisualSearchFab from '../components/VisualSearchFab';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { styles, Colors as C } from '../styles/category';
import { SUBCATEGORIES_MAP, VALID_CATEGORIES } from '../data/General';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPUS_OPTIONS = [
  { value: '', label: 'All Campuses' },
  { value: 'UG',     label: 'Univ. of Ghana' },
  { value: 'KNUST',  label: 'KNUST' },
  { value: 'UCC',    label: 'UCC' },
  { value: 'UEW',    label: 'UEW' },
  { value: 'UPSA',   label: 'UPSA' },
  { value: 'GIMPA',  label: 'GIMPA' },
  { value: 'ASHESI', label: 'Ashesi' },
  { value: 'ATU',    label: 'ATU' },
  { value: 'OTHER',  label: 'Other' },
];

//  Adapter: canonical subcategories use `key`; this screen's chips
//  reference `.value`. Rather than rewrite every JSX site, adapt once.
const adaptSubcategories = (map) =>
  Object.fromEntries(
    Object.entries(map || {}).map(([catKey, subs]) => [
      catKey,
      (subs || []).map(({ key, label }) => ({ value: key, label })),
    ])
  );

const SUBCATEGORY_MAP = adaptSubcategories(SUBCATEGORIES_MAP);

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest First',       icon: 'time-outline'         },
  { id: 'price-asc',  label: 'Price: Low to High', icon: 'arrow-up-outline'     },
  { id: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline'   },
  { id: 'popular',    label: 'Most Viewed',         icon: 'trending-up-outline'  },
];

const CONDITION_CONFIG = {
  'new':           { label: 'New',           color: C.success, bg: C.successBg },
  'like-new':      { label: 'Like New',      color: C.success, bg: C.successBg },
  'excellent':     { label: 'Excellent',     color: C.brand,   bg: C.brandBg },
  'good':          { label: 'Good',          color: '#D97706', bg: C.accentBg },
  'fair':          { label: 'Fair',          color: '#EA580C', bg: C.accentBg },
  'slightly-used': { label: 'Slightly Used', color: '#EA580C', bg: C.accentBg },
  'for-parts':     { label: 'For Parts',     color: C.danger,  bg: C.dangerBg },
};

const CONDITION_FILTER_OPTIONS = [
  { id: '', label: 'Any' },
  ...Object.entries(CONDITION_CONFIG).map(([k, v]) => ({ id: k, label: v.label })),
];

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300/F5F5F5/BDBDBD?text=No+Image';

// Location can arrive as a plain string, the current { area, city } shape, or
// — for older listings — the legacy { campusArea, hostel } shape. Always
// resolve it to a displayable string rather than rendering the object.
const getLocationLabel = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  if (location.city) return location.area ? `${location.area}, ${location.city}` : location.city;
  if (location.campusArea) return location.hostel ? `${location.hostel}, ${location.campusArea}` : location.campusArea;
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CartToast = ({ visible, message }) => {
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
        <Ionicons name="checkmark-circle" size={18} color={C.success} />
        <Text style={styles.toastText} numberOfLines={1}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const FilterPill = ({ label, onRemove }) => (
  <View style={styles.activePill}>
    <Text style={styles.activePillText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
      <Ionicons name="close-circle" size={15} color={C.info} />
    </TouchableOpacity>
  </View>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({
  item, onPress, onAddToCart, onQtyChange,
  qtyInCart = 0, isAdding = false, isUpdating = false,
}) => {
  const condition = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG['good'];
  const isAvailable = item.isAvailable && (item.countInStock ?? 0) > 0;
  const isLowStock = isAvailable && (item.countInStock ?? 0) <= 3;
  const images = item.images?.length > 0 ? item.images : [PLACEHOLDER_IMAGE];
  const isLoading = isAdding || isUpdating;
  const locationLabel = getLocationLabel(item.location);

  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale &&
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());

  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;
  const savingsAmount = hasActiveDiscount && originalPrice ? originalPrice - currentPrice : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
      disabled={isLoading}
    >
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: images[0] }} style={styles.cardImage} resizeMode="cover" />
        {hasActiveDiscount && isAvailable && (
          <View style={styles.discountBadge}>
            <Ionicons name="pricetag" size={9} color="#FFFFFF" />
            <Text style={styles.discountBadgeText}>-{discountPercentage}% OFF</Text>
          </View>
        )}
        <View style={[styles.conditionBadge, { backgroundColor: condition.bg }]}>
          <Text style={[styles.conditionBadgeText, { color: condition.color }]}>{condition.label}</Text>
        </View>
        {!isAvailable && <View style={styles.oosOverlay}><Text style={styles.oosText}>Sold Out</Text></View>}
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text style={styles.lowStockText}>Only {item.countInStock} left</Text>
          </View>
        )}
        {item.negotiable && (
          <View style={styles.negotiableTag}>
            <Text style={styles.negotiableTagText}>Nego.</Text>
          </View>
        )}
        {images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={10} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        {(item.campus || locationLabel) && (
          <View style={styles.cardLocationRow}>
            <Ionicons name="location-outline" size={11} color={C.t3} />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {[item.campus, locationLabel].filter(Boolean).join(' · ')}
            </Text>
          </View>
        )}
        <View style={styles.cardFooter}>
          <View style={styles.cardPriceSection}>
            {hasActiveDiscount ? (
              <View style={styles.cardPriceStack}>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                  <View style={styles.cardDiscountPill}>
                    <Text style={styles.cardDiscountPillText}>-{discountPercentage}%</Text>
                  </View>
                </View>
                {originalPrice && <Text style={styles.cardOriginalPrice}>GH₵ {originalPrice.toFixed(2)}</Text>}
                {savingsAmount > 0 && <Text style={styles.cardSavingsText}>Save GH₵ {savingsAmount.toFixed(2)}</Text>}
              </View>
            ) : (
              <Text style={styles.cardPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
            )}
            {item.vendor?.name && <Text style={styles.cardVendor} numberOfLines={1}>@{item.vendor.name}</Text>}
          </View>

          {qtyInCart === 0 ? (
            <TouchableOpacity
              style={[styles.cardAddBtn, !isAvailable && styles.cardAddBtnDisabled]}
              onPress={() => onAddToCart(item)}
              disabled={isLoading || !isAvailable}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              {isAdding
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="add" size={18} color="#fff" />}
            </TouchableOpacity>
          ) : (
            <View style={styles.cardQtyPill}>
              <TouchableOpacity
                style={styles.cardQtyBtn}
                onPress={() => onQtyChange(item, 'decrease')}
                disabled={isLoading}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="remove" size={12} color="#0D9488" />
              </TouchableOpacity>
              {isUpdating
                ? <ActivityIndicator size="small" color="#0D9488" style={{ width: 22 }} />
                : <Text style={styles.cardQtyNum}>{qtyInCart}</Text>}
              <TouchableOpacity
                style={styles.cardQtyBtn}
                onPress={() => onQtyChange(item, 'increase')}
                disabled={isLoading || qtyInCart >= (item.countInStock ?? 0)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
// LIST HEADER — extracted + memoized so it keeps its identity across
// re-renders (this is what keeps the search TextInput mounted and focused,
// and is the main lever for making typing feel fast).
// ─────────────────────────────────────────────────────────────────────────────
const ListHeader = React.memo(({
  navigation,
  displayName,
  loading,
  total,
  searchQuery,
  onChangeSearch,
  searchFocused,
  setSearchFocused,
  searchInputRef,
  handleSearchSubmit,
  clearSearch,
  showLiveDropdown,
  liveSearching,
  liveSearchResults,
  onLiveResultPress,
  subcategories,
  selectedSubcategory,
  setSelectedSubcategory,
  activeFilterCount,
  setShowFilterSheet,
  sort,
  setShowSortModal,
  handleClearFilters,
  recentSearches,
  setRecentSearches,
  onRecentChipPress,
  selectedCampus,
  selectedCondition,
  negotiableOnly,
  minPrice,
  maxPrice,
  setSelectedCampus,
  setSelectedCondition,
  setNegotiableOnly,
  setMinPrice,
  setMaxPrice,
  filteredProductsCount,
  heroScaleAnim,
}) => (
  <>
    <View style={styles.heroWrap}>
      <Animated.Image
        source={{ uri: `https://res.cloudinary.com/duv3qvvjz/image/upload/v1790250614/hero_flyer_1_ilzcr5.png` }}
        style={[styles.heroImage, { transform: [{ scale: heroScaleAnim }] }]}
        resizeMode="cover"
      />
      <View style={styles.heroScrimTop} />
      <View style={styles.heroScrimBottom} />
      <SafeAreaView style={styles.heroNav} edges={['top']}>
        <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroTitleWrap}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </Text>
          {!loading && (
            <Text style={styles.heroCount}>{total} {total === 1 ? 'listing' : 'listings'}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.heroIconBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.heroSearchWrap}>
        <View style={[styles.heroSearchBar, searchFocused && styles.heroSearchBarFocused]}>
          <Ionicons name="search-outline" size={17} color={C.brand} style={{ marginLeft: 14 }} />
          <TextInput
            ref={searchInputRef}
            style={styles.heroSearchInput}
            placeholder={`Search in ${displayName}…`}
            placeholderTextColor={C.t3}
            value={searchQuery}
            onChangeText={onChangeSearch}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <>
              <TouchableOpacity onPress={clearSearch} style={{ padding: 8 }}>
                <Ionicons name="close-circle" size={18} color={C.t3} />
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
                <ActivityIndicator size="small" color={C.brand} />
              </View>
            ) : liveSearchResults.length > 0 ? (
              <>
                {liveSearchResults.map(p => (
                  <TouchableOpacity
                    key={p._id || p.id}
                    style={styles.liveRow}
                    onPress={() => onLiveResultPress(p)}
                  >
                    {p.images?.[0] ? (
                      <Image source={{ uri: p.images[0] }} style={styles.liveThumb} />
                    ) : (
                      <View style={[styles.liveThumb, { backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={16} color={C.t3} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.liveRowName} numberOfLines={1}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={styles.liveRowPrice}>GH₵ {Number(p.price).toFixed(2)}</Text>
                        {(p.campus || getLocationLabel(p.location)) && (
                          <Text style={styles.liveRowLocation} numberOfLines={1}>{p.campus || getLocationLabel(p.location)}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.liveViewAll} onPress={handleSearchSubmit}>
                  <Text style={styles.liveViewAllText}>See all results for "{searchQuery}"</Text>
                  <Ionicons name="arrow-forward" size={13} color={C.brand} />
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
    </View>

    {searchFocused && !searchQuery && recentSearches.length > 0 && (
      <View style={styles.recentWrap}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent</Text>
          <TouchableOpacity onPress={() => setRecentSearches([])}>
            <Text style={styles.recentClear}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {recentSearches.map((s, i) => (
            <TouchableOpacity key={i} style={styles.recentChip} onPress={() => onRecentChipPress(s)}>
              <Ionicons name="time-outline" size={13} color={C.brand} />
              <Text style={styles.recentChipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )}

    {subcategories.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subcatStrip}
        style={styles.subcatStripWrap}
      >
        <TouchableOpacity
          style={[styles.subcatPill, !selectedSubcategory && styles.subcatPillActive]}
          onPress={() => setSelectedSubcategory('')}
        >
          <Text style={[styles.subcatPillText, !selectedSubcategory && styles.subcatPillTextActive]}>All</Text>
        </TouchableOpacity>
        {subcategories.map(sub => {
          const active = selectedSubcategory === sub.value;
          return (
            <TouchableOpacity
              key={sub.value}
              style={[styles.subcatPill, active && styles.subcatPillActive]}
              onPress={() => setSelectedSubcategory(active ? '' : sub.value)}
            >
              <Text style={[styles.subcatPillText, active && styles.subcatPillTextActive]}>{sub.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}

    <View style={styles.resultsMetaRow}>
      <View style={styles.resultsMetaLeft}>
        <Text style={styles.toolbarCount}>
          {loading ? 'Loading…' : (
            <><Text style={styles.toolbarCountBold}>{total}</Text> listings</>
          )}
        </Text>
        {!!searchQuery && (
          <View style={styles.searchActiveTag}>
            <Text style={styles.searchActiveTagText} numberOfLines={1}>"{searchQuery}"</Text>
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close" size={11} color={C.info} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>

    <View style={styles.sortFilterBar}>
      <TouchableOpacity
        style={[styles.sortFilterSegment, sort !== 'newest' && styles.sortFilterSegmentActive]}
        onPress={() => setShowSortModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="swap-vertical-outline" size={16} color={sort !== 'newest' ? C.brandD : C.brand} />
        <Text style={[styles.sortFilterText, sort !== 'newest' && styles.sortFilterTextActive]} numberOfLines={1}>
          Sort{sort !== 'newest' ? `: ${SORT_OPTIONS.find(s => s.id === sort)?.label.split(':')[0].split(' ')[0]}` : ' by'}
        </Text>
      </TouchableOpacity>

      <View style={styles.sortFilterDivider} />

      <TouchableOpacity
        style={[styles.sortFilterSegment, activeFilterCount > 0 && styles.sortFilterSegmentActive]}
        onPress={() => setShowFilterSheet(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? C.brandD : C.brand} />
        <Text style={[styles.sortFilterText, activeFilterCount > 0 && styles.sortFilterTextActive]}>Filter</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>

    {(selectedSubcategory || selectedCampus || selectedCondition || negotiableOnly || minPrice || maxPrice) && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersRow}>
        {selectedSubcategory && (
          <FilterPill
            label={subcategories.find(s => s.value === selectedSubcategory)?.label || selectedSubcategory}
            onRemove={() => setSelectedSubcategory('')}
          />
        )}
        {selectedCampus && (
          <FilterPill
            label={CAMPUS_OPTIONS.find(c => c.value === selectedCampus)?.label || selectedCampus}
            onRemove={() => setSelectedCampus('')}
          />
        )}
        {selectedCondition && (
          <FilterPill
            label={CONDITION_CONFIG[selectedCondition]?.label || selectedCondition}
            onRemove={() => setSelectedCondition('')}
          />
        )}
        {negotiableOnly && (
          <FilterPill label="Negotiable" onRemove={() => setNegotiableOnly(false)} />
        )}
        {(minPrice || maxPrice) && (
          <FilterPill
            label={`GH₵${minPrice || '0'} – ${maxPrice || '∞'}`}
            onRemove={() => { setMinPrice(''); setMaxPrice(''); }}
          />
        )}
        <TouchableOpacity style={styles.clearAllPill} onPress={handleClearFilters}>
          <Text style={styles.clearAllPillText}>Clear all</Text>
        </TouchableOpacity>
      </ScrollView>
    )}
  </>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category, categoryName } = route.params || {};

  const { addToCart, updateQuantity, removeFromCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('newest');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [liveSearching, setLiveSearching] = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  const [addingProductId, setAddingProductId] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const searchInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const heroScaleAnim = useRef(new Animated.Value(1.05)).current;
  const fetchIdRef = useRef(0);
  const isMountedRef = useRef(true);

  //  Subcategories come straight from the canonical map in ../data/General,
  //  adapted once at module load so the shape matches this screen's UI.
  const subcategories = SUBCATEGORY_MAP[category] || [];
  const displayName = categoryName || category?.replace(/-/g, ' ') || '';

  useEffect(() => {
    isMountedRef.current = true;
    Animated.spring(heroScaleAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (pageNum = 1, append = false, searchOverride) => {
    if (!category) return;
    const myId = ++fetchIdRef.current;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setProducts([]);
      }

      const effectiveSearch = searchOverride !== undefined ? searchOverride : searchQuery;
      const params = {
        category,
        sort,
        page: pageNum,
        limit: 20,
        subcategory: selectedSubcategory || undefined,
        campus: selectedCampus || undefined,
        condition: selectedCondition || undefined,
        negotiable: negotiableOnly || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        search: effectiveSearch.trim() || undefined,
      };

      const res = await productService.getProducts(params);
      if (myId !== fetchIdRef.current || !isMountedRef.current) return;

      if (res?.success) {
        const incoming = res.data || [];
        setProducts(prev => append ? [...prev, ...incoming] : incoming);
        setPagination(res.pagination || {});
        setTotal(res.total ?? 0);
      }
    } catch (err) {
      showToast('Failed to load products. Pull to refresh.');
    } finally {
      if (myId !== fetchIdRef.current || !isMountedRef.current) return;
      setLoading(false); setLoadingMore(false); setRefreshing(false);
    }
  }, [category, sort, selectedSubcategory, selectedCampus, selectedCondition, negotiableOnly, minPrice, maxPrice, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, selectedSubcategory, selectedCampus, selectedCondition, negotiableOnly, minPrice, maxPrice]);

  // ── Live search debounce ────────────────────────────────────────────────
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

  const performLiveSearch = async () => {
    setLiveSearching(true);
    try {
      const res = await productService.getProducts({
        search: searchQuery.trim(),
        category,
        subcategory: selectedSubcategory || undefined,
        campus: selectedCampus || undefined,
        limit: 6,
      });
      if (isMountedRef.current) {
        setLiveSearchResults(res?.data || []);
        setShowLiveDropdown(true);
      }
    } catch { /* silent */ }
    finally { setLiveSearching(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); setPage(1); fetchProducts(1, false); }, [fetchProducts]);
  const handleLoadMore = () => { if (!pagination?.hasNextPage || loadingMore || loading) return; const nextPage = page + 1; setPage(nextPage); fetchProducts(nextPage, true); };

  const showToast = useCallback((msg) => {
    setToastMessage(msg); setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  // ── Search handlers ─────────────────────────────────────────────────────
  const onChangeSearch = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const recordRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const lower = trimmed.toLowerCase();
      if (prev.some(s => s.toLowerCase() === lower)) return prev;
      return [trimmed, ...prev.slice(0, 4)];
    });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setShowLiveDropdown(false);
    recordRecentSearch(searchQuery);
    setPage(1);
    fetchProducts(1, false, searchQuery);
  }, [fetchProducts, searchQuery, recordRecentSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setLiveSearchResults([]);
    setShowLiveDropdown(false);
    setPage(1);
    fetchProducts(1, false, '');
  }, [fetchProducts]);

  const onRecentChipPress = useCallback((term) => {
    setSearchQuery(term);
    setShowLiveDropdown(false);
    recordRecentSearch(term);
    setPage(1);
    fetchProducts(1, false, term);
  }, [fetchProducts, recordRecentSearch]);

  const handleProductPress = useCallback((item) => {
    navigation.navigate('ProductDetail', { productId: item._id || item.id, product: item });
  }, [navigation]);

  const handleClearFilters = useCallback(() => {
    setSelectedSubcategory('');
    setSelectedCampus('');
    setSelectedCondition('');
    setNegotiableOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────
  const cartQtyMap = useMemo(() => {
    const map = {};
    (cartItems || []).forEach(i => {
      const id = i.product?._id || i.productId;
      if (id) map[id] = i.quantity ?? 0;
    });
    return map;
  }, [cartItems]);

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
      const id = product._id || product.id;
      setAddingProductId(id);
      await addToCart(id, 1);
      showToast(`${product.name} saved to cart`);
    } catch {
      Alert.alert('Error', 'Could not add item. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  }, [isAuthenticated, addToCart, navigation, showToast]);

  const handleQtyChange = useCallback(async (product, action) => {
    const productId = product._id || product.id;
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

  // ── Derived ─────────────────────────────────────────────────────────────
  const filteredProducts = products;
  const activeFilterCount = [
    selectedSubcategory, selectedCampus, selectedCondition, negotiableOnly, minPrice, maxPrice,
  ].filter(Boolean).length;

  const renderProductItem = useCallback(({ item }) => {
    const id = item._id || item.id;
    return (
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onQtyChange={handleQtyChange}
        qtyInCart={cartQtyMap[id] || 0}
        isAdding={addingProductId === id}
        isUpdating={updatingProductId === id}
      />
    );
  }, [handleProductPress, handleAddToCart, handleQtyChange, cartQtyMap, addingProductId, updatingProductId]);

  const renderFooter = () => {
    if (loadingMore) return (<View style={styles.loadMoreWrap}><ActivityIndicator size="small" color={C.brand} /><Text style={styles.loadMoreText}>Loading more…</Text></View>);
    if (pagination && !pagination.hasNextPage && products.length > 0) return (<View style={styles.endOfListWrap}><View style={styles.endOfListLine} /><Text style={styles.endOfListText}>You've seen all {total} listings</Text><View style={styles.endOfListLine} /></View>);
    return <View style={{ height: 100 }} />;
  };

  const renderEmptyState = () => {
    if (loading) return <ProductGridSkeleton />;
    const isFiltered = selectedSubcategory || selectedCampus || selectedCondition || negotiableOnly || minPrice || maxPrice || searchQuery;
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconBg}><Ionicons name={isFiltered ? 'filter-outline' : 'storefront-outline'} size={36} color={C.brandBorder} /></View>
        <Text style={styles.emptyTitle}>{searchQuery ? 'No results found' : isFiltered ? 'No matches' : 'No listings yet'}</Text>
        <Text style={styles.emptySubtitle}>{searchQuery ? `Nothing matched "${searchQuery}". Try different keywords.` : isFiltered ? 'Try removing some filters to see more listings.' : 'Be the first to list something in this category!'}</Text>
        {isFiltered && (
          <TouchableOpacity style={styles.emptyBtn} onPress={() => { clearSearch(); handleClearFilters(); }}>
            <Ionicons name="refresh-outline" size={16} color="#fff" /><Text style={styles.emptyBtnText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const listHeaderElement = useMemo(() => (
    <ListHeader
      navigation={navigation}
      displayName={displayName}
      loading={loading}
      total={total}
      searchQuery={searchQuery}
      onChangeSearch={onChangeSearch}
      searchFocused={searchFocused}
      setSearchFocused={setSearchFocused}
      searchInputRef={searchInputRef}
      handleSearchSubmit={handleSearchSubmit}
      clearSearch={clearSearch}
      showLiveDropdown={showLiveDropdown}
      liveSearching={liveSearching}
      liveSearchResults={liveSearchResults}
      onLiveResultPress={handleProductPress}
      subcategories={subcategories}
      selectedSubcategory={selectedSubcategory}
      setSelectedSubcategory={setSelectedSubcategory}
      activeFilterCount={activeFilterCount}
      setShowFilterSheet={setShowFilterSheet}
      sort={sort}
      setShowSortModal={setShowSortModal}
      handleClearFilters={handleClearFilters}
      recentSearches={recentSearches}
      setRecentSearches={setRecentSearches}
      onRecentChipPress={onRecentChipPress}
      selectedCampus={selectedCampus}
      selectedCondition={selectedCondition}
      negotiableOnly={negotiableOnly}
      minPrice={minPrice}
      maxPrice={maxPrice}
      setSelectedCampus={setSelectedCampus}
      setSelectedCondition={setSelectedCondition}
      setNegotiableOnly={setNegotiableOnly}
      setMinPrice={setMinPrice}
      setMaxPrice={setMaxPrice}
      filteredProductsCount={filteredProducts.length}
      heroScaleAnim={heroScaleAnim}
    />
  ), [
    navigation, displayName, loading, total, searchQuery, onChangeSearch, searchFocused,
    handleSearchSubmit, clearSearch,
    showLiveDropdown, liveSearching, liveSearchResults, handleProductPress,
    subcategories, selectedSubcategory, activeFilterCount,
    sort, handleClearFilters, recentSearches, onRecentChipPress,
    selectedCampus, selectedCondition, negotiableOnly, minPrice, maxPrice,
    filteredProducts.length, heroScaleAnim,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <CartToast visible={toastVisible} message={toastMessage} />

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)} statusBarTranslucent>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSortModal(false)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort By</Text>
          {SORT_OPTIONS.map(opt => { const active = sort === opt.id; return (<TouchableOpacity key={opt.id} style={[styles.sheetRow, active && styles.sheetRowActive]} onPress={() => { setSort(opt.id); setShowSortModal(false); }} activeOpacity={0.75}><View style={[styles.sheetRowIcon, active && styles.sheetRowIconActive]}><Ionicons name={opt.icon} size={16} color={active ? '#fff' : '#666'} /></View><Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{opt.label}</Text>{active && <Ionicons name="checkmark-circle" size={20} color={C.brand} />}</TouchableOpacity>); })}
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* Filter Sheet */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)} statusBarTranslucent>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
        <View style={[styles.bottomSheet, { maxHeight: '85%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>Filters</Text>
            {activeFilterCount > 0 && <TouchableOpacity onPress={handleClearFilters}><Text style={styles.sheetClearBtn}>Clear all</Text></TouchableOpacity>}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionLabel}>Campus</Text>
            <View style={styles.filterChipsWrap}>
              {CAMPUS_OPTIONS.map(opt => {
                const active = selectedCampus === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setSelectedCampus(active ? '' : opt.value)}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {subcategories.length > 0 && (
              <>
                <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Subcategory</Text>
                <View style={styles.filterChipsWrap}>
                  <TouchableOpacity style={[styles.filterChip, !selectedSubcategory && styles.filterChipActive]} onPress={() => setSelectedSubcategory('')}>
                    <Text style={[styles.filterChipText, !selectedSubcategory && styles.filterChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {subcategories.map(sub => {
                    const active = selectedSubcategory === sub.value;
                    return (
                      <TouchableOpacity key={sub.value} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setSelectedSubcategory(active ? '' : sub.value)}>
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{sub.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Condition</Text>
            <View style={styles.filterChipsWrap}>
              {CONDITION_FILTER_OPTIONS.map(opt => {
                const active = selectedCondition === opt.id;
                return (
                  <TouchableOpacity key={opt.id} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setSelectedCondition(opt.id)}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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

            <TouchableOpacity style={styles.toggleRow} onPress={() => setNegotiableOnly(v => !v)} activeOpacity={0.8}>
              <View>
                <Text style={styles.toggleRowLabel}>Negotiable Only</Text>
                <Text style={styles.toggleRowSub}>Show listings open to price discussion</Text>
              </View>
              <View style={[styles.toggleSwitch, negotiableOnly && styles.toggleSwitchOn]}>
                <View style={[styles.toggleThumb, negotiableOnly && styles.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterSheet(false)}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.applyBtnText}>Apply{activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}</Text>
          </TouchableOpacity>

          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => (item._id || item.id || String(Math.random())).toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} colors={[C.brand]} />}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraData={{ cartQtyMap, addingProductId, updatingProductId }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
      <VisualSearchFab navigation={navigation} bottom={128} right={20} />
      <AIFAB style={{ position: 'absolute', bottom: 44, right: 16 }} />
    </View>
  );
};

export default CategoryScreen;