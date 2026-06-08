// src/screens/OrderDetailScreen.js
import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById, cancelOrder } from '../apis/orderApi';

const { width } = Dimensions.get('window');

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  Pending:          { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082', icon: 'time',             dotColor: '#F57F17' },
  Processing:       { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', icon: 'sync',             dotColor: '#1565C0' },
  'Out for Delivery':{ bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7', icon: 'bicycle',         dotColor: '#2E7D32' },
  Delivered:        { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7', icon: 'checkmark-circle', dotColor: '#1B5E20' },
  Cancelled:        { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A', icon: 'close-circle',     dotColor: '#B71C1C' },
};

const STEPS = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];

// ─── Helper to get product image from array ───────────────────────────────────
const getProductImage = (item) => {
  // Check images array first, then image field, then placeholder
  if (item?.images?.length > 0) return item.images[0];
  if (item?.image) return item.image;
  if (item?.product?.images?.length > 0) return item.product.images[0];
  if (item?.product?.image) return item.product.image;
  return 'https://via.placeholder.com/64';
};

// ─── Collapsible Section ──────────────────────────────────────────────────────
const Section = ({ icon, title, expanded, onToggle, children }) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.75}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color="#2E7D32" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9E9E9E" />
    </TouchableOpacity>
    {expanded && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowIcon}>
      <Ionicons name={icon} size={15} color="#9E9E9E" />
    </View>
    <View style={styles.infoRowBody}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={[styles.infoRowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;
  const { user, token, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState('items');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

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

  const toggle = (s) => setExpanded(expanded === s ? null : s);

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

  // ── NAV shared component ──────────────────────────────────────────────────
  const FloatingNav = () => (
    <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order Details</Text>
        <TouchableOpacity style={styles.navBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />
        <FloatingNav />
        <View style={styles.centered}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color="#4CAF50" />
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
        <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />
        <FloatingNav />
        <View style={styles.centered}>
          <View style={[styles.loadingIconWrap, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="alert-circle-outline" size={36} color="#E53935" />
          </View>
          <Text style={styles.loadingTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = order.status?.current || 'Pending';
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const canCancel = ['Pending', 'Processing'].includes(status) && !order.payment?.isPaid;
  const stepIdx = STEPS.indexOf(status);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />

      {/* ── Cancellation Modal (unchanged) ── */}
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
              <View style={[styles.modalHeadIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="close-circle-outline" size={20} color="#B71C1C" />
              </View>
              <Text style={styles.modalTitle}>Cancel Order</Text>
            </View>
            <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={styles.modalOrderStrip}>
              <Text style={styles.modalOrderNum}>
                Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.modalOrderTotal}>GH₵ {order.pricing?.totalPrice || '—'}</Text>
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
                      <Ionicons name={r.icon} size={20} color={active ? '#2E7D32' : '#9E9E9E'} />
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
                  placeholderTextColor="#BDBDBD"
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
              <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
              <Text style={styles.policyText}>
                Cancelling will void any pending payments and return items to stock.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={() => setCancelModalVisible(false)}
              disabled={cancelling}
            >
              <Text style={styles.keepBtnText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmCancelBtn,
                (!cancelReason || (cancelReason === 'other' && !customReason.trim()) || cancelling) && styles.confirmCancelBtnDisabled,
              ]}
              onPress={submitCancellation}
              disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim()) || cancelling}
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

      {/* ── Floating Nav ── */}
      <FloatingNav />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" colors={['#4CAF50']} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATUS HERO CARD (unchanged) */}
        <View style={[styles.statusHero, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <View style={styles.statusHeroTop}>
            <View style={[styles.statusIconBg, { backgroundColor: meta.text }]}>
              <Ionicons name={meta.icon} size={22} color="#fff" />
            </View>
            <View style={styles.statusHeroInfo}>
              <Text style={[styles.statusText, { color: meta.text }]}>{status}</Text>
              <Text style={styles.orderNumText}>
                #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: meta.text }]}>
              <Text style={styles.statusPillText}>{status}</Text>
            </View>
          </View>

          {status !== 'Cancelled' && (
            <View style={styles.progressRow}>
              {STEPS.map((s, i) => {
                const done = stepIdx > i;
                const active = stepIdx === i;
                return (
                  <React.Fragment key={s}>
                    <View style={styles.stepWrap}>
                      <View style={[
                        styles.stepBubble,
                        done && { backgroundColor: meta.text },
                        active && { backgroundColor: meta.text, shadowColor: meta.text, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 3 },
                        !done && !active && styles.stepBubbleInactive,
                      ]}>
                        {done
                          ? <Ionicons name="checkmark" size={11} color="#fff" />
                          : <View style={[styles.stepInnerDot, active && { backgroundColor: '#fff' }, !active && { backgroundColor: '#D0D0D0' }]} />
                        }
                      </View>
                      <Text style={[styles.stepLabel, (done || active) && { color: meta.text, fontWeight: '700' }]} numberOfLines={1}>
                        {s === 'Out for Delivery' ? 'On Way' : s}
                      </Text>
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={[styles.stepConnector, done && { backgroundColor: meta.text }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {status === 'Out for Delivery' && (
            <TouchableOpacity style={styles.trackNudge} onPress={handleTrackOrder} activeOpacity={0.8}>
              <Ionicons name="location" size={15} color="#2E7D32" />
              <Text style={styles.trackNudgeText}>Tap to track your order in real-time</Text>
              <Ionicons name="chevron-forward" size={15} color="#2E7D32" />
            </TouchableOpacity>
          )}

          {status === 'Delivered' && (
            <View style={styles.deliveredBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#1B5E20" />
              <Text style={styles.deliveredBannerText}>
                Delivered on {formatDate(order.deliveredAt)}
              </Text>
            </View>
          )}

          <View style={styles.placedRow}>
            <Ionicons name="calendar-outline" size={13} color="#9E9E9E" />
            <Text style={styles.placedText}>Placed {formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* ORDER ITEMS — ✅ Updated with getProductImage */}
        <Section
          icon="basket-outline"
          title={`Items (${order.orderItems?.length || 0})`}
          expanded={expanded === 'items'}
          onToggle={() => toggle('items')}
        >
          {order.orderItems?.map((item, idx) => (
            <View
              key={idx}
              style={[styles.itemRow, idx === (order.orderItems.length - 1) && { borderBottomWidth: 0 }]}
            >
              <Image
                source={{ uri: getProductImage(item) }}
                style={styles.itemThumb}
              />
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.quantity} × {item.unit || 'unit'} · GH₵ {item.price}</Text>
              </View>
              <Text style={styles.itemTotal}>
                GH₵ {(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
        </Section>

        {/* DELIVERY (unchanged) */}
        <Section
          icon="location-outline"
          title="Delivery"
          expanded={expanded === 'delivery'}
          onToggle={() => toggle('delivery')}
        >
          <InfoRow icon="location-outline" label="Address"
            value={`${order.shippingAddress?.address}, ${order.shippingAddress?.city}`} />
          <InfoRow icon="call-outline" label="Phone"
            value={order.shippingAddress?.phone || user?.phone || '—'} />
          <InfoRow icon="calendar-outline" label="Scheduled"
            value={`${(order.deliverySchedule?.preferredDay || '').charAt(0).toUpperCase() + (order.deliverySchedule?.preferredDay || '').slice(1)} · ${order.deliverySchedule?.preferredTime || '—'}`} />
          {order.deliveryNote && (
            <InfoRow icon="document-text-outline" label="Note" value={order.deliveryNote} />
          )}
        </Section>

        {/* PAYMENT (unchanged) */}
        <Section
          icon="card-outline"
          title="Payment"
          expanded={expanded === 'payment'}
          onToggle={() => toggle('payment')}
        >
          <InfoRow icon="card-outline" label="Method" value={order.payment?.method || 'Paystack'} />
          <InfoRow
            icon={order.payment?.isPaid ? 'checkmark-circle-outline' : 'time-outline'}
            label="Status"
            value={order.payment?.isPaid ? 'Paid' : 'Pending'}
            valueColor={order.payment?.isPaid ? '#2E7D32' : '#F57F17'}
          />
          {order.payment?.paidAt && (
            <InfoRow icon="calendar-outline" label="Paid on" value={formatDate(order.payment.paidAt)} />
          )}
        </Section>

        {/* PRICE SUMMARY (unchanged) */}
        <Section
          icon="receipt-outline"
          title="Price Summary"
          expanded={expanded === 'summary'}
          onToggle={() => toggle('summary')}
        >
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Items total</Text>
            <Text style={styles.priceLineValue}>GH₵ {order.pricing?.itemsPrice || '—'}</Text>
          </View>
          <View style={styles.priceLine}>
            <View style={styles.priceLineLabelRow}>
              <Ionicons name="bicycle-outline" size={13} color="#F57F17" />
              <Text style={[styles.priceLineLabel, { color: '#F57F17' }]}>Delivery fee</Text>
            </View>
            <Text style={[styles.priceLineValue, { color: '#F57F17' }]}>
              {order.pricing?.deliveryFee === 0 ? 'Free' : `GH₵ ${order.pricing?.deliveryFee || '—'}`}
            </Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceGrandRow}>
            <Text style={styles.priceGrandLabel}>Grand Total</Text>
            <Text style={styles.priceGrandValue}>GH₵ {order.pricing?.totalPrice || '—'}</Text>
          </View>
        </Section>

        {/* TIMELINE (unchanged) */}
        <Section
          icon="time-outline"
          title="Order Timeline"
          expanded={expanded === 'timeline'}
          onToggle={() => toggle('timeline')}
        >
          {[
            { label: 'Order Placed', sub: formatDate(order.createdAt), active: true },
            { label: 'Order Confirmed', sub: 'Processing started', active: ['Processing','Out for Delivery','Delivered'].includes(status) },
            { label: 'Out for Delivery', sub: 'Your order is on the way', active: ['Out for Delivery','Delivered'].includes(status) },
            { label: 'Delivered', sub: formatDate(order.deliveredAt), active: status === 'Delivered' },
          ].map((tl, i, arr) => (
            <View key={i} style={styles.tlRow}>
              <View style={styles.tlLeft}>
                <View style={[styles.tlDot, tl.active && { backgroundColor: '#4CAF50' }]} />
                {i < arr.length - 1 && (
                  <View style={[styles.tlLine, tl.active && arr[i + 1].active && { backgroundColor: '#4CAF50' }]} />
                )}
              </View>
              <View style={[styles.tlContent, i < arr.length - 1 && { paddingBottom: 18 }]}>
                <Text style={[styles.tlLabel, tl.active && { color: '#1A1A1A', fontWeight: '700' }]}>
                  {tl.label}
                </Text>
                {tl.active && tl.sub && tl.sub !== '—' && (
                  <Text style={styles.tlSub}>{tl.sub}</Text>
                )}
              </View>
            </View>
          ))}
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR (unchanged) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnBlue]} onPress={handleContactSupport} activeOpacity={0.85}>
          <Ionicons name="help-circle-outline" size={17} color="#fff" />
          <Text style={styles.actionBtnText}>Support</Text>
        </TouchableOpacity>

        {status === 'Out for Delivery' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGreen]} onPress={handleTrackOrder} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={17} color="#fff" />
            <Text style={styles.actionBtnText}>Track</Text>
          </TouchableOpacity>
        )}

        {status === 'Delivered' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAmber]} onPress={handleReorder} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={17} color="#fff" />
            <Text style={styles.actionBtnText}>Reorder</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRed]} onPress={handleCancelOrder} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={17} color="#fff" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {!order.payment?.isPaid && status !== 'Cancelled' && !canCancel && status !== 'Delivered' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGreen]}
            onPress={() => Alert.alert('Pay Now', 'Redirecting to payment…')}
            activeOpacity={0.85}
          >
            <Ionicons name="card-outline" size={17} color="#fff" />
            <Text style={styles.actionBtnText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Styles (unchanged from original) ─────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F7' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  loadingSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },
  goBackBtn: { marginTop: 20, backgroundColor: '#4CAF50', paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14 },
  goBackBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scrollContent: { paddingBottom: 24 },
  statusHero: { marginHorizontal: 14, marginTop: 4, marginBottom: 10, borderRadius: 20, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  statusHeroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  statusIconBg: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusHeroInfo: { flex: 1 },
  statusText: { fontSize: 18, fontWeight: '800' },
  orderNumText: { fontSize: 13, color: '#9E9E9E', marginTop: 2, fontWeight: '500' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepWrap: { alignItems: 'center', flex: 1 },
  stepBubble: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  stepBubbleInactive: { backgroundColor: '#E8E8E8' },
  stepInnerDot: { width: 8, height: 8, borderRadius: 4 },
  stepConnector: { flex: 1, height: 2, backgroundColor: '#E8E8E8', marginHorizontal: 2, marginBottom: 20 },
  stepLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '500', textAlign: 'center' },
  trackNudge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 6, marginBottom: 10 },
  trackNudgeText: { flex: 1, fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  deliveredBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  deliveredBannerText: { fontSize: 13, color: '#1B5E20', fontWeight: '600' },
  placedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  placedText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  section: { backgroundColor: '#fff', marginHorizontal: 14, marginVertical: 5, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0', paddingTop: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F5F5F5', gap: 12 },
  itemThumb: { width: 58, height: 58, borderRadius: 12, backgroundColor: '#F5F5F5' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  itemTotal: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  infoRowIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F7F8F7', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoRowBody: { flex: 1 },
  infoRowLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoRowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', lineHeight: 20 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceLineLabel: { fontSize: 14, color: '#757575' },
  priceLineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priceLineValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  priceDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  priceGrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceGrandLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  priceGrandValue: { fontSize: 22, fontWeight: '900', color: '#2E7D32' },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlLeft: { width: 20, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D0D0D0', flexShrink: 0 },
  tlLine: { flex: 1, width: 2, backgroundColor: '#EEEEEE', marginTop: 3 },
  tlContent: { flex: 1, paddingBottom: 4 },
  tlLabel: { fontSize: 14, color: '#9E9E9E', fontWeight: '500', marginBottom: 2 },
  tlSub: { fontSize: 12, color: '#BDBDBD' },
  bottomBar: { position: 'absolute', bottom: 36, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 13, gap: 5 },
  actionBtnBlue: { backgroundColor: '#1565C0' },
  actionBtnGreen: { backgroundColor: '#2E7D32', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  actionBtnAmber: { backgroundColor: '#F57F17' },
  actionBtnRed: { backgroundColor: '#B71C1C' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalHeadIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  modalOrderStrip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F7F8F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 18 },
  modalOrderNum: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  modalOrderTotal: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },
  modalSubtitle: { fontSize: 14, color: '#757575', marginBottom: 14, fontWeight: '500' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  reasonCard: { width: '47%', backgroundColor: '#F7F8F7', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#EEEEEE', position: 'relative' },
  reasonCardActive: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  reasonIconBg: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEEEEE' },
  reasonIconBgActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: '#757575', lineHeight: 17 },
  reasonLabelActive: { color: '#2E7D32' },
  reasonCheck: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  customReasonWrap: { marginBottom: 16 },
  customReasonLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  customReasonInput: { backgroundColor: '#F7F8F7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', borderWidth: 1.5, borderColor: '#EEEEEE', minHeight: 90, textAlignVertical: 'top' },
  policyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, marginBottom: 8 },
  policyText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 17 },
  modalFooter: { flexDirection: 'row', gap: 10, bottom: 36, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EBEBEB' },
  keepBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 14, borderRadius: 13, alignItems: 'center' },
  keepBtnText: { color: '#757575', fontWeight: '700', fontSize: 14 },
  confirmCancelBtn: { flex: 1, backgroundColor: '#B71C1C', paddingVertical: 14, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmCancelBtnDisabled: { backgroundColor: '#BDBDBD' },
  confirmCancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default OrderDetailScreen;