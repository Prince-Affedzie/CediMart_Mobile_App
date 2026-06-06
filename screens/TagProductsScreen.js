// src/screens/main/TagProductsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductsByTag } from '../apis/productApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const TAG_CONFIG = {
  'featured':         { label: 'Featured',         icon: 'star',        accent: '#F57F17', accentBg: '#FFF8E1', headerBg: ['#E65100', '#F57F17'], heroEmoji: '⭐' },
  'urgent-sale':      { label: 'Urgent Sales',      icon: 'flash',       accent: '#C62828', accentBg: '#FFEBEE', headerBg: ['#B71C1C', '#E53935'], heroEmoji: '⚡' },
  'popular':          { label: 'Popular',           icon: 'trending-up', accent: '#6A1B9A', accentBg: '#F3E5F5', headerBg: ['#4A148C', '#7B1FA2'], heroEmoji: '🔥' },
  'discounted':       { label: 'Discounted',        icon: 'pricetag',    accent: '#1B5E20', accentBg: '#E8F5E9', headerBg: ['#1B5E20', '#2E7D32'], heroEmoji: '🏷️' },
  'new-arrival':      { label: 'New Arrivals',      icon: 'sparkles',    accent: '#1565C0', accentBg: '#E3F2FD', headerBg: ['#0D47A1', '#1976D2'], heroEmoji: '✨' },
  'student-favorite': { label: 'Student Favorites', icon: 'heart',       accent: '#AD1457', accentBg: '#FCE4EC', headerBg: ['#880E4F', '#C2185B'], heroEmoji: '🎓' },
};

