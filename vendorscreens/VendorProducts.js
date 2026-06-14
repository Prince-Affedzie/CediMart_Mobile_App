// src/vendorscreens/MyProductsScreen.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Animated,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMyProducts, deleteProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const STALE_THRESHOLD_MS = 30_000; // re-fetch if data is older than 30s

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',       label: 'All',       icon: 'apps-outline'         },
  { key: 'available', label: 'Active',    icon: 'checkmark-circle-outline' },
  { key: 'low',       label: 'Low Stock', icon: 'warning-outline'      },
  { key: 'sold',      label: 'Sold Out',  icon: 'close-circle-outline' },
];

const SORT_OPTIONS = [
  { key: 'newest',     label: 'Newest First',        icon: 'time-outline'        },
  { key: 'oldest',     label: 'Oldest First',         icon: 'time-outline'        },
  { key: 'price-asc',  label: 'Price: Low → High',   icon: 'arrow-up-outline'    },
  { key: 'price-desc', label: 'Price: High → Low',   icon: 'arrow-down-outline'  },
  { key: 'stock-asc',  label: 'Stock: Low → High',   icon: 'trending-up-outline' },
  { key: 'name-az',    label: 'Name A → Z',           icon: 'text-outline'        },
];

const CONDITION_CONFIG = {
  'new':           { label: 'New',           color: '#2E7D32', bg: '#E8F5E9' },
  'like-new':      { label: 'Like New',      color: '#2E7D32', bg: '#E8F5E9' },
  'excellent':     { label: 'Excellent',     color: '#1565C0', bg: '#E3F2FD' },
  'good':          { label: 'Good',          color: '#F57F17', bg: '#FFF8E1' },
  'fair':          { label: 'Fair',          color: '#E65100', bg: '#FFF3E0' },
  'slightly-used': { label: 'Used',          color: '#E65100', bg: '#FFF3E0' },
  'for-parts':     { label: 'Parts',         color: '#C62828', bg: '#FFEBEE' },
};

