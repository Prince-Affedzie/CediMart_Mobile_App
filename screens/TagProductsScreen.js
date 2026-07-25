// src/screens/main/TagProductsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, StatusBar,
  Animated, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductsByTag } from '../apis/productApi';

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
  purple:       '#7E22CE',
  purpleBg:     '#F3E8FF',
  rose:         '#BE185D',
  roseBg:       '#FCE7F3',
  white:        '#FFFFFF',
  black:        '#000000',
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CONFIG — tag colors now use teal/coral/purple instead of greens
// ─────────────────────────────────────────────────────────────────────────────

const TAG_CONFIG = {
  'featured':         { label: 'Featured',         icon: 'star',        accent: '#D97706', accentBg: C.accentBg,  headerBg: ['#EA580C', '#F97316'], heroEmoji: '⭐' },
  'urgent-sale':      { label: 'Urgent Sales',      icon: 'flash',       accent: C.danger,    accentBg: C.dangerBg,  headerBg: ['#991B1B', '#DC2626'], heroEmoji: '⚡' },
  'popular':          { label: 'Popular',           icon: 'trending-up', accent: C.purple,    accentBg: C.purpleBg,  headerBg: ['#581C87', '#7E22CE'], heroEmoji: '🔥' },
  'discounted':       { label: 'Discounted',        icon: 'pricetag',    accent: C.brand,     accentBg: C.brandBg,   headerBg: ['#0F766E', '#0D9488'], heroEmoji: '🏷️' },
  'new-arrival':      { label: 'New Arrivals',      icon: 'sparkles',    accent: C.info,      accentBg: C.infoBg,    headerBg: ['#0369A1', '#0284C7'], heroEmoji: '✨' },
  'student-favorite': { label: 'Student Favorites', icon: 'heart',       accent: C.rose,      accentBg: C.roseBg,    headerBg: ['#9D174D', '#BE185D'], heroEmoji: '🎓' },
};

const CONDITION_CONFIG = {
  'new':           { label: 'Brand New',     bg: C.successBg, text: C.success },
  'like-new':      { label: 'Like New',      bg: C.infoBg,    text: C.info },
  'excellent':     { label: 'Excellent',     bg: C.brandBg,   text: C.brand },
  'good':          { label: 'Good',          bg: C.accentBg,  text: '#D97706' },
  'fair':          { label: 'Fair',          bg: '#FFF7ED',   text: '#EA580C' },
  'slightly-used': { label: 'Slight Used',   bg: '#F5F5F4',   text: '#57534E' },
  'for-parts':     { label: 'For Parts',     bg: C.dangerBg,  text: C.danger },
};

