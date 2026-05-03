import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
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


const { width } = Dimensions.get('window');

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = ['Details', 'Delivery', 'Payment'];
  return (
    <View style={styles.stepBar}>
      {steps.map((label, i) => {
        const done = currentStep > i + 1;
        const active = currentStep === i + 1;
        return (
          <React.Fragment key={i}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, done && styles.stepDone, active && styles.stepActive]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, (active || done) && styles.stepLabelActive]}>{label}</Text>
            </View>
            {i < 2 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── Section Card Header ──────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, filled, required, pulseAnim, action }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={[styles.sectionIconWrap, filled && styles.sectionIconFilled]}>
      <Ionicons name={icon} size={17} color={filled ? '#fff' : '#2E7D32'} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {filled ? (
      <View style={styles.doneBadge}>
        <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
        <Text style={styles.doneBadgeText}>Done</Text>
      </View>
    ) : required ? (
      <Animated.View style={[styles.reqBadge, pulseAnim && { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.reqBadgeText}>REQUIRED</Text>
      </Animated.View>
    ) : null}
    {action && (
      <TouchableOpacity style={styles.sectionAction} onPress={action.onPress}>
        <Ionicons name={action.icon} size={13} color="#2E7D32" />
        <Text style={styles.sectionActionText}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const { cartItems, cartTotal, clearCart, refreshCart, loading: cartLoading } = useCart();
  const { user, token } = useAuth();
  const { package: packageInfo } = route.params || {};
  const { popup } = usePaystack();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryDay, setDeliveryDay] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentEmailError, setPaymentEmailError] = useState('');
  const [currentStep] = useState(1);
  const [newAddress, setNewAddress] = useState({
    address: '',
    city: '',
    region: '',
    nearestLandmark: '',
    phone: user?.phone || '',
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse for required badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();

    loadUserAddresses();
    const today = new Date().getDay();
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    setDeliveryDay(days[(today + 1) % 7]);
    setDeliveryTime('afternoon');
    refreshCart();
  }, []);

  const total = cartTotal;

  const deliveryDays = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ];

  const deliveryTimes = [
    { id: 'morning', label: 'Morning', sub: '8AM – 12PM', icon: 'sunny-outline' },
    { id: 'afternoon', label: 'Afternoon', sub: '12PM – 4PM', icon: 'partly-sunny-outline' },
    { id: 'evening', label: 'Evening', sub: '4PM – 8PM', icon: 'moon-outline' },
  ];

  const loadUserAddresses = async () => {
    try {
      if (user?.addresses?.length > 0) {
        setAddresses(user.addresses);
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddress(def);
      }
    } catch (err) {
      console.log(err);
    }
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

  const prepareOrderItems = () =>
    cartItems.map(item => ({
      productId: item.product?._id || item.productId || item.id,
      name: item.product?.name || item.name,
      quantity: item.quantity || 1,
      unit: item.product?.unit || 'piece',
      price: item.product?.price || item.price,
      product: item.product?._id || item.productId || item.id,
    }));

  const prepareOrderData = () => ({
    orderItems: prepareOrderItems(),
    shippingAddress: {
      address: selectedAddress.address,
      city: selectedAddress.city,
      region: selectedAddress.region || '',
      nearestLandmark: selectedAddress.nearestLandmark || '',
      phone: selectedAddress.phone || user?.phone,
    },
    deliverySchedule: { preferredDay: deliveryDay, preferredTime: deliveryTime },
    deliveryNote: deliveryNote.trim(),
    paymentMethod: 'paystack',
    ...(packageInfo && {
      package: {
        id: packageInfo.id || packageInfo._id,
        name: packageInfo.name,
        basePrice: packageInfo.price,
        valuePrice: packageInfo.originalPrice || null,
      },
    }),
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
    if (!deliveryDay || !deliveryTime) {
      Alert.alert('Schedule Required', 'Please choose delivery day and time.');
      return false;
    }
    if (!paymentEmail.trim()) {
      setPaymentEmailError('Email is required for payment');
      return false;
    }
    if (!validateEmail(paymentEmail)) {
      setPaymentEmailError('Please enter a valid email address');
      return false;
    }
    const outOfStock = cartItems.filter(item => {
      const stock = item.product?.countInStock ?? item.product?.stock ?? 0;
      return stock < (item.quantity || 1);
    });
    if (outOfStock.length > 0) {
      Alert.alert(
        'Stock Issue',
        `Not enough stock for: ${outOfStock.map(i => i.product?.name || i.name).join(', ')}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]
      );
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;
    setPlacingOrder(true);
    try {
      const authToken = token || (await AsyncStorage.getItem('@freshyfood_token'));
      if (!authToken) {
        Alert.alert('Login Required', 'Please sign in to continue.');
        navigation.navigate('Login');
        return;
      }
      /*const paymentResult = await triggerPayment({
        //popup,
        navigation:navigation,
        email: paymentEmail.trim(),
        phone: user?.phone || selectedAddress?.phone,
        amount: total,
        //authToken,
      });
      if (!paymentResult?.success) { setPlacingOrder(false); return; }
     */
      const orderData = prepareOrderData();
      const res = await order(orderData, authToken);
      if (res.status === 200) {
        clearCart();
        Alert.alert(
          'Order Confirmed! 🎉',
          `Order #${res.data.data.orderNumber || res.data.data._id} placed successfully.`,
          [
            { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { orderId: res.data.data.id }) },
            { text: 'Continue Shopping', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
          ]
        );
      } else {
        Alert.alert('Order Failed', res.data?.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setPlacingOrder(false);
      if (err.response) {
        if (err.response.status === 400 && err.response.data.outOfStockItems) {
          const names = err.response.data.outOfStockItems.map(i => i.name).join(', ');
          Alert.alert('Stock Error', `Out of stock: ${names}`, [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]);
        } else if (err.response.status === 401) {
          Alert.alert('Session Expired', 'Please sign in again.');
          navigation.navigate('Login');
        } else {
          Alert.alert('Error', err.response.data?.message || 'Failed to process order.');
        }
      } else {
        Alert.alert('Network Error', 'Please check your connection and try again.');
      }
    }
  };

  const emailValid = paymentEmail && validateEmail(paymentEmail);
  const readyToPay = selectedAddress && emailValid;

  // ── LOADING ──
  if (cartLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIconWrap}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
        <Text style={styles.loadingTitle}>Preparing Checkout</Text>
        <Text style={styles.loadingSub}>Getting everything ready for you…</Text>
      </View>
    );
  }

  // ── EMPTY CART ──
  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F7F4" />
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.navPageTitle}>Checkout</Text>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyScreen}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="cart-outline" size={40} color="#A5D6A7" />
          </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F4" />

      {/* ════════════════════════════
          FLOATING NAV
          ════════════════════════════ */}
      <SafeAreaView edges={['top']}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.navCenterGroup}>
            <Text style={styles.navPageTitle}>Checkout</Text>
            <View style={styles.navSecurePill}>
              <Ionicons name="shield-checkmark" size={11} color="#2E7D32" />
              <Text style={styles.navSecureText}>Secure</Text>
            </View>
          </View>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Checkout</Text>
            <Text style={styles.pageSubtitle}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · GH₵ {total.toFixed(2)}
            </Text>
          </View>

          {/* ════════════════════════════
              § 1 — DELIVERY ADDRESS
              ════════════════════════════ */}
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
                <Ionicons name="home-outline" size={30} color="#C8E6C9" />
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
                  label="City"
                  required
                  placeholder="e.g. Accra"
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
                    {selectedAddress === addr && (
                      <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.addAddrBtn, !selectedAddress && styles.addAddrBtnFilled]}
                  onPress={() => setShowAddAddress(true)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={19}
                    color={!selectedAddress ? '#fff' : '#2E7D32'}
                  />
                  <Text style={[styles.addAddrText, !selectedAddress && { color: '#fff' }]}>
                    Add New Address
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ════════════════════════════
              § 2 — PAYMENT EMAIL
              ════════════════════════════ */}
          <View style={[styles.card, !emailValid && styles.cardRequired]}>
            <SectionHeader
              icon="mail"
              title="Payment Email"
              filled={emailValid}
              required
              pulseAnim={pulseAnim}
            />

            {/* Info banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={15} color="#1565C0" />
              <Text style={styles.infoBannerText}>
                Your receipt and order confirmation will be sent here
              </Text>
            </View>

            <View style={[
              styles.emailFieldWrap,
              paymentEmailError ? styles.emailFieldError :
              emailValid ? styles.emailFieldSuccess : null
            ]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={paymentEmailError ? '#D32F2F' : emailValid ? '#2E7D32' : '#9E9E9E'}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.emailField}
                placeholder="yourname@example.com"
                placeholderTextColor="#BDBDBD"
                value={paymentEmail}
                onChangeText={t => {
                  setPaymentEmail(t.trim());
                  if (paymentEmailError && validateEmail(t.trim())) setPaymentEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailValid && (
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              )}
            </View>
            {paymentEmailError ? (
              <View style={styles.fieldMsg}>
                <Ionicons name="close-circle" size={14} color="#D32F2F" />
                <Text style={styles.fieldMsgError}>{paymentEmailError}</Text>
              </View>
            ) : emailValid ? (
              <View style={styles.fieldMsg}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={styles.fieldMsgSuccess}>Looks good!</Text>
              </View>
            ) : null}
          </View>

          {/* ════════════════════════════
              § 3 — ORDER SUMMARY
              ════════════════════════════ */}
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
                return (
                  <View
                    key={i}
                    style={[styles.itemRow, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Image
                      source={{ uri: p.image || 'https://via.placeholder.com/64' }}
                      style={styles.itemThumb}
                    />
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={2}>{p.name}</Text>
                      <Text style={styles.itemMeta}>{qty} × GH₵{p.price?.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.itemTotal}>GH₵{lineTotal}</Text>
                  </View>
                );
              })}
            </View>

            {/* Totals */}
            <View style={styles.totalsBlock}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                </Text>
                <Text style={styles.totalsValue}>GH₵ {cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <View style={styles.deliveryLabelWrap}>
                  <Ionicons name="bicycle-outline" size={14} color="#F57F17" />
                  <Text style={[styles.totalsLabel, { color: '#F57F17' }]}>Delivery fee</Text>
                </View>
                <Text style={[styles.totalsValue, { color: '#F57F17' }]}>GH₵ 20–80</Text>
              </View>
              <View style={styles.deliveryNote}>
                <Ionicons name="information-circle-outline" size={13} color="#F57F17" />
                <Text style={styles.deliveryNoteText}>
                  Delivery fee is paid separately to the rider on delivery — not included in your total.
                </Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Total to pay now</Text>
                <Text style={styles.grandAmount}>GH₵ {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ════════════════════════════
              § 4 — DELIVERY SCHEDULE
              ════════════════════════════ */}
          <View style={styles.card}>
            <SectionHeader
              icon="calendar-outline"
              title="Delivery Schedule"
              filled={!!(deliveryDay && deliveryTime)}
            />

            <Text style={styles.fieldGroupLabel}>Preferred Day</Text>
            <View style={styles.dayGrid}>
              {deliveryDays.map(day => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayChip, deliveryDay === day.id && styles.dayChipActive]}
                  onPress={() => setDeliveryDay(day.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dayChipText, deliveryDay === day.id && styles.dayChipTextActive]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldGroupLabel, { marginTop: 4 }]}>Preferred Time</Text>
            <View style={styles.timeGrid}>
              {deliveryTimes.map(time => {
                const active = deliveryTime === time.id;
                return (
                  <TouchableOpacity
                    key={time.id}
                    style={[styles.timeCard, active && styles.timeCardActive]}
                    onPress={() => setDeliveryTime(time.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.timeIcon, active && styles.timeIconActive]}>
                      <Ionicons name={time.icon} size={20} color={active ? '#fff' : '#9E9E9E'} />
                    </View>
                    <Text style={[styles.timeLabel, active && styles.timeLabelActive]}>{time.label}</Text>
                    <Text style={[styles.timeSub, active && styles.timeSubActive]}>{time.sub}</Text>
                    {active && (
                      <View style={styles.timeCheck}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldGroupLabel, { marginTop: 16 }]}>Delivery Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Call when you arrive, leave at the gate…"
              placeholderTextColor="#BDBDBD"
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 220 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ════════════════════════════
          FIXED BOTTOM BAR
          ════════════════════════════ */}
      <View style={styles.bottomBar}>
        {/* Mini checklist */}
        <View style={styles.checklist}>
          {[
            { label: 'Address', done: !!selectedAddress },
            { label: 'Email', done: !!emailValid },
            { label: 'Schedule', done: !!(deliveryDay && deliveryTime) },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.checklistSep} />}
              <View style={styles.checklistItem}>
                <Ionicons
                  name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={item.done ? '#4CAF50' : '#D0D0D0'}
                />
                <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>
                  {item.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Amount row */}
        <View style={styles.bottomAmountRow}>
          <View>
            <Text style={styles.bottomAmountLabel}>Total to pay now</Text>
            <Text style={styles.bottomDeliveryNote}>🚴 Delivery fee paid to rider</Text>
          </View>
          <Text style={styles.bottomAmount}>GH₵ {total.toFixed(2)}</Text>
        </View>

        {/* Pay button */}
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
            <>
             
              <Text style={styles.payBtnText}>
                Pay Securely · GH₵ {total.toFixed(2)}
              </Text>
             
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          🔒 Secured by Paystack · Continuing means you agree to our Terms
        </Text>
      </View>
    </View>
  );
};

// ─── Reusable InputField ──────────────────────────────────────────────────────
const InputField = ({ label, required, placeholder, value, onChangeText, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {label}{required ? <Text style={styles.asterisk}> *</Text> : ''}
    </Text>
    <TextInput
      style={styles.inputField}
      placeholder={placeholder}
      placeholderTextColor="#BDBDBD"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F4' },

  // ── LOADING ──
  loadingScreen: {
    flex: 1, backgroundColor: '#F4F7F4',
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
  loadingSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center' },

  // ── EMPTY CART ──
  emptyScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', marginBottom: 28, textAlign: 'center' },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2E7D32', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── FLOATING NAV ──
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
  navCenterGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navPageTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.1 },
  navSecurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  navSecureText: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },

  // ── PAGE HEADER ──
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 30, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 3, fontWeight: '500' },

  // ── STEP BAR ──
  stepBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EEF2EE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  stepItem: { alignItems: 'center' },
  stepLine: { width: 44, height: 2, backgroundColor: '#E8E8E8', marginHorizontal: 6, marginBottom: 20, borderRadius: 1 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 5,
  },
  stepActive: { backgroundColor: '#2E7D32', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  stepDone: { backgroundColor: '#4CAF50' },
  stepNum: { color: '#9E9E9E', fontWeight: '700', fontSize: 13 },
  stepLabel: { fontSize: 11, color: '#BDBDBD', fontWeight: '500' },
  stepLabelActive: { color: '#1B5E20', fontWeight: '700' },

  // ── CALLOUT ──
  callout: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3, borderLeftColor: '#E65100',
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 12, padding: 14, gap: 10,
  },
  calloutIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFE0CC',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: '#BF360C', marginBottom: 3 },
  calloutBody: { fontSize: 12, color: '#E65100', lineHeight: 18 },

  scroll: { paddingTop: 10, paddingBottom: 20 },

  // ── CARDS ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 7,
    borderRadius: 18, padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardRequired: {
    borderWidth: 1.5, borderColor: '#FFB74D',
  },

  // ── SECTION HEADER ──
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 18,
  },
  sectionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  sectionIconFilled: { backgroundColor: '#2E7D32' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1B5E20', flex: 1 },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  doneBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  reqBadge: {
    backgroundColor: '#D32F2F', borderRadius: 7,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  reqBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sectionAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F8E9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  sectionActionText: { color: '#2E7D32', fontWeight: '600', fontSize: 12 },

  // ── ADDRESS ──
  nudgeBox: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: '#FAFAFA', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E8E8E8', borderStyle: 'dashed',
    marginBottom: 16, gap: 6,
  },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: '#757575' },
  nudgeSub: { fontSize: 12, color: '#BDBDBD' },

  addrCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#EEEEEE',
    marginBottom: 10, backgroundColor: '#FAFAFA', gap: 12,
  },
  addrCardSelected: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D0D0D0',
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#2E7D32' },
  radioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' },
  addrBody: { flex: 1 },
  addrMain: { fontSize: 14, fontWeight: '600', color: '#212121' },
  addrSub: { fontSize: 12, color: '#9E9E9E', marginTop: 3 },
  addAddrBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12,
    borderWidth: 2, borderColor: '#4CAF50', borderStyle: 'dashed',
    marginTop: 4, gap: 8,
  },
  addAddrBtnFilled: { backgroundColor: '#2E7D32', borderStyle: 'solid' },
  addAddrText: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },

  // ── FORM ──
  formWrap: { marginTop: 4 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 7 },
  asterisk: { color: '#D32F2F' },
  inputField: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, borderWidth: 1.5, borderColor: '#E8E8E8', color: '#212121',
  },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#F5F5F5', alignItems: 'center',
  },
  btnSecondaryText: { color: '#616161', fontWeight: '600', fontSize: 14 },
  btnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#2E7D32', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── EMAIL ──
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E3F2FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  infoBannerText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 16 },
  emailFieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#E8E8E8',
  },
  emailFieldError: { borderColor: '#D32F2F', backgroundColor: '#FFF5F5' },
  emailFieldSuccess: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  emailField: { flex: 1, fontSize: 15, color: '#212121', letterSpacing: 0.2 },
  fieldMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  fieldMsgError: { color: '#D32F2F', fontSize: 12, fontWeight: '500' },
  fieldMsgSuccess: { color: '#2E7D32', fontSize: 12, fontWeight: '600' },

  // ── ORDER ITEMS ──
  itemsList: { marginBottom: 4 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  itemThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F5F5F5' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#9E9E9E' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  // ── TOTALS ──
  totalsBlock: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  totalsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  totalsLabel: { fontSize: 13, color: '#757575', fontWeight: '500' },
  totalsValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  deliveryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deliveryNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFF8E1', borderRadius: 10,
    padding: 10, marginBottom: 4,
  },
  deliveryNoteText: { flex: 1, fontSize: 12, color: '#F57F17', lineHeight: 17 },
  totalsDivider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 12 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: 15, fontWeight: '700', color: '#1B5E20' },
  grandAmount: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },

  // ── SCHEDULE ──
  fieldGroupLabel: {
    fontSize: 13, fontWeight: '700', color: '#424242',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  dayChip: {
    flex: 1, minWidth: '12%', paddingVertical: 11,
    borderRadius: 10, backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E8E8E8', alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: '#E8F5E9', borderColor: '#2E7D32',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  dayChipText: { fontSize: 12, color: '#757575', fontWeight: '600' },
  dayChipTextActive: { color: '#1B5E20', fontWeight: '800' },

  timeGrid: { flexDirection: 'row', gap: 8 },
  timeCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 14, backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E8E8E8', position: 'relative',
  },
  timeCardActive: {
    backgroundColor: '#E8F5E9', borderColor: '#2E7D32',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  timeIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  timeIconActive: { backgroundColor: '#2E7D32' },
  timeLabel: { fontSize: 12, color: '#757575', fontWeight: '700', marginBottom: 2 },
  timeLabelActive: { color: '#1B5E20' },
  timeSub: { fontSize: 10, color: '#BDBDBD', textAlign: 'center', lineHeight: 14 },
  timeSubActive: { color: '#4CAF50' },
  timeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },

  noteInput: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, borderWidth: 1.5, borderColor: '#E8E8E8',
    color: '#212121', minHeight: 80, textAlignVertical: 'top',
  },

  // ── BOTTOM BAR ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1, borderTopColor: '#EEF2EE',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 18,
  },
  checklist: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checklistSep: { width: 24, height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 6 },
  checklistLabel: { fontSize: 12, color: '#D0D0D0', fontWeight: '600' },
  checklistLabelDone: { color: '#4CAF50' },

  bottomAmountRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  bottomAmountLabel: { fontSize: 13, color: '#757575', fontWeight: '500' },
  bottomDeliveryNote: { fontSize: 11, color: '#F57F17', marginTop: 2, fontWeight: '500' },
  bottomAmount: { fontSize: 26, fontWeight: '800', color: '#1B5E20' },

  payBtn: {
    backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  payBtnLoading: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  payBtnIncomplete: { backgroundColor: '#81C784', shadowOpacity: 0.1 },
  payBtnIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },

  termsText: {
    fontSize: 11, color: '#BDBDBD', textAlign: 'center', marginTop: 10, lineHeight: 16,
  },
});

export default OrderScreen;