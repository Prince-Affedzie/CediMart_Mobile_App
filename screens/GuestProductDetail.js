// src/screens/auth/GuestProductDetailScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProductById } from '../apis/productApi';
import {shareGuestProduct} from '../utils/shareUtils'
import ChatFAB from '../components/ChatFAB';


const { width } = Dimensions.get('window');

const CAMPUS_LABELS = {
  UG: 'University of Ghana', KNUST: 'KNUST', UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba', UPSA: 'UPSA', GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University', ATU: 'Accra Technical University', OTHER: 'Other',
};

const CONDITION_CONFIG = {
  'new':           { label: 'New',           bg: '#E8F5E9', text: '#2E7D32', icon: 'sparkles' },
  'like-new':      { label: 'Like New',      bg: '#E8F5E9', text: '#2E7D32', icon: 'star' },
  'excellent':     { label: 'Excellent',     bg: '#E3F2FD', text: '#1565C0', icon: 'thumbs-up' },
  'good':          { label: 'Good',          bg: '#FFF8E1', text: '#F57F17', icon: 'checkmark-circle' },
  'fair':          { label: 'Fair',          bg: '#FFF3E0', text: '#E65100', icon: 'alert-circle' },
  'slightly-used': { label: 'Slightly Used', bg: '#FFF3E0', text: '#E65100', icon: 'time' },
  'for-parts':     { label: 'For Parts',     bg: '#FFEBEE', text: '#C62828', icon: 'construct' },
};

const TAG_CONFIG = {
  'featured':         { label: 'Featured',         bg: '#FFF8E1', text: '#F57F17', icon: 'star' },
  'urgent-sale':      { label: 'Urgent Sale',       bg: '#FFEBEE', text: '#C62828', icon: 'flash' },
  'popular':          { label: 'Popular',           bg: '#F3E5F5', text: '#6A1B9A', icon: 'trending-up' },
  'discounted':       { label: 'Discounted',        bg: '#E8F5E9', text: '#2E7D32', icon: 'pricetag' },
  'new-arrival':      { label: 'New Arrival',       bg: '#E3F2FD', text: '#1565C0', icon: 'sparkles' },
  'student-favorite': { label: 'Student Favorite',  bg: '#FFF3E0', text: '#E65100', icon: 'heart' },
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400/F5F5F5/BDBDBD?text=No+Image';

// ─── Collapsible Section ─────────────────────────────────────────────────────
const CollapsibleSection = ({ title, children, defaultOpen = false, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    setOpen(o => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={colStyles.wrap}>
      <TouchableOpacity style={colStyles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={colStyles.headerLeft}>
          <Text style={colStyles.title}>{title}</Text>
          {badge != null && <View style={colStyles.badge}><Text style={colStyles.badgeText}>{badge}</Text></View>}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color="#424242" />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={colStyles.body}>{children}</View>}
    </View>
  );
};

const colStyles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  body: { paddingHorizontal: 24, paddingBottom: 20 },
  badge: { backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

// ─── Star Row ────────────────────────────────────────────────────────────────
const StarRow = ({ rating = 0, count = 0, size = 16 }) => {
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= filled ? 'star' : half && i === filled + 1 ? 'star-half' : 'star-outline'} size={size} color="#F9A825" style={{ marginRight: 2 }} />
      ))}
      {count > 0 && <Text style={[starStyles.label, { fontSize: size - 3 }]}>{rating.toFixed(1)} ({count})</Text>}
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  label: { marginLeft: 6, color: '#757575', fontWeight: '500' },
});

// ─── Info Row (minimal label/value line) ─────────────────────────────────────
const InfoRow = ({ icon, label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <View style={styles.infoRowLeft}>
      <Ionicons name={icon} size={15} color="#9E9E9E" />
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={styles.infoRowValue} numberOfLines={2}>{value || '—'}</Text>
  </View>
);

// ─── Review Card ─────────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const filled = Math.floor(review.rating);
  return (
    <View style={reviewStyles.card}>
      <View style={reviewStyles.header}>
        <View style={reviewStyles.avatar}><Text style={reviewStyles.avatarText}>{review.name?.charAt(0).toUpperCase()}</Text></View>
        <View style={reviewStyles.meta}>
          <Text style={reviewStyles.name}>{review.name}</Text>
          <View style={reviewStyles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name={i <= filled ? 'star' : 'star-outline'} size={12} color="#F9A825" style={{ marginRight: 1 }} />)}
          </View>
        </View>
        <Text style={reviewStyles.date}>{new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      {!!review.comment && <Text style={reviewStyles.comment}>{review.comment}</Text>}
    </View>
  );
};

