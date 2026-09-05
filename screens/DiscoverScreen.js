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

// ─── Design Tokens ───────────────────────────────────────────────────────────
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

// ─── Category meta ───────────────────────────────────────────────────────────
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
const THUMB_SIZE = 64; // Fixed thumbnail size

const isRealImageUrl = (val) => !!val && /^https?:\/\//i.test(val);

const shade = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const b = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
};

// ─── Press-scale wrapper ────────────────────────────────────────────────────
const Pressy = ({ onPress, style, children, scaleTo = 0.97 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ─── Trust hero ─────────────────────────────────────────────────────────────
const DiscoverHero = () => (
  <LinearGradient
    colors={[C.brand, shade(C.brand, 20)]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.hero}
  >
    <View style={styles.heroBadge}>
      <Ionicons name="shield-checkmark" size={12} color="#fff" />
      <Text style={styles.heroBadgeText}>Verified vendors</Text>
    </View>
    <Text style={styles.heroTitle}>Trusted shops,{'\n'}run by students like you</Text>
    <Text style={styles.heroSub}>Buy and book from vendors on your own campus</Text>
    <Ionicons name="bag-handle" size={84} color="rgba(255,255,255,0.14)" style={styles.heroIconDecor} />
  </LinearGradient>
);

// ─── Business type dropdown button ─────────────────────────────────────────
const BusinessTypeDropdown = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);
  const selectedLabel = BUSINESS_TYPE_FILTERS.find(f => f.key === value)?.label || 'All';
  
  return (
    <>
      <TouchableOpacity 
        style={styles.businessTypeDropdownBtn} 
        onPress={() => { Haptics.selectionAsync().catch(() => {}); setVisible(true); }}
        activeOpacity={0.8}
      >
        <Text style={styles.businessTypeDropdownText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={14} color={C.brand} />
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={sheetStyles.sheet} onPress={() => {}}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Filter by type</Text>
            {BUSINESS_TYPE_FILTERS.map((opt) => {
              const isSelected = value === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key || 'all'}
                  style={[sheetStyles.option, isSelected && sheetStyles.optionSelected]}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(opt.key); setVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon} size={17} color={isSelected ? C.brand : C.textOff} style={{ marginRight: 10 }} />
                  <Text style={[sheetStyles.optionText, isSelected && sheetStyles.optionTextSelected]}>{opt.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.brand} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ─── Category quick-filter tile ─────────────────────────────────────────────
const CategoryTile = ({ item, active, onPress }) => (
  <TouchableOpacity style={[styles.categoryTile, active && styles.categoryTileActive]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.categoryTileIconWrap, { backgroundColor: active ? item.color : `${item.color}16` }]}>
      <Ionicons name={item.icon} size={19} color={active ? '#fff' : item.color} />
    </View>
    <Text style={[styles.categoryTileLabel, active && styles.categoryTileLabelActive]} numberOfLines={1}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

// ─── Bottom-sheet style option picker ───────────────────────────────────────
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

// ─── Product thumbnail ─────────────────────────────────────────────────────
const ProductThumb = ({ uri }) =>
  isRealImageUrl(uri) ? (
    <Image source={{ uri }} style={styles.thumbImg} />
  ) : (
    <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
      <Ionicons name="image-outline" size={15} color={C.textMuted} />
    </View>
  );

// ─── Vendor list card ───────────────────────────────────────────────────────
const VendorListCard = ({ vendor, onPress }) => {
  const hasAvatar = isRealImageUrl(vendor.profileImage);
  const displayName = vendor.storeName || vendor.name;
  const campusLabel = CAMPUSES.find((c) => c.key === vendor.campus)?.label || vendor.campus;
  const areaLabel = vendor.location?.campusArea;
  const locationLine = [areaLabel, campusLabel].filter(Boolean).join(', ') || 'Campus not set';
  const primaryCategory = vendor.categories?.[0];
  const categoryMeta = CATEGORY_META[primaryCategory] || CATEGORY_META.other;
  const categoryLine = (vendor.categories || [])
    .slice(0, 2)
    .map((c) => CATEGORY_META[c]?.label)
    .filter(Boolean)
    .join(' & ') || categoryMeta.label;
  const isServiceOnly = vendor.businessType === 'service';
  const products = vendor.products || [];
  const shownProducts = products.slice(0, 3);
  const extraCount = Math.max(0, (vendor.productCount ?? products.length) - shownProducts.length);
  
  // Calculate how many slots are needed (always 3 for consistency)
  const totalSlots = shownProducts.length + (extraCount > 0 ? 1 : 0);

  return (
    <Pressy onPress={() => onPress(vendor)} style={styles.listCard}>
      <View style={styles.listCardTop}>
        {hasAvatar ? (
          <Image source={{ uri: vendor.profileImage }} style={styles.listAvatar} />
        ) : (
          <View style={[styles.listAvatar, styles.listAvatarPlaceholder, { backgroundColor: `${categoryMeta.color}1A` }]}>
            <Text style={[styles.listAvatarInitial, { color: categoryMeta.color }]}>
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View style={styles.listCardInfo}>
          <Text style={styles.listStoreName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.listCategoryLine} numberOfLines={1}>{categoryLine}</Text>
          <View style={styles.listMetaRow}>
            <Ionicons name="star" size={11} color={C.gold} />
            <Text style={styles.listMetaText}>{vendor.rating?.toFixed(1) || '0.0'}</Text>
            {!!vendor.reviewCount && <Text style={styles.listMetaMuted}>({vendor.reviewCount})</Text>}
            <Text style={styles.listMetaDot}>·</Text>
            <Ionicons name="location-outline" size={11} color={C.textMuted} />
            <Text style={styles.listMetaMuted} numberOfLines={1}>{locationLine}</Text>
          </View>
        </View>

        <View style={styles.listCardRight}>
          {vendor.isVerified && (
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={11} color={C.success} />
              <Text style={styles.verifiedPillText}>Verified</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} style={{ marginTop: 8 }} />
        </View>
      </View>

      {isServiceOnly ? (
        <View style={styles.serviceCue}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.info} />
          <Text style={styles.serviceCueText} numberOfLines={1}>
            {vendor.openingHours ? `Message to book · ${vendor.openingHours}` : 'Message to book'}
          </Text>
        </View>
      ) : shownProducts.length > 0 ? (
        <View style={styles.thumbRow}>
          {shownProducts.map((p, i) => (
            <ProductThumb key={p._id || i} uri={p.images?.[0] || p.image} />
          ))}
          {extraCount > 0 && (
            <View style={[styles.thumbImg, styles.thumbMore]}>
              <Text style={styles.thumbMoreText}>+{extraCount}</Text>
            </View>
          )}
          {/* Fill remaining slots with subtle placeholders for consistent layout */}
          {totalSlots < 3 && Array.from({ length: 3 - totalSlots }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.thumbImg, styles.thumbEmpty]} />
          ))}
        </View>
      ) : null}
    </Pressy>
  );
};

// ─── Skeleton list card ─────────────────────────────────────────────────────
const SkeletonListCard = ({ delay = 0 }) => {
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
    <View style={styles.listCard}>
      <View style={styles.listCardTop}>
        <Animated.View style={[styles.listAvatar, { backgroundColor: C.skeleton, opacity }]} />
        <View style={styles.listCardInfo}>
          <Animated.View style={[skeletonStyles.line, { width: '62%', height: 13, opacity }]} />
          <Animated.View style={[skeletonStyles.line, { width: '42%', height: 10, marginTop: 7, opacity }]} />
          <Animated.View style={[skeletonStyles.line, { width: '55%', height: 10, marginTop: 8, opacity }]} />
        </View>
      </View>
      <View style={styles.thumbRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} style={[styles.thumbImg, { backgroundColor: C.skeleton, opacity }]} />
        ))}
      </View>
    </View>
  );
};

