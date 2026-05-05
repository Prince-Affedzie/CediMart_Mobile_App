// src/screens/main/ProductDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addToFavorites, removeFromFavorites } from '../apis/userActionsApi';

const { width } = Dimensions.get('window');

// ─── Collapsible Section ──────────────────────────────────────────────────────
const CollapsibleSection = ({ title, badge, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={colStyles.wrap}>
      <TouchableOpacity style={colStyles.header} onPress={toggle} activeOpacity={0.7}>
        <Text style={colStyles.title}>{title}</Text>
        <View style={colStyles.headerRight}>
          {badge ? <View style={colStyles.badge}><Text style={colStyles.badgeText}>{badge}</Text></View> : null}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={20} color="#424242" />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {open && <View style={colStyles.body}>{children}</View>}
    </View>
  );
};

const colStyles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, color: '#555', fontWeight: '600' },
  body: { paddingHorizontal: 24, paddingBottom: 20 },
});

// ─── Star Rating Row ──────────────────────────────────────────────────────────
const StarRow = ({ rating = 4.8, count = 142 }) => {
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : half && i === filled + 1 ? 'star-half' : 'star-outline'}
          size={18}
          color="#FF6D00"
          style={{ marginRight: 2 }}
        />
      ))}
      <Text style={starStyles.label}>{count} reviews</Text>
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  label: { marginLeft: 8, fontSize: 13, color: '#757575', fontWeight: '500' },
});

