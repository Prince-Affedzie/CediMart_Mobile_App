// src/vendorscreens/VendorOrdersScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders } from '../apis/vendorApi';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { bg: '#FFF8E1', border: '#FFD54F', text: '#E65100', icon: 'time-outline',              label: 'Pending' },
  confirmed: { bg: '#E8F5E9', border: '#81C784', text: '#2E7D32', icon: 'checkmark-circle-outline',  label: 'Confirmed' },
  preparing: { bg: '#E3F2FD', border: '#64B5F6', text: '#1565C0', icon: 'restaurant-outline',        label: 'Preparing' },
  ready:     { bg: '#F3E5F5', border: '#CE93D8', text: '#6A1B9A', icon: 'cube-outline',              label: 'Ready' },
  delivered: { bg: '#E0F2F1', border: '#4DB6AC', text: '#00695C', icon: 'checkmark-done-outline',    label: 'Delivered' },
  cancelled: { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828', icon: 'close-circle-outline',      label: 'Cancelled' },
};

// ─────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────
const FILTERS = ['All', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatDate = (ds) =>
  new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (ds) =>
  new Date(ds).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const getAddressString = (addr) => {
  if (!addr) return '';
  return [addr.address, addr.nearestLandmark, addr.city, addr.region].filter(Boolean).join(', ');
};

// ─────────────────────────────────────────────
// SUMMARY STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, count, iconName, color, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
      <Ionicons name={iconName} size={16} color={color} />
    </View>
    <Text style={[styles.statCount, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────
const OrderCard = ({ item, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 320,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 320,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cfg = STATUS_CONFIG[item.vendorStatus] || STATUS_CONFIG.pending;
  const addressStr = getAddressString(item.shippingAddress);
  const itemCount = item.items?.length || 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(item)}
        activeOpacity={0.82}
      >
        {/* Left status stripe */}
        <View style={[styles.cardStripe, { backgroundColor: cfg.text }]} />

        <View style={styles.cardBody}>
          {/* ── TOP ROW: order number + timestamp ── */}
          <View style={styles.cardTopRow}>
            <View style={styles.cardOrderNumWrap}>
              <Text style={styles.cardOrderNum}>#{item.orderNumber}</Text>
            </View>
            <View style={styles.cardTimestamp}>
              <Ionicons name="calendar-outline" size={11} color="#BDBDBD" />
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.cardTimeDot}>·</Text>
              <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>

          {/* ── DIVIDER ── */}
          <View style={styles.cardDivider} />

          {/* ── CUSTOMER ROW ── */}
          <View style={styles.cardCustomerRow}>
            <View style={styles.cardAvatarCircle}>
              <Text style={styles.cardAvatarInitial}>
                {item.customer?.firstName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.cardCustomerInfo}>
              <Text style={styles.cardCustomerName} numberOfLines={1}>
                {item.customer?.firstName} {item.customer?.lastName}
              </Text>
              {item.customer?.phone && (
                <View style={styles.cardPhoneRow}>
                  <Ionicons name="call-outline" size={11} color="#9E9E9E" />
                  <Text style={styles.cardPhone}>{item.customer.phone}</Text>
                </View>
              )}
            </View>

            {/* Status badge — right side */}
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.text} />
              <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* ── FOOTER ROW: items, delivery date, address ── */}
          <View style={styles.cardFooter}>
            {/* Item count pill */}
            <View style={styles.footerPill}>
              <Ionicons name="bag-handle-outline" size={12} color="#2E7D32" />
              <Text style={styles.footerPillText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>

            {/* Delivery date */}
            {item.deliverySchedule && (
              <View style={styles.footerPill}>
                <Ionicons name="bicycle-outline" size={12} color="#1565C0" />
                <Text style={[styles.footerPillText, { color: '#1565C0' }]}>
                  {new Date(item.deliverySchedule).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}

            {/* Address */}
            {addressStr !== '' && (
              <View style={[styles.footerPill, styles.footerPillAddress]}>
                <Ionicons name="location-outline" size={12} color="#757575" />
                <Text style={styles.footerPillAddressText} numberOfLines={1}>{addressStr}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.cardChevronWrap}>
          <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const VendorOrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyOrders();
      if (res?.data?.success || res?.status === 200) {
        setOrders(res.data.data || res.data);
      } else {
        setError('Failed to load orders.');
      }
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || 'Could not fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  // Derived data
  const filteredOrders = activeFilter === 'All'
    ? orders
    : orders.filter(o => o.vendorStatus === activeFilter);

  // Summary stats for header
  const pendingCount   = orders.filter(o => o.vendorStatus === 'pending').length;
  const preparingCount = orders.filter(o => ['confirmed', 'preparing'].includes(o.vendorStatus)).length;
  const doneCount      = orders.filter(o => o.vendorStatus === 'delivered').length;

  // ── Loading ──
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ══════════════════════════
          HEADER
          ══════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSub}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={() => { setLoading(false); setRefreshing(true); fetchOrders(); }}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        {orders.length > 0 && (
          <View style={styles.statsRow}>
            <StatCard label="Pending"   count={pendingCount}   iconName="time-outline"           color="#E65100" bg="#FFF8E1" />
            <StatCard label="Active"    count={preparingCount} iconName="restaurant-outline"      color="#1565C0" bg="#E3F2FD" />
            <StatCard label="Delivered" count={doneCount}      iconName="checkmark-done-outline"  color="#00695C" bg="#E0F2F1" />
            <StatCard label="Total"     count={orders.length}  iconName="receipt-outline"         color="#1B5E20" bg="#E8F5E9" />
          </View>
        )}
      </View>

      {/* ── Error banner ── */}
      {error && !refreshing && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => { setLoading(true); fetchOrders(); }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════
          FILTER TABS
          ══════════════════════════ */}
      <View style={styles.filterWrapper}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => {
            const active = activeFilter === f;
            const cfg    = f !== 'All' ? STATUS_CONFIG[f] : null;
            const count  = f === 'All' ? orders.length : orders.filter(o => o.vendorStatus === f).length;
            return (
              <TouchableOpacity
                style={[styles.filterTab, active && styles.filterTabActive, active && cfg && { backgroundColor: cfg.text }]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.78}
              >
                {cfg && <Ionicons name={cfg.icon} size={13} color={active ? '#fff' : cfg.text} style={{ marginRight: 4 }} />}
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {f === 'All' ? 'All' : cfg?.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ══════════════════════════
          ORDER LIST
          ══════════════════════════ */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <OrderCard item={item} onPress={order => navigation.navigate('VendorOrderDetail', { order })} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="clipboard-outline" size={42} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'All' ? 'No orders yet' : `No ${activeFilter} orders`}
            </Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'All'
                ? "When customers place orders, they'll appear here."
                : `You have no ${activeFilter} orders right now.`}
            </Text>
            {activeFilter !== 'All' && (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={() => setActiveFilter('All')}>
                <Text style={styles.emptyResetText}>Show all orders</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F5F2' },

  // ── HEADER ──
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    marginHorizontal:8,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerRefreshBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 10,
    alignItems: 'center', gap: 4,
  },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  statCount: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textAlign: 'center' },

  // ── ERROR ──
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12, marginHorizontal: 16,
    borderRadius: 12, marginTop: 10,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText:  { flex: 1, fontSize: 13, color: '#C62828', marginLeft: 8 },
  retryBtn:   { marginLeft: 8 },
  retryText:  { fontWeight: '700', color: '#2E7D32', fontSize: 13 },

  // ── FILTER TABS ──
  filterWrapper: { paddingTop: 14, paddingBottom: 4 },
  filterList:    { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E8E8E8',
  },
  filterTabActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterTabText:       { fontSize: 13, fontWeight: '600', color: '#616161' },
  filterTabTextActive: { color: '#fff' },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText:       { fontSize: 10, fontWeight: '800', color: '#616161' },
  filterBadgeTextActive: { color: '#fff' },

  // ── ORDER CARD ──
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardStripe: { width: 4 },
  cardBody:   { flex: 1, padding: 14 },

  // Top row
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardOrderNumWrap: {
    backgroundColor: '#F1F8F3', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  cardOrderNum: { fontSize: 13, fontWeight: '800', color: '#1B5E20', letterSpacing: 0.3 },
  cardTimestamp: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate:      { fontSize: 11, color: '#BDBDBD', fontWeight: '500' },
  cardTimeDot:   { fontSize: 11, color: '#BDBDBD' },
  cardTime:      { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },

  // Divider
  cardDivider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 10 },

  // Customer
  cardCustomerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardAvatarCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, flexShrink: 0,
  },
  cardAvatarInitial: { fontSize: 14, fontWeight: '800', color: '#2E7D32' },
  cardCustomerInfo:  { flex: 1 },
  cardCustomerName:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardPhoneRow:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cardPhone:         { fontSize: 11, color: '#9E9E9E' },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1,
    flexShrink: 0, marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Footer pills
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 10,
  },
  footerPillText:        { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  footerPillAddress:     { flex: 1, maxWidth: width * 0.45 },
  footerPillAddressText: { fontSize: 11, color: '#757575', fontWeight: '500', flexShrink: 1 },

  // Chevron
  cardChevronWrap: { justifyContent: 'center', paddingRight: 14 },

  // ── LOADING ──
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { marginTop: 12, fontSize: 15, color: '#616161' },

  // ── EMPTY ──
  emptyWrap: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: '#424242', marginBottom: 6 },
  emptySub:      { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20 },
  emptyResetBtn: {
    marginTop: 20, backgroundColor: '#E8F5E9',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#A5D6A7',
  },
  emptyResetText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
});

export default VendorOrdersScreen;