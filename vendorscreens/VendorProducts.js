// src/vendorscreens/MyProductsScreen.js
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Dimensions,
  ScrollView, Alert, Animated, StatusBar, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { deleteProduct } from '../apis/vendorApi';
import { useVendor } from '../context/VendorContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  elev:         '#F1F5F9',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentL:      '#FB923C',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  successBorder:'#A7F3D0',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  infoBorder:   '#BAE6FD',
  white:        '#FFFFFF',
  black:        '#000000',
};

const TABS = [
  { key: 'all',       label: 'All',       icon: 'apps-outline'              },
  { key: 'available', label: 'Active',    icon: 'checkmark-circle-outline'  },
  { key: 'low',       label: 'Low Stock', icon: 'warning-outline'           },
  { key: 'sold',      label: 'Sold Out',  icon: 'close-circle-outline'      },
];

const SORT_OPTIONS = [
  { key: 'newest',     label: 'Newest First',      icon: 'time-outline'        },
  { key: 'oldest',     label: 'Oldest First',       icon: 'time-outline'        },
  { key: 'price-asc',  label: 'Price: Low → High', icon: 'arrow-up-outline'    },
  { key: 'price-desc', label: 'Price: High → Low', icon: 'arrow-down-outline'  },
  { key: 'stock-asc',  label: 'Stock: Low → High', icon: 'trending-up-outline' },
  { key: 'name-az',    label: 'Name A → Z',         icon: 'text-outline'        },
];

const CONDITION_CONFIG = {
  'new':           { label: 'New',      color: C.success, bg: C.successBg },
  'like-new':      { label: 'Like New', color: C.success, bg: C.successBg },
  'excellent':     { label: 'Excellent',color: C.brand,   bg: C.brandBg },
  'good':          { label: 'Good',     color: '#D97706', bg: C.accentBg },
  'fair':          { label: 'Fair',     color: '#EA580C', bg: '#FFF7ED' },
  'slightly-used': { label: 'Used',     color: '#EA580C', bg: '#FFF7ED' },
  'for-parts':     { label: 'Parts',    color: C.danger,  bg: C.dangerBg },
};

const PLACEHOLDER_COLORS = [
  { bg: C.brandBg,   text: C.brand },   { bg: C.accentBg,  text: '#D97706' },
  { bg: '#FCE7F3',   text: '#BE185D' }, { bg: C.infoBg,    text: C.info },
  { bg: '#F3E8FF',   text: '#7E22CE' }, { bg: '#FFF7ED',   text: '#EA580C' },
  { bg: '#CCFBF1',   text: '#0F766E' },
];

// ─── Skeleton Card (unchanged) ────────────────────────────────────────────────
const SkeletonCard = () => {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.5, duration: 750, useNativeDriver: true })])).start();
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