// Deterministic placeholder color from product name
const PLACEHOLDER_COLORS = [
  { bg: '#E8F5E9', text: '#2E7D32' }, { bg: '#FFF8E1', text: '#F9A825' },
  { bg: '#FCE4EC', text: '#AD1457' }, { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#F3E5F5', text: '#6A1B9A' }, { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#E0F2F1', text: '#00695C' },
];

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={[styles.cardImageWrap, { backgroundColor: '#E8EDE8' }]} />
      <View style={styles.cardBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '55%', marginTop: 5 }]} />
        <View style={styles.cardFooter}>
          <View style={[styles.skeletonLine, { width: 60, height: 16 }]} />
          <View style={[styles.skeletonLine, { width: 38, height: 24, borderRadius: 8 }]} />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ item, onPress, onEditPress, onLongPress }) => {
  const imageUri = item.images?.[0] || item.image;
  const stock     = item.countInStock ?? 0;
  const isSoldOut = !item.isAvailable || stock <= 0;
  const isLowStock = item.isAvailable && stock > 0 && stock <= 3;
  const condition  = CONDITION_CONFIG[item.condition];
  const colorIdx   = (item.name?.charCodeAt(0) || 0) % PLACEHOLDER_COLORS.length;
  const { bg: placeholderBg, text: placeholderText } = PLACEHOLDER_COLORS[colorIdx];
  const hasMultipleImages = (item.images?.length ?? 0) > 1;

  return (
    <TouchableOpacity
      style={[styles.card, isSoldOut && styles.cardDimmed]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.85}
      delayLongPress={380}
    >
      {/* Image */}
      <View style={[styles.cardImageWrap, { backgroundColor: imageUri ? '#F0F0F0' : placeholderBg }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.cardInitial, { color: placeholderText }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <Ionicons name="close-circle" size={14} color="#fff" />
            <Text style={styles.soldOutLabel}>Sold Out</Text>
          </View>
        )}

        {/* Low stock warning */}
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="flame" size={9} color="#fff" />
            <Text style={styles.lowStockText}>{stock} left</Text>
          </View>
        )}

        {/* Stock count (when healthy) */}
        {!isSoldOut && !isLowStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{stock} in stock</Text>
          </View>
        )}

        {/* Multi-image indicator */}
        {hasMultipleImages && (
          <View style={styles.imgCountBadge}>
            <Ionicons name="images-outline" size={9} color="#fff" />
            <Text style={styles.imgCountText}>{item.images.length}</Text>
          </View>
        )}

        {/* Negotiable flag */}
        {item.negotiable && (
          <View style={styles.negotiableBadge}>
            <Text style={styles.negotiableText}>Nego.</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Condition pill */}
        {condition && (
          <View style={[styles.conditionPill, { backgroundColor: condition.bg }]}>
            <Text style={[styles.conditionPillText, { color: condition.color }]}>
              {condition.label}
            </Text>
          </View>
        )}

        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>

        {item.category && (
          <Text style={styles.cardCategory} numberOfLines={1}>
            {item.category.replace(/-/g, ' ')}
            {item.subcategory ? ` · ${item.subcategory.replace(/-/g, ' ')}` : ''}
          </Text>
        )}

        {/* Engagement row */}
        {((item.views ?? 0) > 0 || (item.favorites ?? 0) > 0) && (
          <View style={styles.engagementRow}>
            {(item.views ?? 0) > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="eye-outline" size={11} color="#BDBDBD" />
                <Text style={styles.engagementText}>{item.views}</Text>
              </View>
            )}
            {(item.favorites ?? 0) > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="heart-outline" size={11} color="#BDBDBD" />
                <Text style={styles.engagementText}>{item.favorites}</Text>
              </View>
            )}
            {(item.numReviews ?? 0) > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="star-outline" size={11} color="#BDBDBD" />
                <Text style={styles.engagementText}>{item.numReviews}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>GH₵ {item.price?.toFixed(2) || '0.00'}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={e => { e?.stopPropagation?.(); onEditPress(item); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={13} color="#2E7D32" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MyProductsScreen = ({ navigation }) => {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]   = useState('all');
  const [sortKey, setSortKey]       = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const lastFetchedAt = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Smart focus-based refresh ───────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const isStale = !lastFetchedAt.current || (now - lastFetchedAt.current) > STALE_THRESHOLD_MS;
      if (isStale) fetchProducts(false);
    }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── API ────────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(prev => products.length === 0 ? true : prev);
      setError(null);
      const res = await getMyProducts();
      if (res?.status === 200) {
        const data = res.data?.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
        lastFetchedAt.current = Date.now();
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else {
        setError('Failed to load products.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [products.length]);

  const onRefresh = () => fetchProducts(true);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const available = products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0).length;
    const lowStock  = products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) <= 3).length;
    const soldOut   = products.filter(p => !p.isAvailable || (p.countInStock ?? 0) <= 0).length;
    const totalVal  = products.reduce((sum, p) => sum + (p.price ?? 0) * (p.countInStock ?? 0), 0);
    return { total: products.length, available, lowStock, soldOut, totalVal };
  }, [products]);

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const tabCount = useCallback((key) => {
    if (key === 'all')       return stats.total;
    if (key === 'available') return stats.available;
    if (key === 'low')       return stats.lowStock;
    return stats.soldOut;
  }, [stats]);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...products];

    // Tab filter
    if (activeTab === 'available') {
      list = list.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0);
    } else if (activeTab === 'low') {
      list = list.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) <= 3);
    } else if (activeTab === 'sold') {
      list = list.filter(p => !p.isAvailable || (p.countInStock ?? 0) <= 0);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortKey) {
      case 'newest':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'oldest':     list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'price-asc':  list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price-desc': list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      case 'stock-asc':  list.sort((a, b) => (a.countInStock ?? 0) - (b.countInStock ?? 0)); break;
      case 'name-az':    list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
    }

    return list;
  }, [products, activeTab, searchQuery, sortKey]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  };

  const handleEditPress = (product) => {
    navigation.navigate('UpdateProduct', { productId: product._id });
  };

  const handleLongPress = (product) => {
    Alert.alert(
      product.name,
      'What would you like to do?',
      [
        { text: 'View Details', onPress: () => handleProductPress(product) },
        { text: 'Edit Listing', onPress: () => handleEditPress(product) },
        { text: 'Toggle Availability', onPress: () => handleToggleAvailability(product) },
        { text: 'Delete Listing', style: 'destructive', onPress: () => confirmDelete(product) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleToggleAvailability = (product) => {
    const newState = !product.isAvailable;
    Alert.alert(
      newState ? 'Mark as Available?' : 'Mark as Unavailable?',
      newState
        ? `"${product.name}" will appear in search results.`
        : `"${product.name}" will be hidden from buyers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Optimistic update
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: newState } : p));
            Toast.show({ type: 'success', text1: newState ? 'Listed' : 'Hidden', text2: `"${product.name}" updated.` });
          },
        },
      ]
    );
  };

  const confirmDelete = (product) => {
    Alert.alert(
      'Delete Listing',
      `Delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(product._id);
            try {
              await deleteProduct(product._id);
              setProducts(prev => prev.filter(p => p._id !== product._id));
              Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing removed.' });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to delete.' });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // ── List Header ────────────────────────────────────────────────────────────
  const ListHeader = useMemo(() => (
    <View>
      {/* ══════════════════════ HEADER HERO ══════════════════════ */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        {/* Top row */}
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>Vendor Dashboard</Text>
            <Text style={styles.heroTitle}>My Listings</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => setShowSortModal(true)}
            >
              <Ionicons name="swap-vertical-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => fetchProducts(true)}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#69F0AE' }]}>{stats.available}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FFD54F' }]}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF8A80' }]}>{stats.soldOut}</Text>
            <Text style={styles.statLabel}>Sold Out</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9E9E9E" style={{ marginLeft: 14 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, category, brand…"
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
              style={styles.searchClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={17} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ══════════════════════ TABS ══════════════════════ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsWrap}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = tabCount(tab.key);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isActive ? '#fff' : '#9E9E9E'}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ══════════════════════ TOOLBAR ══════════════════════ */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>
          {searchQuery
            ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
        </Text>
        <TouchableOpacity
          style={styles.sortChip}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={13} color="#2E7D32" />
          <Text style={styles.sortChipText}>
            {SORT_OPTIONS.find(s => s.key === sortKey)?.label.split(':')[0].split(' → ')[0].trim() || 'Sort'}
          </Text>
          <Ionicons name="chevron-down" size={12} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts(false)}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Low-stock alert banner */}
      {stats.lowStock > 0 && activeTab !== 'low' && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => setActiveTab('low')}
          activeOpacity={0.85}
        >
          <Ionicons name="flame" size={14} color="#E65100" />
          <Text style={styles.alertBannerText}>
            {stats.lowStock} listing{stats.lowStock > 1 ? 's' : ''} running low on stock
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#E65100" />
        </TouchableOpacity>
      )}
    </View>
  ), [stats, activeTab, searchQuery, sortKey, filtered.length, error]);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const ListFooter = (
    <View style={{ height: 120 }} />
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null;
    const isSearching = !!searchQuery.trim();
    const icon = isSearching ? 'search-outline' : activeTab === 'sold' ? 'checkmark-done-outline' : activeTab === 'low' ? 'checkmark-circle-outline' : 'storefront-outline';
    const title = isSearching
      ? 'No results found'
      : activeTab === 'available' ? 'No active listings'
      : activeTab === 'low'      ? 'No low-stock items'
      : activeTab === 'sold'     ? 'Nothing sold out'
      : 'No listings yet';
    const subtitle = isSearching
      ? `No matches for "${searchQuery}". Try a different term.`
      : activeTab === 'available' ? 'Add a product or restore a sold-out listing.'
      : activeTab === 'low'       ? 'All your stock levels look healthy!'
      : activeTab === 'sold'      ? "Great — all your listings are available."
      : 'List your first item to start selling on campus.';

    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name={icon} size={34} color="#A5D6A7" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{subtitle}</Text>
        {!isSearching && activeTab === 'all' && (
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.emptyAddBtnText}>List an Item</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Render card ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (deletingId === item._id) {
      return (
        <View style={[styles.card, styles.cardDeleting]}>
          <ActivityIndicator color="#E53935" />
          <Text style={styles.deletingText}>Deleting…</Text>
        </View>
      );
    }
    return (
      <ProductCard
        item={item}
        onPress={handleProductPress}
        onEditPress={handleEditPress}
        onLongPress={handleLongPress}
      />
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
        {/* Minimal hero while loading */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <SafeAreaView edges={['top']}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroEyebrow}>Vendor Dashboard</Text>
                <Text style={styles.heroTitle}>My Listings</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
        {/* Skeleton grid */}
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ══════════════════════ SORT MODAL ══════════════════════ */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={styles.sortSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort By</Text>
          {SORT_OPTIONS.map(opt => {
            const active = sortKey === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetRow, active && styles.sheetRowActive]}
                onPress={() => { setSortKey(opt.key); setShowSortModal(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetRowIcon, active && styles.sheetRowIconActive]}>
                  <Ionicons name={opt.icon} size={15} color={active ? '#fff' : '#888'} />
                </View>
                <Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />}
              </TouchableOpacity>
            );
          })}
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>

      {/* ══════════════════════ PRODUCT GRID ══════════════════════ */}
      <Animated.FlatList
        style={{ opacity: fadeAnim }}
        data={filtered}
        keyExtractor={item => item._id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && { flexGrow: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
            colors={['#2E7D32']}
            progressBackgroundColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
        extraData={[activeTab, searchQuery, sortKey, deletingId]}
      />

      {/* FAB — add new listing */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Hint bar */}
      <View style={styles.hintBar}>
        <Ionicons name="hand-left-outline" size={12} color="#C8C8C8" />
        <Text style={styles.hintText}>Long-press any listing for more options</Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F0' },

  // ── Hero header ─────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1B5E20',
    marginTop:16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    borderTopLeftRadius:15,
    borderTopRightRadius:15,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', right: -50, top: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', right: 60, bottom: -20,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 14 : 14,
    marginBottom: 20,
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: '700', color: '#81C784',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  heroIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingVertical: 12,
    paddingHorizontal: 8, marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1B2714',
    paddingVertical: 13, paddingHorizontal: 10,
  },
  searchClear: { paddingRight: 12 },

  // Tabs
  tabsWrap: { backgroundColor: '#F2F4F0', flexShrink: 0 },
  tabsRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#E8EAE6',
  },
  tabActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#EFEFEF', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#9E9E9E' },
  tabBadgeTextActive: { color: '#fff' },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB', marginBottom: 4,
  },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500', flex: 1 },
  sortChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F8F3', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
  },
  sortChipText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  // Banners
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 12, marginHorizontal: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText: { flex: 1, fontSize: 13, color: '#C62828' },
  retryLink: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFE0B2',
  },
  alertBannerText: { flex: 1, fontSize: 13, color: '#E65100', fontWeight: '600' },

  // List
  listContent: { paddingHorizontal: 14, paddingBottom: 30 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  // Product card
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff',
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardDimmed: { opacity: 0.58 },
  cardDeleting: {
    justifyContent: 'center', alignItems: 'center',
    height: 180, gap: 8, opacity: 0.7,
  },
  deletingText: { fontSize: 12, color: '#E53935', fontWeight: '600' },
  cardImageWrap: {
    width: '100%', height: 124,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardInitial: { fontSize: 34, fontWeight: '900' },

  // Image overlays
  soldOutOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.62)', paddingVertical: 6,
  },
  soldOutLabel: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  lowStockBadge: {
    position: 'absolute', bottom: 7, left: 7,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E53935', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  lowStockText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stockBadge: {
    position: 'absolute', bottom: 7, right: 7,
    backgroundColor: 'rgba(27,94,32,0.82)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  stockBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  imgCountBadge: {
    position: 'absolute', top: 7, right: 7,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3,
  },
  imgCountText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  negotiableBadge: {
    position: 'absolute', top: 7, left: 7,
    backgroundColor: 'rgba(249,115,22,0.92)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3,
  },
  negotiableText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Card body
  cardBody: { padding: 10, paddingTop: 9 },
  conditionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, marginBottom: 5,
  },
  conditionPillText: { fontSize: 9, fontWeight: '800' },
  cardName: {
    fontSize: 13, fontWeight: '700', color: '#1B2714',
    lineHeight: 17, marginBottom: 2, minHeight: 34,
    numberOfLines: 2,
  },
  cardCategory: {
    fontSize: 10, fontWeight: '700', color: '#BDBDBD',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5,
  },
  engagementRow: { flexDirection: 'row', gap: 10, marginBottom: 7 },
  engagementItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  engagementText: { fontSize: 11, color: '#BDBDBD', fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardPrice: { fontSize: 15, fontWeight: '900', color: '#1B5E20' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9', borderRadius: 9,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, gap: 12, paddingTop: 16,
  },
  skeletonLine: {
    height: 12, borderRadius: 6, backgroundColor: '#E8EDE8', marginBottom: 3, width: '80%',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#1B2714', marginBottom: 8 },
  emptySub: {
    fontSize: 13, color: '#9E9E9E', textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#2E7D32', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 14, shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Sort sheet
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sortSheet: {
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
  sheetTitle: { fontSize: 18, fontWeight: '900', color: '#1B5E20', marginBottom: 14 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4,
  },
  sheetRowActive: { backgroundColor: '#F1F8F3' },
  sheetRowIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetRowIconActive: { backgroundColor: '#2E7D32' },
  sheetRowText: { flex: 1, fontSize: 14, color: '#424242', fontWeight: '500' },
  sheetRowTextActive: { color: '#2E7D32', fontWeight: '700' },

  // FAB + hint
  fab: {
    position: 'absolute', right: 20, bottom: 52,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.38, shadowRadius: 10, elevation: 8,
  },
  hintBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, backgroundColor: '#F2F4F0',
  },
  hintText: { fontSize: 11, color: '#C8C8C8', fontWeight: '500' },
});

export default MyProductsScreen;