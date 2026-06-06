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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyProducts, deleteProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'available',  label: 'Available' },
  { key: 'sold',       label: 'Sold Out' },
];

const ProductCard = ({ item, onPress, onEditPress, onLongPress }) => {
  const imageUri = item.images?.[0] || item.image;
  const stock = item.countInStock ?? 0;
  const isSoldOut = !item.isAvailable || stock <= 0;

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
      style={[styles.card, isSoldOut && styles.cardDimmed]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.82}
      delayLongPress={400}
    >
      <View style={[styles.cardImageWrap, { backgroundColor: imageUri ? '#F0F0F0' : bg }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.cardInitial, { color: textColor }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}

        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutLabel}>Sold Out</Text>
          </View>
        )}

        {!isSoldOut && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{stock} avail</Text>
          </View>
        )}

        {item.negotiable && (
          <View style={styles.negotiableBadge}>
            <Ionicons name="pricetag" size={10} color="#fff" />
            <Text style={styles.negotiableText}>Negotiable</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.category && (
          <Text style={styles.cardCategory} numberOfLines={1}>
            {item.category.replace(/-/g, ' ')}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>GH₵ {item.price?.toFixed(2) || '0.00'}</Text>
          <TouchableOpacity
            style={styles.editBadge}
            onPress={(e) => {
              e.stopPropagation?.();
              onEditPress(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={12} color="#2E7D32" />
            <Text style={styles.editBadgeText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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

  const availableCount = useMemo(
    () => products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0).length,
    [products]
  );
  const soldCount = products.length - availableCount;

  const filtered = useMemo(() => {
    let list = products;

    if (activeTab === 'available') {
      list = list.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0);
    } else if (activeTab === 'sold') {
      list = list.filter(p => !p.isAvailable || (p.countInStock ?? 0) <= 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, activeTab, searchQuery]);

  const tabCount = (key) => {
    if (key === 'all') return products.length;
    if (key === 'available') return availableCount;
    return soldCount;
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  };

  const handleEditPress = (product) => {
    navigation.navigate('UpdateProduct', { productId: product._id });
  };

  const handleProductLongPress = (product) => {
    Alert.alert(
      product.name,
      'What would you like to do?',
      [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('VendorProductDetail', { productId: product._id, product }),
        },
        {
          text: 'Edit Listing',
          onPress: () => navigation.navigate('UpdateProduct', { productId: product._id }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(product),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmDelete = (product) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product._id);
              setProducts(prev => prev.filter(p => p._id !== product._id));
              Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing removed.' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to delete' });
            }
          },
        },
      ]
    );
  };

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

  const ListHeaderComponent = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerLabel}>Inventory</Text>
          <TouchableOpacity style={styles.headerIconBtn} onPress={fetchProducts}>
            <Ionicons name="refresh-outline" size={18} color="#E8F5E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerCount}>{products.length} items</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, category, or brand…"
            placeholderTextColor="#BDBDBD"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsContainer}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                  {tabCount(tab.key)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#B71C1C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchProducts} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={handleProductPress}
            onEditPress={handleEditPress}
            onLongPress={handleProductLongPress}
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
                ? 'Try a different search term'
                : 'Tap the button below to list your first item'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddProduct')}
                activeOpacity={0.82}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyAddBtnText}>List an Item</Text>
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

      <View style={styles.bottomHint}>
        <Ionicons name="information-circle-outline" size={14} color="#9E9E9E" />
        <Text style={styles.bottomHintText}>Tap to view · Tap Edit to modify · Long press for more</Text>
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius:18,
    borderTopRightRadius:18,
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
  tabsContainer: { flexShrink: 0, backgroundColor: '#F0F2EE' },
  tabsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActive: { backgroundColor: '#1B5E20' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#757575' },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#9E9E9E' },
  tabCountTextActive: { color: '#FFFFFF' },
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
  listContent: { paddingHorizontal: 16, paddingBottom: 60 },
  listContentEmpty: { flex: 1 },
  columnWrapper: { gap: 12, marginBottom: 12 },
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
  cardDimmed: { opacity: 0.65 },
  cardImageWrap: {
    width: '100%',
    height: 118,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardInitial: { fontSize: 32, fontWeight: '800' },
  soldOutOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  soldOutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8, right: 8,
    backgroundColor: 'rgba(27,94,32,0.85)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stockBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  negotiableBadge: {
    position: 'absolute',
    bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(249,115,22,0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  negotiableText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  cardBody: { padding: 11 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1B2714', marginBottom: 3 },
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
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#1B5E20' },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editBadgeText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1B2714', marginBottom: 6 },
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
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0F2EE',
  },
  bottomHintText: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2EE',
  },
  loadingText: { marginTop: 14, fontSize: 15, color: '#757575' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 48,
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