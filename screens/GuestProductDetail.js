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

const InfoGridItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIcon}><Ionicons name={icon} size={18} color="#2E7D32" /></View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
  </View>
);

const ImageGallery = ({ images, activeIndex, onScroll }) => {
  const flatListRef = useRef(null);
  const IMG_H = width * 0.88;

  return (
    <View style={galS.wrapper}>
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
  arrowBtn: { position: 'absolute', top: '40%', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  counterPill: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dotsRow: { position: 'absolute', bottom: 58, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  thumbStripWrap: { backgroundColor: 'rgba(0,0,0,0.55)', position: 'absolute', bottom: 0, left: 0, right: 0 },
  thumbStrip: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', opacity: 0.65 },
  thumbActive: { opacity: 1, borderColor: '#fff' },
  thumbImg: { width: '100%', height: '100%' },
});

const GuestProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, product: routeProduct } = route.params || {};

  const [product, setProduct] = useState(routeProduct || null);
  const [loading, setLoading] = useState(!routeProduct);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = useCallback(async () => {
    const id = productId || routeProduct?._id || routeProduct?.id;
    if (!id) { setError('Product not found.'); setLoading(false); return; }
    try {
      setError(null);
      const res = await getProductById(id);
      if (res?.data?.success || res?.status === 200) {
        setProduct(res.data?.data?.product || res.data?.data || res.data);
      } else setError('Could not load product.');
    } catch (err) { setError(err?.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }, [productId, routeProduct]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleShare = async () => {
    try { await Share.share({ message: `Check out "${product?.name}" on CampusMart — GH₵ ${product?.price?.toFixed(2)}`, title: product?.name }); } catch {}
  };

  const handleAddToCart = () => {
    Alert.alert('Sign in Required', 'Create a free account or log in to add items to your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
    ]);
  };

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
  const lineTotal = (Number(product.price) * quantity).toFixed(2);
  const reviews = product.reviews || [];

  const infoItems = [
    { icon: 'grid-outline', label: 'Category', value: product.category?.replace(/-/g, ' ') },
    product.subcategory && { icon: 'layers-outline', label: 'Subcategory', value: product.subcategory?.replace(/-/g, ' ') },
    { icon: 'school-outline', label: 'Campus', value: CAMPUS_LABELS[product.campus] || product.campus },
    { icon: 'location-outline', label: 'Area', value: product.location?.campusArea },
    product.location?.hostel && { icon: 'home-outline', label: 'Hostel / Hall', value: product.location.hostel },
    product.brand && { icon: 'bookmark-outline', label: 'Brand', value: product.brand },
    { icon: 'eye-outline', label: 'Views', value: `${product.views ?? 0}` },
    { icon: 'heart-outline', label: 'Saved', value: `${product.favorites ?? 0} people` },
  ].filter(Boolean);

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.floatingNav} edges={['top']}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#1A1A1A" /></TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIconBtn} onPress={handleShare}><Ionicons name="share-social-outline" size={20} color="#1A1A1A" /></TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          <ImageGallery images={images} activeIndex={activeImageIndex} onScroll={onImageScroll} />

          <View style={[styles.conditionOverlay, { backgroundColor: conditionInfo.bg }]}>
            <Ionicons name={conditionInfo.icon} size={11} color={conditionInfo.text} />
            <Text style={[styles.conditionOverlayText, { color: conditionInfo.text }]}>{conditionInfo.label}</Text>
          </View>

          {product.negotiable && (
            <View style={styles.negotiableTag}>
              <Ionicons name="pricetag" size={11} color="#fff" />
              <Text style={styles.negotiableTagText}>Negotiable</Text>
            </View>
          )}

          {product.tags?.includes('urgent-sale') && (
            <View style={styles.urgentTag}><Ionicons name="flash" size={11} color="#fff" /><Text style={styles.urgentTagText}>Urgent Sale</Text></View>
          )}

          {!isAvailable && (
            <View style={styles.oosOverlay}>
              <View style={styles.oosBadge}><Ionicons name="close-circle-outline" size={28} color="#fff" /><Text style={styles.oosText}>Sold Out</Text></View>
            </View>
          )}
        </View>

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

          <View style={styles.titleSection}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && <Text style={styles.brandText}>by {product.brand}</Text>}
            <View style={styles.priceRow}>
              <Text style={styles.price}>GH₵ {product.price?.toFixed(2)}</Text>
              {product.negotiable && (
                <View style={styles.negotiableChip}><Ionicons name="chatbubble-ellipses-outline" size={11} color="#E65100" /><Text style={styles.negotiableChipText}>Negotiable</Text></View>
              )}
            </View>
            {(product.numReviews ?? 0) > 0 && <StarRow rating={product.rating || 0} count={product.numReviews || 0} />}
          </View>

          <View style={[styles.availBanner, !isAvailable && styles.availBannerOos, isLowStock && styles.availBannerLow]}>
            <View style={[styles.availDot, { backgroundColor: isAvailable ? (isLowStock ? '#FF8F00' : '#4CAF50') : '#E53935' }]} />
            <Text style={[styles.availText, { color: isAvailable ? (isLowStock ? '#FF6F00' : '#2E7D32') : '#C62828' }]}>
              {!isAvailable ? 'Currently unavailable' : isLowStock ? `Only ${stockCount} left — grab it fast!` : `${stockCount} in stock`}
            </Text>
          </View>

          {isAvailable && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyStepper}>
                <TouchableOpacity style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]} onPress={decreaseQty} disabled={quantity <= 1}><Ionicons name="remove" size={18} color={quantity <= 1 ? '#D0D0D0' : '#424242'} /></TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={increaseQty}><Ionicons name="add" size={18} color="#2E7D32" /></TouchableOpacity>
              </View>
              <Text style={styles.qtyTotal}>GH₵ {lineTotal}</Text>
            </View>
          )}

          <CollapsibleSection title="Product Details" defaultOpen>
            <View style={styles.infoGrid}>{infoItems.map((item, i) => <InfoGridItem key={i} icon={item.icon} label={item.label} value={item.value} />)}</View>
          </CollapsibleSection>

          {!!product.description && (
            <CollapsibleSection title="Description" defaultOpen>
              <Text style={styles.descText}>{product.description}</Text>
            </CollapsibleSection>
          )}

          {product.vendor && (
            <CollapsibleSection title="Seller" defaultOpen>
             
              <TouchableOpacity style={styles.sellerRow}  onPress={() => navigation.navigate('VendorDetail', { vendorId: product.vendor._id, vendor: product.vendor })}
                                activeOpacity={0.7}>
                
                <View style={styles.sellerAvatar}><Text style={styles.sellerAvatarText}>{(product.vendor.name || 'S').charAt(0).toUpperCase()}</Text></View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{product.vendor.name || 'Student Seller'}</Text>
                  <Text style={styles.sellerCampus}>{CAMPUS_LABELS[product.campus] || product.campus}</Text>
                </View>
                <View style={styles.viewShopBtn}>
                  <Text style={styles.viewShopBtnText}>View Shop</Text>
                </View>
              </TouchableOpacity>
            </CollapsibleSection>
          )}

          <View style={styles.guestNotice}>
            <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
            <Text style={styles.guestNoticeText}>
              <Text style={{ fontWeight: '700' }}>Browsing as guest.</Text>{' '}
              Sign in to add items to your cart, save favorites, and more.
            </Text>
          </View>
        </View>
        <View style={{ height: 150 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <TouchableOpacity style={[styles.addToCartBtn, (!isAvailable) && styles.btnDisabled]} onPress={handleAddToCart} activeOpacity={0.88}>
            <Ionicons name="bag-add-outline" size={20} color="#fff" />
            <Text style={styles.addToCartBtnText}>{isAvailable ? `Add to Cart · GH₵ ${lineTotal}` : 'Sold Out'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#F7F7F7' },
  floatingNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  minimalNav: { paddingHorizontal: 16, paddingVertical: 10 },
  navRight: { flexDirection: 'row', gap: 6 },
  navIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 },
  scrollContent: { paddingBottom: 24 },
  conditionOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, left: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  conditionOverlayText: { fontSize: 11, fontWeight: '700' },
  negotiableTag: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 44, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249,115,22,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  negotiableTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  urgentTag: { position: 'absolute', top: Platform.OS === 'ios' ? 94 : 84, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  urgentTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  oosOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 4, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  oosBadge: { alignItems: 'center', gap: 6 },
  oosText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  infoPanel: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 6, paddingBottom: 8 },
  tagsScroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  titleSection: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16 },
  productName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', lineHeight: 30, letterSpacing: -0.3, marginBottom: 4 },
  brandText: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, marginTop: 4 },
  price: { fontSize: 28, fontWeight: '900', color: '#1B5E20', letterSpacing: -0.5 },
  negotiableChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#FFCC80' },
  negotiableChipText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
  availBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 16, backgroundColor: '#F1F8F3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  availBannerOos: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  availBannerLow: { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 13, fontWeight: '600', flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingBottom: 16 },
  qtyLabel: { fontSize: 13, fontWeight: '600', color: '#757575' },
  qtyStepper: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F2', justifyContent: 'center', alignItems: 'center' },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 14 },
  qtyTotal: { marginLeft: 'auto', fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: { width: '47%', alignItems: 'center', backgroundColor: '#F8FAF8', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EEF2EE' },
  infoIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', textTransform: 'capitalize' },
  descText: { fontSize: 15, lineHeight: 24, color: '#555' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  sellerAvatarText: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  viewShopBtn:      { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F8F3', borderRadius: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  viewShopBtnText:  { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  sellerCampus: { fontSize: 13, color: '#757575', fontWeight: '500', marginTop: 2 },
  guestNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E3F2FD', borderRadius: 14, padding: 14, marginHorizontal: 24, marginTop: 20, borderWidth: 1, borderColor: '#BBDEFB' },
  guestNoticeText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 19 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 14 },
  bottomBarInner: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  addToCartBtn: { flex: 1, backgroundColor: '#1B5E20', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addToCartBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 14, color: '#9E9E9E', fontWeight: '500' },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 16, marginBottom: 6 },
  errorBtn: { backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 14 },
  errorBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default GuestProductDetailScreen;