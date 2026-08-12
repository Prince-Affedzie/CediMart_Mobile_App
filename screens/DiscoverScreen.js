// src/screens/discover/DiscoverScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - GRID_GAP) / 2;
const BANNER_HEIGHT = 120;

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
};

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'phones and tablets', label: 'Phones & Tablets' },
  { key: 'computers and laptops', label: 'Computers' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'books-course-materials', label: 'Books' },
  { key: 'hostel-items', label: 'Hostel Items' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'beauty and grooming', label: 'Beauty' },
  { key: 'sports and fitness', label: 'Sports' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'food and drinks', label: 'Food & Drinks' },
  { key: 'services', label: 'Services' },
  { key: 'other', label: 'Other' },
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
  { key: 'createdAt', order: 'desc', label: 'Newest' },
  { key: 'rating', order: 'desc', label: 'Top rated' },
  { key: 'totalSales', order: 'desc', label: 'Most sales' },
];

const PAGE_LIMIT = 16;
const SEARCH_DEBOUNCE_MS = 400;

const FALLBACK_COLORS = [
  '#0D9488', '#7C3AED', '#F97316', '#0284C7', '#059669', '#EC4899',
];

const getFallbackColor = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};

const isRealImageUrl = (val) => !!val && /^https?:\/\//i.test(val);