const StatCard = ({ value, label, valueColor, icon, onPress, alert }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={onPress ? 0.75 : 1} disabled={!onPress}>
    <View style={styles.statCardTop}>
      <View style={[styles.statIconWrap, { backgroundColor: (valueColor || C.brand) + '18' }]}>
        <Ionicons name={icon} size={15} color={valueColor || C.brand} />
      </View>
      {alert ? <View style={styles.statAlertDot} /> : null}
    </View>
    <Text style={[styles.statValue, { color: valueColor || C.t1 }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const ProductCard = React.memo(({ item, onPress, onEditPress, onLongPress }) => {
  const imageUri = item.images?.[0] || item.image;
  const stock = item.countInStock ?? 0;
  const isSoldOut = !item.isAvailable || stock <= 0;
  const isLowStock = item.isAvailable && stock > 0 && stock <= 3;
  const condition = CONDITION_CONFIG[item.condition];
  const colorIdx = (item.name?.charCodeAt(0) || 0) % PLACEHOLDER_COLORS.length;
  const { bg: placeholderBg, text: placeholderText } = PLACEHOLDER_COLORS[colorIdx];
  const hasMultipleImages = (item.images?.length ?? 0) > 1;

  return (
    <TouchableOpacity style={[styles.card, isSoldOut && styles.cardDimmed]} onPress={() => onPress(item)} onLongPress={() => onLongPress(item)} activeOpacity={0.85} delayLongPress={380}>
      <View style={[styles.cardImageWrap, { backgroundColor: imageUri ? '#F0F0F0' : placeholderBg }]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" /> : <Text style={[styles.cardInitial, { color: placeholderText }]}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>}
        {isSoldOut && <View style={styles.soldOutOverlay}><Ionicons name="close-circle" size={14} color="#fff" /><Text style={styles.soldOutLabel}>Sold Out</Text></View>}
        {isLowStock && <View style={styles.lowStockBadge}><Ionicons name="flame" size={9} color="#fff" /><Text style={styles.lowStockText}>{stock} left</Text></View>}
        {!isSoldOut && !isLowStock && <View style={styles.stockBadge}><Text style={styles.stockBadgeText}>{stock} in stock</Text></View>}
        {hasMultipleImages && <View style={styles.imgCountBadge}><Ionicons name="images-outline" size={9} color="#fff" /><Text style={styles.imgCountText}>{item.images.length}</Text></View>}
        {item.negotiable && <View style={styles.negotiableBadge}><Text style={styles.negotiableText}>Nego.</Text></View>}
      </View>
      <View style={styles.cardBody}>
        {condition && <View style={[styles.conditionPill, { backgroundColor: condition.bg }]}><Text style={[styles.conditionPillText, { color: condition.color }]}>{condition.label}</Text></View>}
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        {item.category && <Text style={styles.cardCategory} numberOfLines={1}>{item.category.replace(/-/g, ' ')}{item.subcategory ? ` · ${item.subcategory.replace(/-/g, ' ')}` : ''}</Text>}
        {((item.views ?? 0) > 0 || (item.favorites ?? 0) > 0) && (
          <View style={styles.engagementRow}>
            {(item.views ?? 0) > 0 && <View style={styles.engagementItem}><Ionicons name="eye-outline" size={11} color={C.t3} /><Text style={styles.engagementText}>{item.views}</Text></View>}
            {(item.favorites ?? 0) > 0 && <View style={styles.engagementItem}><Ionicons name="heart-outline" size={11} color={C.t3} /><Text style={styles.engagementText}>{item.favorites}</Text></View>}
            {(item.numReviews ?? 0) > 0 && <View style={styles.engagementItem}><Ionicons name="star-outline" size={11} color={C.t3} /><Text style={styles.engagementText}>{item.numReviews}</Text></View>}
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>GH₵ {item.price?.toFixed(2) || '0.00'}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={e => { e?.stopPropagation?.(); onEditPress(item); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={13} color={C.brand} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MyProductsScreen = ({ navigation }) => {
  const { products, loading: contextLoading, refreshing: contextRefreshing, error: contextError, refreshVendorData, refetchProducts, updateProductLocally, removeProductLocally } = useVendor();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const updateIndicatorAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    let isMounted = true;
    const silentRefresh = async () => {
      if (products.length === 0) return;
      setIsSilentRefreshing(true);
      Animated.timing(updateIndicatorAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      try { await refetchProducts(); } finally {
        if (isMounted) setTimeout(() => { Animated.timing(updateIndicatorAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => { if (isMounted) setIsSilentRefreshing(false); }); }, 500);
      }
    };
    silentRefresh();
    return () => { isMounted = false; };
  }, [refetchProducts, products.length]));

  useEffect(() => { if (!contextLoading && products.length > 0) Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, [contextLoading, products.length]);

  const stats = useMemo(() => {
    const available = products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0).length;
    const lowStock = products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) <= 3).length;
    const soldOut = products.filter(p => !p.isAvailable || (p.countInStock ?? 0) <= 0).length;
    return { total: products.length, available, lowStock, soldOut };
  }, [products]);

  const tabCount = useCallback((key) => { if (key === 'all') return stats.total; if (key === 'available') return stats.available; if (key === 'low') return stats.lowStock; return stats.soldOut; }, [stats]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeTab === 'available') list = list.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0);
    else if (activeTab === 'low') list = list.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) <= 3);
    else if (activeTab === 'sold') list = list.filter(p => !p.isAvailable || (p.countInStock ?? 0) <= 0);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase().trim(); list = list.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.subcategory?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)); }
    switch (sortKey) {
      case 'newest': list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'oldest': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'price-asc': list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price-desc': list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      case 'stock-asc': list.sort((a, b) => (a.countInStock ?? 0) - (b.countInStock ?? 0)); break;
      case 'name-az': list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
    }
    return list;
  }, [products, activeTab, searchQuery, sortKey]);

  const handleProductPress = (p) => navigation.navigate('ProductDetail', { productId: p._id, product: p });
  const handleEditPress = (p) => navigation.navigate('UpdateProduct', { productId: p._id });

  const handleLongPress = (product) => {
    Alert.alert(product.name, 'What would you like to do?', [
      { text: 'View Details', onPress: () => handleProductPress(product) },
      { text: 'Edit Listing', onPress: () => handleEditPress(product) },
      { text: 'Toggle Availability', onPress: () => handleToggleAvailability(product) },
      { text: 'Delete Listing', style: 'destructive', onPress: () => confirmDelete(product) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleToggleAvailability = (product) => {
    const newState = !product.isAvailable;
    Alert.alert(newState ? 'Mark as Available?' : 'Mark as Unavailable?', newState ? `"${product.name}" will appear in search results.` : `"${product.name}" will be hidden from buyers.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => { updateProductLocally(product._id, { isAvailable: newState }); Toast.show({ type: 'success', text1: newState ? 'Listed' : 'Hidden', text2: `"${product.name}" updated.` }); } },
    ]);
  };

  const confirmDelete = (product) => {
    Alert.alert('Delete Listing', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { setDeletingId(product._id); try { await deleteProduct(product._id); removeProductLocally(product._id); Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing removed.' }); } catch (err) { Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to delete.' }); } finally { setDeletingId(null); } } },
    ]);
  };

  // ── ListHeader, renderItem, renderEmpty (same structure, colors in styles) ──
  const ListHeader = useMemo(() => (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroDecor1} /><View style={styles.heroDecor2} />
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <View><Text style={styles.heroEyebrow}>Vendor Dashboard</Text><Text style={styles.heroTitle}>My Listings</Text></View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => setShowSortModal(true)}><Ionicons name="swap-vertical-outline" size={18} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={refreshVendorData}><Ionicons name="refresh-outline" size={18} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
      <View style={styles.statsStrip}>
        <StatCard icon="cube-outline" value={stats.total} label="Total" valueColor={C.brand} />
        <View style={styles.statDivider} />
        <StatCard icon="checkmark-circle-outline" value={stats.available} label="Active" valueColor={C.success} onPress={() => setActiveTab('available')} />
        <View style={styles.statDivider} />
        <StatCard icon="flame-outline" value={stats.lowStock} label="Low Stock" valueColor={stats.lowStock > 0 ? C.accent : C.t3} onPress={stats.lowStock > 0 ? () => setActiveTab('low') : null} alert={stats.lowStock > 0} />
        <View style={styles.statDivider} />
        <StatCard icon="close-circle-outline" value={stats.soldOut} label="Sold Out" valueColor={stats.soldOut > 0 ? C.danger : C.t3} onPress={stats.soldOut > 0 ? () => setActiveTab('sold') : null} />
      </View>
      {/* Search, Tabs, Toolbar, Error, Alert — same structure with updated colors in styles */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.t3} style={{ marginLeft: 14 }} />
          <TextInput style={styles.searchInput} placeholder="Search by name, category, brand…" placeholderTextColor={C.t3} value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close-circle" size={17} color={C.t3} /></TouchableOpacity>}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow} style={styles.tabsWrap}>
        {TABS.map(tab => { const isActive = activeTab === tab.key; const count = tabCount(tab.key); return (<TouchableOpacity key={tab.key} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.75}><Ionicons name={tab.icon} size={13} color={isActive ? '#fff' : C.t3} /><Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text><View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}><Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text></View></TouchableOpacity>); })}
      </ScrollView>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>{searchQuery ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"` : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}</Text>
        <TouchableOpacity style={styles.sortChip} onPress={() => setShowSortModal(true)}><Ionicons name="swap-vertical-outline" size={13} color={C.brand} /><Text style={styles.sortChipText}>{SORT_OPTIONS.find(s => s.key === sortKey)?.label.split(':')[0].split(' → ')[0].trim() || 'Sort'}</Text><Ionicons name="chevron-down" size={12} color={C.brand} /></TouchableOpacity>
      </View>
      {contextError && <View style={styles.errorBanner}><Ionicons name="alert-circle-outline" size={16} color={C.danger} /><Text style={styles.errorText}>{contextError}</Text><TouchableOpacity onPress={refreshVendorData}><Text style={styles.retryLink}>Retry</Text></TouchableOpacity></View>}
      {stats.lowStock > 0 && activeTab !== 'low' && <TouchableOpacity style={styles.alertBanner} onPress={() => setActiveTab('low')} activeOpacity={0.85}><Ionicons name="flame" size={14} color={C.accent} /><Text style={styles.alertBannerText}>{stats.lowStock} listing{stats.lowStock > 1 ? 's' : ''} running low on stock</Text><Ionicons name="chevron-forward" size={14} color={C.accent} /></TouchableOpacity>}
    </View>
  ), [stats, activeTab, searchQuery, sortKey, filtered.length, contextError]);

  const renderItem = ({ item }) => {
    if (deletingId === item._id) return <View style={[styles.card, styles.cardDeleting]}><ActivityIndicator color={C.danger} /><Text style={styles.deletingText}>Deleting…</Text></View>;
    return <ProductCard item={item} onPress={handleProductPress} onEditPress={handleEditPress} onLongPress={handleLongPress} />;
  };

  const renderEmpty = () => {
    if (contextLoading) return null;
    const isSearching = !!searchQuery.trim();
    const configs = {
      search: { icon: 'search-outline', title: 'No results found', sub: `No matches for "${searchQuery}". Try a different term.` },
      available: { icon: 'storefront-outline', title: 'No active listings', sub: 'Add a product or restore a sold-out listing.' },
      low: { icon: 'checkmark-circle-outline', title: 'No low-stock items', sub: 'All your stock levels look healthy!' },
      sold: { icon: 'checkmark-done-outline', title: 'Nothing sold out', sub: 'Great — all your listings are available.' },
      all: { icon: 'storefront-outline', title: 'No listings yet', sub: 'List your first item to start selling on campus.' },
    };
    const cfg = configs[isSearching ? 'search' : activeTab] || configs.all;
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}><Ionicons name={cfg.icon} size={34} color={C.brandBorder} /></View>
        <Text style={styles.emptyTitle}>{cfg.title}</Text>
        <Text style={styles.emptySub}>{cfg.sub}</Text>
        {!isSearching && activeTab === 'all' && <TouchableOpacity style={styles.emptyAddBtn} onPress={() => navigation.navigate('AddProduct')}><Ionicons name="add" size={16} color="#fff" /><Text style={styles.emptyAddBtnText}>List an Item</Text></TouchableOpacity>}
      </View>
    );
  };

  if (contextLoading && products.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
        <View style={styles.hero}><View style={styles.heroDecor1} /><View style={styles.heroDecor2} /><SafeAreaView edges={['top']}><View style={styles.heroInner}><View><Text style={styles.heroEyebrow}>Vendor Dashboard</Text><Text style={styles.heroTitle}>My Listings</Text></View></View></SafeAreaView></View>
        <View style={styles.skeletonGrid}>{[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
      <Animated.View style={[styles.updateIndicator, { opacity: updateIndicatorAnim, transform: [{ translateY: updateIndicatorAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] }]} pointerEvents="none">
        <ActivityIndicator size="small" color={C.brand} /><Text style={styles.updateIndicatorText}>Updating your listings...</Text>
      </Animated.View>
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowSortModal(false)} />
        <View style={styles.sortSheet}>
          <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Sort By</Text>
          {SORT_OPTIONS.map(opt => { const active = sortKey === opt.key; return (<TouchableOpacity key={opt.key} style={[styles.sheetRow, active && styles.sheetRowActive]} onPress={() => { setSortKey(opt.key); setShowSortModal(false); }} activeOpacity={0.75}><View style={[styles.sheetRowIcon, active && styles.sheetRowIconActive]}><Ionicons name={opt.icon} size={15} color={active ? '#fff' : '#888'} /></View><Text style={[styles.sheetRowText, active && styles.sheetRowTextActive]}>{opt.label}</Text>{active && <Ionicons name="checkmark-circle" size={20} color={C.brand} />}</TouchableOpacity>); })}
          <SafeAreaView edges={['bottom']} style={{ paddingBottom: 8 }} />
        </View>
      </Modal>
      <Animated.FlatList style={{ opacity: fadeAnim }} data={filtered} keyExtractor={item => item._id} ListHeaderComponent={ListHeader} ListFooterComponent={<View style={{ height: 110 }} />} ListEmptyComponent={renderEmpty} renderItem={renderItem} numColumns={2} columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && { flexGrow: 1 }]}
        refreshControl={<RefreshControl refreshing={contextRefreshing} onRefresh={refreshVendorData} tintColor={C.brand} colors={[C.brand]} progressBackgroundColor="#fff" />}
        showsVerticalScrollIndicator={false} extraData={[activeTab, searchQuery, sortKey, deletingId]} />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct')} activeOpacity={0.88}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>
      <View style={styles.hintBar}><Ionicons name="hand-left-outline" size={12} color="#C8C8C8" /><Text style={styles.hintText}>Long-press any listing for more options</Text></View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  updateIndicator: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brandBg, paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.brandBorder },
  updateIndicatorText: { fontSize: 13, fontWeight: '600', color: C.brand },
  hero: { backgroundColor: C.brand, paddingHorizontal: 16, paddingBottom: 20, overflow: 'hidden', position: 'relative', marginTop: 18, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  heroDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', right: -40, top: -50 },
  heroDecor2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)', right: 80, bottom: -10 },
  heroInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 14, marginBottom: 2 },
  heroEyebrow: { fontSize: 11, fontWeight: '700', color: '#99F6E4', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  heroIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  statsStrip: { flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: 14, marginTop: -1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingVertical: 14, paddingHorizontal: 8, shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4, marginBottom: 14 },
  statCard: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statCardTop: { position: 'relative', marginBottom: 6 },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statAlertDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.surface },
  statValue: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  statLabel: { fontSize: 10, color: C.t3, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0', alignSelf: 'center' },
  searchWrap: { paddingHorizontal: 14, marginBottom: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: C.t1, paddingVertical: 13, paddingHorizontal: 10 },
  searchClear: { paddingRight: 12 },
  tabsWrap: { backgroundColor: C.bg, flexShrink: 0 },
  tabsRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1.5, borderColor: '#E8EAE6' },
  tabActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabText: { fontSize: 12, fontWeight: '600', color: C.t3 },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#EFEFEF', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: C.t3 },
  tabBadgeTextActive: { color: '#fff' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EBEBEB', marginBottom: 4 },
  toolbarCount: { fontSize: 13, color: C.t3, fontWeight: '500', flex: 1 },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.brandBorder },
  sortChipText: { fontSize: 12, fontWeight: '700', color: C.brand },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.dangerBg, borderRadius: 12, padding: 12, marginHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: C.dangerBorder },
  errorText: { flex: 1, fontSize: 13, color: C.danger },
  retryLink: { fontSize: 13, fontWeight: '700', color: C.brand },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentBg, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.accentBorder },
  alertBannerText: { flex: 1, fontSize: 13, color: C.accent, fontWeight: '600' },
  listContent: { paddingHorizontal: 14, paddingBottom: 30 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  card: { width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardDimmed: { opacity: 0.58 },
  cardDeleting: { justifyContent: 'center', alignItems: 'center', height: 180, gap: 8, opacity: 0.7 },
  deletingText: { fontSize: 12, color: C.danger, fontWeight: '600' },
  cardImageWrap: { width: '100%', height: 124, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardInitial: { fontSize: 34, fontWeight: '900' },
  soldOutOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.62)', paddingVertical: 6 },
  soldOutLabel: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  lowStockBadge: { position: 'absolute', bottom: 7, left: 7, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.danger, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  lowStockText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  stockBadge: { position: 'absolute', bottom: 7, right: 7, backgroundColor: C.brandD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  stockBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  imgCountBadge: { position: 'absolute', top: 7, right: 7, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  imgCountText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  negotiableBadge: { position: 'absolute', top: 7, left: 7, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  negotiableText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  cardBody: { padding: 10, paddingTop: 9 },
  conditionPill: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  conditionPillText: { fontSize: 9, fontWeight: '800' },
  cardName: { fontSize: 13, fontWeight: '700', color: C.t1, lineHeight: 17, marginBottom: 2, minHeight: 34 },
  cardCategory: { fontSize: 10, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  engagementRow: { flexDirection: 'row', gap: 10, marginBottom: 7 },
  engagementItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  engagementText: { fontSize: 11, color: C.t3, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 15, fontWeight: '900', color: C.accent },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.brandBg, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: C.brandBorder },
  editBtnText: { fontSize: 11, fontWeight: '700', color: C.brand },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12, paddingTop: 16 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: '#E8EDE8', marginBottom: 3, width: '80%' },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40 },
  emptyIconCircle: { width: 82, height: 82, borderRadius: 41, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: C.t1, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.t3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.brand, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sortSheet: { backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, shadowColor: C.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 18 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: C.brand, marginBottom: 14 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4 },
  sheetRowActive: { backgroundColor: C.brandBg },
  sheetRowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  sheetRowIconActive: { backgroundColor: C.brand },
  sheetRowText: { flex: 1, fontSize: 14, color: C.t2, fontWeight: '500' },
  sheetRowTextActive: { color: C.brand, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 44, width: 56, height: 56, borderRadius: 28, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', shadowColor: C.brandD, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  hintBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: C.bg },
  hintText: { fontSize: 11, color: '#C8C8C8', fontWeight: '500' },
});

export default MyProductsScreen;