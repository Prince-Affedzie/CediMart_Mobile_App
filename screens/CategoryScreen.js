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
  TextInput,
  Modal,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductsByCategory } from '../apis/productApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

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

// Subcategory map: category → [{value, label}]
const SUBCATEGORY_MAP = {
  'electronics': [
    { value: 'headphones-earbuds', label: 'Headphones & Earbuds' },
    { value: 'speakers',           label: 'Speakers' },
    { value: 'chargers-cables',    label: 'Chargers & Cables' },
    { value: 'power-banks',        label: 'Power Banks' },
    { value: 'smartwatches',       label: 'Smartwatches' },
    { value: 'cameras',            label: 'Cameras' },
    { value: 'other-electronics',  label: 'Other' },
  ],
  'phones and tablets': [
    { value: 'smartphones',             label: 'Smartphones' },
    { value: 'tablets',                 label: 'Tablets' },
    { value: 'ipads',                   label: 'iPads' },
    { value: 'phone-cases',             label: 'Phone Cases' },
    { value: 'screen-protectors',       label: 'Screen Protectors' },
    { value: 'other-phone-accessories', label: 'Other' },
  ],
  'computers and laptops': [
    { value: 'laptops',                   label: 'Laptops' },
    { value: 'desktops',                  label: 'Desktops' },
    { value: 'monitors',                  label: 'Monitors' },
    { value: 'keyboards',                 label: 'Keyboards' },
    { value: 'mouse',                     label: 'Mouse' },
    { value: 'laptop-bags',               label: 'Laptop Bags' },
    { value: 'software',                  label: 'Software' },
    { value: 'other-computer-accessories',label: 'Other' },
  ],
  'gaming': [
    { value: 'consoles',           label: 'Consoles' },
    { value: 'games',              label: 'Games' },
    { value: 'controllers',        label: 'Controllers' },
    { value: 'gaming-accessories', label: 'Accessories' },
  ],
  'fashion': [
    { value: 'men-clothing',    label: "Men's Clothing" },
    { value: 'women-clothing',  label: "Women's Clothing" },
    { value: 'unisex-clothing', label: 'Unisex' },
    { value: 'shoes',           label: 'Shoes' },
    { value: 'bags',            label: 'Bags' },
    { value: 'watches',         label: 'Watches' },
    { value: 'jewelry',         label: 'Jewelry' },
    { value: 'other-fashion',   label: 'Other' },
  ],
  'books-course-materials': [
    { value: 'textbooks',     label: 'Textbooks' },
    { value: 'course-notes',  label: 'Course Notes' },
    { value: 'past-questions',label: 'Past Questions' },
    { value: 'stationery',    label: 'Stationery' },
    { value: 'novels',        label: 'Novels' },
    { value: 'other-books',   label: 'Other' },
  ],
  'hostel-items': [
    { value: 'bedding',          label: 'Bedding' },
    { value: 'kitchenware',      label: 'Kitchenware' },
    { value: 'cleaning-supplies',label: 'Cleaning' },
    { value: 'storage',          label: 'Storage' },
    { value: 'lighting',         label: 'Lighting' },
    { value: 'other-hostel',     label: 'Other' },
  ],
  'appliances': [
    { value: 'fans',             label: 'Fans' },
    { value: 'irons',            label: 'Irons' },
    { value: 'kettles',          label: 'Kettles' },
    { value: 'blenders',         label: 'Blenders' },
    { value: 'microwaves',       label: 'Microwaves' },
    { value: 'other-appliances', label: 'Other' },
  ],
  'furniture': [
    { value: 'chairs',          label: 'Chairs' },
    { value: 'tables-desks',    label: 'Tables & Desks' },
    { value: 'beds-mattresses', label: 'Beds & Mattresses' },
    { value: 'shelves',         label: 'Shelves' },
    { value: 'other-furniture', label: 'Other' },
  ],
  'beauty and grooming': [
    { value: 'skincare',     label: 'Skincare' },
    { value: 'makeup',       label: 'Makeup' },
    { value: 'hair-care',    label: 'Hair Care' },
    { value: 'perfumes',     label: 'Perfumes' },
    { value: 'nail-care',    label: 'Nail Care' },
    { value: 'other-beauty', label: 'Other' },
  ],
  'sports and fitness': [
    { value: 'sports-equipment', label: 'Equipment' },
    { value: 'gym-gear',         label: 'Gym Gear' },
    { value: 'activewear',       label: 'Activewear' },
    { value: 'other-sports',     label: 'Other' },
  ],
  'food and drinks': [
    { value: 'snacks',        label: 'Snacks' },
    { value: 'drinks',        label: 'Drinks' },
    { value: 'homemade-meals',label: 'Homemade Meals' },
    { value: 'baked-goods',   label: 'Baked Goods' },
    { value: 'other-food',    label: 'Other' },
  ],
  'services': [
    { value: 'tutoring',            label: 'Tutoring' },
    { value: 'graphic-design',      label: 'Graphic Design' },
    { value: 'photography',         label: 'Photography' },
    { value: 'printing-photocopy',  label: 'Printing' },
    { value: 'laundry',             label: 'Laundry' },
    { value: 'barbering-hairdressing', label: 'Barbering/Hair' },
    { value: 'tech-repairs',        label: 'Tech Repairs' },
    { value: 'other-services',      label: 'Other' },
  ],
};

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest First',       icon: 'time-outline'         },
  { id: 'price-asc',  label: 'Price: Low to High', icon: 'arrow-up-outline'     },
  { id: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline'   },
  { id: 'popular',    label: 'Most Viewed',         icon: 'trending-up-outline'  },
];