const CONDITION_CONFIG = {
  'new':           { label: 'Brand New',     bg: '#E8F5E9', text: '#1B5E20' },
  'like-new':      { label: 'Like New',      bg: '#E3F2FD', text: '#1565C0' },
  'excellent':     { label: 'Excellent',     bg: '#EDE7F6', text: '#4527A0' },
  'good':          { label: 'Good',          bg: '#FFF8E1', text: '#F57F17' },
  'fair':          { label: 'Fair',          bg: '#FFF3E0', text: '#E65100' },
  'slightly-used': { label: 'Slight Used',   bg: '#EFEBE9', text: '#4E342E' },
  'for-parts':     { label: 'For Parts',     bg: '#FFEBEE', text: '#C62828' },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ item, onPress, tagConfig, cardAnim }) => {
  const imageUri   = item.images?.[0];
  const condCfg    = CONDITION_CONFIG[item.condition];
  const isAvail    = item.isAvailable !== false && (item.countInStock ?? 0) > 0;
  const isLowStock = isAvail && (item.countInStock ?? 0) <= 3;

  return (
    <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.87}>

        {/* ── Image ── */}
        <View style={s.imgWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.img} resizeMode="cover" />
          ) : (
            <View style={[s.imgPlaceholder, { backgroundColor: tagConfig.accentBg }]}>
              <Text style={{ fontSize: 32 }}>{tagConfig.heroEmoji}</Text>
            </View>
          )}

          {/* Gradient scrim bottom */}
          <View style={s.imgScrim} />

          {/* Condition badge — top left */}
          {condCfg && (
            <View style={[s.condBadge, { backgroundColor: condCfg.bg }]}>
              <Text style={[s.condBadgeText, { color: condCfg.text }]}>{condCfg.label}</Text>
            </View>
          )}

          {/* Negotiable — top right */}
          {item.negotiable && (
            <View style={s.negTag}>
              <Text style={s.negTagText}>Nego</Text>
            </View>
          )}

          {/* Low stock ribbon */}
          {isLowStock && (
            <View style={s.lowStockRibbon}>
              <Ionicons name="flame" size={9} color="#fff" />
              <Text style={s.lowStockText}>Only {item.countInStock} left</Text>
            </View>
          )}

          {/* Sold-out overlay */}
          {!isAvail && (
            <View style={s.soldOverlay}>
              <View style={s.soldBadge}>
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={s.soldText}>Sold Out</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={s.body}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>

          {/* Campus pill */}
          {item.campus && (
            <View style={s.campusPill}>
              <Ionicons name="school-outline" size={9} color="#2E7D32" />
              <Text style={s.campusPillText}>{item.campus}</Text>
            </View>
          )}

          {/* Price row */}
          <View style={s.footer}>
            <Text style={s.price}>GH₵ {item.price?.toFixed(2)}</Text>
            <TouchableOpacity
              style={[s.viewBtn, { backgroundColor: tagConfig.accentBg }]}
              onPress={() => onPress(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="arrow-forward" size={13} color={tagConfig.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({ tagConfig, onBrowseAll }) => (
  <View style={s.emptyWrap}>
    <View style={[s.emptyIconBg, { backgroundColor: tagConfig.accentBg }]}>
      <Text style={{ fontSize: 42 }}>{tagConfig.heroEmoji}</Text>
    </View>
    <Text style={s.emptyTitle}>No {tagConfig.label} listings</Text>
    <Text style={s.emptySub}>
      There are no products with this tag right now.{'\n'}Check back soon!
    </Text>
    <TouchableOpacity
      style={[s.browseBtn, { backgroundColor: tagConfig.accent }]}
      onPress={onBrowseAll}
      activeOpacity={0.88}
    >
      <Ionicons name="grid-outline" size={16} color="#fff" />
      <Text style={s.browseBtnText}>Browse All Listings</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const TagProductsScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { tag }    = route.params;

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const tagConfig  = TAG_CONFIG[tag] || { label: tag, icon: 'pricetag', accent: '#2E7D32', accentBg: '#E8F5E9', headerBg: ['#1B5E20', '#2E7D32'], heroEmoji: '🏷️' };

  // Header animation
  const scrollY      = useRef(new Animated.Value(0)).current;
  const headerScale  = scrollY.interpolate({ inputRange: [-80, 0], outputRange: [1.08, 1], extrapolate: 'clamp' });
  const headerOpacity= scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.92], extrapolate: 'clamp' });

  // Card stagger animations
  const cardAnims = useRef([...Array(40)].map(() => new Animated.Value(0))).current;

  const animateCards = useCallback((count) => {
    const anims = cardAnims.slice(0, count).map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 280, delay: i * 55, useNativeDriver: true })
    );
    Animated.stagger(40, anims).start();
  }, [cardAnims]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await getProductsByTag(tag);
      if (res?.data?.success) {
        const data = res.data.data || [];
        setProducts(data);
        // Reset all card anims then stagger in
        cardAnims.forEach(a => a.setValue(0));
        setTimeout(() => animateCards(data.length), 80);
      } else {
        setError('Failed to load products.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tag, animateCards]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const handleProductPress = (product) =>
    navigation.navigate('ProductDetail', { productId: product._id, product });

  // ── RENDER ITEM ────────────────────────────────────────────────────────────
  const renderItem = ({ item, index }) => (
    <ProductCard
      item={item}
      onPress={handleProductPress}
      tagConfig={tagConfig}
      cardAnim={cardAnims[index] || new Animated.Value(1)}
    />
  );

  // ── HEADER (FlatList ListHeaderComponent) ──────────────────────────────────
  const renderListHeader = () => (
    <>
      {/* Error banner */}
      {error && (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color="#B71C1C" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchProducts} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={s.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Animated.View style={[s.heroHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <SafeAreaView edges={['top']} style={s.heroHeaderInner}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.heroCenter}>
              <Text style={s.heroTitle}>{tagConfig.label}</Text>
            </View>
            <View style={{ width: 42 }} />
          </SafeAreaView>
        </Animated.View>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={tagConfig.accent} />
          <Text style={s.loadingText}>Loading listings…</Text>
        </View>
      </View>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero header (scrolls with content, but anims on scroll) ── */}
      <Animated.View
        style={[
          s.heroHeader,
          { opacity: headerOpacity, transform: [{ scale: headerScale }] },
        ]}
      >
        <SafeAreaView edges={['top']} style={s.heroHeaderInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={s.heroCenter}>
            
            <Text style={s.heroTitle}>{tagConfig.label}</Text>
            <Text style={s.heroSubtitle}>
              {products.length} listing{products.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </SafeAreaView>

        {/* Decorative bottom curve */}
        <View style={s.headerCurve} />
      </Animated.View>

      {/* ── Product grid ── */}
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              tagConfig={tagConfig}
              onBrowseAll={() => navigation.navigate('Products')}
            />
          )
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tagConfig.accent}
            colors={[tagConfig.accent]}
            progressViewOffset={180}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F4F6F4' },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 15, color: '#9E9E9E', fontWeight: '500' },

  // ── Hero header ────────────────────────────────────────────────────────────
  heroHeader: {
    backgroundColor: '#1B5E20',
    paddingBottom: 28,
    zIndex: 10,
  },
  heroHeaderInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
  },
  heroCenter: { flex: 1, alignItems: 'center', gap: 8 },
  heroEmojiWrap: {
    width: 60, height: 60, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerCurve: {
    position: 'absolute', bottom: -18, left: 0, right: 0,
    height: 28, backgroundColor: '#F4F6F4',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Stats strip ────────────────────────────────────────────────────────────
  statsStrip: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
    paddingVertical: 14, paddingHorizontal: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statItem:   { alignItems: 'center', flex: 1 },
  statValue:  { fontSize: 20, fontWeight: '900', color: '#1B2714' },
  statLabel:  { fontSize: 11, color: '#9E9E9E', fontWeight: '600', marginTop: 2 },
  statDivider:{ width: 1, height: 30, backgroundColor: '#F0F0F0' },

  // ── Error banner ───────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText: { flex: 1, fontSize: 13, color: '#B71C1C' },
  retryLink:  { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent:   { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  // ── Product card ──────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  imgWrap:        { position: 'relative', height: 145, backgroundColor: '#F5F5F5' },
  img:            { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  imgScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  // Badges
  condBadge: {
    position: 'absolute', top: 7, left: 7,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  condBadgeText: { fontSize: 9, fontWeight: '800' },
  negTag: {
    position: 'absolute', top: 7, right: 7,
    backgroundColor: '#1B5E20', borderRadius: 7,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  negTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Low stock ribbon
  lowStockRibbon: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(255,87,34,0.88)',
    paddingVertical: 4,
  },
  lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Sold out
  soldOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  soldBadge: { alignItems: 'center', gap: 4 },
  soldText:  { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Card body
  body:     { padding: 11 },
  name:     { fontSize: 13, fontWeight: '700', color: '#1B2714', lineHeight: 18, marginBottom: 6 },
  campusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9', alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginBottom: 8,
  },
  campusPillText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:  { fontSize: 15, fontWeight: '900', color: '#1B5E20' },
  viewBtn:{
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 100, height: 100, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: '#1B2714', marginBottom: 8 },
  emptySub:     { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 4,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

export default TagProductsScreen;