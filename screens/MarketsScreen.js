// src/screens/MarketsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorsByMarket } from '../apis/vendorApi';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Vendor Card
// ─────────────────────────────────────────────
const VendorCard = ({ vendor, onPress }) => {
  const imageUrl = vendor.profile_image;
  const name = vendor.name || 'Unknown Store';
  const marketTag = vendor.market_name;
  const productCount = vendor.products?.length || 0;
  const isVerified = vendor.is_verified;

  return (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => onPress(vendor)}
      activeOpacity={0.82}
    >
      {/* Image / Placeholder */}
      <View style={styles.vendorImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.vendorImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={17} color="#2E7D32" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {name}
        </Text>

        {marketTag && (
          <View style={styles.marketTag}>
            <Text style={styles.marketTagText}>{marketTag}</Text>
          </View>
        )}

        <View style={styles.productRow}>
          <Ionicons name="cube-outline" size={12} color="#888" />
          <Text style={styles.productCount}>
            {productCount} product{productCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Stats chip row — derived from markets data
// ─────────────────────────────────────────────
const StatsRow = ({ markets }) => {
  const totalVendors = markets.reduce((acc, m) => acc + (m.count || 0), 0);
  const totalProducts = markets.reduce(
    (acc, m) =>
      acc + (m.vendors || []).reduce((s, v) => s + (v.products?.length || 0), 0),
    0,
  );

  return (
    <View style={styles.statsRow}>
      {[
        { label: 'Markets', value: markets.length },
        { label: 'Vendors', value: totalVendors },
        { label: 'Products', value: totalProducts > 999 ? `${(totalProducts / 1000).toFixed(1)}k` : totalProducts },
      ].map((s) => (
        <View key={s.label} style={styles.statChip}>
          <Text style={styles.statNum}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
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

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarkets();
  };

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMarkets(markets);
    } else {
      const query = search.toLowerCase().trim();
      setFilteredMarkets(
        markets.filter(
          (market) =>
            market._id.toLowerCase().includes(query) ||
            (market.vendors || []).some(
              (v) =>
                v.name?.toLowerCase().includes(query) ||
                v.location?.toLowerCase().includes(query),
            ),
        ),
      );
    }
  }, [search, markets]);

  const handleVendorPress = (vendor) =>
    navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor });

  const handleMarketPress = (market) =>
    navigation.navigate('MarketDetail', { marketName: market._id });

  // ── Loading state ──
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
        <View style={styles.loadingHero}>
          <Text style={styles.heroTitle}>Fresh Groceries</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading grocery stores…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* ── Hero ── */}
       <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2E7D32"
              colors={['#2E7D32']}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
      <View style={styles.heroSection}>
        <View style={styles.heroTopRow}>
          {/* Location pill */}
          <View style={styles.locationPill}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>Accra, Ghana</Text>
          </View>

          {/* Notification button */}
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={20} color="#E8F5E9" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Fresh Groceries,{'\n'}Delivered Fast</Text>
        <Text style={styles.heroSubtitle}>Trusted Partners across all Accra Markets</Text>
      </View>

      {/* ── Main card sheet ── */}
      <View style={styles.mainContent}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search markets or stores…"
              placeholderTextColor="#BDBDBD"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#BDBDBD" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats row */}
        {markets.length > 0 && <StatsRow markets={markets} />}

        {/* Section header */}
        <View style={styles.allVendorsRow}>
          <Text style={styles.sectionTitle}>Markets & Vendores</Text>  
        </View>

        {/* ── Scrollable content ── */}
       
          {/* Error empty state */}
          {error && markets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cloud-offline-outline" size={36} color="#A5D6A7" />
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
                <Ionicons name="storefront-outline" size={36} color="#A5D6A7" />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching for a different market or store
              </Text>
            </View>
          ) : (
            filteredMarkets.map((market) => {
              const previewVendors = (market.vendors || []).slice(0, 6);
              return (
                <View key={market._id} style={styles.marketSection}>
                  {/* Market header row */}
                  <TouchableOpacity
                    style={styles.marketHeader}
                    onPress={() => handleMarketPress(market)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.marketHeaderLeft}>
                      <View style={styles.marketIconBadge}>
                        <Text style={styles.marketEmoji}>🛒</Text>
                      </View>
                      <View>
                        <Text style={styles.marketName}>{market._id}</Text>
                        <Text style={styles.marketMeta}>
                          Accra · {market.count} store{market.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.marketChevron}>
                      <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
                    </View>
                  </TouchableOpacity>

                  {/* Horizontal vendor cards */}
                  {previewVendors.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.vendorsScroll}
                    >
                      {previewVendors.map((vendor) => (
                        <VendorCard
                          key={vendor._id}
                          vendor={vendor}
                          onPress={handleVendorPress}
                        />
                      ))}

                      {market.count > 6 && (
                        <TouchableOpacity
                          style={styles.seeMoreCard}
                          onPress={() => handleMarketPress(market)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="arrow-forward-circle-outline" size={28} color="#2E7D32" />
                          <Text style={styles.seeMoreText}>See All</Text>
                          <Text style={styles.seeMoreCount}>+{market.count - 6} more</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}
       
      </View>
       </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },

  // ── Hero ──
  heroSection: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 52,
  },
  loadingHero: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#69F0AE',
  },
  locationText: {
    fontSize: 13,
    color: '#E8F5E9',
    fontWeight: '500',
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A5D6A7',
    fontWeight: '400',
  },

  // ── Main sheet ──
  mainContent: {
    flex: 1,
    backgroundColor: '#F2F4F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 18,
    overflow: 'hidden',
  },

  // ── Search ──
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1B2714',
    paddingVertical: 0,
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  statLabel: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Section header ──
  allVendorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2714',
    letterSpacing: -0.2,
  },
  allVendorsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // ── Market section ──
  marketSection: {
    marginBottom: 24,
    backgroundColor:"#ffff",
    paddingVertical:24,
    paddingBottom:24,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  marketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marketIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketEmoji: {
    fontSize: 18,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '700',
   color: '#1B5E20',
  },
  marketMeta: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  marketChevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Vendor scroll ──
  vendorsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },

  // ── Vendor card ──
  vendorCard: {
    width: 158,
    height: 200,
    margin:8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  vendorImageContainer: {
    height: 130,
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2E7D32',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vendorInfo: {
    padding: 12,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2714',
    marginBottom: 6,
  },
  marketTag: {
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 7,
  },
  marketTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productCount: {
    fontSize: 11,
    color: '#888',
  },

  // ── See more card ──
  seeMoreCard: {
    width: 110,
    height: 190,
    backgroundColor: '#F1F8F3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 4,
  },
  seeMoreCount: {
    fontSize: 11,
    color: '#4CAF50',
  },

  // ── Empty / error states ──
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2714',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Loading ──
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F0',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#757575',
  },

  // ── Retry button ──
  retryBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 22,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default MarketsScreen;