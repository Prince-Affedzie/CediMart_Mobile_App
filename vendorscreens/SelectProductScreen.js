// src/screens/vendor/SelectProductScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVendor } from '../context/VendorContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandD: '#0F766E',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  danger: '#DC2626',
  success: '#059669',
  successBg: '#ECFDF5',
  info: '#0284C7',
  gold: '#F59E0B',
  white: '#FFFFFF',
};

// ─── Product Card ────────────────────────────────────────────────────────────
const ProductCard = ({ product, isSelected, onSelect }) => {
  const imageUri = product.images?.[0] || product.image;
  const isAvailable = product.isAvailable && (product.countInStock ?? 0) > 0;

  return (
    <TouchableOpacity
      style={[styles.productCard, isSelected && styles.productCardSelected]}
      onPress={() => onSelect(product)}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.productImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImg} />
        ) : (
          <View style={styles.productImgPlaceholder}>
            <Ionicons name="cube-outline" size={28} color={C.textMuted} />
          </View>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedCheck}>
              <Ionicons name="checkmark-circle" size={28} color={C.brand} />
            </View>
          </View>
        )}

        {/* Availability badge */}
        {!isAvailable && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableBadgeText}>Sold Out</Text>
          </View>
        )}

        {/* Condition badge */}
        {product.condition && isAvailable && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionBadgeText}>
              {product.condition === 'new' ? 'New' : product.condition.replace(/-/g, ' ')}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>GH₵ {Number(product.price).toFixed(2)}</Text>
          {product.campus && (
            <View style={styles.campusPill}>
              <Text style={styles.campusPillText}>{product.campus}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ searchQuery, onRefresh }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconWrap}>
      <Ionicons 
        name={searchQuery ? 'search-outline' : 'cube-outline'} 
        size={44} 
        color={C.textMuted} 
      />
    </View>
    <Text style={styles.emptyTitle}>
      {searchQuery ? 'No products found' : 'No products yet'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {searchQuery 
        ? `No products match "${searchQuery}". Try a different search term.`
        : 'Add your first product to start linking them to your posts.'}
    </Text>
    {!searchQuery && (
      <TouchableOpacity style={styles.emptyBtn} onPress={onRefresh}>
        <Ionicons name="refresh-outline" size={16} color={C.brand} />
        <Text style={styles.emptyBtnText}>Refresh</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const SelectProductScreen = ({ route, navigation }) => {
  const { onSelect } = route.params || {};
  const {
    products,
    loading: contextLoading,
    refreshing: contextRefreshing,
    refreshVendorData,
  } = useVendor();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!products?.length) return [];
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      p =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.campus?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Only show available products
  const availableProducts = useMemo(
    () => filteredProducts.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0),
    [filteredProducts]
  );

  const handleSelect = (product) => {
    setSelectedId(product._id);
    // Small delay to show the selection animation before navigating back
    setTimeout(() => {
      onSelect?.(product);
      navigation.goBack();
    }, 200);
  };

  const handleRefresh = () => {
    refreshVendorData?.();
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      isSelected={selectedId === item._id}
      onSelect={handleSelect}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Product</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your products..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      {availableProducts.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''} available
          </Text>
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={availableProducts}
        renderItem={renderProduct}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          contextLoading ? null : (
            <EmptyState searchQuery={searchQuery} onRefresh={handleRefresh} />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={contextRefreshing || false}
            onRefresh={handleRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          availableProducts.length === 0 && !contextLoading && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading overlay */}
      {contextLoading && availableProducts.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40 },
  listContentEmpty: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

  // Search
  searchContainer: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.surface },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: C.text, paddingVertical: 11,
  },
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  countText: { fontSize: 12.5, color: C.textMuted, fontWeight: '600' },
  clearSearch: { fontSize: 12.5, color: C.brand, fontWeight: '600' },

  // Grid
  gridRow: { paddingHorizontal: 12, gap: 12, marginBottom: 12 },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productCardSelected: {
    borderColor: C.brand,
    borderWidth: 2,
    shadowColor: C.brand,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Image
  productImgWrap: { position: 'relative', height: 140, backgroundColor: '#F1F5F9' },
  productImg: { width: '100%', height: '100%' },
  productImgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Selected overlay
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,148,136,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  selectedCheck: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },

  // Badges
  unavailableBadge: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  unavailableBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  conditionBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  conditionBadgeText: { fontSize: 9.5, fontWeight: '700', color: C.text, textTransform: 'capitalize' },

  // Body
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18, marginBottom: 8 },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { fontSize: 14, fontWeight: '800', color: C.accent },
  campusPill: {
    backgroundColor: C.brandDim, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  campusPillText: { fontSize: 10, fontWeight: '600', color: C.brand },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.brand,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: C.brand },

  // Loading
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg, gap: 12,
  },
  loadingText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
});

export default SelectProductScreen;