// ─── Dot Indicator ────────────────────────────────────────────────────────────
const DotIndicator = ({ count, active }) => (
  <View style={dotStyles.row}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[dotStyles.dot, i === active && dotStyles.dotActive]} />
    ))}
  </View>
);

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D8D8D8' },
  dotActive: { width: 22, backgroundColor: '#4CAF50', borderRadius: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProductDetailScreen = ({ route, navigation }) => {
  const { productId, product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addToCart, favoriteItems } = useCart();
  const { isAuthenticated } = useAuth();

  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!initialProduct || !initialProduct.relatedProducts) {
      loadProduct();
    } else {
      setProduct(initialProduct);
      setRelatedProducts(initialProduct.relatedProducts || []);
      animateIn();
    }
    checkIfFavorite();
  }, [productId, favoriteItems, initialProduct]);

  const animateIn = () => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      if (response.status === 200) {
        const data = response.data.data;
        setProduct(data);
        setRelatedProducts(data.relatedProducts || []);
        animateIn();
      } else {
        setError(response.error || 'Failed to load product');
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = () => {
    if (!isAuthenticated || !productId) { setIsFavorite(false); setCheckingFavorite(false); return; }
    const found = favoriteItems?.some(item => item._id === productId || item._id === product?._id || item._id === product?.id);
    setIsFavorite(!!found);
    setCheckingFavorite(false);
  };

  const handleFavoriteToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please sign in to manage favorites.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    // Heart bounce animation
    Animated.sequence([
      Animated.timing(heartScaleAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(heartScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setFavoriteLoading(true);
    try {
      const pid = product._id || product.id;
      const res = isFavorite ? await removeFromFavorites(pid) : await addToFavorites(pid);
      if (res.status === 200) setIsFavorite(!isFavorite);
      else Alert.alert('Error', 'Could not update favorites');
    } catch {
      Alert.alert('Error', 'Network or server issue');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const stock = product.countInStock ?? 0;
    if (stock <= 0) { Alert.alert('Out of Stock', `${product.name} is currently unavailable.`); return; }
    if (!isAuthenticated) {
      Alert.alert('Login recommended', 'Sign in to sync your cart?', [
        { text: 'Continue as guest', onPress: () => performAddToCart() },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    await performAddToCart();
  };

  const performAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product._id || product.id, quantity);
      Alert.alert('Added to Cart! 🛒', `${quantity} × ${product.name} added`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }) },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `FreshyFood • ${product.name} – GH₵${product.price}\n${product.description || ''}`,
        url: `https://freshyfood.com/product/${productId}`,
        title: product.name,
      });
    } catch { }
  };

  const handleRelatedProductPress = (item) => {
    navigation.push('ProductDetail', { productId: item._id || item.id, product: null });
  };

  const increaseQty = () => {
    const max = product?.countInStock ?? 99;
    setQuantity(q => Math.min(q + 1, max));
  };
  const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));

  // ── LOADING ──
  if (loading) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.minimalNav} edges={['top']}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  // ── ERROR ──
  if (error || !product) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.minimalNav} edges={['top']}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centered}>
          <View style={styles.errorIconBg}>
            <Ionicons name="alert-circle-outline" size={36} color="#E53935" />
          </View>
          <Text style={styles.errorTitle}>Product not found</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image || 'https://via.placeholder.com/400'];
  const isInStock = (product.countInStock ?? 0) > 0;
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const lineTotal = (Number(product.price) * quantity).toFixed(2);

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      {/* ── Floating transparent nav ── */}
      <SafeAreaView style={styles.floatingNav} edges={['top']}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          >
            <Ionicons name="bag-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════
            HERO IMAGE AREA
            ════════════════════════════ */}
        <View style={styles.imageArea}>
          <Image
            source={{ uri: images[selectedImage] }}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {/* Discount tag */}
          {discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {!isInStock && (
            <View style={styles.oosOverlay}>
              <Text style={styles.oosText}>Out of Stock</Text>
            </View>
          )}

          {/* Dot indicator */}
          {images.length > 1 && (
            <View style={styles.dotRow}>
              <DotIndicator count={images.length} active={selectedImage} />
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {images.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.thumbWrap, selectedImage === idx && styles.thumbActive]}
                onPress={() => setSelectedImage(idx)}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ════════════════════════════
            PRODUCT INFO PANEL
            ════════════════════════════ */}
        <View style={styles.infoPanel}>

          {/* Name + Heart row */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productUnit}>{product.unit || 'piece'}</Text>
              <Text style={styles.productUnit1}>{product.market_name}</Text>
            </View>
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={handleFavoriteToggle}
              disabled={favoriteLoading || checkingFavorite}
              activeOpacity={0.8}
            >
              {favoriteLoading || checkingFavorite ? (
                <ActivityIndicator size="small" color="#E53935" />
              ) : (
                <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={26}
                    color={isFavorite ? '#E53935' : '#BDBDBD'}
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>

          {/* Rating */}
          <StarRow
            rating={product.rating || 4.8}
            count={product.reviewCount || 142}
          />

          {/* ── Qty stepper + price row ── */}
          <View style={styles.qtyPriceRow}>
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                onPress={decreaseQty}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={18} color={quantity <= 1 ? '#D0D0D0' : '#424242'} />
              </TouchableOpacity>

              <View style={styles.stepperCount}>
                <Text style={styles.stepperNum}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperBtn, styles.stepperBtnAdd, !isInStock && styles.stepperBtnDisabled]}
                onPress={increaseQty}
                disabled={!isInStock}
              >
                <Ionicons name="add" size={18} color={isInStock ? '#4CAF50' : '#D0D0D0'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.priceDisplay}>
              GH₵ {lineTotal}
            </Text>
          </View>

          {/* Stock status */}
          <View style={[styles.stockRow, !isInStock && styles.stockRowOos]}>
            <Ionicons
              name={isInStock ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isInStock ? '#4CAF50' : '#E53935'}
            />
            <Text style={[styles.stockText, !isInStock && { color: '#E53935' }]}>
              {isInStock ? `In stock · ${product.countInStock} available` : 'Currently unavailable'}
            </Text>
          </View>

          {/* ── COLLAPSIBLE SECTIONS ── */}

          {/* Product Detail */}
          <CollapsibleSection title="Product Detail" defaultOpen>
            <Text style={styles.descText}>
              {product.description || 'No description available.'}
            </Text>
          </CollapsibleSection>

          {/* Nutritions */}
          <CollapsibleSection title="Nutritions" badge="100gr">
            <View style={styles.nutritionGrid}>
              {[
                { label: 'Calories', value: product.calories || '52 kcal' },
                { label: 'Carbs', value: product.carbs || '14g' },
                { label: 'Protein', value: product.protein || '0.3g' },
                { label: 'Fat', value: product.fat || '0.2g' },
                { label: 'Fibre', value: product.fibre || '2.4g' },
                { label: 'Sugar', value: product.sugar || '10g' },
              ].map((n, i) => (
                <View key={i} style={styles.nutritionItem}>
                  <Text style={styles.nutritionVal}>{n.value}</Text>
                  <Text style={styles.nutritionLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>

          {/* Product Details table */}
          <CollapsibleSection title="Product Details">
            {[
              { key: 'Category', val: getCategoryName(product.category) },
              { key: 'Unit', val: product.unit || '—' },
              { key: 'Origin', val: product.origin || 'Local' },
              { key: 'Storage', val: product.storage || 'Cool & dry' },
              { key: 'SKU', val: product.sku || '—' },
            ].map((row, i, arr) => (
              <View
                key={i}
                style={[styles.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={styles.detailKey}>{row.key}</Text>
                <Text style={styles.detailVal}>{row.val}</Text>
              </View>
            ))}
          </CollapsibleSection>

          {/* Review */}
          <CollapsibleSection title="Review">
            <StarRow rating={product.rating || 4.8} count={product.reviewCount || 142} />
            <Text style={styles.reviewPlaceholder}>
              {product.reviewCount || 142} customers have reviewed this product.
            </Text>
          </CollapsibleSection>

          {/* ── RELATED PRODUCTS ── */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>You may also like</Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item._id || item.id || String(Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.relatedCard}
                    onPress={() => handleRelatedProductPress(item)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: item.image || 'https://via.placeholder.com/140' }}
                      style={styles.relatedImg}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.relatedPrice}>GH₵ {Number(item.price).toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingLeft: 2, paddingRight: 8 }}
              />
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* ════════════════════════════
          ADD TO BASKET BAR
          ════════════════════════════ */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addBtn, (!isInStock || addingToCart) && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!isInStock || addingToCart}
          activeOpacity={0.88}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>
              {isInStock ? `Add To Cart  ·  GH₵ ${lineTotal}` : 'Out of Stock'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getCategoryName = (cat) => {
  const map = { vegetable: 'Vegetables', fruit: 'Fruits', staple: 'Staples', herb: 'Herbs', tuber: 'Tubers', other: 'Others' };
  return map[cat?.toLowerCase()] || cat || 'Category';
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F7F7F7' },

  // ── NAV ────────────────────────────────────────────────────────────────────
  floatingNav: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  minimalNav: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navRight: { flexDirection: 'row', gap: 6 },
  navIconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  scrollContent: { paddingBottom: 24 },

  // ── IMAGE AREA ──────────────────────────────────────────────────────────────
  imageArea: {
    width,
    height: width * 0.82,
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  discountTag: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  dotRow: {
    position: 'absolute',
    bottom: 18,
    left: 0, right: 0,
    alignItems: 'center',
  },

  // ── THUMBNAILS ──────────────────────────────────────────────────────────────
  thumbStrip: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  thumbWrap: {
    width: 64, height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  thumbActive: { borderColor: '#4CAF50' },
  thumb: { width: '100%', height: '100%' },

  // ── INFO PANEL ──────────────────────────────────────────────────────────────
  infoPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
    paddingTop: 28,
    paddingBottom: 8,
    // flat bottom — sections extend here
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 6,
  },
  titleLeft: { flex: 1, marginRight: 12 },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 30,
    marginBottom: 4,
  },
  productUnit: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  productUnit1: { fontSize: 14, color: '#4CAF50', fontWeight: '500' },
  heartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EFEFEF',
  },

  // ── QTY + PRICE ROW ─────────────────────────────────────────────────────────
  qtyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 14,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepperBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: '#F2F2F2',
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperCount: {
    width: 52, alignItems: 'center',
  },
  stepperNum: {
    fontSize: 20, fontWeight: '700', color: '#1A1A1A',
  },
  priceDisplay: {
    fontSize: 26, fontWeight: '900', color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  // ── STOCK ROW ───────────────────────────────────────────────────────────────
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  stockRowOos: {},
  stockText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },

  // ── COLLAPSIBLE CONTENT ──────────────────────────────────────────────────────
  descText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  nutritionItem: {
    width: '30%',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nutritionVal: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  nutritionLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  detailKey: { fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  detailVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },

  reviewPlaceholder: {
    fontSize: 14, color: '#9E9E9E', marginTop: 10,
  },

  // ── RELATED ──────────────────────────────────────────────────────────────────
  relatedSection: {
    paddingTop: 20,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  relatedTitle: {
    fontSize: 16, fontWeight: '700', color: '#1A1A1A',
    paddingHorizontal: 24, marginBottom: 14,
  },
  relatedCard: {
    width: 148,
    marginLeft: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  relatedImg: { width: '100%', height: 110 },
  relatedInfo: { padding: 10 },
  relatedName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  relatedPrice: { fontSize: 15, fontWeight: '800', color: '#4CAF50' },

  // ── LOADING / ERROR ──────────────────────────────────────────────────────────
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 15, color: '#9E9E9E' },
  errorIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  errorBtn: {
    backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14,
  },
  errorBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── BOTTOM BAR ───────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 28, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  addBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default ProductDetailScreen;