// ─── Category / Filter Chip ────────────────────────────────────────────────
const Chip = ({ label, active, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon ? <Ionicons name={icon} size={13} color={active ? '#fff' : C.textOff} style={{ marginRight: 4 }} /> : null}
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Vendor Grid Card ───────────────────────────────────────────────────────
const VendorGridCard = ({ vendor, onPress }) => {
  const hasBanner = isRealImageUrl(vendor.storeBanner);
  const hasAvatar = isRealImageUrl(vendor.profileImage);
  const fallbackColor = getFallbackColor(vendor._id);
  const displayName = vendor.storeName || vendor.name;
  const campusLabel = CAMPUSES.find((c) => c.key === vendor.campus)?.label || vendor.campus;
  const areaLabel = vendor.location?.campusArea;
  const primaryCategory = vendor.categories?.[0];
  const categoryLabel = CATEGORIES.find((c) => c.key === primaryCategory)?.label;
  const productCount = vendor.productCount ?? vendor.products?.length ?? 0;

  return (
    <TouchableOpacity style={styles.gridCard} onPress={() => onPress(vendor)} activeOpacity={0.88}>
      {/* Banner */}
      <View style={styles.bannerWrap}>
        {hasBanner ? (
          <Image source={{ uri: vendor.storeBanner }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={[styles.banner, { backgroundColor: fallbackColor }]}>
            <Ionicons name="storefront-outline" size={28} color="rgba(255,255,255,0.35)" />
            <View style={styles.bannerPattern}>
              <Ionicons name="storefront-outline" size={70} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -15, bottom: -20 }} />
            </View>
          </View>
        )}

        {vendor.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
          </View>
        )}

        {categoryLabel && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText} numberOfLines={1}>{categoryLabel}</Text>
          </View>
        )}

        {/* Avatar overlapping the banner's bottom edge */}
        <View style={styles.avatarRing}>
          {hasAvatar ? (
            <Image source={{ uri: vendor.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.storeName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {campusLabel || 'Campus not set'}{areaLabel ? ` · ${areaLabel}` : ''}
        </Text>

        <View style={styles.statsRow}>
          <Ionicons name="star" size={12} color={C.gold} />
          <Text style={styles.statsText}>{vendor.rating?.toFixed(1) || '0.0'}</Text>
          <View style={styles.statsDot} />
          <Text style={styles.statsText}>{productCount} item{productCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  const [activeCampus, setActiveCampus] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [showCampusFilter, setShowCampusFilter] = useState(false);

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
    [search, activeCampus, activeCategory, verifiedOnly, sort]
  );

  useEffect(() => {
    fetchVendors(1);
  }, [search, activeCampus, activeCategory, verifiedOnly, sort]);

  const handleRefresh = () => fetchVendors(1, { refresh: true });
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchVendors(page + 1);
  };
  const handleVendorPress = (vendor) => {
    navigation.navigate('VendorDetail', { vendorId: vendor._id });
  };

  const activeFilterCount = (activeCampus ? 1 : 0) + (activeCategory ? 1 : 0) + (verifiedOnly ? 1 : 0);

  const renderHeader = () => (
    <View>
      {/* Title + stats */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.screenTitle}>Discover</Text>
          <Text style={styles.screenSubtitle}>
            {stats ? `${stats.totalVendors} vendor${stats.totalVendors !== 1 ? 's' : ''} on campus` : 'Find vendors near you'}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors, stores, campus area..."
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
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key || 'all'}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <Chip label={item.label} active={activeCategory === item.key} onPress={() => setActiveCategory(item.key)} />
        )}
      />

      {/* Campus / verified / sort row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeCampus && styles.filterPillActive]}
          onPress={() => setShowCampusFilter((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="school-outline" size={14} color={activeCampus ? '#fff' : C.textOff} />
          <Text style={[styles.filterPillText, activeCampus && styles.filterPillTextActive]} numberOfLines={1}>
            {CAMPUSES.find((c) => c.key === activeCampus)?.label || 'Campus'}
          </Text>
          <Ionicons name={showCampusFilter ? 'chevron-up' : 'chevron-down'} size={13} color={activeCampus ? '#fff' : C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, verifiedOnly && styles.filterPillActive]}
          onPress={() => setVerifiedOnly((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={14} color={verifiedOnly ? '#fff' : C.textOff} />
          <Text style={[styles.filterPillText, verifiedOnly && styles.filterPillTextActive]}>Verified</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortPill}
          onPress={() => {
            const idx = SORT_OPTIONS.findIndex((o) => o.key === sort.key && o.order === sort.order);
            setSort(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical-outline" size={14} color={C.brand} />
          <Text style={styles.sortPillText}>{sort.label}</Text>
        </TouchableOpacity>
      </View>

      {/* Campus dropdown */}
      {showCampusFilter && (
        <View style={styles.campusDropdown}>
          {CAMPUSES.map((c) => (
            <TouchableOpacity
              key={c.key || 'all'}
              style={styles.campusOption}
              onPress={() => { setActiveCampus(c.key); setShowCampusFilter(false); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.campusOptionText, activeCampus === c.key && styles.campusOptionTextActive]}>{c.label}</Text>
              {activeCampus === c.key && <Ionicons name="checkmark" size={16} color={C.brand} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeFilterCount > 0 && (
        <TouchableOpacity
          style={styles.clearFiltersBtn}
          onPress={() => { setActiveCampus(''); setActiveCategory(''); setVerifiedOnly(false); }}
        >
          <Text style={styles.clearFiltersText}>Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="storefront-outline" size={36} color={C.brand} />
        </View>
        <Text style={styles.emptyTitle}>No vendors found</Text>
        <Text style={styles.emptySub}>
          {search || activeCampus || activeCategory || verifiedOnly
            ? 'Try adjusting your search or filters'
            : 'Check back soon as more vendors join CediMart'}
        </Text>
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
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Finding vendors…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
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
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { gap: GRID_GAP },

  titleRow: { paddingTop: 12, marginBottom: 16 },
  screenTitle: { fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 3 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, height: '100%' },

  chipRow: { gap: 8, paddingBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
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

  campusDropdown: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    marginBottom: 12, overflow: 'hidden',
  },
  campusOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  campusOptionText: { fontSize: 13.5, color: C.textOff },
  campusOptionTextActive: { color: C.brand, fontWeight: '700' },

  clearFiltersBtn: { alignSelf: 'flex-start', marginBottom: 14 },
  clearFiltersText: { fontSize: 12.5, fontWeight: '700', color: C.accent },

  // ─── Vendor grid card ────────────────────────────────────────────────────
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: GRID_GAP,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(2,132,199,0.85)',
    borderRadius: 10,
    padding: 2,
  },
  categoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  },
  avatar: { width: '100%', height: '100%', borderRadius: 21 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: C.brandDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 17, fontWeight: '800', color: C.brand },

  cardBody: {
    paddingTop: 28,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  storeName: { fontSize: 14, fontWeight: '800', color: C.text },
  metaText: { fontSize: 11.5, color: C.textMuted, marginTop: 3 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  statsText: { fontSize: 11.5, color: C.textOff, fontWeight: '600' },
  statsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textMuted,
    marginHorizontal: 4,
  },

  // Empty / loading
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.brandDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textOff },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

export default DiscoverScreen;