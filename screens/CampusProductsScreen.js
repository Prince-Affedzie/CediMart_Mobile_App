// src/screens/main/CampusProductsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductsByCampus } from '../apis/productApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMPUS_META = {
  UG:     { label: 'University of Ghana',           short: 'UG',     color: '#1B5E20', accent: '#43A047', emoji: '🎓' },
  KNUST:  { label: 'KNUST',                          short: 'KNUST',  color: '#1A237E', accent: '#3949AB', emoji: '⚙️' },
  UCC:    { label: 'University of Cape Coast',       short: 'UCC',    color: '#4A148C', accent: '#7B1FA2', emoji: '🌊' },
  UEW:    { label: 'Univ. of Education, Winneba',    short: 'UEW',    color: '#B71C1C', accent: '#E53935', emoji: '📚' },
  UPSA:   { label: 'UPSA',                           short: 'UPSA',   color: '#E65100', accent: '#F57C00', emoji: '📊' },
  GIMPA:  { label: 'GIMPA',                          short: 'GIMPA',  color: '#004D40', accent: '#00796B', emoji: '🏛️' },
  ASHESI: { label: 'Ashesi University',              short: 'ASHESI', color: '#880E4F', accent: '#AD1457', emoji: '💡' },
  ATU:    { label: 'Accra Technical University',    short: 'ATU',    color: '#1565C0', accent: '#1976D2', emoji: '🔧' },
  OTHER:  { label: 'Other Campus',                  short: 'OTHER',  color: '#37474F', accent: '#546E7A', emoji: '🏫' },
};

const CATEGORIES = [
  { key: '',                      label: 'All',           icon: 'apps-outline'         },
  { key: 'electronics',           label: 'Electronics',   icon: 'flash-outline'        },
  { key: 'phones and tablets',    label: 'Phones',        icon: 'phone-portrait-outline'},
  { key: 'computers and laptops', label: 'Computers',     icon: 'laptop-outline'       },
  { key: 'gaming',                label: 'Gaming',        icon: 'game-controller-outline'},
  { key: 'fashion',               label: 'Fashion',       icon: 'shirt-outline'        },
  { key: 'books-course-materials',label: 'Books',         icon: 'book-outline'         },
  { key: 'hostel-items',          label: 'Hostel',        icon: 'home-outline'         },
  { key: 'appliances',            label: 'Appliances',    icon: 'tv-outline'           },
  { key: 'furniture',             label: 'Furniture',     icon: 'bed-outline'          },
  { key: 'beauty and grooming',   label: 'Beauty',        icon: 'color-palette-outline'},
  { key: 'sports and fitness',    label: 'Sports',        icon: 'bicycle-outline'      },
  { key: 'food and drinks',       label: 'Food',          icon: 'fast-food-outline'    },
  { key: 'services',              label: 'Services',      icon: 'construct-outline'    },
  { key: 'other',                 label: 'Other',         icon: 'ellipsis-horizontal-outline'},
];

const SORT_OPTIONS = [
  { key: 'newest',     label: 'Newest First',       icon: 'time-outline'          },
  { key: 'price-asc',  label: 'Price: Low to High', icon: 'arrow-up-outline'      },
  { key: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down-outline'    },
  { key: 'popular',    label: 'Most Viewed',         icon: 'trending-up-outline'   },
];

const CONDITION_CONFIG = {
  'new':           { label: 'New',           bg: '#E8F5E9', text: '#2E7D32' },
  'like-new':      { label: 'Like New',      bg: '#E8F5E9', text: '#2E7D32' },
  'excellent':     { label: 'Excellent',     bg: '#E3F2FD', text: '#1565C0' },
  'good':          { label: 'Good',          bg: '#FFF8E1', text: '#F57F17' },
  'fair':          { label: 'Fair',          bg: '#FFF3E0', text: '#E65100' },
  'slightly-used': { label: 'Slightly Used', bg: '#FFF3E0', text: '#E65100' },
  'for-parts':     { label: 'For Parts',     bg: '#FFEBEE', text: '#C62828' },
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300/F5F5F5/BDBDBD?text=No+Image';

// ─── Sub-components ───────────────────────────────────────────────────────────

// Skeleton loader card
const SkeletonCard = ({ color }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}>
      <View style={[styles.skeletonImg, { backgroundColor: color + '22' }]} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '80%', backgroundColor: color + '18' }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 10, backgroundColor: color + '18' }]} />
        <View style={[styles.skeletonLine, { width: '60%', height: 20, backgroundColor: color + '18' }]} />
      </View>
    </Animated.View>
  );
};