const reviewStyles = StyleSheet.create({
  card: { backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  meta: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  starsRow: { flexDirection: 'row' },
  date: { fontSize: 11, color: '#BDBDBD', fontWeight: '500' },
  comment: { fontSize: 13, color: '#555', lineHeight: 20 },
});

// ─── Specifications Table ────────────────────────────────────────────────────
const SpecsTable = ({ specifications }) => {
  const entries = specifications ? Object.entries(specifications).filter(([, v]) => v) : [];
  if (entries.length === 0) return null;

  return (
    <View style={spS.table}>
      {entries.map(([key, value], i) => (
        <View key={key} style={[spS.row, i % 2 === 1 && spS.rowAlt]}>
          <Text style={spS.key}>{key}</Text>
          <Text style={spS.value} numberOfLines={3}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const spS = StyleSheet.create({
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  row: {
    flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  rowAlt: { backgroundColor: '#FAFAFA' },
  key:   { width: '40%', fontSize: 12.5, color: '#9E9E9E', fontWeight: '600' },
  value: { flex: 1, fontSize: 12.5, color: '#1A1A1A', fontWeight: '600' },
});

// ─── Discount Helpers ────────────────────────────────────────────────────────
const isDiscountActive = (discountInfo) => {
  if (!discountInfo?.isOnSale) return false;
  const now = Date.now();
  const startsOk = !discountInfo.discountStartDate || new Date(discountInfo.discountStartDate).getTime() <= now;
  const endsOk   = !discountInfo.discountEndDate   || new Date(discountInfo.discountEndDate).getTime()   >= now;
  return startsOk && endsOk;
};

const DiscountCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;
  return (
    <View style={dS.countdown}>
      <Ionicons name="time-outline" size={11} color="#C62828" />
      <Text style={dS.countdownText}>Deal ends in {timeLeft}</Text>
    </View>
  );
};

const dS = StyleSheet.create({
  countdown: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFEBEE', alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginTop: 6,
  },
  countdownText: { fontSize: 11, fontWeight: '700', color: '#C62828' },
});

// ─── Image Gallery ───────────────────────────────────────────────────────────
const ImageGallery = ({ images, activeIndex, onScroll }) => {
  const flatListRef = useRef(null);
  const IMG_H = width * 0.88;
  const nudgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (images.length > 1) {
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(nudgeAnim, { toValue: -18, duration: 260, useNativeDriver: true }),
          Animated.spring(nudgeAnim, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        ]).start();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [images.length]);

  return (
    <View style={galS.wrapper}>
      <Animated.View style={{ transform: [{ translateX: nudgeAnim }] }}>
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={{ width, height: IMG_H }} resizeMode="cover" />
          )}
        />
      </Animated.View>

      {images.length > 1 && activeIndex === 0 && (
        <View style={galS.swipeHint}>
          <Ionicons name="swap-horizontal-outline" size={13} color="#fff" />
          <Text style={galS.swipeHintText}>Swipe for more photos</Text>
        </View>
      )}

      {images.length > 1 && activeIndex > 0 && (
        <TouchableOpacity style={[galS.arrowBtn, galS.arrowLeft]} onPress={() => flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true })} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {images.length > 1 && activeIndex < images.length - 1 && (
        <TouchableOpacity style={[galS.arrowBtn, galS.arrowRight]} onPress={() => flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true })} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {images.length > 1 && (
        <View style={galS.counterPill}>
          <Ionicons name="images-outline" size={11} color="#fff" style={{ marginRight: 4 }} />
          <Text style={galS.counterText}>{activeIndex + 1} / {images.length}</Text>
        </View>
      )}

      {images.length > 1 && (
        <View style={galS.dotsRow}>
          {images.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <View style={[galS.dot, i === activeIndex && galS.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={galS.thumbStrip} style={galS.thumbStripWrap}>
          {images.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })} activeOpacity={0.8}>
              <View style={[galS.thumb, i === activeIndex && galS.thumbActive]}>
                <Image source={{ uri }} style={galS.thumbImg} resizeMode="cover" />
                {i === activeIndex && <View style={galS.thumbActiveBorder} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const galS = StyleSheet.create({
  wrapper: { backgroundColor: '#E8E8E8' },
  swipeHint: {
    position: 'absolute', bottom: 76, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.48)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  swipeHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  arrowBtn: { position: 'absolute', top: '40%', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  arrowLeft:  { left: 12 },
  arrowRight: { right: 12 },
  counterPill: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dotsRow: { position: 'absolute', bottom: 58, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot:       { width: 7,  height: 7,  borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 22, height: 7,  borderRadius: 4, backgroundColor: '#fff' },
  thumbStripWrap: { backgroundColor: 'rgba(0,0,0,0.55)', position: 'absolute', bottom: 0, left: 0, right: 0 },
  thumbStrip: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', opacity: 0.65 },
  thumbActive: { opacity: 1, borderColor: '#fff' },
  thumbImg: { width: '100%', height: '100%' },
  thumbActiveBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
});

// ─── Main Component ──────────────────────────────────────────────────────────
const GuestProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, product: routeProduct } = route.params || {};

  const [product, setProduct] = useState(routeProduct || null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(!routeProduct);
  const [sharing, setSharing] = useState(false); 
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProduct = useCallback(async () => {
    const id = productId || routeProduct?._id || routeProduct?.id;
    if (!id) { setError('Product not found.'); setLoading(false); return; }
    try {
      setError(null);
      const res = await getProductById(id);
      if (res?.data?.success || res?.status === 200) {
        const data = res.data?.data?.product || res.data?.data || res.data;
        const related = res.data?.data?.relatedProducts || [];
        const vendorProds = res.data?.data?.vendorProducts || [];
        setProduct(data);
        setRelatedProducts(related);
        setVendorProducts(vendorProds);
      } else {
        if (routeProduct) {
          setProduct(routeProduct);
          setRelatedProducts(routeProduct.relatedProducts || []);
        } else {
          setError('Could not load product.');
        }
      }
    } catch (err) {
      if (routeProduct) {
        setProduct(routeProduct);
        setRelatedProducts(routeProduct.relatedProducts || []);
      } else {
        setError(err?.response?.data?.message || 'Something went wrong.');
      }
    } finally { setLoading(false); }
  }, [productId, routeProduct]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    if (!loading && product) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [loading, product]);

  const handleShare = async () => {
    if (sharing) return; // Prevent double-tap
    
    setSharing(true);
    try {
      const result = await shareGuestProduct(product);   
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleAddToCart = () => {
    Alert.alert('Sign in Required', 'Create a free account or log in to add items to your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
    ]);
  };

  const handleRelatedProductPress = useCallback(
    (item) => navigation.push('GuestProductDetail', { productId: item._id || item.id, product: null }),
    [navigation],
  );

  const increaseQty = () => { const max = product?.countInStock ?? 99; setQuantity(q => Math.min(q + 1, max)); };
  const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));

  const onImageScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeImageIndex) setActiveImageIndex(idx);
  };

  if (loading) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.minimalNav} edges={['top']}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#1A1A1A" /></TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centered}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>Loading listing…</Text></View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.minimalNav} edges={['top']}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#1A1A1A" /></TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={56} color="#E53935" />
          <Text style={styles.errorTitle}>Listing not found</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}><Text style={styles.errorBtnText}>Go Back</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  const images = product.images?.length > 0 ? product.images : [PLACEHOLDER_IMAGE];
  const conditionInfo = CONDITION_CONFIG[product.condition] || CONDITION_CONFIG['good'];
  const isAvailable = product.isAvailable && (product.countInStock ?? 0) > 0;
  const stockCount = product.countInStock ?? 0;
  const isLowStock = isAvailable && stockCount > 0 && stockCount <= 3;
  const reviews = product.reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Discount calculations
  const discount = product.discountInfo;
  const discountActive = isDiscountActive(discount);
  const originalPrice = discount?.originalPrice;
  const currentPrice = Number(product.price);
  const savingsAmount = discountActive && originalPrice ? (originalPrice - currentPrice) : 0;
  const savingsPct = discountActive
    ? (discount?.discountPercentage ?? (originalPrice ? Math.round((savingsAmount / originalPrice) * 100) : 0))
    : 0;

  const lineTotal = (currentPrice * quantity).toFixed(2);

  // Specifications
  const specifications = product.specifications && Object.keys(product.specifications).length > 0
    ? product.specifications
    : null;

  const infoItems = [
    { icon: 'grid-outline',       label: 'Category',    value: product.category?.replace(/-/g, ' ').replace(/ and /g, ' & ') },
    product.subcategory && { icon: 'layers-outline', label: 'Subcategory', value: product.subcategory?.replace(/-/g, ' ') },
    { icon: 'school-outline',     label: 'Campus',      value: CAMPUS_LABELS[product.campus] || product.campus },
    { icon: 'location-outline',   label: 'Area',        value: product.location?.campusArea },
    product.location?.hostel && { icon: 'home-outline', label: 'Hostel / Hall', value: product.location.hostel },
    product.brand && { icon: 'bookmark-outline', label: 'Brand', value: product.brand },
  ].filter(Boolean);

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.floatingNav} edges={['top']}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity 
            style={[styles.navIconBtn, sharing && styles.navIconBtnSharing]} 
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.7}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : (
              <Ionicons name="share-social-outline" size={20} color="#1A1A1A" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ImageGallery images={images} activeIndex={activeImageIndex} onScroll={onImageScroll} />

          <View style={[styles.conditionOverlay, { backgroundColor: conditionInfo.bg }]}>
            <Ionicons name={conditionInfo.icon} size={11} color={conditionInfo.text} />
            <Text style={[styles.conditionOverlayText, { color: conditionInfo.text }]}>{conditionInfo.label}</Text>
          </View>

          {/* Discount ribbon takes priority if active, else urgent tag */}
          {discountActive ? (
            <View style={styles.discountRibbon}>
              <Ionicons name="pricetags" size={11} color="#fff" />
              <Text style={styles.discountRibbonText}>{savingsPct}% OFF</Text>
            </View>
          ) : product.tags?.includes('urgent-sale') ? (
            <View style={styles.urgentTag}>
              <Ionicons name="flash" size={11} color="#fff" />
              <Text style={styles.urgentTagText}>Urgent Sale</Text>
            </View>
          ) : null}

          {!isAvailable && (
            <View style={styles.oosOverlay}>
              <View style={styles.oosBadge}>
                <Ionicons name="close-circle-outline" size={28} color="#fff" />
                <Text style={styles.oosText}>Sold Out</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Info Panel ── */}
        <View style={styles.infoPanel}>
          {product.tags?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
              {product.tags.map(tag => {
                const cfg = TAG_CONFIG[tag] || { label: tag, bg: '#F1F8F3', text: '#2E7D32' };
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: cfg.bg }]}>
                    {cfg.icon && <Ionicons name={cfg.icon} size={11} color={cfg.text} />}
                    <Text style={[styles.tagText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* ── Title block ── */}
          <View style={styles.titleSection}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && <Text style={styles.brandText}>by {product.brand}</Text>}

            {/* Price Block */}
            {discountActive ? (
              <View style={styles.priceBlockDiscount}>
                <View style={styles.priceRowDiscount}>
                  <Text style={styles.price}>GH₵ {currentPrice.toFixed(2)}</Text>
                  {savingsPct > 0 && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>-{savingsPct}%</Text>
                    </View>
                  )}
                </View>
                {originalPrice && (
                  <View style={styles.wasRow}>
                    <Text style={styles.wasPrice}>GH₵ {originalPrice.toFixed(2)}</Text>
                    {savingsAmount > 0 && (
                      <Text style={styles.youSave}>You save GH₵ {savingsAmount.toFixed(2)}</Text>
                    )}
                  </View>
                )}
                <DiscountCountdown endDate={discount?.discountEndDate} />
                {discount?.couponEligible && (
                  <View style={styles.couponHint}>
                    <Ionicons name="ticket-outline" size={12} color="#1565C0" />
                    <Text style={styles.couponHintText}>Eligible for coupon discounts</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.price}>GH₵ {currentPrice.toFixed(2)}</Text>
                {product.negotiable && (
                  <View style={styles.negotiableChip}>
                    <Ionicons name="chatbubble-ellipses-outline" size={11} color="#E65100" />
                    <Text style={styles.negotiableChipText}>Negotiable</Text>
                  </View>
                )}
              </View>
            )}

            {/* Negotiable chip alongside discount */}
            {discountActive && product.negotiable && (
              <View style={[styles.negotiableChip, { marginTop: 10, alignSelf: 'flex-start' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={11} color="#E65100" />
                <Text style={styles.negotiableChipText}>Negotiable</Text>
              </View>
            )}

            {(product.numReviews ?? 0) > 0 && (
              <View style={{ marginTop: 10 }}>
                <StarRow rating={product.rating || 0} count={product.numReviews || 0} />
              </View>
            )}

            {/* Views/saved meta line */}
            {((product.views ?? 0) > 0 || (product.favorites ?? 0) > 0) && (
              <View style={styles.metaCaptionRow}>
                {(product.views ?? 0) > 0 && (
                  <View style={styles.metaCaptionItem}>
                    <Ionicons name="eye-outline" size={12} color="#BDBDBD" />
                    <Text style={styles.metaCaptionText}>{product.views} views</Text>
                  </View>
                )}
                {(product.favorites ?? 0) > 0 && (
                  <View style={styles.metaCaptionItem}>
                    <Ionicons name="heart-outline" size={12} color="#BDBDBD" />
                    <Text style={styles.metaCaptionText}>{product.favorites} saved</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Stock availability banner ── */}
          <View style={[styles.availBanner, !isAvailable && styles.availBannerOos, isLowStock && styles.availBannerLow]}>
            <View style={[styles.availDot, { backgroundColor: isAvailable ? (isLowStock ? '#FF8F00' : '#4CAF50') : '#E53935' }]} />
            <Text style={[styles.availText, { color: isAvailable ? (isLowStock ? '#FF6F00' : '#2E7D32') : '#C62828' }]}>
              {!isAvailable ? 'Currently unavailable' : isLowStock ? `Only ${stockCount} left — grab it fast!` : `${stockCount} in stock`}
            </Text>
          </View>

          {/* ── Quantity Stepper ── */}
          {isAvailable && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyStepper}>
                <TouchableOpacity style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]} onPress={decreaseQty} disabled={quantity <= 1}>
                  <Ionicons name="remove" size={18} color={quantity <= 1 ? '#D0D0D0' : '#424242'} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={increaseQty}>
                  <Ionicons name="add" size={18} color="#2E7D32" />
                </TouchableOpacity>
              </View>
              <Text style={styles.qtyTotal}>GH₵ {lineTotal}</Text>
            </View>
          )}

          {/* ── Product Details (minimal label/value rows) ── */}
          <CollapsibleSection title="Product Details" defaultOpen>
            <View style={styles.infoRowsWrap}>
              {infoItems.map((item, i) => (
                <InfoRow
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  isLast={i === infoItems.length - 1}
                />
              ))}
            </View>
          </CollapsibleSection>

          {/* ── Specifications table ── */}
          {specifications && (
            <CollapsibleSection title="Specifications" defaultOpen>
              <SpecsTable specifications={specifications} />
            </CollapsibleSection>
          )}

          {/* ── Description ── */}
          {!!product.description && (
            <CollapsibleSection title="Description" defaultOpen>
              <Text style={styles.descText}>{product.description}</Text>
            </CollapsibleSection>
          )}

          {/* ── Seller ── */}
          {product.vendor && (
            <CollapsibleSection title="Seller" defaultOpen>
              <TouchableOpacity
                style={styles.sellerRow}
                onPress={() => navigation.navigate('VendorDetail', { vendorId: product.vendor._id, vendor: product.vendor })}
                activeOpacity={0.7}
              >
                <View style={styles.sellerAvatar}>
                  {product.vendor.avatar ? (
                    <Image source={{ uri: product.vendor.avatar }} style={styles.sellerAvatarImg} />
                  ) : (
                    <Text style={styles.sellerAvatarText}>{(product.vendor.name || 'S').charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{product.vendor.name || 'Student Seller'}</Text>
                  <Text style={styles.sellerCampus}>{CAMPUS_LABELS[product.campus] || product.campus}</Text>
                  {product.vendor.rating !== undefined && (
                    <View style={styles.sellerRating}>
                      <Ionicons name="star" size={12} color="#F9A825" />
                      <Text style={styles.sellerRatingText}>{product.vendor.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sellerArrow}>
                  <View style={styles.viewShopBtn}>
                    <Text style={styles.viewShopBtnText}>View Shop</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
                </View>
              </TouchableOpacity>
            </CollapsibleSection>
          )}

          {/* ── Reviews ── */}
          {reviews.length > 0 && (
            <CollapsibleSection title="Reviews" badge={reviews.length} defaultOpen={reviews.length <= 3}>
              <View style={styles.ratingOverview}>
                <View style={styles.ratingBig}>
                  <Text style={styles.ratingBigNum}>{(product.rating || 0).toFixed(1)}</Text>
                  <StarRow rating={product.rating || 0} size={14} />
                  <Text style={styles.ratingBigSub}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              {visibleReviews.map((review, idx) => <ReviewCard key={review._id || idx} review={review} />)}
              {reviews.length > 3 && (
                <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllReviews(v => !v)}>
                  <Text style={styles.showMoreBtnText}>{showAllReviews ? 'Show less' : `Show all ${reviews.length} reviews`}</Text>
                </TouchableOpacity>
              )}
            </CollapsibleSection>
          )}

          {/* ── Related listings ── */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Similar Listings</Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item._id || item.id || String(Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.relatedCard} onPress={() => handleRelatedProductPress(item)} activeOpacity={0.85}>
                    <Image source={{ uri: item.images?.[0] || item.image || PLACEHOLDER_IMAGE }} style={styles.relatedImg} resizeMode="cover" />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.relatedPrice}>GH₵ {Number(item.price).toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
              />
            </View>
          )}

          {/* ── More from this seller ── */}
          {vendorProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>More from this seller</Text>
              <FlatList
                data={vendorProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item._id || item.id || String(Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.relatedCard} onPress={() => handleRelatedProductPress(item)} activeOpacity={0.85}>
                    <Image source={{ uri: item.images?.[0] || item.image || PLACEHOLDER_IMAGE }} style={styles.relatedImg} resizeMode="cover" />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.relatedPrice}>GH₵ {Number(item.price).toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
              />
            </View>
          )}

          {/* Guest notice */}
          <View style={styles.guestNotice}>
            <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
            <Text style={styles.guestNoticeText}>
              <Text style={{ fontWeight: '700' }}>Browsing as guest.</Text>{' '}
              Sign in to add items to your cart, save favorites, and more.
            </Text>
          </View>
        </View>
        <View style={{ height: 150 }} />
      </Animated.ScrollView>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <TouchableOpacity style={[styles.addToCartBtn, (!isAvailable) && styles.btnDisabled]} onPress={handleAddToCart} activeOpacity={0.88}>
            <Ionicons name="bag-add-outline" size={20} color="#fff" />
            <Text style={styles.addToCartBtnText}>{isAvailable ? `Add to Cart · GH₵ ${lineTotal}` : 'Sold Out'}</Text>
          </TouchableOpacity>
          <ChatFAB 
                        product={product}
                        isAuthenticated={false}
                        style={{ 
                          position: 'absolute', 
                          bottom: 100, 
                          right: 20,
                          zIndex: 20,
                        }}
                        onConversationOpened={(conversation) => {
                          console.log('Conversation opened:', conversation._id);
                        }}
                   />
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen:  { flex: 1, backgroundColor: '#F7F7F7' },
  floatingNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  minimalNav:  { paddingHorizontal: 16, paddingVertical: 10 },
  navRight:    { flexDirection: 'row', gap: 6 },
  navIconBtn:  { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 },
  scrollContent: { paddingBottom: 24 },

  conditionOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, left: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  conditionOverlayText: { fontSize: 11, fontWeight: '700' },

  discountRibbon: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, right: 16, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#C62828', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  discountRibbonText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  urgentTag: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  urgentTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  oosOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 4, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  oosBadge:   { alignItems: 'center', gap: 6 },
  oosText:    { color: '#fff', fontSize: 18, fontWeight: '800' },

  infoPanel:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 6, paddingBottom: 8 },
  tagsScroll:    { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, gap: 8 },
  tag:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  tagText:       { fontSize: 11, fontWeight: '700' },
  titleSection:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 },
  productName:   { fontSize: 22, fontWeight: '800', color: '#1A1A1A', lineHeight: 30, letterSpacing: -0.3, marginBottom: 4 },
  brandText:     { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 10 },
  metaCaptionRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  metaCaptionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaCaptionText: { fontSize: 11.5, color: '#BDBDBD', fontWeight: '500' },

  // Regular (non-discount) price row
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, marginTop: 4 },
  price:         { fontSize: 28, fontWeight: '900', color: '#1B5E20', letterSpacing: -0.5 },
  negotiableChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#FFCC80' },
  negotiableChipText: { fontSize: 11, fontWeight: '700', color: '#E65100' },

  // Discount price block
  priceBlockDiscount: { marginTop: 4 },
  priceRowDiscount: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savingsBadge: {
    backgroundColor: '#C62828', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
  },
  savingsBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  wasRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  wasPrice: { fontSize: 15, color: '#9E9E9E', fontWeight: '600', textDecorationLine: 'line-through' },
  youSave:  { fontSize: 12.5, color: '#2E7D32', fontWeight: '700' },
  couponHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E3F2FD', alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginTop: 8,
  },
  couponHintText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },

  availBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 16, backgroundColor: '#F1F8F3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  availBannerOos:  { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  availBannerLow:  { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  availDot:        { width: 8, height: 8, borderRadius: 4 },
  availText:       { fontSize: 13, fontWeight: '600', flex: 1 },

  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingBottom: 16 },
  qtyLabel:      { fontSize: 13, fontWeight: '600', color: '#757575' },
  qtyStepper:    { flexDirection: 'row', alignItems: 'center' },
  qtyBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F2', justifyContent: 'center', alignItems: 'center' },
  qtyBtnDisabled:{ opacity: 0.4 },
  qtyValue:      { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 14 },
  qtyTotal:      { marginLeft: 'auto', fontSize: 18, fontWeight: '800', color: '#1B5E20' },

  // Minimal info rows
  infoRowsWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoRowLabel: { fontSize: 13, color: '#757575', fontWeight: '500' },
  infoRowValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textTransform: 'capitalize', maxWidth: '55%', textAlign: 'right' },

  descText: { fontSize: 15, lineHeight: 24, color: '#555' },

  sellerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sellerAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sellerAvatarImg:  { width: '100%', height: '100%' },
  sellerAvatarText: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  sellerInfo:       { flex: 1 },
  sellerName:       { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  sellerCampus:     { fontSize: 13, color: '#757575', fontWeight: '500', marginTop: 2 },
  sellerRating:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  sellerRatingText: { fontSize: 12, color: '#757575', fontWeight: '600' },
  sellerArrow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewShopBtn:      { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F8F3', borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  viewShopBtnText:  { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  safetyNote:       { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE' },
  safetyNoteText:   { fontSize: 12, color: '#1D4ED8', lineHeight: 18, flex: 1 },

  ratingOverview: { flexDirection: 'row', gap: 20, marginBottom: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EBEBEB' },
  ratingBig:      { alignItems: 'center' },
  ratingBigNum:   { fontSize: 40, fontWeight: '900', color: '#1A1A1A', lineHeight: 46 },
  ratingBigSub:   { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
  showMoreBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9', marginTop: 4 },
  showMoreBtnText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  relatedSection: { paddingTop: 20, paddingBottom: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB' },
  relatedTitle:   { fontSize: 15, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 24, marginBottom: 14 },
  relatedCard:    { width: 148, marginRight: 12, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  relatedImg:     { width: '100%', height: 110 },
  relatedInfo:    { padding: 10 },
  relatedName:    { fontSize: 12, fontWeight: '600', color: '#1A1A1A', marginBottom: 4, lineHeight: 17 },
  relatedPrice:   { fontSize: 15, fontWeight: '800', color: '#2E7D32' },

  guestNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E3F2FD', borderRadius: 14, padding: 14, marginHorizontal: 24, marginTop: 20, borderWidth: 1, borderColor: '#BBDEFB' },
  guestNoticeText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 19 },

  loadingText: { marginTop: 14, fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle:  { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 16, marginBottom: 6 },
  errorBtn:    { backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 14 },
  errorBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 14,
  },
  bottomBarInner: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    paddingVertical: 16, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addToCartBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
   navIconBtnSharing: {
    backgroundColor: '#F5F5F5',
  },
});

export default GuestProductDetailScreen;