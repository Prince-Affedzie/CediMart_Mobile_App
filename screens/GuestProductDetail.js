// src/screens/main/ProductDetailScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductById } from '../apis/productApi'; // ← your API
import { useCart } from '../context/CartContext';   // only used when authenticated
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────
const formatPrice = (price) =>
  price != null ? `GH₵ ${parseFloat(price).toFixed(2)}` : '—';

const formatCategory = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

const TAG_ICONS = {
  organic: '🌱', farm_fresh: '🚜', locally_sourced: '📍', fresh_today: '✨',
  seasonal: '🍂', popular: '🔥', best_selling: '⭐', new_arrival: '🆕',
  discounted: '🏷️', perishable: '⏱️', ready_to_cook: '👨‍🍳', ready_to_eat: '🍽️',
  featured: '🌟',
};

// ─────────────────────────────────────────────
// Tag chip
// ─────────────────────────────────────────────
const TagChip = ({ tag }) => (
  <View style={styles.tagChip}>
    <Text style={styles.tagEmoji}>{TAG_ICONS[tag] || '🏷️'}</Text>
    <Text style={styles.tagLabel}>{formatCategory(tag)}</Text>
  </View>
);

// ─────────────────────────────────────────────
// Info row (used for vendor, unit, stock, etc.)
// ─────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={16} color="#2E7D32" />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

