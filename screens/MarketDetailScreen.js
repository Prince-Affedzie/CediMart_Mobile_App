import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendors } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const MarketDetailScreen = ({ route, navigation }) => {
  const { marketName } = route.params; // e.g., "Madina Market"
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name | verification

  // Fetch vendors filtered by market name
  const fetchVendors = useCallback(async () => {
    try {
      setError(null);
      const res = await getVendors({ market: marketName });
      if (res.data?.success) {
        const data = res.data.data;
        setVendors(data);
        setFilteredVendors(data);
      } else {
        setError('Failed to load vendors.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [marketName]);

  useEffect(() => {
    setLoading(true);
    fetchVendors();
  }, [fetchVendors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  // Client-side search + sort
  useEffect(() => {
    let result = vendors;
    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        v =>
          v.name.toLowerCase().includes(query) ||
          (v.location && v.location.toLowerCase().includes(query))
      );
    }
    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'verification') {
      result.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
    }
    setFilteredVendors(result);
  }, [search, vendors, sortBy]);

  const handleVendorPress = (vendor) => {
    navigation.navigate('VendorDetail', { vendorId: vendor._id, vendor });
  };

  // Sort options for modal
  const sortOptions = [
    { id: 'name', label: 'Name A–Z', icon: 'text-outline' },
    { id: 'verification', label: 'Verified First', icon: 'checkmark-circle-outline' },
  ];

  const activeSortLabel = sortOptions.find(s => s.id === sortBy)?.label || 'Sort';

  // ── Loading State ─────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.heroWrap}>
          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>{marketName}</Text>
            </View>
            <View style={styles.heroIconBtn} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading vendors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error State ───────────────────────────────
  if (error && vendors.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.heroWrap}>
          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>{marketName}</Text>
            </View>
            <View style={styles.heroIconBtn} />
          </View>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={50} color="#BDBDBD" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchVendors(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ════════════════ HERO ════════════════ */}
      <View style={styles.heroWrap}>
        {/* Scrim layers for legibility */}
        <View style={styles.heroScrimTop} />
        <View style={styles.heroScrimBottom} />

        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>{marketName}</Text>
            {!loading && (
              <Text style={styles.heroCount}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          {/* Placeholder for symmetry; could add search toggle or other action */}
          <View style={styles.heroIconBtn} />
        </View>

        {/* Search bar floating at hero bottom */}
        <View style={styles.heroSearchWrap}>
          <View style={styles.heroSearchActive}>
            <Ionicons name="search-outline" size={18} color="#4CAF50" style={{ marginLeft: 14 }} />
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Search vendor by name or location..."
              placeholderTextColor="#9E9E9E"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 10 }}>
                <Ionicons name="close-circle" size={18} color="#BDBDBD" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ════════════════ TOOLBAR ════════════════ */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>
          {filteredVendors.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.toolbarRight}>
          {/* Sort button */}
          <TouchableOpacity
            style={styles.toolbarSortBtn}
            onPress={() => setSortModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical-outline" size={15} color="#2E7D32" />
            <Text style={styles.toolbarSortText} numberOfLines={1}>
              {activeSortLabel.split(' ')[0]}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#2E7D32" />
          </TouchableOpacity>

          {/* View mode toggle */}
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

      {/* ════════════════ VENDORS LIST/GRID ════════════════ */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={50} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No vendors found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term.' : 'This market doesn’t have any vendors yet.'}
            </Text>
          </View>
        ) : viewMode === 'list' ? (
          <View style={styles.listWrap}>
            {filteredVendors.map(vendor => (
              <VendorListItem key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
            ))}
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {filteredVendors.map(vendor => (
              <VendorGridCard key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sort Modal */}
      {sortModalVisible && (
        <View style={styles.sortModalOverlay}>
          <TouchableOpacity
            style={styles.sortBackdrop}
            activeOpacity={1}
            onPress={() => setSortModalVisible(false)}
          />
          <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortSheetTitle}>Sort by</Text>
            {sortOptions.map(option => {
              const isActive = sortBy === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.sortRow, isActive && styles.sortRowActive]}
                  onPress={() => {
                    setSortBy(option.id);
                    setSortModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isActive ? '#2E7D32' : '#666'}
                  />
                  <Text style={[styles.sortRowText, isActive && styles.sortRowTextActive]}>
                    {option.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Vendor Grid Card ─────────────────────────────────────────
const VendorGridCard = ({ vendor, onPress }) => {
  const imageUrl = vendor.profile_image;
  const name = vendor.name || 'Unknown Vendor';
  const location = vendor.location || 'Accra';
  const marketTag = vendor.market_name;
  const productCount = vendor.products?.length || 0;
  const isVerified = vendor.is_verified;

  return (
    <TouchableOpacity style={styles.gridCard} onPress={() => onPress(vendor)} activeOpacity={0.85}>
      <View style={styles.gridImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Text style={styles.gridImagePlaceholderText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {isVerified && (
          <View style={styles.verifiedBadgeOverlay}>
            <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          </View>
        )}
        <View style={styles.gridCatChip}>
          <Text style={styles.gridCatChipText}>
            {isVerified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={2}>{name}</Text>
        <View style={styles.gridLocationRow}>
          <Ionicons name="location-outline" size={12} color="#757575" />
          <Text style={styles.gridLocation} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.gridFooter}>
          {marketTag && (
            <View style={styles.gridMarketTag}>
              <Text style={styles.gridMarketTagText}>{marketTag}</Text>
            </View>
          )}
          <Text style={styles.gridProductCount}>
            {productCount} product{productCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Vendor List Item ────────────────────────────────────────
const VendorListItem = ({ vendor, onPress }) => {
  const imageUrl = vendor.profile_image;
  const name = vendor.name || 'Unknown Vendor';
  const location = vendor.location || 'Accra';
  const marketTag = vendor.market_name;
  const productCount = vendor.products?.length || 0;
  const isVerified = vendor.is_verified;

  return (
    <TouchableOpacity style={styles.listCard} onPress={() => onPress(vendor)} activeOpacity={0.85}>
      <View style={styles.listImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.listImage} />
        ) : (
          <View style={styles.listImagePlaceholder}>
            <Text style={styles.listImagePlaceholderText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {isVerified && (
          <View style={styles.listVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          </View>
        )}
      </View>

      <View style={styles.listContent}>
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={1}>{name}</Text>
          <View style={[styles.listCatChip, isVerified ? styles.listCatChipVerified : styles.listCatChipPending]}>
            <Text style={[styles.listCatText, isVerified ? styles.listCatTextVerified : styles.listCatTextPending]}>
              {isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.listLocationRow}>
          <Ionicons name="location-outline" size={13} color="#757575" />
          <Text style={styles.listLocation} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.listBottomRow}>
          {marketTag && (
            <View style={styles.listMarketTag}>
              <Text style={styles.listMarketTagText}>{marketTag}</Text>
            </View>
          )}
          <Text style={styles.listProductCount}>
            {productCount} product{productCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#BDBDBD" style={{ marginRight: 8 }} />
    </TouchableOpacity>
  );
};

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  scrollContent: { paddingBottom: 20 ,marginTop:12},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#616161' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#616161', marginTop: 12, marginBottom: 20, textAlign: 'center' },
  retryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // Hero (mirrors ProductsScreen hero with solid gradient)
  heroWrap: {
    height: 220,
    backgroundColor: '#1B5E20',
    overflow: 'hidden',
    position: 'relative',
  },
  heroScrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(27,94,32,0.9)',
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
  heroTitleWrap: { flex: 1, alignItems: 'center' },
  heroTitle: {
    fontSize: 20,
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
  heroSearchWrap: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
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
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212121',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
  viewModeBtn: { padding: 6, borderRadius: 8 },
  viewModeBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#424242', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#757575', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  // Grid
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
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
    marginBottom: 4,
  },
  gridImageWrap: {
    height: 130,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImagePlaceholderText: { fontSize: 36, fontWeight: '800', color: '#2E7D32' },
  verifiedBadgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  gridInfo: { padding: 12 },
  gridName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 4, lineHeight: 18 },
  gridLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gridLocation: { fontSize: 12, color: '#757575', marginLeft: 3 },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridMarketTag: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gridMarketTagText: { fontSize: 10, fontWeight: '600', color: '#E65100' },
  gridProductCount: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },

  // List
  listWrap: { paddingHorizontal: 12, gap: 10 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 90,
    height: 90,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listImage: { width: '100%', height: '100%' },
  listImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listImagePlaceholderText: { fontSize: 30, fontWeight: '800', color: '#2E7D32' },
  listVerifiedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  listTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  listName: { fontSize: 15, fontWeight: '700', color: '#212121', flex: 1, marginRight: 8 },
  listCatChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  listCatChipVerified: { backgroundColor: '#F1F8E9' },
  listCatChipPending: { backgroundColor: '#FFF3E0' },
  listCatText: { fontSize: 10, fontWeight: '700' },
  listCatTextVerified: { color: '#2E7D32' },
  listCatTextPending: { color: '#E65100' },
  listLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  listLocation: { fontSize: 12, color: '#757575', marginLeft: 4 },
  listBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listMarketTag: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  listMarketTagText: { fontSize: 10, fontWeight: '600', color: '#E65100' },
  listProductCount: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },

  // Sort modal (same as ProductsScreen)
  sortModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
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
    paddingBottom: 20,
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
  sortSheetTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 16 },
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
  sortRowText: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  sortRowTextActive: { color: '#2E7D32', fontWeight: '700' },
});

export default MarketDetailScreen;