const CONDITION_CONFIG = {
  'new':           { label: 'New',           color: '#2E7D32', bg: '#E8F5E9' },
  'like-new':      { label: 'Like New',      color: '#2E7D32', bg: '#E8F5E9' },
  'excellent':     { label: 'Excellent',     color: '#1565C0', bg: '#E3F2FD' },
  'good':          { label: 'Good',          color: '#F57F17', bg: '#FFF8E1' },
  'fair':          { label: 'Fair',          color: '#E65100', bg: '#FFF3E0' },
  'slightly-used': { label: 'Slightly Used', color: '#E65100', bg: '#FFF3E0' },
  'for-parts':     { label: 'For Parts',     color: '#C62828', bg: '#FFEBEE' },
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300/F5F5F5/BDBDBD?text=No+Image';

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
        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
        <Text style={styles.toastText} numberOfLines={1}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// Active filter pill shown in the filter row
const FilterPill = ({ label, onRemove }) => (
  <View style={styles.activePill}>
    <Text style={styles.activePillText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
      <Ionicons name="close-circle" size={15} color="#1565C0" />
    </TouchableOpacity>
  </View>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ item, onPress }) => {
  const condition = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG['good'];
  const isAvailable = item.isAvailable && (item.countInStock ?? 0) > 0;
  const isLowStock = isAvailable && (item.countInStock ?? 0) <= 3;
  const images = item.images?.length > 0 ? item.images : [PLACEHOLDER_IMAGE];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
    >
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: images[0] }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Condition badge */}
        <View style={[styles.conditionBadge, { backgroundColor: condition.bg }]}>
          <Text style={[styles.conditionBadgeText, { color: condition.color }]}>
            {condition.label}
          </Text>
        </View>

        {/* Availability overlay */}
        {!isAvailable && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosText}>Sold Out</Text>
          </View>
        )}

        {/* Low stock badge */}
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text style={styles.lowStockText}>Only {item.countInStock} left</Text>
          </View>
        )}

        {/* Negotiable tag */}
        {item.negotiable && (
          <View style={styles.negotiableTag}>
            <Text style={styles.negotiableTagText}>Nego.</Text>
          </View>
        )}

        {/* Multiple images indicator */}
        {images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={10} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

        {/* Campus + location */}
        {(item.campus || item.location?.campusArea) && (
          <View style={styles.cardLocationRow}>
            <Ionicons name="location-outline" size={11} color="#9E9E9E" />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {[item.campus, item.location?.campusArea].filter(Boolean).join(' · ')}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardPrice}>GH₵ {item.price?.toFixed(2)}</Text>
            {item.vendor?.name && (
              <Text style={styles.cardVendor} numberOfLines={1}>@{item.vendor.name}</Text>
            )}
          </View>

          
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category, categoryName } = route.params || {};
  

  // ── Server-state ──
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [total, setTotal] = useState(0);

  // ── Filter state (drives API calls) ──
  const [sort, setSort] = useState('newest');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [page, setPage] = useState(1);

  // ── Search (client-side debounce over loaded page) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const searchInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const heroScaleAnim = useRef(new Animated.Value(1.05)).current;

  const subcategories = SUBCATEGORY_MAP[category] || [];
  const displayName = categoryName || category?.replace(/-/g, ' ') || '';

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(heroScaleAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  // Reset to page 1 and reload when filters/sort change
  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(1, false);
  }, [sort, selectedSubcategory, selectedCampus]);

  // ── API ───────────────────────────────────────────────────────────────────────
  const fetchProducts = async (pageNum = 1, append = false) => {
    if (!category) return;
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const params = { sort, page: pageNum, limit: 20 };
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (selectedCampus) params.campus = selectedCampus;

      const response = await getProductsByCategory(category, params);

      if (response.success || response.status ===200) {
        const incoming = response.data.data || [];
        setProducts(prev => append ? [...prev, ...incoming] : incoming);
        setPagination(response.pagination);
        setTotal(response.total ?? 0);
      }
    } catch (err) {
      showToast('Failed to load products. Pull to refresh.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setProducts([]);
    fetchProducts(1, false);
  }, [sort, selectedSubcategory, selectedCampus]);

  const handleLoadMore = () => {
    if (!pagination?.hasNextPage || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2400);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() && !recentSearches.includes(text.trim().toLowerCase())) {
      setRecentSearches(prev => [text.trim(), ...prev.slice(0, 4)]);
    }
  };

  const clearSearch = () => setSearchQuery('');

  const handleProductPress = useCallback((item) => {
    navigation.navigate('ProductDetail', { productId: item._id || item.id, product: item });
  }, [navigation]);

 const handleClearFilters = () => {
  setSelectedSubcategory('');
  setSelectedCampus('');
  setSort('newest');  
};

  // Client-side search filter over currently loaded products
  const filteredProducts = searchQuery.trim()
    ? products.filter(p => {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.location?.campusArea?.toLowerCase().includes(q) ||
          p.vendor?.name?.toLowerCase().includes(q)
        );
      })
    : products;

  const activeFilterCount = [selectedSubcategory, selectedCampus].filter(Boolean).length;
  const activeSortLabel = SORT_OPTIONS.find(s => s.id === sort)?.label || 'Sort';

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderProductItem = ({ item }) => (
    <ProductCard item={item} onPress={handleProductPress} />
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadMoreText}>Loading more…</Text>
        </View>
      );
    }
    if (pagination && !pagination.hasNextPage && products.length > 0) {
      return (
        <View style={styles.endOfListWrap}>
          <View style={styles.endOfListLine} />
          <Text style={styles.endOfListText}>You've seen all {total} listings</Text>
          <View style={styles.endOfListLine} />
        </View>
      );
    }
    return <View style={{ height: 100 }} />;
  };

  const renderEmptyState = () => {
  if (loading) return null;
  const isFiltered = selectedSubcategory || selectedCampus || searchQuery;
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name={isFiltered ? 'filter-outline' : 'storefront-outline'} size={36} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No results found' : isFiltered ? 'No matches' : 'No listings yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Nothing matched "${searchQuery}". Try different keywords.`
          : isFiltered
            ? 'Try removing some filters to see more listings.'
            : 'Be the first to list something in this category!'}
      </Text>
      {isFiltered && (
        <TouchableOpacity 
          style={styles.emptyBtn} 
          onPress={() => { 
            clearSearch(); 
            handleClearFilters(); 
          }}
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  const renderListHeader = () => (
    <>
      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <View style={styles.heroWrap}>
        <Animated.Image
          source={{ uri: `https://res.cloudinary.com/duv3qvvjz/image/upload/v1780782982/flyer13_1_fyp0xj.png` }}
          style={[styles.heroImage, { transform: [{ scale: heroScaleAnim }] }]}
          resizeMode="cover"
        />
        <View style={styles.heroScrimTop} />
        <View style={styles.heroScrimBottom} />

        {/* Nav bar */}
        <SafeAreaView style={styles.heroNav} edges={['top']}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
            </Text>
            {!loading && (
              <Text style={styles.heroCount}>
                {total} {total === 1 ? 'listing' : 'listings'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          >
           <Ionicons name="cart-outline" size={20} color="#E8F5E9" />

          </TouchableOpacity>
        </SafeAreaView>

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
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={clearSearch} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#BDBDBD" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.heroSearchDoneBtn}
                onPress={() => { setShowSearch(false); clearSearch(); }}
              >
                <Text style={styles.heroSearchDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.heroSearchInactive}
              onPress={() => setShowSearch(true)}
              activeOpacity={0.9}
            >
              <Ionicons name="search-outline" size={17} color="#9E9E9E" style={{ marginRight: 8 }} />
              <Text style={styles.heroSearchPlaceholder}>Search in {displayName}…</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══════════════════════════ RECENT SEARCHES ════════════════════════ */}
      {showSearch && recentSearches.length > 0 && !searchQuery && (
        <View style={styles.recentWrap}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent</Text>
            <TouchableOpacity onPress={() => setRecentSearches([])}>
              <Text style={styles.recentClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {recentSearches.map((s, i) => (
              <TouchableOpacity key={i} style={styles.recentChip} onPress={() => handleSearch(s)}>
                <Ionicons name="time-outline" size={13} color="#2E7D32" />
                <Text style={styles.recentChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ═══════════════════════════ SUBCATEGORY PILLS ══════════════════════ */}
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
            <Text style={[styles.subcatPillText, !selectedSubcategory && styles.subcatPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {subcategories.map(sub => {
            const active = selectedSubcategory === sub.value;
            return (
              <TouchableOpacity
                key={sub.value}
                style={[styles.subcatPill, active && styles.subcatPillActive]}
                onPress={() => setSelectedSubcategory(active ? '' : sub.value)}
              >
                <Text style={[styles.subcatPillText, active && styles.subcatPillTextActive]}>
                  {sub.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ═══════════════════════════ TOOLBAR ════════════════════════════════ */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>
          {loading
            ? 'Loading…'
            : searchQuery
              ? `${filteredProducts.length} results for "${searchQuery}"`
              : `${total} listings`}
        </Text>

        <View style={styles.toolbarRight}>
          {/* Filter button */}
          <TouchableOpacity
            style={[styles.toolbarBtn, activeFilterCount > 0 && styles.toolbarBtnActive]}
            onPress={() => setShowFilterSheet(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={14}
              color={activeFilterCount > 0 ? '#fff' : '#2E7D32'}
            />
            <Text style={[styles.toolbarBtnText, activeFilterCount > 0 && { color: '#fff' }]}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Sort button */}
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical-outline" size={14} color="#2E7D32" />
            <Text style={styles.toolbarBtnText}>
              {SORT_OPTIONS.find(s => s.id === sort)?.label.split(':')[0].split(' ')[0] || 'Sort'}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active filters row */}
      {(selectedSubcategory || selectedCampus) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersRow}
        >
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
          <TouchableOpacity style={styles.clearAllPill} onPress={handleClearFilters}>
            <Text style={styles.clearAllPillText}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Search results banner */}
      {searchQuery.trim() && (
        <View style={styles.searchResultBanner}>
          <Ionicons name="search" size={14} color="#4CAF50" />
          <Text style={styles.searchResultText}>
            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for{' '}
            <Text style={styles.searchResultQuery}>"{searchQuery}"</Text>
            {' '}(searching loaded listings)
          </Text>
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={16} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
        <View style={styles.loadingIconWrap}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
        <Text style={styles.loadingTitle}>{displayName}</Text>
        <Text style={styles.loadingSubtitle}>Fetching listings for you…</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      <CartToast visible={toastVisible} message={toastMessage} />

      {/* ═══════════════════════════ SORT MODAL ═════════════════════════════ */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSortModal(false)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort By</Text>
          {SORT_OPTIONS.map(opt => {
            const active = sort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sheetRow, active && styles.sheetRowActive]}
                onPress={() => { setSort(opt.id); setShowSortModal(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetRowIcon, active && styles.sheetRowIconActive]}>
                  <Ionicons name={opt.icon} size={16} color={active ? '#fff' : '#666'} />
                </View>
                <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
              </TouchableOpacity>
            );
          })}
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* ═══════════════════════════ FILTER SHEET ═══════════════════════════ */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
        <View style={[styles.bottomSheet, { maxHeight: '80%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>Filters</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.sheetClearBtn}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Campus filter */}
            <Text style={styles.filterSectionLabel}>Campus</Text>
            <View style={styles.filterChipsWrap}>
              {CAMPUS_OPTIONS.map(opt => {
                const active = selectedCampus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedCampus(active ? '' : opt.value)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subcategory filter (only if subcategories exist) */}
            {subcategories.length > 0 && (
              <>
                <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Subcategory</Text>
                <View style={styles.filterChipsWrap}>
                  <TouchableOpacity
                    style={[styles.filterChip, !selectedSubcategory && styles.filterChipActive]}
                    onPress={() => setSelectedSubcategory('')}
                  >
                    <Text style={[styles.filterChipText, !selectedSubcategory && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {subcategories.map(sub => {
                    const active = selectedSubcategory === sub.value;
                    return (
                      <TouchableOpacity
                        key={sub.value}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setSelectedSubcategory(active ? '' : sub.value)}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setShowFilterSheet(false)}
          >
            <Text style={styles.applyBtnText}>
              Apply{activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}
            </Text>
          </TouchableOpacity>
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* ═══════════════════════════ PRODUCT LIST ═══════════════════════════ */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => (item._id || item.id || String(Math.random())).toString()}
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
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        extraData={[searchQuery, selectedSubcategory, selectedCampus, sort]}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  listContent: { paddingBottom: 20 },
  row: { justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 2 },

  // Loading screen
  loadingScreen: {
    flex: 1, backgroundColor: '#F7F9F7',
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 6, textTransform: 'capitalize' },
  loadingSubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center' },

  // Hero
  heroWrap: { height: 260, overflow: 'hidden', backgroundColor: '#1B5E20' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroScrimTop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  heroScrimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 130, backgroundColor: 'rgba(0,0,0,0.48)',
  },
  heroNav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitleWrap: { flex: 1, alignItems: 'center' },
  heroTitle: {
    fontSize: 19, fontWeight: '800', color: '#fff',
    letterSpacing: 0.2, textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' },
  heroSearchWrap: { position: 'absolute', bottom: 18, left: 16, right: 16 },
  heroSearchInactive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  heroSearchPlaceholder: { flex: 1, fontSize: 14, color: '#BDBDBD' },
  heroSearchActive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 2, borderColor: '#4CAF50',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6, overflow: 'hidden',
  },
  heroSearchInput: {
    flex: 1, fontSize: 14, color: '#212121',
    paddingVertical: 13, paddingHorizontal: 10,
  },
  heroSearchDoneBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 13 },
  heroSearchDoneText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Recent searches
  recentWrap: {
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  recentTitle: { fontSize: 12, color: '#9E9E9E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  recentClear: { fontSize: 12, color: '#E53935', fontWeight: '600' },
  recentChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8E9', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9', gap: 5,
  },
  recentChipText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // Subcategory strip
  subcatStripWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  subcatStrip: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  subcatPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  subcatPillActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  subcatPillText: { fontSize: 13, fontWeight: '600', color: '#555' },
  subcatPillTextActive: { color: '#fff' },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 14,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: 4,
  },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500', flex: 1, marginRight: 8 },
  toolbarRight: { flexDirection: 'row', gap: 8 },
  toolbarBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8F3', paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 20, gap: 4, borderWidth: 1, borderColor: '#C8E6C9',
  },
  toolbarBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  toolbarBtnText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // Active filter pills
  activeFiltersRow: {
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
    backgroundColor: '#F7F9F7',
  },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE',
  },
  activePillText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  clearAllPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  clearAllPillText: { fontSize: 12, fontWeight: '600', color: '#C62828' },

  // Search result banner
  searchResultBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8E9', paddingHorizontal: 14, paddingVertical: 10,
    gap: 7, borderBottomWidth: 1, borderBottomColor: '#E8F5E9',
  },
  searchResultText: { flex: 1, fontSize: 13, color: '#555', fontWeight: '500' },
  searchResultQuery: { color: '#2E7D32', fontWeight: '700' },

  // Product card
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 18, overflow: 'hidden',
    marginBottom: 12, marginTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  cardImageWrap: { height: 148, position: 'relative', backgroundColor: '#F5F5F5' },
  cardImage: { width: '100%', height: '100%' },
  conditionBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  conditionBadgeText: { fontSize: 10, fontWeight: '700' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  lowStockBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E53935', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, gap: 3,
  },
  lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  negotiableTag: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(249,115,22,0.9)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  negotiableTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageCountBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, gap: 3,
  },
  imageCountText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardBody: { padding: 12, paddingTop: 10 },
  cardName: {
    fontSize: 13, fontWeight: '700', color: '#212121',
    lineHeight: 18, minHeight: 36, marginBottom: 4,
  },
  cardLocationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6,
  },
  cardLocation: { fontSize: 11, color: '#9E9E9E', flex: 1 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20' },
  cardVendor: { fontSize: 10, color: '#9E9E9E', marginTop: 1 },
  cardViewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F8F3', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9',
  },
  cardViewBtnText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // Load more / end of list
  loadMoreWrap: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, paddingVertical: 20,
  },
  loadMoreText: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  endOfListWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 28, gap: 12,
  },
  endOfListLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  endOfListText: { fontSize: 12, color: '#BDBDBD', fontWeight: '500' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14, color: '#9E9E9E', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4CAF50', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 12, gap: 8,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modals (sort + filter sheets)
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  sheetClearBtn: { fontSize: 14, color: '#E53935', fontWeight: '600' },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 6, gap: 12,
  },
  sheetRowActive: { backgroundColor: '#F1F8E9' },
  sheetRowIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetRowIconActive: { backgroundColor: '#4CAF50' },
  sheetRowText: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  sheetRowTextActive: { color: '#2E7D32', fontWeight: '700' },

  // Filter sheet specifics
  filterSectionLabel: {
    fontSize: 12, color: '#9E9E9E', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
  },
  filterChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  applyBtn: {
    backgroundColor: '#2E7D32', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 20, marginBottom: 4,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Toast
  toastWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 999, alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1B5E20', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 30, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    maxWidth: width - 60,
  },
  toastText: { fontSize: 13, color: 'rgba(255,255,255,0.92)', flex: 1 },
});

export default CategoryScreen;