const SkeletonList = () => (
  <View>
    {[0, 90, 180, 270].map((delay, i) => <SkeletonListCard key={i} delay={delay} />)}
  </View>
);

// ─── Become-a-vendor CTA ───────────────────────────────────────────────────
const BecomeVendorCTA = ({ onPress }) => (
  <TouchableOpacity style={styles.vendorCta} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.vendorCtaIconWrap}>
      <Ionicons name="storefront" size={20} color={C.brand} />
    </View>
    <View style={styles.vendorCtaText}>
      <Text style={styles.vendorCtaTitle}>Have a business?</Text>
      <Text style={styles.vendorCtaSub}>Join CediMart and reach students on your campus</Text>
    </View>
    <View style={styles.vendorCtaBtn}>
      <Text style={styles.vendorCtaBtnText}>Start</Text>
    </View>
  </TouchableOpacity>
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
  const [activeBusinessType, setActiveBusinessType] = useState('');
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
          businessType: activeBusinessType || undefined,
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
  const handleBecomeVendor = () => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('VendorSignUp');
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
  const sectionLabel = activeBusinessType === 'service' ? 'Services' : activeBusinessType === 'product' ? 'Shops' : 'All vendors';

  const renderHeader = () => (
    <View>
      {/* Title + Business type dropdown */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Discover</Text>
          <Text style={styles.screenSubtitle}>Shops and services across your campus</Text>
        </View>
        <BusinessTypeDropdown value={activeBusinessType} onChange={setActiveBusinessType} />
      </View>

      {/* Trust hero */}
      <DiscoverHero />

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

      {/* Category quick tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((item) => (
          <CategoryTile
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      </View>
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

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={{ paddingBottom: 12 }}>
          <SkeletonListCard delay={0} />
          <SkeletonListCard delay={100} />
        </View>
      )}
      {!loading && vendors.length > 0 && !loadingMore && <BecomeVendorCTA onPress={handleBecomeVendor} />}
    </View>
  );

  if (loading && vendors.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlatList
          key="loading-list"
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<SkeletonList />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        key="vendors-list"
        data={vendors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <VendorListCard vendor={item} onPress={handleVendorPress} />}
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

  titleRow: { paddingTop: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.6 },
  screenSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 3 },

  // Business type dropdown
  businessTypeDropdownBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.brandDim, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(13,148,136,0.2)',
  },
  businessTypeDropdownText: { fontSize: 13, fontWeight: '700', color: C.brand },

  // Hero
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    minHeight: 128,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 10,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 21, fontWeight: '900', lineHeight: 26, letterSpacing: -0.3, marginBottom: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 18, maxWidth: '78%' },
  heroIconDecor: { position: 'absolute', right: -12, bottom: -12 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderRadius: 15, paddingHorizontal: 14, height: 48,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, height: '100%' },

  // Category tiles
  categoryRow: { gap: 10, paddingBottom: 16 },
  categoryTile: {
    width: 72, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  categoryTileActive: { borderColor: C.brand, backgroundColor: C.brandDim },
  categoryTileIconWrap: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  categoryTileLabel: { fontSize: 10.5, fontWeight: '600', color: C.textOff, textAlign: 'center' },
  categoryTileLabelActive: { color: C.brand, fontWeight: '800' },

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

  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 6, marginTop: 2 },
  clearFiltersText: { fontSize: 12.5, fontWeight: '700', color: C.accent },

  sectionHeaderRow: { marginTop: 16, marginBottom: 10 },
  sectionLabel: { fontSize: 15.5, fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  // ─── Vendor list card ────────────────────────────────────────────────────
  listCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  listAvatar: { width: 52, height: 52, borderRadius: 16, marginRight: 12 },
  listAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  listAvatarInitial: { fontSize: 19, fontWeight: '800' },

  listCardInfo: { flex: 1, marginRight: 8 },
  listStoreName: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 2 },
  listCategoryLine: { fontSize: 11.5, color: C.textMuted, marginBottom: 5 },
  listMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  listMetaText: { fontSize: 11.5, color: C.textOff, fontWeight: '700' },
  listMetaMuted: { fontSize: 11.5, color: C.textMuted, fontWeight: '600' },
  listMetaDot: { fontSize: 11, color: C.textMuted, marginHorizontal: 1 },

  listCardRight: { alignItems: 'flex-end', minWidth: 62 },
  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3.5,
  },
  verifiedPillText: { fontSize: 10, fontWeight: '800', color: C.success },

  serviceCue: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: C.infoBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  serviceCueText: { fontSize: 11.5, color: C.info, fontWeight: '700', flexShrink: 1 },

  thumbRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  thumbImg: { 
    width: THUMB_SIZE, 
    height: THUMB_SIZE, 
    borderRadius: 10, 
    overflow: 'hidden', 
    backgroundColor: C.skeleton,
  },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  thumbEmpty: { 
    backgroundColor: C.skeleton,
    opacity: 0.3,
  },
  thumbMore: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: C.bg, 
    borderWidth: 1, 
    borderColor: C.border,
  },
  thumbMoreText: { fontSize: 13, fontWeight: '800', color: C.textOff },

  // Become-a-vendor CTA
  vendorCta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.brandDim, borderRadius: 18, padding: 14, marginTop: 4, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(13,148,136,0.18)',
  },
  vendorCtaIconWrap: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  vendorCtaText: { flex: 1, marginRight: 10 },
  vendorCtaTitle: { fontSize: 13.5, fontWeight: '800', color: C.text, marginBottom: 2 },
  vendorCtaSub: { fontSize: 11.5, color: C.textOff, lineHeight: 16 },
  vendorCtaBtn: { backgroundColor: C.brand, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 10 },
  vendorCtaBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },

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
    paddingBottom: 48,
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