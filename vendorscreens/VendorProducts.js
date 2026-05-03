// src/vendorscreens/MyProductsScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyProducts } from '../apis/vendorApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─────────────────────────────────────────────
// Filter tabs config
// ─────────────────────────────────────────────
const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'instock',   label: 'In Stock' },
  { key: 'outofstock',label: 'Out of Stock' },
];

// ─────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────
const ProductCard = ({ item, onPress }) => {
  const imageUri = item.image || item.images?.[0];
  const stock = item.stock ?? item.countInStock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= 5;

  // Generate a consistent placeholder color from the product name
  const placeholderColors = [
    { bg: '#E8F5E9', text: '#2E7D32' },
    { bg: '#FFF8E1', text: '#F9A825' },
    { bg: '#FCE4EC', text: '#AD1457' },
    { bg: '#E3F2FD', text: '#1565C0' },
    { bg: '#F3E5F5', text: '#6A1B9A' },
    { bg: '#FFF3E0', text: '#E65100' },
    { bg: '#E0F2F1', text: '#00695C' },
  ];
  const colorIdx = (item.name?.charCodeAt(0) || 0) % placeholderColors.length;
  const { bg, text: textColor } = placeholderColors[colorIdx];

  return (
    <TouchableOpacity
      style={[styles.card, isOutOfStock && styles.cardDimmed]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      {/* Image */}
      <View style={[styles.cardImageWrap, { backgroundColor: imageUri ? '#F0F0F0' : bg }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.cardInitial, { color: textColor }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockLabel}>Out of stock</Text>
          </View>
        )}

        {/* Stock badge — only when in stock */}
        {!isOutOfStock && (
          <View style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}>
            <Text style={styles.stockBadgeText}>{stock} left</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.category ? (
          <Text style={styles.cardCategory} numberOfLines={1}>
            {item.category}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            GH₵ {item.price?.toFixed(2) || '0.00'}
          </Text>
          <View style={styles.editIcon}>
            <Ionicons name="pencil" size={12} color="#2E7D32" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const MyProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyProducts();
      if (res?.status === 200) {
        const data = res.data?.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load products.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  // ── Derived counts for tab labels ──
  const inStockCount = useMemo(
    () => products.filter(p => (p.stock ?? p.countInStock ?? 0) > 0).length,
    [products]
  );
  const outOfStockCount = products.length - inStockCount;

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = products;

    // Tab filter
    if (activeTab === 'instock') {
      list = list.filter(p => (p.stock ?? p.countInStock ?? 0) > 0);
    } else if (activeTab === 'outofstock') {
      list = list.filter(p => (p.stock ?? p.countInStock ?? 0) <= 0);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, activeTab, searchQuery]);

  const tabCount = (key) => {
    if (key === 'all') return products.length;
    if (key === 'instock') return inStockCount;
    return outOfStockCount;
  };

  // ── Loading state ──
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Inventory</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>My Products</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading your products…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerLabel}>Inventory</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="options-outline" size={18} color="#E8F5E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerCount}>{products.length} items</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or category…"
            placeholderTextColor="#BDBDBD"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsContainer}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = tabCount(tab.key);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Error banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#B71C1C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchProducts} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Product Grid ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
             onPress={(p) => navigation.navigate('ProductDetail', { productId: p._id,product: p })}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name={searchQuery ? 'search-outline' : 'cube-outline'}
                size={32}
                color="#A5D6A7"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No products yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different name or category'
                : 'Start selling by adding your first product'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddProduct')}
                activeOpacity={0.82}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyAddBtnText}>Add your first product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
            colors={['#2E7D32']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  // ── Header ──
  header: {
    borderTopRightRadius:12,
    borderTopLeftRadius:12,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#81C784',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerCount: {
    fontSize: 13,
    color: '#A5D6A7',
    fontWeight: '500',
    paddingBottom: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B2714',
    paddingVertical: 0,
  },

  // ── Tabs ──
  tabsContainer: {
    flexShrink: 0,
    backgroundColor: '#F0F2EE',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActive: {
    backgroundColor: '#1B5E20',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { flex: 1, fontSize: 13, color: '#B71C1C' },
  retryLink: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  // ── Grid ──
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 4,
  },
  listContentEmpty: {
    flex: 1,
  },
  columnWrapper: { gap: 12, marginBottom: 12 },

  // ── Product Card ──
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDimmed: {
    opacity: 0.72,
  },
  cardImageWrap: {
    width: '100%',
    height: 118,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInitial: {
    fontSize: 32,
    fontWeight: '800',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  outOfStockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(27,94,32,0.82)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(230,81,0,0.85)',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 11,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2714',
    marginBottom: 3,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
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
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2EE',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#757575',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
});

export default MyProductsScreen;