// src/screens/MarketsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorsByMarket } from '../apis/vendorApi';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Hero carousel slides
// ─────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: '1',
    marketName: 'Madina Market',
    tag: '📍 Madina Market',
    title: 'Fresh Produce,\nDelivered Daily',
    subtitle: 'Vegetables, fruits & staples from trusted vendors',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769990080/vegetables_cpp5n5.jpg',
  },
  {
    id: '2',
    marketName: 'Makola Market',
    tag: '🛒 Makola Market',
    title: "Accra's Biggest\nMarket, Online",
    subtitle: 'Hundreds of vendors at your fingertips',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1777893982/makola_img_1_ryp6no.jpg',
  },
  {
    id: '3',
    marketName: null,
    tag: '🍎 Seasonal Picks',
    title: 'Juicy Fruits,\nEvery Season',
    subtitle: 'Tropical & local fruits sourced weekly',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1770885485/colorful-fruits-tasty-fresh-ripe-juicy-white-desk_utdxnl.jpg',
  },
  {
    id: '4',
    marketName: null,
    tag: '⚡ Free Delivery',
    title: 'Free Delivery\nOver GH₵ 200',
    subtitle: 'Shop from any Accra market and save on delivery',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1769989775/free_delivery_tsytih.jpg',
  },
];

const AUTO_SCROLL_MS = 4200;

// Per-market accent palette (keyed by enum name)
const MARKET_PALETTE = {
  'Madina Market':       { bg: '#E8F5E9', accent: '#1B5E20', iconBg: '#C8E6C9', emoji: '🏬' },
  'Makola Market':       { bg: '#FFF3E0', accent: '#E65100', iconBg: '#FFE0B2', emoji: '🛒' },
  'Kaneshie Market':     { bg: '#E3F2FD', accent: '#1565C0', iconBg: '#BBDEFB', emoji: '🏪' },
  'Mallam Market':       { bg: '#E0F2F1', accent: '#00695C', iconBg: '#B2DFDB', emoji: '🌿' },
  'Tema Market':         { bg: '#F3E5F5', accent: '#6A1B9A', iconBg: '#E1BEE7', emoji: '🏭' },
  'Dansoman Market':     { bg: '#FCE4EC', accent: '#AD1457', iconBg: '#F8BBD0', emoji: '🏘️' },
  'Agbogbloshie Market': { bg: '#FFF9C4', accent: '#F57F17', iconBg: '#FFF176', emoji: '🌳' },
  'Dome Market':         { bg: '#EFEBE9', accent: '#4E342E', iconBg: '#D7CCC8', emoji: '🏙️' },
};
const DEFAULT_PALETTE = { bg: '#E8F5E9', accent: '#2E7D32', iconBg: '#C8E6C9', emoji: '🛒' };

// Consistent placeholder colors derived from vendor name char code
const PLACEHOLDER_COLORS = [
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#FFF8E1', text: '#F9A825' },
  { bg: '#FCE4EC', text: '#AD1457' },
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#E0F2F1', text: '#00695C' },
];

