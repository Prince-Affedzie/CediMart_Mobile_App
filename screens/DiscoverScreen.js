// src/screens/discover/DiscoverScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - GRID_GAP) / 2;
const BANNER_HEIGHT = 116;

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  success: '#059669',
  successBg: '#ECFDF5',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  danger: '#DC2626',
  gold: '#F59E0B',
  skeleton: '#EEF2F6',
};

// ─── Category → { color, icon } — kept in sync with the vendor sign-up
// form's category list, including the 6 service-oriented categories added
// for the business-discovery push (tutoring, photography, repairs, etc).
const CATEGORY_META = {
  '':                          { label: 'All',                  icon: 'grid-outline',                       color: C.brand },
  'electronics':                { label: 'Electronics',          icon: 'hardware-chip-outline',              color: '#2563EB' },
  'phones and tablets':         { label: 'Phones & Tablets',     icon: 'phone-portrait-outline',             color: '#7C3AED' },
  'computers and laptops':      { label: 'Computers',            icon: 'laptop-outline',                     color: '#0891B2' },
  'gaming':                     { label: 'Gaming',                icon: 'game-controller-outline',            color: '#DB2777' },
  'fashion':                    { label: 'Fashion',               icon: 'shirt-outline',                      color: '#DC2626' },
  'books-course-materials':     { label: 'Books',                 icon: 'book-outline',                       color: '#B45309' },
  'hostel-items':               { label: 'Hostel Items',          icon: 'bed-outline',                        color: '#0D9488' },
  'appliances':                  { label: 'Appliances',           icon: 'tv-outline',                         color: '#475569' },
  'furniture':                  { label: 'Furniture',             icon: 'cube-outline',                       color: '#92400E' },
  'beauty and grooming':        { label: 'Beauty',                icon: 'sparkles-outline',                   color: '#EC4899' },
  'sports and fitness':         { label: 'Sports',                icon: 'basketball-outline',                 color: '#16A34A' },
  'accessories':                 { label: 'Accessories',          icon: 'watch-outline',                      color: '#CA8A04' },
  'food and drinks':            { label: 'Food & Drinks',         icon: 'fast-food-outline',                  color: '#EA580C' },
  'services':                    { label: 'Services',             icon: 'construct-outline',                  color: '#0284C7' },
  'tutoring-education':         { label: 'Tutoring',              icon: 'school-outline',                     color: '#4F46E5' },
  'photography-media':          { label: 'Photography',           icon: 'camera-outline',                     color: '#0EA5E9' },
  'graphic-design-printing':    { label: 'Design & Print',        icon: 'color-palette-outline',              color: '#9333EA' },
  'repair-services':            { label: 'Repairs',               icon: 'build-outline',                      color: '#65A30D' },
  'events-catering':            { label: 'Events & Catering',     icon: 'restaurant-outline',                 color: '#F59E0B' },
  'accommodation-housing':      { label: 'Housing',               icon: 'home-outline',                       color: '#0F766E' },
  'other':                       { label: 'Other',                icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
};
const CATEGORIES = Object.keys(CATEGORY_META).map((key) => ({ key, ...CATEGORY_META[key] }));

// 🔥 NEW: primary Shops/Services split — this is the core navigation axis
// from the business-discovery plan ("I need a product" vs "I need a
// service"), so it's a persistent segmented control, not buried in a sheet.
const BUSINESS_TYPE_FILTERS = [
  { key: '', label: 'All', icon: 'apps-outline' },
  { key: 'product', label: 'Shops', icon: 'storefront-outline' },
  { key: 'service', label: 'Services', icon: 'construct-outline' },
];

const CAMPUSES = [
  { key: '', label: 'All campuses' },
  { key: 'UG', label: 'University of Ghana' },
  { key: 'KNUST', label: 'KNUST' },
  { key: 'UCC', label: 'Univ. of Cape Coast' },
  { key: 'UEW', label: 'Univ. of Ed., Winneba' },
  { key: 'UPSA', label: 'UPSA' },
  { key: 'GIMPA', label: 'GIMPA' },
  { key: 'ASHESI', label: 'Ashesi University' },
  { key: 'ATU', label: 'Accra Technical Univ.' },
  { key: 'OTHER', label: 'Other' },
];

const SORT_OPTIONS = [
  { key: 'createdAt', order: 'desc', label: 'Newest first', icon: 'time-outline' },
  { key: 'rating', order: 'desc', label: 'Top rated', icon: 'star-outline' },
  { key: 'totalSales', order: 'desc', label: 'Most sales', icon: 'trending-up-outline' },
];

const PAGE_LIMIT = 16;
const SEARCH_DEBOUNCE_MS = 400;

const isRealImageUrl = (val) => !!val && /^https?:\/\//i.test(val);

// Darkens a #rrggbb hex by `percent` (0–100) — used to build a 2-stop
// gradient out of a single category color instead of a flat fill.
const shade = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const b = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
};

