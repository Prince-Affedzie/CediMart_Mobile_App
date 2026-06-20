import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CartScreen = () => {
  const navigation = useNavigation();
  const { bottom, top } = useSafeAreaInsets();
  const {
    cartItems,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    loading: cartContextLoading,
    refreshCart,
  } = useCart();
  const { isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      setScreenLoading(true);
      const loadData = async () => {
        try {
          await refreshCart();
        } catch (error) {
          console.error('Error loading cart:', error);
        } finally {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }).start();
          setScreenLoading(false);
        }
      };
      loadData();
      return () => { fadeAnim.setValue(0); };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(productId);
    try {
      await updateQuantity(productId, newQuantity);
      await refreshCart();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update quantity');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingItemId(productId);
            try {
              await removeFromCart(productId);
              await refreshCart();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove item');
            } finally {
              setRemovingItemId(null);
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    Alert.alert(
      'Clear Cart',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setScreenLoading(true);
              await clearCart();
              await refreshCart();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to clear cart');
            } finally {
              setScreenLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items first!');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to proceed with checkout.',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      navigation.navigate('Order');
    }, 800);
  };

  const getProductData = (item) => {
    const product = item.product || item;
    return {
      id: product._id || product.id || item.productId || item.id,
      name: product.name || item.name || 'Unnamed Product',
      price: product.price || item.price || 0,
      image: product.image || product.images?.[0] || item.image || 'https://via.placeholder.com/100',
      unit: product.unit || item.unit || 'piece',
      stock: product.countInStock || product.stock || 100,
      quantity: item.quantity || 1,
    };
  };

  const calculateItemTotal = (item) => {
    const p = getProductData(item);
    return p.quantity * p.price;
  };

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (screenLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />
        <SafeAreaView edges={['top']} style={styles.floatingNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.loadingBody}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          <Text style={styles.loadingTitle}>Loading your cart</Text>
          <Text style={styles.loadingSub}>Fetching items and latest prices…</Text>
        </View>
      </View>
    );
  }

  // ── EMPTY CART ────────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />
        <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>My Cart</Text>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>

        <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="cart-outline" size={44} color="#A5D6A7" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            You haven't added any fresh products yet. Start browsing!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── CART ITEM ─────────────────────────────────────────────────────────────────
  const renderCartItem = (item, index) => {
    const p = getProductData(item);
    const isUpdating = updatingItemId === p.id;
    const isRemoving = removingItemId === p.id;
    const lineTotal = calculateItemTotal(item).toFixed(2);

    return (
      <Animated.View
        key={`${p.id}-${index}`}
        style={[styles.cartCard, { opacity: fadeAnim }]}
      >
        {/* Image */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { productId: p.id, product: item.product || item })}
          activeOpacity={0.85}
        >
          <Image source={{ uri: p.image }} style={styles.itemImage} resizeMode="cover" />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.itemBody}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductDetail', { productId: p.id, product: item.product || item })}
            activeOpacity={0.8}
          >
            <Text style={styles.itemName} numberOfLines={2}>{p.name}</Text>
          </TouchableOpacity>

          <Text style={styles.itemUnitPrice}>GH₵ {p.price.toFixed(2)} / {p.unit}</Text>

          {/* Qty stepper + line total */}
          <View style={styles.itemFooter}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, p.quantity <= 1 && styles.stepBtnDisabled]}
                onPress={() => handleUpdateQuantity(p.id, p.quantity - 1)}
                disabled={p.quantity <= 1 || isUpdating || screenLoading}
              >
                <Ionicons name="remove" size={16} color={p.quantity <= 1 ? '#D0D0D0' : '#2E7D32'} />
              </TouchableOpacity>

              <View style={styles.stepCount}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Text style={styles.stepNum}>{p.quantity}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.stepBtn, p.quantity >= p.stock && styles.stepBtnDisabled]}
                onPress={() => handleUpdateQuantity(p.id, p.quantity + 1)}
                disabled={p.quantity >= p.stock || isUpdating || screenLoading}
              >
                <Ionicons name="add" size={16} color={p.quantity >= p.stock ? '#D0D0D0' : '#2E7D32'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.lineTotal}>GH₵ {lineTotal}</Text>
          </View>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveItem(p.id, p.name)}
          disabled={isRemoving || screenLoading}
          activeOpacity={0.7}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#E53935" />
          ) : (
            <Ionicons name="trash-outline" size={17} color="#E53935" />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />

      {/* ── Floating Nav ── */}
      <SafeAreaView edges={['top']} style={styles.floatingNavSafe}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>My Cart</Text>
            {cartCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnClear]}
            onPress={handleClearCart}
            disabled={screenLoading}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={17} color="#E53935" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Checkout processing modal ── */}
      <Modal transparent visible={checkoutLoading} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.modalTitle}>Preparing your order</Text>
            <Text style={styles.modalSub}>Please wait a moment…</Text>
          </View>
        </View>
      </Modal>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Page title block */}
        <Animated.View style={[styles.pageHeader, { opacity: fadeAnim }]}>
          <Text style={styles.pageTitle}>Cart</Text>
          <Text style={styles.pageSubtitle}>
            {cartCount} item{cartCount !== 1 ? 's' : ''} ready to order
          </Text>
        </Animated.View>

        {/* Cart items */}
        <View style={styles.itemsBlock}>
          {cartItems.map((item, index) => renderCartItem(item, index))}
        </View>

        {/* Delivery info card */}
        <Animated.View style={[styles.deliveryCard, { opacity: fadeAnim }]}>
          <View style={styles.deliveryCardHeader}>
            <View style={styles.deliveryCardIcon}>
              <Ionicons name="bicycle-outline" size={18} color="#F57F17" />
            </View>
            <Text style={styles.deliveryCardTitle}>Delivery Info</Text>
          </View>
          <View style={styles.deliveryItems}>
            {[
              'Delivery fee (GH₵ 10–70) paid to rider on delivery',
              'Same-day delivery available',
              'Flexible delivery scheduling at checkout',
            ].map((txt, i) => (
              <View key={i} style={styles.deliveryItem}>
                <View style={styles.deliveryDot} />
                <Text style={styles.deliveryItemText}>{txt}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Spacer for bottom bar */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ── Fixed bottom checkout bar ── */}
      <Animated.View
        style={[
          styles.checkoutBar,
          { paddingBottom: Math.max(bottom, 16), opacity: fadeAnim },
        ]}
      >
        {/* Subtotal row */}
        <View style={styles.checkoutSummary}>
          <View style={styles.checkoutLeft}>
            <Text style={styles.checkoutItemCount}>
              {cartCount} item{cartCount !== 1 ? 's' : ''}
            </Text>
            <View style={styles.checkoutSep} />
            <View style={styles.checkoutDeliveryWrap}>
              <Ionicons name="bicycle-outline" size={12} color="#F57F17" />
              <Text style={styles.checkoutDeliveryLabel}>GH₵ 20–80 delivery</Text>
            </View>
          </View>
          <Text style={styles.checkoutTotal}>GH₵ {cartTotal.toFixed(2)}</Text>
        </View>

        {/* Delivery disclaimer */}
        <View style={styles.checkoutNote}>
          <Ionicons name="information-circle-outline" size={12} color="#F57F17" />
          <Text style={styles.checkoutNoteText}>
            Delivery fee paid separately to rider — not included above
          </Text>
        </View>

        {/* Checkout button */}
        <TouchableOpacity
          style={[styles.checkoutBtn, (checkoutLoading || cartItems.length === 0) && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={checkoutLoading || cartItems.length === 0}
          activeOpacity={0.88}
        >
          {checkoutLoading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.checkoutBtnText}>Processing…</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.checkoutBtnText}>
                Checkout · GH₵ {cartTotal.toFixed(2)}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F7' },

  // ── NAV ────────────────────────────────────────────────────────────────────
  floatingNav: { zIndex: 10 },
  floatingNavSafe: { zIndex: 10 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  navBtnClear: {
    backgroundColor: '#FFF0F0',
    shadowColor: '#E53935',
    shadowOpacity: 0.08,
  },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.1 },
  navBadge: {
    backgroundColor: '#4CAF50', borderRadius: 11,
    minWidth: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  navBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── LOADING ──────────────────────────────────────────────────────────────────
  loadingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
  loadingSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },

  // ── EMPTY ────────────────────────────────────────────────────────────────────
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBg: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── SCROLL ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ── PAGE HEADER ─────────────────────────────────────────────────────────────
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 30, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 3, fontWeight: '500' },

  // ── ITEMS ────────────────────────────────────────────────────────────────────
  itemsBlock: { paddingHorizontal: 16, gap: 10 },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  itemImage: {
    width: 88, height: 88,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  itemBody: { flex: 1 },
  itemName: {
    fontSize: 14, fontWeight: '700', color: '#1A1A1A',
    lineHeight: 20, marginBottom: 5,
  },
  itemUnitPrice: {
    fontSize: 12, color: '#9E9E9E', fontWeight: '500', marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8F7', borderRadius: 20,
    padding: 3, gap: 2,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepCount: { minWidth: 34, alignItems: 'center' },
  stepNum: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  lineTotal: {
    fontSize: 16, fontWeight: '800', color: '#2E7D32',
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  // ── DELIVERY CARD ────────────────────────────────────────────────────────────
  deliveryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deliveryCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  deliveryCardIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center', alignItems: 'center',
  },
  deliveryCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  deliveryItems: { gap: 8 },
  deliveryItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  deliveryDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4CAF50', marginTop: 5, flexShrink: 0,
  },
  deliveryItemText: { flex: 1, fontSize: 13, color: '#757575', lineHeight: 19 },

  // ── CHECKOUT BAR ─────────────────────────────────────────────────────────────
  checkoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 18,
  },
  checkoutSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  checkoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  checkoutItemCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  checkoutSep: { width: 1, height: 16, backgroundColor: '#E8E8E8', marginHorizontal: 10 },
  checkoutDeliveryWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkoutDeliveryLabel: { fontSize: 12, color: '#F57F17', fontWeight: '600' },
  checkoutTotal: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  checkoutNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF8E1', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 6,
  },
  checkoutNoteText: { flex: 1, fontSize: 11, color: '#F57F17', lineHeight: 15 },
  checkoutBtn: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: 16, gap: 8,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  checkoutBtnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // ── MODAL ────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 22,
    padding: 32, alignItems: 'center',
    width: width * 0.78, maxWidth: 300,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 18, marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },
});

export default CartScreen;