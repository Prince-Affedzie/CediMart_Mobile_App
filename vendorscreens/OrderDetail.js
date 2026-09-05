// src/vendorscreens/VendorOrderDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Brand Colors ──────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandD: '#0F766E',
  brandBg: '#F0FDFA',
  brandBorder: '#99F6E4',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  success: '#059669',
  successBg: '#ECFDF5',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  gold: '#F59E0B',
};

const shade = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const b = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
};

const STATUS_COLORS = {
  Pending:   { gradient: ['#F97316', '#FB923C'], icon: 'time-outline' },
  Confirmed: { gradient: ['#059669', '#34D399'], icon: 'checkmark-circle-outline' },
  Processing: { gradient: ['#0284C7', '#38BDF8'], icon: 'restaurant-outline' },
  Ready:     { gradient: ['#7C3AED', '#8B5CF6'], icon: 'cube-outline' },
  Delivered: { gradient: ['#0D9488', '#14B8A6'], icon: 'checkmark-done-outline' },
  Cancelled: { gradient: ['#DC2626', '#F87171'], icon: 'close-circle-outline' },
};

// ─── Helper: get product image from array ────────────────────────────────────
const getProductImage = (item) => {
  if (item?.images?.length > 0) return item.images[0];
  if (item?.image) return item.image;
  if (item?.product?.images?.length > 0) return item.product.images[0];
  if (item?.product?.image) return item.product.image;
  return null;
};

const VendorOrderDetailScreen = ({ navigation, route }) => {
  const { order } = route.params;
  
  const statusStyle = STATUS_COLORS[order?.status] || STATUS_COLORS.Pending;
  const statusLabel = order?.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });

  const getAddressString = (addr) => {
    if (!addr) return '';
    const parts = [addr.address, addr.nearestLandmark, addr.city, addr.region].filter(Boolean);
    return parts.join(', ');
  };

  // Calculate order total
  const orderTotal = order.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0) || 0;
  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.brandD} />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[C.brand, shade(C.brand, 20)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerOrderNum}>#{order.orderNumber}</Text>
        </View>
        <View style={{ width: 42 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Status Banner with Gradient ── */}
        <LinearGradient
          colors={statusStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusBanner}
        >
          <View style={styles.statusIconWrap}>
            <Ionicons name={statusStyle.icon} size={24} color="#fff" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>{statusLabel}</Text>
            <Text style={styles.statusDate}>
              Placed {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Customer Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {order.customer?.firstName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {order.customer?.firstName} {order.customer?.lastName}
              </Text>
              {order.customer?.phone && (
                <View style={styles.contactPill}>
                  <Ionicons name="call-outline" size={12} color={C.brand} />
                  <Text style={styles.contactPillText}>{order.customer.phone}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Shipping Address ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="location-outline" size={20} color={C.brand} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>
                {getAddressString(order.shippingAddress) || 'No address provided'}
              </Text>
              {order.shippingAddress?.phone && (
                <View style={styles.addressPhoneChip}>
                  <Ionicons name="call-outline" size={11} color={C.brand} />
                  <Text style={styles.addressPhoneText}>{order.shippingAddress.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({itemCount} total)</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => {
              const imageUri = getProductImage(item.product || item);
              return (
                <View key={item._id || index} style={styles.itemCard}>
                  <View style={styles.itemImageContainer}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="cube-outline" size={22} color={C.textMuted} />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product?.name || item.name || 'Product'}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemMetaDot}>·</Text>
                      <Text style={styles.itemMeta}>GH₵ {item.price?.toFixed(2)} each</Text>
                    </View>
                  </View>
                  <View style={styles.itemTotalWrap}>
                    <Text style={styles.itemTotalLabel}>Total</Text>
                    <Text style={styles.itemTotal}>
                      GH₵ {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color={C.textMuted} />
              <Text style={styles.noItemsText}>No items in this order</Text>
            </View>
          )}

          {/* Order Summary */}
          {order.items && order.items.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>GH₵ {orderTotal.toFixed(2)}</Text>
              </View>
              {order.deliveryFee > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>GH₵ {order.deliveryFee.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalValue}>
                  GH₵ {(orderTotal + (order.deliveryFee || 0)).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Delivery Schedule ── */}
        {order.deliverySchedule && (order.deliverySchedule.preferredDay || order.deliverySchedule.preferredTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Schedule</Text>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="calendar-outline" size={20} color={C.info} />
              </View>
              <View style={styles.scheduleContent}>
                {order.deliverySchedule.preferredDay && (
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Day</Text>
                    <Text style={styles.scheduleValue}>
                      {order.deliverySchedule.preferredDay.charAt(0).toUpperCase() + order.deliverySchedule.preferredDay.slice(1)}
                    </Text>
                  </View>
                )}
                {order.deliverySchedule.preferredTime && (
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Time</Text>
                    <Text style={styles.scheduleValue}>
                      {order.deliverySchedule.preferredTime.charAt(0).toUpperCase() + order.deliverySchedule.preferredTime.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        {order.paymentMethod && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="card-outline" size={20} color={C.gold} />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentMethod}>
                  {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                </Text>
                <Text style={styles.paymentStatus}>
                  {order.paymentStatus || 'Paid'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  headerOrderNum: { fontSize: 12, color: '#99F6E4', marginTop: 2, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },

  // ── Status Banner ──
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 3, textTransform: 'capitalize' },
  statusDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // ── Section ──
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brandBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },

  // ── Customer ──
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.brandBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerAvatarText: { fontSize: 18, fontWeight: '800', color: C.brand },
  customerInfo: { flex: 1, justifyContent: 'center' },
  customerName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.brandBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  contactPillText: { fontSize: 12, color: C.brand, fontWeight: '600' },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Address ──
  addressContent: { flex: 1 },
  addressText: { fontSize: 14, color: C.textOff, lineHeight: 21, fontWeight: '500' },
  addressPhoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.brandBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  addressPhoneText: { fontSize: 12, color: C.brand, fontWeight: '600' },

  // ── Items ──
  itemCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.bg,
    marginRight: 12,
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4, lineHeight: 19 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemMeta: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  itemMetaDot: { fontSize: 12, color: C.textMuted },
  itemTotalWrap: { alignItems: 'flex-end', marginLeft: 8 },
  itemTotalLabel: { fontSize: 10, color: C.textMuted, fontWeight: '500' },
  itemTotal: { fontSize: 14, fontWeight: '800', color: C.brandD },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: C.brandBg,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.brandBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 13, color: C.textOff, fontWeight: '500' },
  summaryValue: { fontSize: 14, color: C.text, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: C.brandBorder, marginVertical: 10 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  summaryTotalValue: { fontSize: 18, fontWeight: '900', color: C.brandD },

  // ── Schedule ──
  scheduleContent: { flex: 1, gap: 6 },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleLabel: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  scheduleValue: { fontSize: 14, color: C.text, fontWeight: '600', textTransform: 'capitalize' },

  // ── Payment ──
  paymentContent: { flex: 1 },
  paymentMethod: { fontSize: 14, color: C.text, fontWeight: '600' },
  paymentStatus: { fontSize: 12, color: C.success, fontWeight: '500', marginTop: 2 },

  emptyItems: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  noItemsText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
});

export default VendorOrderDetailScreen;