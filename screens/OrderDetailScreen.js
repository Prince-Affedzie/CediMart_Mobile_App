// src/screens/OrderDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById, cancelOrder } from '../apis/orderApi';

// ─── Teal + Coral Palette (same as checkout) ─────────────────────────────────
const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  elev:         '#F1F5F9',
  line:         '#E2E8F0',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
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

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  Pending:            { color: C.accent,  icon: 'time',              hint: "We've received your order and it's awaiting confirmation." },
  Processing:         { color: C.info,    icon: 'sync',              hint: 'Your order is confirmed and being prepared.' },
  'Out for Delivery': { color: C.brand,   icon: 'bicycle',           hint: 'Your order is on its way to you.' },
  Delivered:          { color: C.success, icon: 'checkmark-circle',  hint: 'Your order has been delivered. Enjoy!' },
  Cancelled:          { color: C.danger,  icon: 'close-circle',      hint: 'This order was cancelled.' },
};

const STEPS = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];

const TIME_LABELS = {
  morning:   'Morning · 8AM – 12PM',
  afternoon: 'Afternoon · 12PM – 4PM',
  evening:   'Evening · 4PM – 8PM',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getProductImage = (item) => {
  if (item?.images?.length > 0) return item.images[0];
  if (item?.image) return item.image;
  if (item?.product?.images?.length > 0) return item.product.images[0];
  if (item?.product?.image) return item.product.image;
  return 'https://via.placeholder.com/64';
};

const money = (v) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? '—' : Number(v).toFixed(2));
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Collapsible Section ──────────────────────────────────────────────────────
const Section = ({ icon, title, expanded, onToggle, children }) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.75}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={17} color={C.brand} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.t3} />
    </TouchableOpacity>
    {expanded && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor, last }) => (
  <View style={[styles.infoRow, last && { marginBottom: 0 }]}>
    <View style={styles.infoRowIcon}>
      <Ionicons name={icon} size={15} color={C.t2} />
    </View>
    <View style={styles.infoRowBody}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={[styles.infoRowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

// ─── Delivery estimate helpers ────────────────────────────────────────────────
const DAY_IDS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const fmtShortDate = (d) => d.toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short' });

// How far along the route the vehicle sits for each status (0 = dispatch, 1 = your door)
const ROUTE_PROGRESS = { Pending: 0.04, Processing: 0.32, 'Out for Delivery': 0.68, Delivered: 1 };

const ROUTE_CAPTION = {
  Pending: 'Waiting to be confirmed',
  Processing: 'Being prepared for dispatch',
  'Out for Delivery': 'Heading to your address',
};

// Estimated window = 1–3 days after the order was placed.
const getDeliveryEstimate = (order, status) => {
  if (status === 'Out for Delivery') {
    return { headline: 'Arriving today', sub: 'Your order is on its way', late: false };
  }
  const placed = order.createdAt ? new Date(order.createdAt) : new Date();
  const today = startOfDay(new Date());
  const earliest = addDays(startOfDay(placed), 1);
  const latest = addDays(startOfDay(placed), 3);

  if (latest < today) {
    return {
      headline: 'Taking longer than expected',
      sub: 'Your order is past its estimated window. Contact support for an update.',
      late: true,
    };
  }

  const start = earliest < today ? today : earliest;
  const headline = sameDay(start, latest)
    ? fmtShortDate(latest)
    : `${fmtShortDate(start)} – ${fmtShortDate(latest)}`;

  // Does the customer's preferred weekday fall inside the window?
  let preferredDate = null;
  const pref = order.deliverySchedule?.preferredDay;
  for (let d = new Date(start); d <= latest; d = addDays(d, 1)) {
    if (DAY_IDS[d.getDay()] === pref) { preferredDate = new Date(d); break; }
  }

  return { headline, sub: 'Usually 1–3 days after you order', late: false, preferredDate };
};

// ─── Route visual: dispatch point → vehicle → delivery address ───────────────
const RouteTracker = ({ progress, originLabel, destLabel }) => {
  const pos = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pos, {
      toValue: progress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating `left` (layout) so it can't use the native driver
    }).start();
  }, [progress]);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const left = pos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const DASHES = 20;

  return (
    <View style={styles.rtMap}>
      {/* faint street grid so it reads as a map */}
      {[0.28, 0.5, 0.72].map((p) => <View key={`h${p}`} style={[styles.rtGridH, { top: `${p * 100}%` }]} />)}
      {[0.2, 0.4, 0.6, 0.8].map((p) => <View key={`v${p}`} style={[styles.rtGridV, { left: `${p * 100}%` }]} />)}

      <View style={styles.rtRow}>
        {/* origin */}
        <View style={styles.rtNodeCol}>
          <View style={[styles.rtNode, { borderColor: C.brandBorder }]}>
            <Ionicons name="storefront" size={19} color={C.brand} />
          </View>
          <Text style={styles.rtNodeLabel} numberOfLines={1}>{originLabel}</Text>
        </View>

        {/* track */}
        <View style={styles.rtTrack}>
          <View style={styles.rtDashRow}>
            {Array.from({ length: DASHES }).map((_, i) => (
              <View key={i} style={[styles.rtDash, i / DASHES < progress && { backgroundColor: C.brand }]} />
            ))}
          </View>
          <Animated.View style={[styles.rtVehicleWrap, { left }]}>
            <Animated.View style={[styles.rtPulse, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <View style={styles.rtVehicle}>
              <Ionicons name="bicycle" size={20} color="#fff" />
            </View>
          </Animated.View>
        </View>

        {/* destination */}
        <View style={styles.rtNodeCol}>
          <View style={[styles.rtNode, { borderColor: C.accentBorder, backgroundColor: C.accentBg }]}>
            <Ionicons name="home" size={19} color={C.accent} />
          </View>
          <Text style={styles.rtNodeLabel} numberOfLines={1}>{destLabel}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Estimated delivery + route card ─────────────────────────────────────────
const DeliveryTracker = ({ order, status, timeLabel }) => {
  const est = getDeliveryEstimate(order, status);
  const progress = ROUTE_PROGRESS[status] ?? 0;
  const tone = est.late ? C.danger : C.brand;

  return (
    <View style={styles.trackerCard}>
      <View style={styles.trackerHead}>
        <View style={[styles.trackerIconWrap, est.late && { backgroundColor: C.dangerBg }]}>
          <Ionicons name={est.late ? 'alert-circle-outline' : 'calendar-outline'} size={20} color={tone} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.trackerEyebrow}>ESTIMATED DELIVERY</Text>
          <Text style={[styles.trackerHeadline, est.late && { color: C.danger, fontSize: 16 }]}>{est.headline}</Text>
          <Text style={styles.trackerSub}>{est.sub}</Text>
        </View>
        {!est.late && status !== 'Out for Delivery' && (
          <View style={styles.trackerBadge}>
            <Text style={styles.trackerBadgeText}>1–3 days</Text>
          </View>
        )}
      </View>

      {est.preferredDate && (
        <View style={styles.trackerPref}>
          <Ionicons name="checkmark-circle" size={15} color={C.success} />
          <Text style={styles.trackerPrefText}>
            Aiming for your preferred slot: {fmtShortDate(est.preferredDate)}{timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
        </View>
      )}

      <RouteTracker
        progress={progress}
        originLabel="Dispatch"
        destLabel={order.shippingAddress?.city || 'You'}
      />

      <View style={styles.trackerFoot}>
        <View style={[styles.trackerDot, { backgroundColor: tone }]} />
        <Text style={styles.trackerCaption}>{ROUTE_CAPTION[status] || ''}</Text>
      </View>
      <Text style={styles.trackerNote}>Illustration of order progress · live GPS tracking coming soon</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const { user, token, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({ items: true, delivery: true, payment: true, summary: true, timeline: false });
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [bottomBarHeight, setBottomBarHeight] = useState(96);

  const cancellationReasons = [
    { id: 'changed_mind',    label: 'Changed my mind',         icon: 'heart-dislike-outline' },
    { id: 'found_cheaper',   label: 'Found cheaper elsewhere', icon: 'pricetag-outline' },
    { id: 'delivery_time',   label: 'Delivery too slow',       icon: 'time-outline' },
    { id: 'ordered_mistake', label: 'Ordered by mistake',      icon: 'alert-circle-outline' },
    { id: 'payment_issues',  label: 'Payment issues',          icon: 'card-outline' },
    { id: 'other',           label: 'Other reason',            icon: 'chatbubble-outline' },
  ];

  useEffect(() => {
    if (isAuthenticated) fetchOrder();
    else navigation.navigate('Login');
  }, [orderId, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(orderId);
      if (res.status === 200 && res.data?.data) {
        setOrder(res.data.data);
      } else {
        Alert.alert('Error', res.message || 'Could not load order');
        navigation.goBack();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load order. Check connection.');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchOrder(); };

  const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleString('en-GH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleContactSupport = () => Linking.openURL('tel:+233505671577');

  const handleTrackOrder = () => Alert.alert(
    'Track Order',
    'Real-time tracking will be available soon! You will be notified when your order is out for delivery.',
    [{ text: 'OK' }]
  );

  const handleReorder = () => Alert.alert(
    'Reorder',
    'Add all items from this order to your cart?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reorder', onPress: () => Alert.alert('Coming Soon', 'Reorder feature will be available soon!') },
    ]
  );

  const handleCancelOrder = () => {
    if (!order) return;
    if (!['Pending', 'Processing'].includes(order.status?.current)) {
      Alert.alert('Cannot Cancel', `Orders with status "${order.status?.current}" cannot be cancelled.`);
      return;
    }
    if (order.payment?.isPaid) {
      Alert.alert('Paid Order', 'This order has already been paid. Please contact support for assistance.');
      return;
    }
    setCancelReason('');
    setCustomReason('');
    setCancelModalVisible(true);
  };

  const submitCancellation = async () => {
    let finalReason = '';
    if (cancelReason === 'other') {
      if (!customReason.trim()) { Alert.alert('Error', 'Please enter your reason for cancellation'); return; }
      finalReason = customReason.trim();
    } else {
      const sel = cancellationReasons.find(r => r.id === cancelReason);
      if (!sel) { Alert.alert('Error', 'Please select a reason for cancellation'); return; }
      finalReason = sel.label;
    }
    setCancelling(true);
    try {
      const res = await cancelOrder(orderId, { reason: finalReason });
      if (res.status === 200 && res.data?.success) {
        Alert.alert('Order Cancelled', 'Your order has been successfully cancelled.', [{
          text: 'OK', onPress: () => { setCancelModalVisible(false); fetchOrder(); }
        }]);
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to cancel order');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Top nav (plain render fn, so it doesn't remount on every state change) ──
  const renderNav = () => (
    <SafeAreaView edges={['top']} style={{ zIndex: 10, backgroundColor: C.bg }}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.t1} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order Details</Text>
        <TouchableOpacity style={styles.navBtn} onPress={onRefresh} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={20} color={C.t1} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {renderNav()}
        <View style={styles.centered}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color={C.brand} />
          </View>
          <Text style={styles.loadingTitle}>Loading order</Text>
          <Text style={styles.loadingSub}>Fetching your order details…</Text>
        </View>
      </View>
    );
  }

  // ── NOT FOUND ────────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {renderNav()}
        <View style={styles.centered}>
          <View style={[styles.loadingIconWrap, { backgroundColor: C.dangerBg }]}>
            <Ionicons name="alert-circle-outline" size={36} color={C.danger} />
          </View>
          <Text style={styles.loadingTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const status = order.status?.current || 'Pending';
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const isPaid = !!order.payment?.isPaid;
  const isCash = String(order.payment?.method || '').toLowerCase().includes('cash');
  const canCancel = ['Pending', 'Processing'].includes(status) && !isPaid;
  const stepIdx = STEPS.indexOf(status);
  const orderNumber = order.orderNumber || order._id?.slice(-8).toUpperCase();
  const heroBg = status === 'Cancelled' ? C.danger : status === 'Delivered' ? C.brandD : C.brand;
  const itemCount = order.orderItems?.length || 0;

  const showCodBanner = isCash && !isPaid && !['Cancelled', 'Delivered'].includes(status);
  const showPayNow = !isPaid && !isCash && !canCancel && !['Cancelled', 'Delivered'].includes(status);

  const paymentLabel = isPaid ? 'Paid' : isCash ? 'Pay on delivery' : 'Pending';
  const paymentColor = isPaid ? C.success : C.accent;
  const paymentMethodLabel = isCash ? 'Pay on Delivery (Cash)' : (order.payment?.method ? cap(String(order.payment.method)) : 'Paystack');

  const preferredDay = cap(order.deliverySchedule?.preferredDay || '');
  const preferredTime = TIME_LABELS[order.deliverySchedule?.preferredTime] || cap(order.deliverySchedule?.preferredTime || '') || '—';

  // Primary action for the bottom bar
  let primary = null;
  if (status === 'Out for Delivery') primary = { label: 'Track Order', icon: 'navigate-outline', onPress: handleTrackOrder, color: C.brand };
  else if (status === 'Delivered')   primary = { label: 'Reorder', icon: 'refresh-outline', onPress: handleReorder, color: C.accent };
  else if (showPayNow)               primary = { label: 'Pay Now', icon: 'card-outline', onPress: () => Alert.alert('Pay Now', 'Redirecting to payment…'), color: C.brand };

  const timeline = status === 'Cancelled'
    ? [
        { label: 'Order Placed', sub: formatDate(order.createdAt), state: 'done' },
        { label: 'Order Cancelled', sub: order.cancelledAt ? formatDate(order.cancelledAt) : null, state: 'cancelled' },
      ]
    : [
        { label: 'Order Placed', sub: formatDate(order.createdAt), state: 'done' },
        { label: 'Order Confirmed', sub: 'Processing started', state: ['Processing', 'Out for Delivery', 'Delivered'].includes(status) ? 'done' : 'todo' },
        { label: 'Out for Delivery', sub: 'Your order is on the way', state: ['Out for Delivery', 'Delivered'].includes(status) ? 'done' : 'todo' },
        { label: 'Delivered', sub: formatDate(order.deliveredAt), state: status === 'Delivered' ? 'done' : 'todo' },
      ];

  const cancelDisabled = !cancelReason || (cancelReason === 'other' && !customReason.trim()) || cancelling;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Cancellation Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => !cancelling && setCancelModalVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHead}>
            <View style={styles.modalHeadLeft}>
              <View style={[styles.modalHeadIcon, { backgroundColor: C.dangerBg }]}>
                <Ionicons name="close-circle-outline" size={20} color={C.danger} />
              </View>
              <Text style={styles.modalTitle}>Cancel Order</Text>
            </View>
            <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={C.t2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalOrderStrip}>
              <Text style={styles.modalOrderNum}>Order #{orderNumber}</Text>
              <Text style={styles.modalOrderTotal}>GH₵ {money(order.pricing?.totalPrice)}</Text>
            </View>

            <Text style={styles.modalSubtitle}>Why are you cancelling this order?</Text>

            <View style={styles.reasonGrid}>
              {cancellationReasons.map(r => {
                const active = cancelReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.reasonCard, active && styles.reasonCardActive]}
                    onPress={() => { setCancelReason(r.id); if (r.id !== 'other') setCustomReason(''); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.reasonIconBg, active && styles.reasonIconBgActive]}>
                      <Ionicons name={r.icon} size={20} color={active ? C.brand : C.t3} />
                    </View>
                    <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]} numberOfLines={2}>
                      {r.label}
                    </Text>
                    {active && (
                      <View style={styles.reasonCheck}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {cancelReason === 'other' && (
              <View style={styles.customReasonWrap}>
                <Text style={styles.customReasonLabel}>Please describe your reason</Text>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Enter your reason here…"
                  placeholderTextColor={C.t3}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
            )}

            <View style={styles.policyBanner}>
              <Ionicons name="information-circle-outline" size={16} color={C.info} />
              <Text style={styles.policyText}>
                Cancelling will void any pending payments and return items to stock.
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 14 }]}>
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={() => setCancelModalVisible(false)}
              disabled={cancelling}
            >
              <Text style={styles.keepBtnText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmCancelBtn, cancelDisabled && styles.confirmCancelBtnDisabled]}
              onPress={submitCancellation}
              disabled={cancelDisabled}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={16} color="#fff" />
                  <Text style={styles.confirmCancelBtnText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderNav()}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} colors={[C.brand]} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── STATUS HERO ── */}
        <View style={[styles.hero, { backgroundColor: heroBg }]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>ORDER</Text>
              <Text style={styles.heroOrderNum}>#{orderNumber}</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name={meta.icon} size={14} color={heroBg} />
              <Text style={[styles.heroPillText, { color: heroBg }]}>{status}</Text>
            </View>
          </View>

          <Text style={styles.heroHint}>{meta.hint}</Text>

          {status !== 'Cancelled' && (
            <View style={styles.progressRow}>
              {STEPS.map((s, i) => {
                const done = stepIdx > i;
                const active = stepIdx === i;
                return (
                  <React.Fragment key={s}>
                    <View style={styles.stepWrap}>
                      <View style={[styles.stepBubble, (done || active) && styles.stepBubbleOn, active && styles.stepBubbleActive]}>
                        {done
                          ? <Ionicons name="checkmark" size={13} color={heroBg} />
                          : <View style={[styles.stepInnerDot, active && { backgroundColor: heroBg }]} />}
                      </View>
                      <Text style={[styles.stepLabel, (done || active) && styles.stepLabelOn]} numberOfLines={1}>
                        {s === 'Out for Delivery' ? 'On the way' : s}
                      </Text>
                    </View>
                    {i < STEPS.length - 1 && <View style={[styles.stepConnector, done && styles.stepConnectorOn]} />}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Total</Text>
              <Text style={styles.heroStatValue}>GH₵ {money(order.pricing?.totalPrice)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Items</Text>
              <Text style={styles.heroStatValue}>{itemCount}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={[styles.heroStat, { flex: 1.4 }]}>
              <Text style={styles.heroStatLabel}>Placed</Text>
              <Text style={styles.heroStatValueSm} numberOfLines={1}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* ── CONTEXT BANNERS ── */}
        {showCodBanner && (
          <View style={styles.codBanner}>
            <View style={styles.codIcon}>
              <Ionicons name="cash-outline" size={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.codTitle}>Pay GH₵ {money(order.pricing?.totalPrice)} on delivery</Text>
              <Text style={styles.codSub}>Please have the exact amount in cash ready when your order arrives.</Text>
            </View>
          </View>
        )}

        {status === 'Out for Delivery' && (
          <TouchableOpacity style={styles.trackNudge} onPress={handleTrackOrder} activeOpacity={0.85}>
            <Ionicons name="location" size={16} color={C.brand} />
            <Text style={styles.trackNudgeText}>Tap to track your order in real-time</Text>
            <Ionicons name="chevron-forward" size={16} color={C.brand} />
          </TouchableOpacity>
        )}

        {status === 'Delivered' && (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={18} color={C.success} />
            <Text style={styles.deliveredBannerText}>Delivered on {formatDate(order.deliveredAt)}</Text>
          </View>
        )}

        {!['Delivered', 'Cancelled'].includes(status) && (
          <DeliveryTracker order={order} status={status} timeLabel={cap(order.deliverySchedule?.preferredTime || '')} />
        )}

        {/* ── ITEMS ── */}
        <Section icon="basket-outline" title={`Items (${itemCount})`} expanded={expanded.items} onToggle={() => toggle('items')}>
          {order.orderItems?.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx === itemCount - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Image source={{ uri: getProductImage(item) }} style={styles.itemThumb} />
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.quantity} × {item.unit || 'unit'} · GH₵ {money(item.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>GH₵ {(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
        </Section>

        {/* ── DELIVERY ── */}
        <Section icon="location-outline" title="Delivery" expanded={expanded.delivery} onToggle={() => toggle('delivery')}>
          <InfoRow icon="location-outline" label="Address" value={`${order.shippingAddress?.address}, ${order.shippingAddress?.city}`} />
          <InfoRow icon="call-outline" label="Phone" value={order.shippingAddress?.phone || user?.phone || '—'} />
          <InfoRow
            icon="calendar-outline"
            label="Scheduled"
            value={`${preferredDay || '—'} · ${preferredTime}`}
            last={!order.deliveryNote}
          />
          {order.deliveryNote ? (
            <InfoRow icon="document-text-outline" label="Note" value={order.deliveryNote} last />
          ) : null}
        </Section>

        {/* ── PAYMENT ── */}
        <Section icon="card-outline" title="Payment" expanded={expanded.payment} onToggle={() => toggle('payment')}>
          <InfoRow icon={isCash ? 'cash-outline' : 'card-outline'} label="Method" value={paymentMethodLabel} />
          <InfoRow
            icon={isPaid ? 'checkmark-circle-outline' : 'time-outline'}
            label="Status"
            value={paymentLabel}
            valueColor={paymentColor}
            last={!order.payment?.paidAt}
          />
          {order.payment?.paidAt ? (
            <InfoRow icon="calendar-outline" label="Paid on" value={formatDate(order.payment.paidAt)} last />
          ) : null}
        </Section>

        {/* ── PRICE SUMMARY ── */}
        <Section icon="receipt-outline" title="Price Summary" expanded={expanded.summary} onToggle={() => toggle('summary')}>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Items total</Text>
            <Text style={styles.priceLineValue}>GH₵ {money(order.pricing?.itemsPrice)}</Text>
          </View>
          <View style={styles.priceLine}>
            <View style={styles.priceLineLabelRow}>
              <Ionicons name="bicycle-outline" size={14} color={C.accent} />
              <Text style={[styles.priceLineLabel, { color: C.accent }]}>Delivery fee</Text>
            </View>
            <Text style={[styles.priceLineValue, { color: C.accent }]}>
              {order.pricing?.deliveryFee === 0 ? 'Free' : `GH₵ ${money(order.pricing?.deliveryFee)}`}
            </Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceGrandRow}>
            <Text style={styles.priceGrandLabel}>{isCash && !isPaid ? 'Amount due' : 'Grand Total'}</Text>
            <Text style={styles.priceGrandValue}>GH₵ {money(order.pricing?.totalPrice)}</Text>
          </View>
        </Section>

        {/* ── TIMELINE ── */}
        <Section icon="time-outline" title="Order Timeline" expanded={expanded.timeline} onToggle={() => toggle('timeline')}>
          {timeline.map((tl, i, arr) => {
            const isLast = i === arr.length - 1;
            const dotColor = tl.state === 'done' ? C.brand : tl.state === 'cancelled' ? C.danger : C.line;
            const nextDone = !isLast && arr[i + 1].state !== 'todo';
            return (
              <View key={i} style={styles.tlRow}>
                <View style={styles.tlLeft}>
                  <View style={[styles.tlDot, { backgroundColor: dotColor }]}>
                    {tl.state === 'done' && <Ionicons name="checkmark" size={11} color="#fff" />}
                    {tl.state === 'cancelled' && <Ionicons name="close" size={11} color="#fff" />}
                  </View>
                  {!isLast && <View style={[styles.tlLine, tl.state === 'done' && nextDone && { backgroundColor: C.brand }]} />}
                </View>
                <View style={[styles.tlContent, !isLast && { paddingBottom: 20 }]}>
                  <Text style={[styles.tlLabel, tl.state !== 'todo' && styles.tlLabelOn, tl.state === 'cancelled' && { color: C.danger }]}>
                    {tl.label}
                  </Text>
                  {tl.state !== 'todo' && tl.sub && tl.sub !== '—' ? <Text style={styles.tlSub}>{tl.sub}</Text> : null}
                </View>
              </View>
            );
          })}
        </Section>
      </ScrollView>

      {/* ── BOTTOM ACTION BAR ── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
        onLayout={(e) => setBottomBarHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          style={[styles.actionBtn, primary ? styles.actionBtnOutline : styles.actionBtnFilled]}
          onPress={handleContactSupport}
          activeOpacity={0.85}
        >
          <Ionicons name="headset-outline" size={17} color={primary ? C.brand : '#fff'} />
          <Text style={[styles.actionBtnText, { color: primary ? C.brand : '#fff' }]}>Support</Text>
        </TouchableOpacity>

        {canCancel && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDangerOutline]} onPress={handleCancelOrder} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={17} color={C.danger} />
            <Text style={[styles.actionBtnText, { color: C.danger }]}>Cancel</Text>
          </TouchableOpacity>
        )}

        {primary && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnFilled, { backgroundColor: primary.color, shadowColor: primary.color }]}
            onPress={primary.onPress}
            activeOpacity={0.85}
          >
            <Ionicons name={primary.icon} size={17} color="#fff" />
            <Text style={styles.actionBtnText}>{primary.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // nav
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  navTitle: { fontSize: 17, fontWeight: '800', color: C.t1, letterSpacing: 0.1 },

  // states
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: C.t1, marginBottom: 6 },
  loadingSub: { fontSize: 13, color: C.t3, textAlign: 'center' },
  goBackBtn: { marginTop: 20, backgroundColor: C.brand, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14 },
  goBackBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scrollContent: { paddingTop: 4 },

  // hero
  hero: { marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderRadius: 22, padding: 20, shadowColor: C.black, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  heroOrderNum: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginTop: 2 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroPillText: { fontSize: 12, fontWeight: '800' },
  heroHint: { fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 19, marginTop: 10, marginBottom: 18 },

  progressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  stepWrap: { alignItems: 'center', width: 62 },
  stepBubble: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  stepBubbleOn: { backgroundColor: '#fff' },
  stepBubbleActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.45)', width: 30, height: 30, borderRadius: 15, marginTop: -2, marginBottom: 4 },
  stepInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  stepConnector: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 12, borderRadius: 1 },
  stepConnectorOn: { backgroundColor: '#fff' },
  stepLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textAlign: 'center' },
  stepLabelOn: { color: '#fff', fontWeight: '800' },

  heroFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroStatLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  heroStatValue: { fontSize: 16, fontWeight: '900', color: '#fff' },
  heroStatValueSm: { fontSize: 12, fontWeight: '700', color: '#fff', paddingHorizontal: 4 },

  // banners
  codBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.accentBg, borderWidth: 1.5, borderColor: C.accentBorder, borderRadius: 16, marginHorizontal: 16, marginBottom: 10, padding: 14 },
  codIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  codTitle: { fontSize: 14, fontWeight: '800', color: C.t1, marginBottom: 2 },
  codSub: { fontSize: 12, color: C.t2, lineHeight: 17 },
  trackNudge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandBg, borderWidth: 1.5, borderColor: C.brandBorder, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  trackNudgeText: { flex: 1, fontSize: 13, color: C.brandD, fontWeight: '700' },
  deliveredBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.successBg, borderWidth: 1.5, borderColor: C.successBorder, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12 },
  deliveredBannerText: { fontSize: 13, color: C.success, fontWeight: '700' },

  // delivery tracker
  trackerCard: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 10, marginTop: 2, borderRadius: 18, padding: 18, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  trackerHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  trackerIconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  trackerEyebrow: { fontSize: 10.5, fontWeight: '800', color: C.t3, letterSpacing: 1 },
  trackerHeadline: { fontSize: 18, fontWeight: '900', color: C.t1, marginTop: 2 },
  trackerSub: { fontSize: 12, color: C.t2, marginTop: 2, lineHeight: 16 },
  trackerBadge: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  trackerBadgeText: { fontSize: 11, fontWeight: '800', color: C.accent },
  trackerPref: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.successBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 },
  trackerPrefText: { flex: 1, fontSize: 12, color: C.success, fontWeight: '700' },
  trackerFoot: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  trackerDot: { width: 8, height: 8, borderRadius: 4 },
  trackerCaption: { fontSize: 13, fontWeight: '700', color: C.t1 },
  trackerNote: { fontSize: 11, color: C.t3, marginTop: 6 },

  // route visual
  rtMap: { backgroundColor: C.brandBg, borderRadius: 16, borderWidth: 1, borderColor: C.brandBorder, paddingVertical: 20, paddingHorizontal: 12, overflow: 'hidden', position: 'relative' },
  rtGridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(13,148,136,0.10)' },
  rtGridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(13,148,136,0.10)' },
  rtRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rtNodeCol: { width: 66, alignItems: 'center' },
  rtNode: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  rtNodeLabel: { fontSize: 11, fontWeight: '700', color: C.t2, marginTop: 6, maxWidth: 66, textAlign: 'center' },
  rtTrack: { flex: 1, height: 44, justifyContent: 'center', marginHorizontal: 2 },
  rtDashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rtDash: { width: 7, height: 4, borderRadius: 2, backgroundColor: C.line },
  rtVehicleWrap: { position: 'absolute', top: 3, marginLeft: -19, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  rtPulse: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: C.brand },
  rtVehicle: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.brand, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: C.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5 },

  // sections
  section: { backgroundColor: C.surface, marginHorizontal: 16, marginVertical: 6, borderRadius: 18, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.t1 },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: C.elev, paddingTop: 16 },

  // items
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: C.elev, gap: 12 },
  itemThumb: { width: 58, height: 58, borderRadius: 12, backgroundColor: C.elev },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 4 },
  itemMeta: { fontSize: 12, color: C.t3, fontWeight: '500' },
  itemTotal: { fontSize: 14.5, fontWeight: '800', color: C.accent },

  // info rows
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  infoRowIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoRowBody: { flex: 1 },
  infoRowLabel: { fontSize: 10.5, color: C.t3, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  infoRowValue: { fontSize: 14, color: C.t1, fontWeight: '600', lineHeight: 20 },

  // price
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceLineLabel: { fontSize: 14, color: C.t2 },
  priceLineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priceLineValue: { fontSize: 14, fontWeight: '600', color: C.t1 },
  priceDivider: { height: 1, backgroundColor: C.elev, marginVertical: 12 },
  priceGrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceGrandLabel: { fontSize: 15, fontWeight: '700', color: C.brand },
  priceGrandValue: { fontSize: 24, fontWeight: '900', color: C.accent },

  // timeline
  tlRow: { flexDirection: 'row', gap: 14 },
  tlLeft: { width: 22, alignItems: 'center' },
  tlDot: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  tlLine: { flex: 1, width: 2, backgroundColor: C.line, marginVertical: 3, borderRadius: 1 },
  tlContent: { flex: 1, paddingTop: 1 },
  tlLabel: { fontSize: 14, color: C.t3, fontWeight: '600', marginBottom: 2 },
  tlLabelOn: { color: C.t1, fontWeight: '700' },
  tlSub: { fontSize: 12, color: C.t2 },

  // bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.elev, gap: 10, shadowColor: C.black, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 18 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 6 },
  actionBtnFilled: { backgroundColor: C.brand, shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  actionBtnOutline: { backgroundColor: C.brandBg, borderWidth: 1.5, borderColor: C.brandBorder },
  actionBtnDangerOutline: { backgroundColor: C.dangerBg, borderWidth: 1.5, borderColor: C.dangerBorder },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%', shadowColor: C.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalHeadIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.t1 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center' },
  modalOrderStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 18, borderWidth: 1, borderColor: C.elev },
  modalOrderNum: { fontSize: 14, fontWeight: '700', color: C.t1 },
  modalOrderTotal: { fontSize: 16, fontWeight: '800', color: C.accent },
  modalSubtitle: { fontSize: 14, color: C.t2, marginBottom: 14, fontWeight: '500' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  reasonCard: { width: '47.5%', backgroundColor: C.bg, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: C.elev, position: 'relative' },
  reasonCardActive: { borderColor: C.brand, backgroundColor: C.brandBg },
  reasonIconBg: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: C.elev },
  reasonIconBgActive: { backgroundColor: '#fff', borderColor: C.brand },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: C.t2, lineHeight: 17 },
  reasonLabelActive: { color: C.brandD },
  reasonCheck: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  customReasonWrap: { marginBottom: 16 },
  customReasonLabel: { fontSize: 13, fontWeight: '700', color: C.t1, marginBottom: 8 },
  customReasonInput: { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.t1, borderWidth: 1.5, borderColor: C.line, minHeight: 90, textAlignVertical: 'top' },
  policyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.infoBg, borderRadius: 12, padding: 12, marginBottom: 8 },
  policyText: { flex: 1, fontSize: 12, color: C.info, lineHeight: 17 },
  modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.elev },
  keepBtn: { flex: 1, backgroundColor: C.elev, paddingVertical: 14, borderRadius: 13, alignItems: 'center' },
  keepBtnText: { color: C.t2, fontWeight: '700', fontSize: 14 },
  confirmCancelBtn: { flex: 1, backgroundColor: C.danger, paddingVertical: 14, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmCancelBtnDisabled: { backgroundColor: C.t3 },
  confirmCancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default OrderDetailScreen;