// Product card
const ProductCard = React.memo(({ item, onPress, campusColor }) => {
  const condition = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG['good'];
  const isAvailable = item.isAvailable && (item.countInStock ?? 0) > 0;
  const isLowStock = isAvailable && (item.countInStock ?? 0) <= 3;
  const imageUri = item.images?.[0] || PLACEHOLDER_IMAGE;
  const hasMultipleImages = (item.images?.length ?? 0) > 1;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
    >
      {/* Image */}
      <View style={styles.cardImgWrap}>
        <Image source={{ uri: imageUri }} style={styles.cardImg} resizeMode="cover" />

        {/* Condition badge */}
        <View style={[styles.conditionBadge, { backgroundColor: condition.bg }]}>
          <Text style={[styles.conditionBadgeText, { color: condition.text }]}>
            {condition.label}
          </Text>
        </View>

        {/* Negotiable */}
        {item.negotiable && (
          <View style={[styles.negotiableTag, { backgroundColor: campusColor + 'EE' }]}>
            <Text style={styles.negotiableTagText}>Nego.</Text>
          </View>
        )}

        {/* Sold out */}
        {!isAvailable && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosText}>Sold Out</Text>
          </View>
        )}

        {/* Low stock */}
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="flame" size={9} color="#fff" />
            <Text style={styles.lowStockText}>{item.countInStock} left</Text>
          </View>
        )}

        {/* Multi-image indicator */}
        {hasMultipleImages && (
          <View style={styles.imgCountBadge}>
            <Ionicons name="images-outline" size={9} color="#fff" />
            <Text style={styles.imgCountText}>{item.images.length}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

        {/* Location row */}
        {item.location?.campusArea && (
          <View style={styles.cardLocRow}>
            <Ionicons name="location-outline" size={10} color="#BDBDBD" />
            <Text style={styles.cardLocText} numberOfLines={1}>
              {item.location.campusArea}
              {item.location.hostel ? ` · ${item.location.hostel}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.cardPrice, { color: campusColor }]}>
              GH₵ {item.price?.toFixed(2)}
            </Text>
            {item.vendor?.name && (
              <Text style={styles.cardVendor} numberOfLines={1}>
                @{item.vendor.name}
              </Text>
            )}
          </View>
          
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CampusProductsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { campus } = route.params;

  const meta = CAMPUS_META[campus] || CAMPUS_META.OTHER;
  const campusColor = meta.color;
  const campusAccent = meta.accent;

  // ── Data state ──
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');

  // ── UI state ──
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ── Refs ──
  const searchRef = useRef(null);
  const searchDebounce = useRef(null);
  const heroAnim = useRef(new Animated.Value(1.06)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroAnim, { toValue: 1, tension: 55, friction: 11, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    fetchProducts(1, true);
  }, [selectedCategory, selectedSort]);

  // Debounce search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchProducts(1, true);
    }, 420);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  // ── API ───────────────────────────────────────────────────────────────────
  const fetchProducts = async (pageNum = 1, reset = false) => {
    try {
      reset ? setLoading(true) : setLoadingMore(true);
      setError(null);

      const params = { page: pageNum, limit: 20, sort: selectedSort };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getProductsByCampus(campus, params);

      if (res?.data?.success) {
        const data = res.data.data || [];
        setProducts(prev => reset ? data : [...prev, ...data]);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.total || 0);
        setPage(pageNum);
      } else {
        setError('Failed to load listings.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1, true);
  }, [selectedCategory, selectedSort, searchQuery]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      fetchProducts(page + 1, false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProductPress = useCallback((product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  }, [navigation]);

  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
  };

  const handleSortSelect = (key) => {
    setSelectedSort(key);
    setShowSortSheet(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSort('newest');
    setSearchQuery('');
  };

  const activeFilterCount = [selectedCategory].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || selectedSort !== 'newest';

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderProduct = ({ item, index }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ProductCard
        item={item}
        onPress={handleProductPress}
        campusColor={campusColor}
      />
    </Animated.View>
  );

  const renderListHeader = () => (
    <>
      {/* ══════════════════════ HERO ══════════════════════ */}
      <View style={[styles.hero, { backgroundColor: campusColor }]}>
        {/* Decorative circles */}
        <View style={[styles.heroCircle1, { backgroundColor: campusAccent + '50' }]} />
        <View style={[styles.heroCircle2, { backgroundColor: campusAccent + '30' }]} />
        <View style={[styles.heroCircle3, { backgroundColor: '#ffffff10' }]} />

        <SafeAreaView edges={['top']} style={styles.heroContent}>
          {/* Nav row */}
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroBackBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroNavRight}>
              <TouchableOpacity
                style={[styles.heroIconBtn, hasActiveFilters && styles.heroIconBtnActive]}
                onPress={() => setShowFilterSheet(true)}
              >
                <Ionicons name="options-outline" size={18} color="#fff" />
                {hasActiveFilters && <View style={styles.filterDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroIconBtn}
                onPress={() => setShowSortSheet(true)}
              >
                <Ionicons name="swap-vertical-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campus identity */}
          <View style={styles.heroIdentity}>
            <Text style={styles.heroEmoji}>{meta.emoji}</Text>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroShort}>{meta.short}</Text>
              <Text style={styles.heroFull} numberOfLines={2}>{meta.label}</Text>
              <View style={styles.heroStatRow}>
                {loading ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                ) : (
                  <>
                    <View style={styles.heroStatChip}>
                      <Ionicons name="storefront-outline" size={11} color="rgba(255,255,255,0.85)" />
                      <Text style={styles.heroStatText}>
                        {total} {total === 1 ? 'listing' : 'listings'}
                      </Text>
                    </View>
                    {selectedCategory && (
                      <View style={styles.heroStatChip}>
                        <Ionicons name="filter-outline" size={11} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.heroStatText}>
                          {CATEGORIES.find(c => c.key === selectedCategory)?.label}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBarWrap, isSearchFocused && styles.searchBarFocused]}>
            <Ionicons
              name="search-outline"
              size={16}
              color={isSearchFocused ? campusAccent : '#9E9E9E'}
              style={{ marginLeft: 14 }}
            />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder={`Search listings at ${meta.short}…`}
              placeholderTextColor="#BDBDBD"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color="#BDBDBD" />
              </TouchableOpacity>
            ) : (
              <View style={[styles.searchMicBtn, { backgroundColor: campusAccent + '20' }]}>
                <Ionicons name="mic-outline" size={14} color={campusAccent} />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* ══════════════════════ CATEGORY STRIP ══════════════════════ */}
      <View style={styles.categoryWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catPill,
                  isActive && { backgroundColor: campusColor, borderColor: campusColor },
                ]}
                onPress={() => handleCategorySelect(cat.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isActive ? '#fff' : '#757575'}
                />
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ══════════════════════ TOOLBAR ══════════════════════ */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount} numberOfLines={1}>
          {loading
            ? 'Loading…'
            : `${total} listing${total !== 1 ? 's' : ''}${searchQuery ? ` for "${searchQuery}"` : ''}`}
        </Text>
        <View style={styles.toolbarRight}>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Ionicons name="close-circle-outline" size={14} color="#E53935" />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.toolbarSortBtn}
            onPress={() => setShowSortSheet(true)}
          >
            <Ionicons name="swap-vertical-outline" size={13} color={campusColor} />
            <Text style={[styles.toolbarSortText, { color: campusColor }]}>
              {SORT_OPTIONS.find(s => s.key === selectedSort)?.label.split(':')[0].split(' ')[0]}
            </Text>
            <Ionicons name="chevron-down" size={12} color={campusColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active filter pills */}
      {(selectedCategory || selectedSort !== 'newest' || searchQuery) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activePillsRow}
        >
          {selectedCategory && (
            <TouchableOpacity
              style={[styles.activePill, { borderColor: campusColor + '50', backgroundColor: campusColor + '10' }]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.activePillText, { color: campusColor }]}>
                {CATEGORIES.find(c => c.key === selectedCategory)?.label}
              </Text>
              <Ionicons name="close-circle" size={14} color={campusColor} />
            </TouchableOpacity>
          )}
          {selectedSort !== 'newest' && (
            <TouchableOpacity
              style={[styles.activePill, { borderColor: campusColor + '50', backgroundColor: campusColor + '10' }]}
              onPress={() => setSelectedSort('newest')}
            >
              <Text style={[styles.activePillText, { color: campusColor }]}>
                {SORT_OPTIONS.find(s => s.key === selectedSort)?.label}
              </Text>
              <Ionicons name="close-circle" size={14} color={campusColor} />
            </TouchableOpacity>
          )}
          {searchQuery && (
            <TouchableOpacity
              style={styles.activePill}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="search-outline" size={12} color="#555" />
              <Text style={styles.activePillText}>"{searchQuery}"</Text>
              <Ionicons name="close-circle" size={14} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Error banner */}
      {error && !loading && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts(1, true)}>
            <Text style={[styles.errorRetry, { color: campusColor }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={campusColor} />
          <Text style={styles.footerLoaderText}>Loading more…</Text>
        </View>
      );
    }
    if (!loading && products.length > 0 && page >= totalPages) {
      return (
        <View style={styles.endRow}>
          <View style={[styles.endLine, { backgroundColor: campusColor + '30' }]} />
          <Text style={styles.endText}>All {total} listings shown</Text>
          <View style={[styles.endLine, { backgroundColor: campusColor + '30' }]} />
        </View>
      );
    }
    return <View style={{ height: 100 }} />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    const isFiltered = selectedCategory || searchQuery;
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyIconCircle, { backgroundColor: campusColor + '15' }]}>
          <Text style={styles.emptyEmoji}>{meta.emoji}</Text>
        </View>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No results found' : isFiltered ? 'No matches' : 'No listings yet'}
        </Text>
        <Text style={styles.emptySub}>
          {searchQuery
            ? `Nothing matched "${searchQuery}" at ${meta.short}. Try different keywords.`
            : isFiltered
              ? 'Try removing some filters to see more listings.'
              : `Be the first to list something at ${meta.label}!`}
        </Text>
        {isFiltered && (
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: campusColor }]}
            onPress={clearFilters}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Skeleton loading grid ─────────────────────────────────────────────────
  const renderSkeletonGrid = () => (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <SkeletonCard key={i} color={campusColor} />
      ))}
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={campusColor} barStyle="light-content" translucent />

      {/* ══════════════════════ SORT MODAL ══════════════════════ */}
      <Modal
        visible={showSortSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortSheet(false)}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: campusColor }]}>Sort By</Text>
          {SORT_OPTIONS.map(opt => {
            const active = selectedSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetRow, active && { backgroundColor: campusColor + '10' }]}
                onPress={() => handleSortSelect(opt.key)}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.sheetRowIcon,
                  active && { backgroundColor: campusColor },
                ]}>
                  <Ionicons name={opt.icon} size={16} color={active ? '#fff' : '#888'} />
                </View>
                <Text style={[styles.sheetRowText, active && { color: campusColor, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={20} color={campusColor} />}
              </TouchableOpacity>
            );
          })}
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* ══════════════════════ FILTER MODAL ══════════════════════ */}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterSheet(false)}
        />
        <View style={[styles.bottomSheet, { maxHeight: '75%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: campusColor }]}>Filter</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.sheetClearText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterChipsGrid}>
              {CATEGORIES.map(cat => {
                const active = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.filterChip,
                      active && { backgroundColor: campusColor, borderColor: campusColor },
                    ]}
                    onPress={() => {
                      setSelectedCategory(active ? '' : cat.key);
                    }}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={active ? '#fff' : '#757575'}
                    />
                    <Text style={[styles.filterChipText, active && { color: '#fff' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 20 }]}>Sort By</Text>
            {SORT_OPTIONS.map(opt => {
              const active = selectedSort === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sheetRow, active && { backgroundColor: campusColor + '10' }]}
                  onPress={() => setSelectedSort(opt.key)}
                >
                  <View style={[styles.sheetRowIcon, active && { backgroundColor: campusColor }]}>
                    <Ionicons name={opt.icon} size={15} color={active ? '#fff' : '#888'} />
                  </View>
                  <Text style={[styles.sheetRowText, active && { color: campusColor, fontWeight: '700' }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={campusColor} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: campusColor }]}
            onPress={() => setShowFilterSheet(false)}
          >
            <Text style={styles.applyBtnText}>
              Apply{hasActiveFilters ? ` (${activeFilterCount + (selectedSort !== 'newest' ? 1 : 0)} active)` : ''}
            </Text>
          </TouchableOpacity>
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* ══════════════════════ MAIN LIST ══════════════════════ */}
      {loading && products.length === 0 ? (
        <View style={styles.container}>
          {renderListHeader()}
          {renderSkeletonGrid()}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id?.toString() || String(Math.random())}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={campusColor}
              colors={[campusColor]}
              progressBackgroundColor="#fff"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          extraData={[selectedCategory, selectedSort, searchQuery]}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },
  listContent: { paddingBottom: 32 },
  columnWrapper: {
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 10,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingBottom: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    right: -60, top: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    right: 40, bottom: 10,
  },
  heroCircle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    left: 30, top: 80,
  },
  heroContent: { paddingHorizontal: 16 },
  heroNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, paddingBottom: 16,
  },
  heroBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroNavRight: { flexDirection: 'row', gap: 8 },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  heroIconBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FFB300', borderWidth: 1.5, borderColor: '#fff',
  },
  heroIdentity: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 18,
  },
  heroEmoji: { fontSize: 44 },
  heroTextBlock: { flex: 1 },
  heroShort: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2,
  },
  heroFull: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    lineHeight: 26, letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroStatRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  heroStatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroStatText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  // Search
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    overflow: 'hidden',
  },
  searchBarFocused: { borderColor: 'rgba(255,255,255,0.6)' },
  searchInput: {
    flex: 1, fontSize: 14, color: '#212121',
    paddingVertical: 13, paddingHorizontal: 10,
  },
  searchClearBtn: { padding: 12 },
  searchMicBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },

  // Category strip
  categoryWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  categoryScroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  catPillTextActive: { color: '#fff' },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: 6,
  },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500', flex: 1, marginRight: 8 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#FFEBEE', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#E53935' },
  toolbarSortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F4F6F4', borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  toolbarSortText: { fontSize: 12, fontWeight: '700' },

  // Active pills
  activePillsRow: {
    paddingHorizontal: 14, paddingBottom: 8, paddingTop: 2, gap: 8,
  },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20,
  },
  activePillText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFCDD2',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#C62828', fontWeight: '500' },
  errorRetry: { fontSize: 13, fontWeight: '700' },

  // Product card
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 7, elevation: 3,
  },
  cardImgWrap: { position: 'relative', height: 142, backgroundColor: '#F5F5F5' },
  cardImg: { width: '100%', height: '100%' },
  conditionBadge: {
    position: 'absolute', top: 7, left: 7,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  conditionBadgeText: { fontSize: 9, fontWeight: '800' },
  negotiableTag: {
    position: 'absolute', top: 7, right: 7,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7,
  },
  negotiableTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  lowStockBadge: {
    position: 'absolute', bottom: 7, left: 7,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E53935', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 7, gap: 3,
  },
  lowStockText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  imgCountBadge: {
    position: 'absolute', bottom: 7, right: 7,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, gap: 3,
  },
  imgCountText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  cardBody: { padding: 10, paddingTop: 9 },
  cardName: {
    fontSize: 12, fontWeight: '700', color: '#1A1A1A',
    lineHeight: 17, minHeight: 34, marginBottom: 4,
  },
  cardLocRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6,
  },
  cardLocText: { fontSize: 10, color: '#BDBDBD', flex: 1 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  cardPrice: { fontSize: 16, fontWeight: '900' },
  cardVendor: { fontSize: 10, color: '#BDBDBD', marginTop: 1 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 9, borderWidth: 1,
  },
  viewBtnText: { fontSize: 10, fontWeight: '700' },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, gap: 12,
    paddingTop: 10,
  },
  skeletonCard: {
    width: CARD_WIDTH, borderRadius: 16,
    backgroundColor: '#fff', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    marginBottom: 10,
  },
  skeletonImg: { width: '100%', height: 142 },
  skeletonBody: { padding: 10, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },

  // Load more / end
  footerLoader: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, paddingVertical: 20,
  },
  footerLoaderText: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  endRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 28, gap: 12,
  },
  endLine: { flex: 1, height: 1 },
  endText: { fontSize: 11, color: '#BDBDBD', fontWeight: '600' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconCircle: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  emptySub: {
    fontSize: 13, color: '#9E9E9E', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 18,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  sheetClearText: { fontSize: 13, color: '#E53935', fontWeight: '600' },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 4, gap: 12,
  },
  sheetRowIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetRowText: { flex: 1, fontSize: 14, color: '#424242', fontWeight: '500' },

  // Filter sheet
  filterLabel: {
    fontSize: 11, fontWeight: '800', color: '#9E9E9E',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  filterChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  applyBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginTop: 18, marginBottom: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 5,
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default CampusProductsScreen;