// ─────────────────────────────────────────────
// Hero Carousel
// ─────────────────────────────────────────────
const HeroCarousel = ({ onSlidePress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const startAutoScroll = useCallback(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % HERO_SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_MS);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [startAutoScroll]);

  const handleMomentumEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
    clearInterval(timerRef.current);
    startAutoScroll();
  };

  const renderSlide = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onSlidePress(item)}
      style={{ width, height: 210, position: 'relative' }}
    >
      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,40,0,0.5)' }]} />
      <View style={heroStyles.content}>
        <View style={heroStyles.tag}>
          <Text style={heroStyles.tagText}>{item.tag}</Text>
        </View>
        <Text style={heroStyles.title}>{item.title}</Text>
        <Text style={heroStyles.subtitle}>{item.subtitle}</Text>
        <View style={heroStyles.btn}>
          <Text style={heroStyles.btnText}>
            {item.marketName ? `Shop ${item.marketName.split(' ')[0]}` : 'Browse All'}
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={HERO_SLIDES}
        renderItem={renderSlide}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={heroStyles.dotsRow}>
        {HERO_SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
              clearInterval(timerRef.current);
              startAutoScroll();
            }}
          >
            <View style={[heroStyles.dot, i === activeIndex ? heroStyles.dotActive : heroStyles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const heroStyles = StyleSheet.create({
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tagText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginBottom: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    backgroundColor: '#1B5E20',
  },
  dot: { borderRadius: 4, height: 5 },
  dotActive: { width: 20, backgroundColor: '#fff' },
  dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
});

// ─────────────────────────────────────────────
// Stats Row
// ─────────────────────────────────────────────
const StatsRow = ({ markets }) => {
  const totalVendors = markets.reduce((acc, m) => acc + (m.count || 0), 0);
  const totalProducts = markets.reduce(
    (acc, m) => acc + (m.vendors || []).reduce((s, v) => s + (v.products?.length || 0), 0),
    0,
  );
  const stats = [
    { label: 'Markets', value: markets.length },
    { label: 'Vendors', value: totalVendors },
    { label: 'Products', value: totalProducts > 999 ? `${(totalProducts / 1000).toFixed(1)}k` : totalProducts },
  ];
  return (
    <View style={styles.statsRow}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.statChip, i < stats.length - 1 && styles.statChipBorder]}>
          <Text style={styles.statNum}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Vendor Card
// ─────────────────────────────────────────────
const VendorCard = ({ vendor, onPress }) => {
  const imageUrl = vendor.profile_image;
  const name = vendor.name || 'Unknown Store';
  const marketTag = vendor.market_name;
  const productCount = vendor.products?.length || 0;
  const isVerified = vendor.is_verified;


  const colorIdx = (name.charCodeAt(0) || 0) % PLACEHOLDER_COLORS.length;
  const { bg: placeholderBg, text: placeholderText } = PLACEHOLDER_COLORS[colorIdx];

  return (
    <TouchableOpacity style={styles.vendorCard} onPress={() => onPress(vendor)} activeOpacity={0.82}>
      <View style={styles.vendorImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.vendorImage} resizeMode="cover" />
        ) : (
          <View style={[styles.vendorPlaceholder, { backgroundColor: placeholderBg }]}>
            <Text style={[styles.vendorPlaceholderText, { color: placeholderText }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={17} color="#2E7D32" />
          </View>
        )}

        {/* Product count overlay strip */}
        <View style={styles.productOverlay}>
          <Ionicons name="cube-outline" size={11} color="#fff" />
          <Text style={styles.productOverlayText}>
            {productCount} product{productCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>{name}</Text>
        {marketTag && (
          <View style={styles.marketTag}>
            <Text style={styles.marketTagText}>{marketTag}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Market Section
// ─────────────────────────────────────────────
const MarketSection = ({ market, onVendorPress, onMarketPress }) => {
  const palette = MARKET_PALETTE[market._id] || DEFAULT_PALETTE;
  const previewVendors = (market.vendors || []).slice(0, 6);

  return (
    <View style={styles.marketBlock}>
      {/* Header */}
      <TouchableOpacity
        style={styles.marketHeader}
        onPress={() => onMarketPress(market)}
        activeOpacity={0.75}
      >
        <View style={styles.marketHeaderLeft}>
          <View style={[styles.marketIconBadge, { backgroundColor: palette.iconBg }]}>
            <Text style={styles.marketEmoji}>{palette.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.marketName, { color: palette.accent }]}>{market._id}</Text>
            <View style={styles.marketMetaRow}>
              <View style={[styles.marketLiveDot, { backgroundColor: palette.accent }]} />
              <Text style={styles.marketMeta}>
                Accra · {market.count} vendor{market.count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.marketChevron, { backgroundColor: palette.bg }]}>
          <Ionicons name="chevron-forward" size={16} color={palette.accent} />
        </View>
      </TouchableOpacity>

      {/* Thin accent divider */}
      <View style={[styles.accentBar, { backgroundColor: palette.accent + '1A' }]} />

      {/* Vendor horizontal scroll */}
      {previewVendors.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vendorsScroll}
        >
          {previewVendors.map(vendor => (
            <VendorCard key={vendor._id} vendor={vendor} onPress={onVendorPress} />
          ))}

          {market.count > 6 && (
            <TouchableOpacity
              style={styles.seeMoreCard}
              onPress={() => onMarketPress(market)}
              activeOpacity={0.8}
            >
              <View style={[styles.seeMoreIconCircle, { backgroundColor: palette.bg }]}>
                <Ionicons name="arrow-forward" size={20} color={palette.accent} />
              </View>
              <Text style={[styles.seeMoreText, { color: palette.accent }]}>See All</Text>
              <Text style={styles.seeMoreCount}>+{market.count - 6} more</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const MarketsScreen = ({ navigation }) => {
  const [markets, setMarkets] = useState([]);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchMarkets = useCallback(async () => {
    try {
      setError(null);
      const res = await getVendorsByMarket();
      if (res?.data?.success) {
        const data = res.data.data || [];
        setMarkets(data);
        setFilteredMarkets(data);
      } else {
        setError('Failed to load markets.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Could not load markets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const onRefresh = () => { setRefreshing(true); fetchMarkets(); };

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMarkets(markets);
    } else {
      const q = search.toLowerCase().trim();
      setFilteredMarkets(
        markets.filter(
          m =>
            m._id.toLowerCase().includes(q) ||
            (m.vendors || []).some(
              v => v.name?.toLowerCase().includes(q) || v.location?.toLowerCase().includes(q),
            ),
        ),
      );
    }
  }, [search, markets]);

  const handleVendorPress = (vendor) =>
    navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor });

  const handleMarketPress = (market) =>
    navigation.navigate('MarketDetail', { marketName: market._id });

  const handleSlidePress = (slide) => {
    if (slide.marketName) {
      const market = markets.find(m => m._id === slide.marketName);
      if (market) handleMarketPress(market);
    } else {
      navigation.navigate('Products');
    }
  };

  // ── Loading ──
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
        <View style={styles.loadingHeader}>
          <Text style={styles.loadingHeaderTitle}>Accra Markets</Text>
        </View>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading markets…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Fixed green header */}
      <View style={styles.fixedHeader}>
        <View style={styles.fixedHeaderRow}>
          <View>
            <Text style={styles.fixedHeaderLabel}>Explore</Text>
            <Text style={styles.fixedHeaderTitle}>Accra Markets Vendors</Text>
          </View>
          <View style={styles.fixedHeaderBtns}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notification')}>
              <Ionicons name="notifications-outline" size={18} color="#E8F5E9" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} >
              <Ionicons name="storefront-outline" size={18} color="#E8F5E9" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main scroll — hero is INSIDE scroll so it scrolls away naturally */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#2E7D32']}
          />
        }
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]} // index 0 = hero, index 1 = search block → sticky
      >
        {/* 0 — Hero carousel */}
        <HeroCarousel onSlidePress={handleSlidePress} />

        {/* 1 — Sticky search block */}
        <View style={styles.stickyBlock}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search markets or vendors…"
              placeholderTextColor="#BDBDBD"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={17} color="#BDBDBD" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2 — Stats */}
        {markets.length > 0 && !search && <StatsRow markets={markets} />}

        {/* 3 — Section label */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>
            {search ? `Results for "${search}"` : 'Markets & Vendors'}
          </Text>
          {search ? (
            <Text style={styles.sectionLabelCount}>{filteredMarkets.length} found</Text>
          ) : null}
        </View>

        {/* 4 — Content */}
        {error && markets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-offline-outline" size={34} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>Couldn't load markets</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMarkets}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredMarkets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="storefront-outline" size={34} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different market or vendor name</Text>
          </View>
        ) : (
          filteredMarkets.map(market => (
            <MarketSection
              key={market._id}
              market={market}
              onVendorPress={handleVendorPress}
              onMarketPress={handleMarketPress}
            />
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  // ── Fixed header ──
  fixedHeader: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  fixedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fixedHeaderLabel: {
    fontSize: 11,
    color: '#81C784',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fixedHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  fixedHeaderBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: { backgroundColor: '#F0F2EE' },

  // ── Sticky search ──
  stickyBlock: {
    backgroundColor: '#F0F2EE',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B2714',
    paddingVertical: 0,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statChip: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  statChipBorder: { borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500', marginTop: 2 },

  // ── Section label ──
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B2714',
    letterSpacing: -0.2,
  },
  sectionLabelCount: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // ── Market block ──
  marketBlock: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingBottom: 18,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  marketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  marketIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketEmoji: { fontSize: 22 },
  marketName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  marketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  marketLiveDot: { width: 6, height: 6, borderRadius: 3 },
  marketMeta: { fontSize: 12, color: '#757575' },
  marketChevron: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  accentBar: {
    height: 2,
    marginHorizontal: 16,
    borderRadius: 1,
    marginBottom: 14,
  },

  // ── Vendor scroll ──
  vendorsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },

  // ── Vendor card ──
  vendorCard: {
    width: 148,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  vendorImageContainer: { height: 110, position: 'relative' },
  vendorImage: { width: '100%', height: '100%' },
  vendorPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vendorPlaceholderText: { fontSize: 32, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.44)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  productOverlayText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  vendorInfo: { padding: 10 },
  vendorName: { fontSize: 13, fontWeight: '700', color: '#1B2714', marginBottom: 5 },
  marketTag: {
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marketTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E65100',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── See more ──
  seeMoreCard: {
    width: 108,
    height: 183,
    backgroundColor: '#F4FAF4',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  seeMoreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeMoreText: { fontSize: 13, fontWeight: '800' },
  seeMoreCount: { fontSize: 11, color: '#9E9E9E' },

  // ── Empty / error ──
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 70,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1B2714', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },

  // ── Loading ──
  loadingHeader: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  loadingHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2EE',
  },
  loadingText: { marginTop: 14, fontSize: 15, color: '#757575' },

  // ── Retry ──
  retryBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 22,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});

export default MarketsScreen;