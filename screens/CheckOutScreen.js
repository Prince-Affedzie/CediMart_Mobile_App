// src/screens/main/OrderScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerPayment } from '../services/paymentService';
import { usePaystack } from 'react-native-paystack-webview';
import { order } from '../apis/orderApi';
import { verifyPayment } from '../apis/paymentApi';
import { getReferralCode, clearReferralCode } from '../utils/referralStorage';

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

// ─── Section Card Header ──────────────────────────────────────────────────
const SectionHeader = ({ icon, title, filled, required, pulseAnim, action }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={[styles.sectionIconWrap, filled && styles.sectionIconFilled]}>
      <Ionicons name={icon} size={17} color={filled ? '#fff' : C.brand} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {filled ? (
      <View style={styles.doneBadge}>
        <Ionicons name="checkmark-circle" size={14} color={C.success} />
        <Text style={styles.doneBadgeText}>Done</Text>
      </View>
    ) : required ? (
      <Animated.View style={[styles.reqBadge, pulseAnim && { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.reqBadgeText}>REQUIRED</Text>
      </Animated.View>
    ) : null}
    {action && (
      <TouchableOpacity style={styles.sectionAction} onPress={action.onPress}>
        <Ionicons name={action.icon} size={13} color={C.brand} />
        <Text style={styles.sectionActionText}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Payment Option Card ─────────────────────────────────────────────────
const PaymentOption = ({ selected, onPress, icon, title, subtitle, badge }) => (
  <TouchableOpacity
    style={[styles.payOption, selected && styles.payOptionActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.payOptionIcon, selected && styles.payOptionIconActive]}>
      <Ionicons name={icon} size={22} color={selected ? '#fff' : C.brand} />
    </View>

    <View style={styles.payOptionBody}>
      <View style={styles.payOptionTitleRow}>
        <Text style={[styles.payOptionTitle, selected && styles.payOptionTitleActive]}>
          {title}
        </Text>
        {badge && (
          <View style={[styles.payOptionBadge, selected && styles.payOptionBadgeActive]}>
            <Text style={[styles.payOptionBadgeText, selected && styles.payOptionBadgeTextActive]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.payOptionSub, selected && styles.payOptionSubActive]}>
        {subtitle}
      </Text>
    </View>

    <View style={[styles.payRadio, selected && styles.payRadioActive]}>
      {selected && <View style={styles.payRadioFill} />}
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────
const OrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { cartItems, cartTotal, clearCart, refreshCart, loading: cartLoading } = useCart();
  const { user, token } = useAuth();

  const { popup } = usePaystack();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentEmailError, setPaymentEmailError] = useState('');
  const [referralCode, setReferralCode] = useState(null);
  const [newAddress, setNewAddress] = useState({ address: '', city: '', region: '', nearestLandmark: '', phone: user?.phone || '' });
  const [bottomBarHeight, setBottomBarHeight] = useState(200);
  const [paymentMethod, setPaymentMethod] = useState('virtual');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 750, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
    ])).start();
    loadUserAddresses();
    refreshCart();
  }, []);

  useEffect(() => {
    (async () => {
      const code = await getReferralCode();
      setReferralCode(code);
    })();
  }, []);

  const total = cartTotal;

  const loadUserAddresses = async () => {
    try {
      if (user?.addresses?.length > 0) {
        setAddresses(user.addresses);
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddress(def);
      }
    } catch (err) { console.log(err); }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddAddress = () => {
    if (!newAddress.address || !newAddress.city || !newAddress.phone) {
      Alert.alert('Missing Fields', 'Please fill address, city and phone.');
      return;
    }
    const addr = { ...newAddress, isDefault: addresses.length === 0 };
    setAddresses(prev => [...prev, addr]);
    setSelectedAddress(addr);
    setShowAddAddress(false);
    setNewAddress({ address: '', city: '', region: '', nearestLandmark: '', phone: user?.phone || '' });
  };

  const prepareOrderItems = () => cartItems.map(item => ({
    productId: item.product?._id || item.productId || item.id,
    name: item.product?.name || item.name,
    quantity: item.quantity || 1,
    unit: item.product?.unit || 'piece',
    price: item.product?.price || item.price,
    product: item.product?._id || item.productId || item.id,
  }));

  //  Delivery schedule no longer collected — omitted from the payload.
  const prepareOrderData = (paymentReference, paymentStatus) => ({
    orderItems: prepareOrderItems(),
    shippingAddress: {
      address: selectedAddress.address,
      city: selectedAddress.city,
      region: selectedAddress.region || '',
      nearestLandmark: selectedAddress.nearestLandmark || '',
      phone: selectedAddress.phone || user?.phone,
    },
    paymentMethod,
    paymentReference,
    paymentStatus,
    ...(referralCode && { referralCode }),
  });

  const isFormValid = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Add items first.');
      navigation.navigate('Products');
      return false;
    }
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select or add a delivery address.');
      return false;
    }
    //  Delivery schedule validation removed.
    if (paymentMethod === 'virtual') {
      if (!paymentEmail.trim()) {
        setPaymentEmailError('Email is required for payment');
        return false;
      }
      if (!validateEmail(paymentEmail)) {
        setPaymentEmailError('Please enter a valid email address');
        return false;
      }
    }
    const outOfStock = cartItems.filter(item => {
      const stock = item.product?.countInStock ?? item.product?.stock ?? 0;
      return stock < (item.quantity || 1);
    });
    if (outOfStock.length > 0) {
      Alert.alert('Stock Issue', `Not enough stock for: ${outOfStock.map(i => i.product?.name || i.name).join(', ')}`, [
        { text: 'OK', onPress: () => navigation.navigate('Cart') },
      ]);
      return false;
    }
    return true;
  };

  const createOrderAfterPayment = async (paymentReference, paymentStatus) => {
    const orderData = prepareOrderData(paymentReference, paymentStatus);
    const authToken = token || (await AsyncStorage.getItem('@cedimart_token'));
    const res = await order(orderData, authToken);
    if (res.status === 200 || res.status === 201) {
      clearCart();
      const orderNumber = res.data.data?.orderNumber || res.data.data?._id || 'N/A';
      const followUp = paymentMethod === 'cash'
        ? '\n\nPlease have the exact amount ready for cash payment on delivery.'
        : paymentStatus === 'pending'
          ? '\n\nYour payment is being verified. We\'ll confirm once complete.'
          : '';
      Alert.alert('Order Confirmed! 🎉', `Order #${orderNumber} has been placed successfully.${followUp}`, [
        { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { orderId: res.data.data?._id || res.data.data?.id }) },
        { text: 'Continue Shopping', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
      ]);
      if (referralCode) {
        await clearReferralCode();
      }
    } else {
      Alert.alert('Order Failed', res.data?.message || 'We couldn\'t create your order. Please contact support.', [
        { text: 'Contact Support', onPress: () => navigation.navigate('Support') },
      ]);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;
    setPlacingOrder(true);
    try {
      const authToken = token || (await AsyncStorage.getItem('@cedimart_token'));
      if (!authToken) {
        Alert.alert('Login Required', 'Please sign in to continue.');
        navigation.navigate('Login');
        setPlacingOrder(false);
        return;
      }

      if (paymentMethod === 'cash') {
        await createOrderAfterPayment(null, 'pending');
        return;
      }

      const paymentResult = await triggerPayment({
        navigation,
        email: paymentEmail.trim(),
        phone: user?.phone || selectedAddress?.phone,
        amount: total,
      });
      if (!paymentResult?.success) {
        if (paymentResult?.cancelled) { setPlacingOrder(false); return; }
        Alert.alert('Payment Failed', 'Your payment could not be processed. Please try again.');
        setPlacingOrder(false);
        return;
      }
      const reference = paymentResult.reference;
      let paymentVerified = false;
      try {
        const verifyRes = await verifyPayment(reference);
        paymentVerified = verifyRes?.status === 200 && verifyRes?.data?.success === true;
      } catch (verifyError) {
        console.log('Payment verification error (non-blocking):', verifyError?.message);
      }
      await createOrderAfterPayment(reference, paymentVerified ? 'paid' : 'pending');
    } catch (err) {
      console.error('Order placement error:', err);
      if (err.response) {
        switch (err.response.status) {
          case 400: {
            if (err.response.data?.outOfStockItems) {
              const names = err.response.data.outOfStockItems.map((i) => i.name).join(', ');
              Alert.alert('Items Unavailable', `The following items are out of stock: ${names}. They have been removed from your cart.`, [
                { text: 'OK', onPress: () => navigation.navigate('Cart') },
              ]);
            } else {
              Alert.alert('Error', err.response.data?.message || 'Invalid order. Please check your items.');
            }
            break;
          }
          case 401: {
            Alert.alert('Session Expired', 'Please sign in again to continue.');
            navigation.navigate('Login');
            break;
          }
          case 409: {
            Alert.alert('Duplicate Order', 'It looks like this order may have already been placed. Please check your orders.', [
              { text: 'View Orders', onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }) },
            ]);
            break;
          }
          default: {
            Alert.alert('Error', err.response.data?.message || 'Failed to process your order. Please try again.');
          }
        }
      } else if (err.request) {
        Alert.alert('Network Error', 'Please check your internet connection and try again. If the issue persists, your payment may have been processed — check your orders before retrying.', [
          { text: 'Check Orders', onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }) },
          { text: 'Retry', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const emailValid = paymentMethod === 'cash' ? true : (paymentEmail && validateEmail(paymentEmail));
  const readyToPay = selectedAddress && emailValid;

  if (cartLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIconWrap}><ActivityIndicator size="large" color={C.brand} /></View>
        <Text style={styles.loadingTitle}>Preparing Checkout</Text>
        <Text style={styles.loadingSub}>Getting everything ready for you…</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={C.t1} />
            </TouchableOpacity>
            <Text style={styles.navPageTitle}>Checkout</Text>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyScreen}>
          <View style={styles.emptyIconBg}><Ionicons name="cart-outline" size={40} color={C.brandBorder} /></View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some fresh items to get started</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Products')}>
            <Ionicons name="storefront-outline" size={17} color="#fff" />
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <SafeAreaView edges={['top']}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.t1} />
          </TouchableOpacity>
          <View style={styles.navCenterGroup}>
            <Text style={styles.navPageTitle}>Checkout</Text>
            <View style={styles.navSecurePill}>
              <Ionicons name="shield-checkmark" size={11} color={C.brand} />
              <Text style={styles.navSecureText}>Secure</Text>
            </View>
          </View>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomBarHeight + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Checkout</Text>
            <Text style={styles.pageSubtitle}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · GH₵ {total.toFixed(2)}
            </Text>
          </View>

          {/* ── Delivery Address (moved above payment) ── */}
          <View style={[styles.card, !selectedAddress && styles.cardRequired]}>
            <SectionHeader
              icon="location"
              title="Delivery Address"
              filled={!!selectedAddress}
              required
              pulseAnim={pulseAnim}
            />

            {!selectedAddress && !showAddAddress && (
              <View style={styles.nudgeBox}>
                <Ionicons name="home-outline" size={30} color={C.brandBorder} />
                <Text style={styles.nudgeTitle}>Where should we deliver?</Text>
                <Text style={styles.nudgeSub}>Tap below to add your first address</Text>
              </View>
            )}

            {showAddAddress ? (
              <View style={styles.formWrap}>
                <InputField
                  label="Street Address"
                  required
                  placeholder="e.g. 12 Accra Road, East Legon"
                  value={newAddress.address}
                  onChangeText={t => setNewAddress({ ...newAddress, address: t })}
                />
                <InputField
                  label="City or Area"
                  required
                  placeholder="e.g. Accra or East Legon"
                  value={newAddress.city}
                  onChangeText={t => setNewAddress({ ...newAddress, city: t })}
                />
                <InputField
                  label="Phone Number"
                  required
                  placeholder="e.g. 0244000000"
                  value={newAddress.phone}
                  onChangeText={t => setNewAddress({ ...newAddress, phone: t })}
                  keyboardType="phone-pad"
                />
                <InputField
                  label="Nearest Landmark"
                  placeholder="e.g. Behind Total Filling Station"
                  value={newAddress.nearestLandmark}
                  onChangeText={t => setNewAddress({ ...newAddress, nearestLandmark: t })}
                />
                <View style={styles.formBtns}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowAddAddress(false)}>
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleAddAddress}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Save Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {addresses.map((addr, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.addrCard, selectedAddress === addr && styles.addrCardSelected]}
                    onPress={() => setSelectedAddress(addr)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radio, selectedAddress === addr && styles.radioActive]}>
                      {selectedAddress === addr && <View style={styles.radioFill} />}
                    </View>
                    <View style={styles.addrBody}>
                      <Text style={styles.addrMain}>{addr.address}</Text>
                      <Text style={styles.addrSub}>
                        {addr.city}{addr.phone ? ` · ${addr.phone}` : ''}
                      </Text>
                    </View>
                    {selectedAddress === addr && <Ionicons name="checkmark-circle" size={20} color={C.success} />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.addAddrBtn, !selectedAddress && styles.addAddrBtnFilled]}
                  onPress={() => setShowAddAddress(true)}
                >
                  <Ionicons name="add-circle-outline" size={19} color={!selectedAddress ? '#fff' : C.brand} />
                  <Text style={[styles.addAddrText, !selectedAddress && { color: '#fff' }]}>
                    Add New Address
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Payment Method (elevated, more prominent) ── */}
          <View style={styles.payCard}>
            <View style={styles.payCardAccent} />
            <View style={styles.payCardInner}>
              <View style={styles.payHeaderRow}>
                <View style={styles.payHeaderIcon}>
                  <Ionicons name="wallet" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle}>Choose how to pay</Text>
                  <Text style={styles.paySubtitle}>You can change this any time before placing the order</Text>
                </View>
              </View>

              <PaymentOption
                selected={paymentMethod === 'virtual'}
                onPress={() => setPaymentMethod('virtual')}
                icon="flash"
                title="Pay now"
                subtitle="Mobile Money · Card · Bank transfer"
                badge="FASTEST"
              />

              <PaymentOption
                selected={paymentMethod === 'cash'}
                onPress={() => setPaymentMethod('cash')}
                icon="cash-outline"
                title="Pay on delivery"
                subtitle="Cash when your order arrives"
              />

              {/* Payment email — only shown when paying online */}
              {paymentMethod === 'virtual' && (
                <View style={styles.payEmailWrap}>
                  <Text style={styles.payEmailLabel}>Receipt will be sent to</Text>
                  <View
                    style={[
                      styles.emailFieldWrap,
                      paymentEmailError ? styles.emailFieldError : emailValid ? styles.emailFieldSuccess : null,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={paymentEmailError ? C.danger : emailValid ? C.success : C.t3}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      style={styles.emailField}
                      placeholder="yourname@example.com"
                      placeholderTextColor={C.t3}
                      value={paymentEmail}
                      onChangeText={t => {
                        setPaymentEmail(t.trim());
                        if (paymentEmailError && validateEmail(t.trim())) setPaymentEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {emailValid && <Ionicons name="checkmark-circle" size={18} color={C.success} />}
                  </View>
                  {paymentEmailError ? (
                    <View style={styles.fieldMsg}>
                      <Ionicons name="close-circle" size={14} color={C.danger} />
                      <Text style={styles.fieldMsgError}>{paymentEmailError}</Text>
                    </View>
                  ) : emailValid ? (
                    <View style={styles.fieldMsg}>
                      <Ionicons name="checkmark-circle" size={14} color={C.success} />
                      <Text style={styles.fieldMsgSuccess}>Looks good!</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>

          {/* ── Order Summary ── */}
          <View style={styles.card}>
            <SectionHeader
              icon="receipt-outline"
              title="Order Summary"
              filled
              action={{ label: 'Edit Cart', icon: 'pencil-outline', onPress: () => navigation.navigate('Cart') }}
            />
            <View style={styles.itemsList}>
              {cartItems.map((item, i) => {
                const p = item.product || item;
                const qty = item.quantity || 1;
                const lineTotal = (qty * p.price).toFixed(2);
                const imageUri = p.images?.[0] || p.image || 'https://via.placeholder.com/64';
                return (
                  <View key={i} style={[styles.itemRow, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
                    <Image source={{ uri: imageUri }} style={styles.itemThumb} />
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={2}>{p.name}</Text>
                      <Text style={styles.itemMeta}>{qty} × GH₵ {p.price?.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.itemTotal}>GH₵ {lineTotal}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.totalsBlock}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                </Text>
                <Text style={styles.totalsValue}>GH₵ {cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>
                  {paymentMethod === 'cash' ? 'Total (pay on delivery)' : 'Total to pay now'}
                </Text>
                <Text style={styles.grandAmount}>GH₵ {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar} onLayout={(e) => setBottomBarHeight(e.nativeEvent.layout.height)}>
        <View style={styles.checklist}>
          {[
            { label: 'Address', done: !!selectedAddress },
            { label: 'Payment', done: paymentMethod === 'cash' || emailValid },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.checklistSep} />}
              <View style={styles.checklistItem}>
                <Ionicons
                  name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={item.done ? C.success : '#D0D0D0'}
                />
                <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>
                  {item.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.bottomAmountRow}>
          <Text style={styles.bottomAmountLabel}>
            {paymentMethod === 'cash' ? 'Total (pay on delivery)' : 'Total to pay now'}
          </Text>
          <Text style={styles.bottomAmount}>GH₵ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.payBtn,
            placingOrder && styles.payBtnLoading,
            !readyToPay && !placingOrder && styles.payBtnIncomplete,
          ]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.88}
        >
          {placingOrder ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.payBtnText}>Processing…</Text>
            </>
          ) : (
            <Text style={styles.payBtnText}>
              {paymentMethod === 'cash' ? 'Place Order' : `Pay GH₵ ${total.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          {paymentMethod === 'cash'
            ? '📦 Pay cash on delivery · Continuing means you agree to our Terms'
            : '🔒 Secured by Paystack · Continuing means you agree to our Terms'}
        </Text>
      </View>
    </View>
  );
};

const InputField = ({ label, required, placeholder, value, onChangeText, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {label}{required ? <Text style={styles.asterisk}> *</Text> : ''}
    </Text>
    <TextInput
      style={styles.inputField}
      placeholder={placeholder}
      placeholderTextColor={C.t3}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: C.brand, marginBottom: 6 },
  loadingSub: { fontSize: 14, color: C.t3, textAlign: 'center' },
  emptyScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.brand, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: C.t3, marginBottom: 28, textAlign: 'center' },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.brand, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  navCenterGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navPageTitle: { fontSize: 17, fontWeight: '800', color: C.t1, letterSpacing: 0.1 },
  navSecurePill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.brandBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  navSecureText: { fontSize: 11, color: C.brand, fontWeight: '700' },

  pageHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: C.t1, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: C.t3, marginTop: 3, fontWeight: '500' },

  scroll: { paddingTop: 10 },

  card: { backgroundColor: C.surface, marginHorizontal: 16, marginVertical: 7, borderRadius: 18, padding: 20, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardRequired: { borderWidth: 1.5, borderColor: C.accentBorder },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionIconFilled: { backgroundColor: C.brand },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.brand, flex: 1 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  doneBadgeText: { color: C.success, fontSize: 11, fontWeight: '700' },
  reqBadge: { backgroundColor: C.danger, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  reqBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  sectionActionText: { color: C.brand, fontWeight: '600', fontSize: 12 },

  // ── Payment card (elevated) ──
  payCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  payCardAccent: { width: 5, backgroundColor: C.brand },
  payCardInner: { flex: 1, padding: 20 },

  payHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  payHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  payTitle: { fontSize: 17, fontWeight: '800', color: C.t1, letterSpacing: -0.2 },
  paySubtitle: { fontSize: 12, color: C.t3, marginTop: 2, fontWeight: '500' },

  // ── Payment option row ──
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  payOptionActive: {
    borderColor: C.brand,
    backgroundColor: C.brandBg,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  payOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.brandBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payOptionIconActive: { backgroundColor: C.brand },
  payOptionBody: { flex: 1 },
  payOptionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  payOptionTitle: { fontSize: 15, fontWeight: '700', color: C.t1 },
  payOptionTitleActive: { color: C.brandD },
  payOptionBadge: {
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  payOptionBadgeActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  payOptionBadgeText: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 0.4 },
  payOptionBadgeTextActive: { color: '#fff' },
  payOptionSub: { fontSize: 12, color: C.t3, fontWeight: '500' },
  payOptionSubActive: { color: C.brandD },

  payRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payRadioActive: { borderColor: C.brand },
  payRadioFill: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.brand },

  // ── Payment email field ──
  payEmailWrap: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.brandBorder,
  },
  payEmailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brandD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // ── Address ──
  nudgeBox: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FAFAFA', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8', borderStyle: 'dashed', marginBottom: 16, gap: 6 },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: C.t2 },
  nudgeSub: { fontSize: 12, color: C.t3 },
  addrCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#EEEEEE', marginBottom: 10, backgroundColor: '#FAFAFA', gap: 12 },
  addrCardSelected: { borderColor: C.success, backgroundColor: C.successBg },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: C.brand },
  radioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.brand },
  addrBody: { flex: 1 },
  addrMain: { fontSize: 14, fontWeight: '600', color: C.t1 },
  addrSub: { fontSize: 12, color: C.t3, marginTop: 3 },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 2, borderColor: C.brand, borderStyle: 'dashed', marginTop: 4, gap: 8 },
  addAddrBtnFilled: { backgroundColor: C.brand, borderStyle: 'solid' },
  addAddrText: { color: C.brand, fontWeight: '700', fontSize: 14 },

  formWrap: { marginTop: 4 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.t2, marginBottom: 7 },
  asterisk: { color: C.danger },
  inputField: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#E8E8E8', color: C.t1 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  btnSecondaryText: { color: '#616161', fontWeight: '600', fontSize: 14 },
  btnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: C.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emailFieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: '#E8E8E8' },
  emailFieldError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  emailFieldSuccess: { borderColor: C.success, backgroundColor: C.successBg },
  emailField: { flex: 1, fontSize: 15, color: C.t1, letterSpacing: 0.2 },
  fieldMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  fieldMsgError: { color: C.danger, fontSize: 12, fontWeight: '500' },
  fieldMsgSuccess: { color: C.success, fontSize: 12, fontWeight: '600' },

  // ── Order summary ──
  itemsList: { marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 12 },
  itemThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F5F5F5' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: C.t1, marginBottom: 4 },
  itemMeta: { fontSize: 12, color: C.t3 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: C.accent },
  totalsBlock: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalsLabel: { fontSize: 13, color: C.t2, fontWeight: '500' },
  totalsValue: { fontSize: 13, fontWeight: '600', color: C.t1 },
  totalsDivider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 12 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: 15, fontWeight: '700', color: C.brand },
  grandAmount: { fontSize: 24, fontWeight: '800', color: C.accent },

  // ── Bottom bar ──
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 14, borderTopWidth: 1, borderTopColor: '#EEF2EE', shadowColor: C.black, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 18 },
  checklist: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checklistSep: { width: 24, height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 6 },
  checklistLabel: { fontSize: 12, color: '#D0D0D0', fontWeight: '600' },
  checklistLabelDone: { color: C.success },
  bottomAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bottomAmountLabel: { fontSize: 13, color: C.t2, fontWeight: '500' },
  bottomAmount: { fontSize: 26, fontWeight: '800', color: C.accent },
  payBtn: { backgroundColor: C.brand, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.brand, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6, bottom: 12 },
  payBtnLoading: { backgroundColor: C.brandBorder, shadowOpacity: 0 },
  payBtnIncomplete: { backgroundColor: C.brandBorder, shadowOpacity: 0.1 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  termsText: { fontSize: 11, color: C.t3, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});

export default OrderScreen;