// ─── Press-scale wrapper for a tactile, premium feel on tap ────────────────
const Pressy = ({ onPress, style, children, scaleTo = 0.96 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ─── Shops / Services segmented control ─────────────────────────────────────
const BusinessTypeTabs = ({ value, onChange }) => (
  <View style={styles.businessTypeTabs}>
    {BUSINESS_TYPE_FILTERS.map((opt) => {
      const active = value === opt.key;
      return (
        <TouchableOpacity
          key={opt.key || 'all'}
          style={[styles.businessTypeTab, active && styles.businessTypeTabActive]}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(opt.key); }}
          activeOpacity={0.8}
        >
          <Ionicons name={opt.icon} size={14} color={active ? '#fff' : C.textOff} />
          <Text style={[styles.businessTypeTabText, active && styles.businessTypeTabTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Category chip (icon + label) ──────────────────────────────────────────
const CategoryChip = ({ item, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && { backgroundColor: item.color, borderColor: item.color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={item.icon} size={13} color={active ? '#fff' : item.color} style={{ marginRight: 5 }} />
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
  </TouchableOpacity>
);

// ─── Bottom-sheet style option picker (used for Campus + Sort) ─────────────
const OptionSheet = ({ visible, title, options, selectedKey, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={sheetStyles.backdrop} onPress={onClose}>
      <Pressable style={sheetStyles.sheet} onPress={() => {}}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.title}>{title}</Text>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const isSelected = opt.key === selectedKey;
            return (
              <TouchableOpacity
                key={opt.key || 'all'}
                style={[sheetStyles.option, isSelected && sheetStyles.optionSelected]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                {opt.icon && <Ionicons name={opt.icon} size={17} color={isSelected ? C.brand : C.textOff} style={{ marginRight: 10 }} />}
                <Text style={[sheetStyles.optionText, isSelected && sheetStyles.optionTextSelected]}>{opt.label}</Text>
                {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.brand} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Vendor Grid Card ───────────────────────────────────────────────────────
const VendorGridCard = ({ vendor, onPress }) => {
  const hasBanner = isRealImageUrl(vendor.storeBanner);
  const hasAvatar = isRealImageUrl(vendor.profileImage);
  const displayName = vendor.storeName || vendor.name;
  const campusLabel = CAMPUSES.find((c) => c.key === vendor.campus)?.label || vendor.campus;
  const areaLabel = vendor.location?.campusArea;
  const primaryCategory = vendor.categories?.[0];
  const categoryMeta = CATEGORY_META[primaryCategory] || CATEGORY_META.other;
  const productCount = vendor.productCount ?? vendor.products?.length ?? 0;
  const isServiceOnly = vendor.businessType === 'service';

  return (
    <Pressy onPress={() => onPress(vendor)} style={styles.gridCard}>
      {/* Banner */}
      <View style={styles.bannerWrap}>
        {hasBanner ? (
          <Image source={{ uri: vendor.storeBanner }} style={styles.banner} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[categoryMeta.color, shade(categoryMeta.color, 22)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <Ionicons name={categoryMeta.icon} size={68} color="rgba(255,255,255,0.14)" style={styles.bannerIconDecor} />
          </LinearGradient>
        )}
        <View style={styles.bannerScrim} pointerEvents="none" />

        {vendor.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#fff" />
          </View>
        )}

        {primaryCategory !== undefined && categoryMeta && (
          <View style={[styles.categoryTag, { backgroundColor: hasBanner ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.22)' }]}>
            <Ionicons name={categoryMeta.icon} size={9} color="#fff" />
            <Text style={styles.categoryTagText} numberOfLines={1}>{categoryMeta.label}</Text>
          </View>
        )}

        {/* Avatar overlapping the banner's bottom edge */}
        <View style={styles.avatarRing}>
          {hasAvatar ? (
            <Image source={{ uri: vendor.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: categoryMeta.color + '22' }]}>
              <Text style={[styles.avatarInitial, { color: categoryMeta.color }]}>{displayName?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.storeName} numberOfLines={1}>{displayName}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={10.5} color={C.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {campusLabel || 'Campus not set'}{areaLabel ? ` · ${areaLabel}` : ''}
          </Text>
        </View>

        {/* 🔥 NEW: opening hours, when a business has set one — most
            relevant for service businesses (tutors, repairs) where "when
            can I reach them" matters more than a product catalog. */}
        {!!vendor.openingHours && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={10.5} color={C.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{vendor.openingHours}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="star" size={11} color={C.gold} />
            <Text style={styles.statChipText}>{vendor.rating?.toFixed(1) || '0.0'}</Text>
          </View>
          {/* 🔥 NEW: a pure-service business has no product catalog, so
              showing "0 items" reads as broken. Show a "Message to book"
              cue instead — matches how they're actually contacted. */}
          {isServiceOnly ? (
            <View style={styles.statChip}>
              <Ionicons name="chatbubble-ellipses-outline" size={11} color={C.info} />
              <Text style={styles.statChipText}>Message to book</Text>
            </View>
          ) : (
            <View style={styles.statChip}>
              <Ionicons name="cube-outline" size={11} color={C.textOff} />
              <Text style={styles.statChipText}>{productCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressy>
  );
};

// ─── Skeleton grid (shown on first load, in place of the old spinner) ──────
const SkeletonCard = ({ delay = 0 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 800, delay, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  return (
    <View style={styles.gridCard}>
      <Animated.View style={[styles.banner, { backgroundColor: C.skeleton, opacity }]} />
      <View style={styles.cardBody}>
        <Animated.View style={[skeletonStyles.line, { width: '70%', height: 13, opacity }]} />
        <Animated.View style={[skeletonStyles.line, { width: '50%', height: 10, marginTop: 8, opacity }]} />
        <Animated.View style={[skeletonStyles.line, { width: '35%', height: 10, marginTop: 10, opacity }]} />
      </View>
    </View>
  );
};

const SkeletonGrid = () => (
  <View style={styles.skeletonGrid}>
    {[0, 100, 200, 300, 400, 500].map((delay, i) => <SkeletonCard key={i} delay={delay} />)}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const DiscoverScreen = () => {
  const navigation = useNavigation();

  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeBusinessType, setActiveBusinessType] = useState(''); // 🔥 NEW
  const [activeCampus, setActiveCampus] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [showCampusSheet, setShowCampusSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  const fetchVendors = useCallback(
    async (pageNum = 1, { refresh = false } = {}) => {
      try {
        if (refresh) setRefreshing(true);
        else if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await getVendors({
          search: search || undefined,
          campus: activeCampus || undefined,
          category: activeCategory || undefined,
          businessType: activeBusinessType || undefined, // 🔥 NEW
          isVerified: verifiedOnly ? true : undefined,
          sortBy: sort.key,
          order: sort.order,
          page: pageNum,
          limit: PAGE_LIMIT,
        });

        const body = res?.data || {};
        const newVendors = body.data || [];
        const pagination = body.pagination || {};

        setVendors((prev) => (pageNum === 1 ? newVendors : [...prev, ...newVendors]));
        setHasMore(!!pagination.hasMore);
        setPage(pageNum);
        setStats(body.stats || null);
      } catch (err) {
        console.error('Discover vendors fetch error:', err?.response?.data?.error || err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [search, activeCampus, activeCategory, activeBusinessType, verifiedOnly, sort]
  );

  useEffect(() => {
    fetchVendors(1);
  }, [search, activeCampus, activeCategory, activeBusinessType, verifiedOnly, sort]);

  const handleRefresh = () => fetchVendors(1, { refresh: true });
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchVendors(page + 1);
  };
  const handleVendorPress = (vendor) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('VendorDetail', { vendorId: vendor._id });
  };
  const toggleVerified = () => {
    Haptics.selectionAsync().catch(() => {});
    setVerifiedOnly((v) => !v);
  };
  const resetAllFilters = () => {
    setActiveBusinessType('');
    setActiveCampus('');
    setActiveCategory('');
    setVerifiedOnly(false);
  };

  const activeFilterCount =
    (activeCampus ? 1 : 0) + (activeCategory ? 1 : 0) + (verifiedOnly ? 1 : 0) + (activeBusinessType ? 1 : 0);
  const selectedCampusLabel = CAMPUSES.find((c) => c.key === activeCampus)?.label || 'Campus';

  const renderHeader = () => (
    <View>
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Discover</Text>
        <Text style={styles.screenSubtitle}>Shops and services across your campus</Text>
      </View>

      {/* Live stat strip */}
      {stats && (
        <View style={styles.statStrip}>
          <View style={styles.statPill}>
            <Ionicons name="apps-outline" size={13} color={C.brand} />
            <Text style={styles.statPillText}>{stats.totalVendors} total</Text>
          </View>
          {stats.productBusinesses > 0 && (
            <View style={styles.statPill}>
              <Ionicons name="storefront-outline" size={13} color={C.accent} />
              <Text style={styles.statPillText}>{stats.productBusinesses} shops</Text>
            </View>
          )}
          {stats.serviceBusinesses > 0 && (
            <View style={styles.statPill}>
              <Ionicons name="construct-outline" size={13} color={C.info} />
              <Text style={styles.statPillText}>{stats.serviceBusinesses} services</Text>
            </View>
          )}
          <View style={styles.statPill}>
            <Ionicons name="checkmark-circle-outline" size={13} color={C.success} />
            <Text style={styles.statPillText}>{stats.verifiedVendors} verified</Text>
          </View>
        </View>
      )}

      {/* 🔥 NEW: Shops / Services segmented control — the primary way to
          browse per the business-discovery plan */}
      <BusinessTypeTabs value={activeBusinessType} onChange={setActiveBusinessType} />

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors, tags, campus area..."
          placeholderTextColor={C.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORIES.map((item) => (
          <CategoryChip
            key={item.key || 'all'}
            item={item}
            active={activeCategory === item.key}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setActiveCategory(item.key); }}
          />
        ))}
      </ScrollView>

      {/* Campus / verified / sort row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeCampus && styles.filterPillActive]}
          onPress={() => setShowCampusSheet(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="school-outline" size={14} color={activeCampus ? '#fff' : C.textOff} />
          <Text style={[styles.filterPillText, activeCampus && styles.filterPillTextActive]} numberOfLines={1}>
            {selectedCampusLabel}
          </Text>
          <Ionicons name="chevron-down" size={13} color={activeCampus ? '#fff' : C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, verifiedOnly && styles.filterPillActive]}
          onPress={toggleVerified}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={14} color={verifiedOnly ? '#fff' : C.textOff} />
          <Text style={[styles.filterPillText, verifiedOnly && styles.filterPillTextActive]}>Verified</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortPill} onPress={() => setShowSortSheet(true)} activeOpacity={0.8}>
          <Ionicons name={sort.icon} size={14} color={C.brand} />
          <Text style={styles.sortPillText}>{sort.label}</Text>
        </TouchableOpacity>
      </View>

      {activeFilterCount > 0 && (
        <TouchableOpacity style={styles.clearFiltersBtn} onPress={resetAllFilters}>
          <Ionicons name="close-circle" size={13} color={C.accent} />
          <Text style={styles.clearFiltersText}>Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    const hasActiveFilters = search || activeCampus || activeCategory || verifiedOnly || activeBusinessType;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="storefront-outline" size={36} color={C.brand} />
        </View>
        <Text style={styles.emptyTitle}>No vendors found</Text>
        <Text style={styles.emptySub}>
          {hasActiveFilters ? 'Try adjusting your search or filters' : 'Check back soon as more vendors join CediMart'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.emptyResetBtn}
            onPress={() => { setSearchInput(''); resetAllFilters(); }}
          >
            <Text style={styles.emptyResetBtnText}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={C.brand} />
      </View>
    );
  };

  if (loading && vendors.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlatList
          key="loading-list"
          data={[]}
          renderItem={null}
          numColumns={1}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<SkeletonGrid />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        key="vendors-grid"
        data={vendors}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={vendors.length > 1 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => <VendorGridCard vendor={item} onPress={handleVendorPress} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.brand} colors={[C.brand]} />
        }
      />

      <OptionSheet
        visible={showCampusSheet}
        title="Filter by campus"
        options={CAMPUSES}
        selectedKey={activeCampus}
        onSelect={(opt) => { setActiveCampus(opt.key); setShowCampusSheet(false); }}
        onClose={() => setShowCampusSheet(false)}
      />
      <OptionSheet
        visible={showSortSheet}
        title="Sort by"
        options={SORT_OPTIONS}
        selectedKey={sort.key}
        onSelect={(opt) => { setSort(opt); setShowSortSheet(false); }}
        onClose={() => setShowSortSheet(false)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { gap: GRID_GAP },

  titleRow: { paddingTop: 14, marginBottom: 12 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.6 },
  screenSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 3 },

  statStrip: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  statPillText: { fontSize: 11.5, fontWeight: '700', color: C.textOff },

  // 🔥 NEW: Shops / Services segmented control
  businessTypeTabs: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  businessTypeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 11,
  },
  businessTypeTabActive: { backgroundColor: C.brand },
  businessTypeTabText: { fontSize: 12.5, fontWeight: '700', color: C.textOff },
  businessTypeTabTextActive: { color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderRadius: 15, paddingHorizontal: 14, height: 48,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, height: '100%' },

  chipRow: { gap: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 12.5, fontWeight: '600', color: C.textOff },
  chipTextActive: { color: '#fff' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: C.border, flexShrink: 1,
  },
  filterPillActive: { backgroundColor: C.brand, borderColor: C.brand },
  filterPillText: { fontSize: 12.5, fontWeight: '600', color: C.textOff, maxWidth: 110 },
  filterPillTextActive: { color: '#fff' },

  sortPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.brandDim, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginLeft: 'auto',
  },
  sortPillText: { fontSize: 12.5, fontWeight: '700', color: C.brand },

  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 14, marginTop: 2 },
  clearFiltersText: { fontSize: 12.5, fontWeight: '700', color: C.accent },

  // ─── Vendor grid card ────────────────────────────────────────────────────
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: GRID_GAP,
    overflow: 'visible',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerWrap: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIconDecor: { position: 'absolute', right: -14, bottom: -14 },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(2,132,199,0.9)',
    borderRadius: 10,
    padding: 2.5,
  },
  categoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: CARD_WIDTH - 50,
  },
  categoryTagText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  avatarRing: {
    position: 'absolute',
    bottom: -20,
    left: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surface,
    padding: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 21 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 17, fontWeight: '800' },

  cardBody: { paddingTop: 28, paddingHorizontal: 14, paddingBottom: 14 },
  storeName: { fontSize: 14, fontWeight: '800', color: C.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metaText: { fontSize: 11, color: C.textMuted, flexShrink: 1 },

  statsRow: { flexDirection: 'row', gap: 6, marginTop: 9, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.bg, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3,
  },
  statChipText: { fontSize: 10.5, color: C.textOff, fontWeight: '700' },

  // Skeleton grid
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  // Empty / loading
  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandDim,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyResetBtn: { marginTop: 18, backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  emptyResetBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

const skeletonStyles = StyleSheet.create({
  line: { backgroundColor: C.skeleton, borderRadius: 6 },
});

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 8, paddingHorizontal: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12,
  },
  optionSelected: { backgroundColor: C.brandDim },
  optionText: { fontSize: 14.5, color: C.textOff, fontWeight: '500', flex: 1 },
  optionTextSelected: { color: C.brand, fontWeight: '700' },
});

export default DiscoverScreen;