const HERO_BACKGROUND_IMAGE = 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780782982/flyer13_1_fyp0xj.png';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ item, onPress, tagConfig, cardAnim }) => {
  const imageUri   = item.images?.[0];
  const condCfg    = CONDITION_CONFIG[item.condition];
  const isAvail    = item.isAvailable !== false && (item.countInStock ?? 0) > 0;
  const isLowStock = isAvail && (item.countInStock ?? 0) <= 3;

  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale && 
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());
  
  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount 
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

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
          <View style={s.imgScrim} />

          {hasActiveDiscount && isAvail && (
            <View style={s.discountBadge}>
              <Text style={s.discountBadgeText}>-{discountPercentage}%</Text>
            </View>
          )}

          {condCfg && !hasActiveDiscount && (
            <View style={[s.condBadge, { backgroundColor: condCfg.bg }]}>
              <Text style={[s.condBadgeText, { color: condCfg.text }]}>{condCfg.label}</Text>
            </View>
          )}
          {condCfg && hasActiveDiscount && (
            <View style={[s.condBadgeSecondary, { backgroundColor: condCfg.bg }]}>
              <Text style={[s.condBadgeText, { color: condCfg.text }]}>{condCfg.label}</Text>
            </View>
          )}

          {item.negotiable && (
            <View style={[s.negTag, { backgroundColor: C.accent }]}>
              <Text style={s.negTagText}>Nego</Text>
            </View>
          )}

          {isLowStock && (
            <View style={s.lowStockRibbon}>
              <Ionicons name="flame" size={9} color="#fff" />
              <Text style={s.lowStockText}>Only {item.countInStock} left</Text>
            </View>
          )}

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

          {item.campus && (
            <View style={[s.campusPill, { backgroundColor: C.brandBg }]}>
              <Ionicons name="school-outline" size={9} color={C.brand} />
              <Text style={[s.campusPillText, { color: C.brand }]}>{item.campus}</Text>
            </View>
          )}

          <View style={s.footer}>
            {hasActiveDiscount ? (
              <View style={s.priceStack}>
                <View style={s.priceRow}>
                  <Text style={s.price}>GH₵ {currentPrice.toFixed(2)}</Text>
                  <View style={s.discountPill}>
                    <Text style={s.discountPillText}>-{discountPercentage}%</Text>
                  </View>
                </View>
                {originalPrice && (
                  <Text style={s.originalPrice}>GH₵ {originalPrice.toFixed(2)}</Text>
                )}
              </View>
            ) : (
              <Text style={s.price}>GH₵ {currentPrice.toFixed(2)}</Text>
            )}
            
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

  const tagConfig  = TAG_CONFIG[tag] || { label: tag, icon: 'pricetag', accent: C.brand, accentBg: C.brandBg, headerBg: [C.brandD, C.brand], heroEmoji: '🏷️' };

  const scrollY      = useRef(new Animated.Value(0)).current;
  const headerScale  = scrollY.interpolate({ inputRange: [-80, 0], outputRange: [1.08, 1], extrapolate: 'clamp' });
  const headerOpacity= scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.92], extrapolate: 'clamp' });

  const cardAnims = useRef([...Array(40)].map(() => new Animated.Value(0))).current;

  const animateCards = useCallback((count) => {
    const anims = cardAnims.slice(0, count).map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 280, delay: i * 55, useNativeDriver: true })
    );
    Animated.stagger(40, anims).start();
  }, [cardAnims]);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await getProductsByTag(tag);
      if (res?.data?.success) {
        const data = res.data.data || [];
        setProducts(data);
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

  const renderItem = ({ item, index }) => (
    <ProductCard
      item={item} onPress={handleProductPress}
      tagConfig={tagConfig} cardAnim={cardAnims[index] || new Animated.Value(1)}
    />
  );

  const renderListHeader = () => (
    <>
      {error && (
        <View style={[s.errorBanner, { backgroundColor: C.dangerBg, borderColor: C.dangerBorder }]}>
          <Ionicons name="alert-circle-outline" size={15} color={C.danger} />
          <Text style={[s.errorText, { color: C.danger }]}>{error}</Text>
          <TouchableOpacity onPress={fetchProducts} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={[s.retryLink, { color: C.brand }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Animated.View style={[s.heroHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <ImageBackground source={{ uri: HERO_BACKGROUND_IMAGE }} style={s.heroHeaderBg} resizeMode="cover">
            <View style={s.heroHeaderOverlay} />
            <SafeAreaView edges={['top']} style={s.heroHeaderInner}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={s.heroCenter}>
                <Text style={s.heroTitle}>{tagConfig.label}</Text>
              </View>
              <View style={{ width: 42 }} />
            </SafeAreaView>
          </ImageBackground>
        </Animated.View>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={tagConfig.accent} />
          <Text style={s.loadingText}>Loading listings…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={[s.heroHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <ImageBackground source={{ uri: HERO_BACKGROUND_IMAGE }} style={s.heroHeaderBg} resizeMode="cover">
          <View style={s.heroHeaderOverlay} />
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
            <View style={{ width: 42 }} />
          </SafeAreaView>
        </ImageBackground>
        <View style={s.headerCurve} />
      </Animated.View>

      <FlatList
        data={products} keyExtractor={item => item._id}
        renderItem={renderItem} numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={!loading && <EmptyState tagConfig={tagConfig} onBrowseAll={() => navigation.navigate('Products')} />}
        ListFooterComponent={<View style={{ height: 40 }} />}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tagConfig.accent} colors={[tagConfig.accent]} progressViewOffset={180} />}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 15, color: C.t3, fontWeight: '500' },

  heroHeader: { paddingBottom: 28, zIndex: 10 },
  heroHeaderBg: { width: '100%' },
  heroHeaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroHeaderInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  heroCenter: { flex: 1, alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  headerCurve: { position: 'absolute', bottom: -18, left: 0, right: 0, height: 28, backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13 },
  retryLink:  { fontSize: 13, fontWeight: '700' },

  listContent:   { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  card: { width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: C.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
  imgWrap: { position: 'relative', height: 145, backgroundColor: '#F5F5F5' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  imgScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(0,0,0,0.10)' },

  discountBadge: { position: 'absolute', top: 7, left: 7, backgroundColor: C.danger, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, zIndex: 3 },
  discountBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  condBadge: { position: 'absolute', top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  condBadgeSecondary: { position: 'absolute', top: 7, right: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  condBadgeText: { fontSize: 9, fontWeight: '800' },
  negTag: { position: 'absolute', top: 7, right: 7, backgroundColor: C.accent, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  negTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  lowStockRibbon: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,87,34,0.88)', paddingVertical: 4 },
  lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  soldOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  soldBadge: { alignItems: 'center', gap: 4 },
  soldText:  { color: '#fff', fontSize: 12, fontWeight: '800' },

  body: { padding: 11 },
  name: { fontSize: 13, fontWeight: '700', color: C.t1, lineHeight: 18, marginBottom: 6 },
  campusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  campusPillText: { fontSize: 10, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  priceStack: { gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  price:  { fontSize: 15, fontWeight: '900', color: C.accent },
  originalPrice: { fontSize: 10, color: C.t3, fontWeight: '600', textDecorationLine: 'line-through' },
  discountPill: { backgroundColor: C.dangerBg, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3, borderWidth: 1, borderColor: C.dangerBorder },
  discountPillText: { fontSize: 8, fontWeight: '800', color: C.danger },
  
  viewBtn:{ width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },

  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.t1, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.t3, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, shadowColor: C.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

export default TagProductsScreen;