// ─────────────────────────────────────────────
// Auth gate — shown when guest taps a gated action
// ─────────────────────────────────────────────
const AuthGateSheet = ({ visible, action, onClose, onLogin, onSignUp }) => {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 300,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const isCart = action === 'cart';

  return (
    <>
      <TouchableOpacity style={styles.gateBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.gateSheet, { transform: [{ translateY }] }]}>
        <View style={styles.gateHandle} />
        <View style={styles.gateIconWrap}>
          <Text style={styles.gateIconEmoji}>{isCart ? '🛒' : '❤️'}</Text>
        </View>
        <Text style={styles.gateTitle}>
          {isCart ? 'Sign in to add to cart' : 'Sign in to save favourites'}
        </Text>
        <Text style={styles.gateSub}>
          {isCart
            ? 'Create a free account or log in to place orders from your favourite Accra markets.'
            : 'Save products you love and find them quickly on your next visit.'}
        </Text>
        <TouchableOpacity style={styles.gateLoginBtn} onPress={onLogin}>
          <Text style={styles.gateLoginBtnText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gateSignUpBtn} onPress={onSignUp}>
          <Text style={styles.gateSignUpBtnText}>Create Free Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.gateCancelBtn}>
          <Text style={styles.gateCancelBtnText}>Keep Browsing</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const GuestProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // route.params can carry a full product object (fast path)
  // or just a productId (deep link / search result)
  const { productId, product: routeProduct } = route.params || {};

  const { isAuthenticated } = useAuth();
  const { addToCart, cartItems } = useCart?.() || {};

  // ── State ──
  const [product, setProduct] = useState(routeProduct || null);
  const [loading, setLoading] = useState(!routeProduct);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [gateAction, setGateAction] = useState(null); // 'cart' | 'favourite'
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Animated header opacity on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Fetch ──
  const fetchProduct = useCallback(async () => {
    const id = productId || routeProduct?._id || routeProduct?.id;
    if (!id) { setError('Product not found.'); setLoading(false); return; }
    try {
      setError(null);
      const res = await getProductById(id);
      if (res?.data?.success || res?.status === 200) {
        setProduct(res.data.data || res.data);
      } else {
        setError('Could not load product.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [productId, routeProduct]);

  useEffect(() => {
    if (!routeProduct) fetchProduct();
    // Even if we have routeProduct, silently refresh to get latest price/stock
    else fetchProduct();
  }, [fetchProduct]);

  // ── Derived ──
  const images = product
    ? [product.image, ...(product.images || [])].filter(Boolean)
    : [];
  const stock = product?.countInStock ?? product?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isInCart = cartItems?.some(
    (i) => i.product?._id === product?._id || i.productId === product?._id,
  ) ?? false;

  // ── Gating helper ──
  const requireAuth = (action, cb) => {
    if (!isAuthenticated) {
      setGateAction(action);
      setGateVisible(true);
    } else {
      cb();
    }
  };

  // ── Actions ──
  const handleAddToCart = () => {
    requireAuth('cart', async () => {
      if (isOutOfStock) {
        Alert.alert('Out of Stock', `${product.name} is currently unavailable.`);
        return;
      }
      try {
        setAddingToCart(true);
        await addToCart(product._id || product.id, quantity);
        Alert.alert('Added to cart', `${quantity}× ${product.name} added.`);
      } catch {
        Alert.alert('Error', 'Could not add to cart. Try again.');
      } finally {
        setAddingToCart(false);
      }
    });
  };

  const handleFavourite = () => {
    requireAuth('favourite', () => {
      setIsFavourite((prev) => !prev);
      // TODO: call your favourites API here
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} on FreshyFood Factory — ${formatPrice(product?.price)}`,
      });
    } catch { /* silent */ }
  };

  const handleVendorPress = () => {
    if (product?.vendor?._id || product?.vendorId) {
      navigation.navigate('VendorDetail', {
        vendorId: product.vendor?._id || product.vendorId,
        vendor: product.vendor,
      });
    }
  };

  const goToAuth = (screen) => {
    setGateVisible(false);
    navigation.navigate(screen);
  };

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#E8F5E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading product…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────
  if (error || !product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#E8F5E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorBody}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={34} color="#A5D6A7" />
          </View>
          <Text style={styles.errorTitle}>Product unavailable</Text>
          <Text style={styles.errorSub}>{error || 'This product could not be loaded.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProduct}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Animated sticky header (fades in on scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.stickyHeaderInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#1B2714" />
          </TouchableOpacity>
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{product.name}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerIconBtnLight}>
            <Ionicons name="share-outline" size={20} color="#1B2714" />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* ── Transparent header over image ── */}
      <View style={styles.floatingHeader}>
        <SafeAreaView edges={['top']} style={styles.floatingHeaderInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.floatingHeaderRight}>
            <TouchableOpacity onPress={handleShare} style={styles.floatingIconBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFavourite} style={styles.floatingIconBtn}>
              <Ionicons
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavourite ? '#FF5252' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* ── Image gallery ── */}
        <View style={styles.imageGallery}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImageIdx(idx);
                }}
                scrollEventThrottle={16}
              >
                {images.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.productImage} resizeMode="cover" />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.imageDots}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.imageDot, i === activeImageIdx && styles.imageDotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {product.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {/* Out-of-stock banner over image */}
          {isOutOfStock && (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockBannerText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* ── Content sheet ── */}
        <View style={styles.contentSheet}>

          {/* Name + price row */}
          <View style={styles.namePriceRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.unit && (
                <Text style={styles.productUnit}>per {product.unit}</Text>
              )}
            </View>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          </View>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsRow}
            >
              {product.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </ScrollView>
          )}

          {/* Stock indicator */}
          <View style={[styles.stockBadge, isOutOfStock && styles.stockBadgeOut]}>
            <View style={[styles.stockDot, isOutOfStock && styles.stockDotOut]} />
            <Text style={[styles.stockText, isOutOfStock && styles.stockTextOut]}>
              {isOutOfStock ? 'Out of stock' : `${stock} in stock`}
            </Text>
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Info rows ── */}
          <View style={styles.infoCard}>
            {product.category && (
              <InfoRow
                icon="grid-outline"
                label="Category"
                value={formatCategory(product.category)}
              />
            )}
            {product.unit && (
              <InfoRow icon="scale-outline" label="Unit" value={product.unit} />
            )}
            {product.market_name && (
              <InfoRow icon="location-outline" label="Market" value={product.market_name} />
            )}
            {(product.vendor?.name || product.vendorName) && (
              <TouchableOpacity onPress={handleVendorPress}>
                <InfoRow
                  icon="storefront-outline"
                  label="Vendor"
                  value={product.vendor?.name || product.vendorName}
                  valueColor="#2E7D32"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Description ── */}
          {product.description?.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}

          {/* ── Guest notice (only for unauthenticated users) ── */}
          {!isAuthenticated && (
            <View style={styles.guestNotice}>
              <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
              <Text style={styles.guestNoticeText}>
                <Text style={{ fontWeight: '700' }}>Browsing as guest.</Text>{' '}
                Sign in to add to cart or save to favourites.
              </Text>
            </View>
          )}

          {/* ── Quantity selector (only for authenticated users) ── */}
          {isAuthenticated && !isOutOfStock && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={18} color={quantity <= 1 ? '#BDBDBD' : '#1B5E20'} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, quantity >= stock && styles.qtyBtnDisabled]}
                  onPress={() => setQuantity((q) => Math.min(stock, q + 1))}
                  disabled={quantity >= stock}
                >
                  <Ionicons name="add" size={18} color={quantity >= stock ? '#BDBDBD' : '#1B5E20'} />
                </TouchableOpacity>
                <Text style={styles.qtyStock}>of {stock} available</Text>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── Bottom CTA bar ── */}
      <View style={styles.ctaBar}>
        {/* Favourite button */}
        <TouchableOpacity
          style={[styles.ctaFavBtn, isFavourite && styles.ctaFavBtnActive]}
          onPress={handleFavourite}
          activeOpacity={0.82}
        >
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavourite ? '#FF5252' : '#2E7D32'}
          />
        </TouchableOpacity>

        {/* Add to cart / Out of stock */}
        <TouchableOpacity
          style={[
            styles.ctaCartBtn,
            (isOutOfStock || (isAuthenticated && isInCart)) && styles.ctaCartBtnSecondary,
          ]}
          onPress={handleAddToCart}
          disabled={addingToCart || (isAuthenticated && isOutOfStock)}
          activeOpacity={0.88}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isOutOfStock ? (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.ctaCartBtnText}>Out of Stock</Text>
            </>
          ) : isAuthenticated && isInCart ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.ctaCartBtnText}>In Cart · Add More</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.ctaCartBtnText}>
                {isAuthenticated ? `Add to Cart · ${formatPrice(product.price)}` : `Add to Cart · ${formatPrice(product.price)}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Auth gate bottom sheet ── */}
      <AuthGateSheet
        visible={gateVisible}
        action={gateAction}
        onClose={() => setGateVisible(false)}
        onLogin={() => goToAuth('Login')}
        onSignUp={() => goToAuth('SignUp')}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  // ── Loading / Error ──
  loadingHeader: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },
  loadingBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 15, color: '#757575' },
  errorBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1B2714', marginBottom: 6 },
  errorSub: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: {
    backgroundColor: '#2E7D32', paddingHorizontal: 32,
    paddingVertical: 13, borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Floating / sticky headers ──
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  stickyHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2714',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 50,
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  floatingHeaderRight: { flexDirection: 'row', gap: 6 },
  floatingIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerIconBtnLight: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  scrollContent: { paddingBottom: 0 },

  // ── Image gallery ──
  imageGallery: {
    width,
    height: width * 0.9,
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  productImage: { width, height: width * 0.9 },
  imagePlaceholder: {
    width, height: width * 0.9,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 72, fontWeight: '800', color: '#2E7D32' },
  imageDots: {
    position: 'absolute', bottom: 14,
    left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  imageDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  imageDotActive: { width: 18, backgroundColor: '#fff' },
  outOfStockBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10, alignItems: 'center',
  },
  outOfStockBannerText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },

  // ── Content sheet ──
  contentSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2714',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  productUnit: { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  productPrice: { fontSize: 22, fontWeight: '800', color: '#1B5E20', letterSpacing: -0.3 },

  // Tags
  tagsRow: { gap: 8, paddingBottom: 12, paddingRight: 4 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F1F8F3', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },

  // Stock badge
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  stockBadgeOut: { backgroundColor: '#FFEBEE' },
  stockDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E7D32' },
  stockDotOut: { backgroundColor: '#E53935' },
  stockText: { fontSize: 12, fontWeight: '700', color: '#1B5E20' },
  stockTextOut: { color: '#C62828' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },

  // Info card
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16, borderWidth: 1,
    borderColor: '#F0F0F0', marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  infoIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  infoLabel: { flex: 1, fontSize: 13, color: '#757575', fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1B2714', textAlign: 'right' },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1B2714', marginBottom: 10 },
  descriptionText: { fontSize: 14, color: '#616161', lineHeight: 22 },

  // Guest notice
  guestNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#E3F2FD', borderRadius: 14,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  guestNoticeText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 19 },

  // Quantity selector
  quantityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  qtyBtnDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  qtyValue: { fontSize: 20, fontWeight: '800', color: '#1B2714', minWidth: 28, textAlign: 'center' },
  qtyStock: { fontSize: 12, color: '#9E9E9E', marginLeft: 4 },

  // ── CTA bar ──
  ctaBar: {
    position: 'absolute',
    bottom: 24, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaFavBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#F4FAF4',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  ctaFavBtnActive: {
    backgroundColor: '#FFEBEE', borderColor: '#FFCDD2',
  },
  ctaCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1B5E20',
    borderRadius: 14, height: 52,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  ctaCartBtnSecondary: { backgroundColor: '#757575', shadowOpacity: 0 },
  ctaCartBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.1 },

  // ── Auth Gate Sheet ──
  gateBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.48)', zIndex: 200,
  },
  gateSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36,
    zIndex: 201,
    alignItems: 'center',
  },
  gateHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', marginBottom: 20,
  },
  gateIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  gateIconEmoji: { fontSize: 34 },
  gateTitle: { fontSize: 19, fontWeight: '800', color: '#1B2714', marginBottom: 8, textAlign: 'center' },
  gateSub: {
    fontSize: 14, color: '#757575', textAlign: 'center',
    lineHeight: 20, marginBottom: 24, paddingHorizontal: 8,
  },
  gateLoginBtn: {
    width: '100%', backgroundColor: '#1B5E20',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginBottom: 10,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  gateLoginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  gateSignUpBtn: {
    width: '100%', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginBottom: 6,
    borderWidth: 1.5, borderColor: '#C8E6C9', backgroundColor: '#F4FAF4',
  },
  gateSignUpBtnText: { color: '#1B5E20', fontSize: 16, fontWeight: '700' },
  gateCancelBtn: { paddingVertical: 10 },
  gateCancelBtnText: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
});

export default GuestProductDetailScreen;