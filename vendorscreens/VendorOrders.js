// src/vendorscreens/VendorOrdersScreen.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useVendor } from '../context/VendorContext';

const { width } = Dimensions.get('window');

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

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending:    { bg: C.accentBg,    border: C.accentBorder, text: C.accent,  icon: 'time-outline',           label: 'Pending' },
  Processing: { bg: C.infoBg,      border: C.infoBorder,   text: C.info,    icon: 'restaurant-outline',      label: 'Processing' },
  Delivered:  { bg: C.successBg,   border: C.successBorder,text: C.success, icon: 'checkmark-done-outline',  label: 'Delivered' },
  Cancelled:  { bg: C.dangerBg,    border: C.dangerBorder, text: C.danger,  icon: 'close-circle-outline',    label: 'Cancelled' },
};

const FILTERS = ['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'];

const formatDate = (ds) => new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (ds) => new Date(ds).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const getAddressString = (addr) => { if (!addr) return ''; return [addr.address, addr.nearestLandmark, addr.city, addr.region].filter(Boolean).join(', '); };

const STAT_ICONS = { Pending: 'time-outline', Active: 'flame-outline', Delivered: 'checkmark-done-outline', Total: 'file-tray-full-outline' };

const StatCard = ({ label, count, color, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '1A' }]}>
      <Ionicons name={STAT_ICONS[label] || 'ellipse-outline'} size={14} color={color} />
    </View>
    <Text style={[styles.statCount, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const OrderCard = ({ item, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: Math.min(index * 45, 360), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: Math.min(index * 45, 360), useNativeDriver: true }),
    ]).start();
  }, []);
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
  const addressStr = getAddressString(item.shippingAddress);
  const itemCount = item.items?.length || 0;
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardOrderNumWrap}>
              <Ionicons name="receipt-outline" size={11} color={C.brand} style={{ marginRight: 4 }} />
              <Text style={styles.cardOrderNum}>#{item.orderNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Ionicons name={cfg.icon} size={11} color={cfg.text} />
              <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
            </View>
          </View>
          <View style={styles.cardCustomerRow}>
            <View style={[styles.cardAvatarCircle, { borderColor: cfg.border }]}>
              <Text style={styles.cardAvatarInitial}>{item.customer?.firstName?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.cardCustomerInfo}>
              <Text style={styles.cardCustomerName} numberOfLines={1}>{item.customer?.firstName} {item.customer?.lastName}</Text>
              <View style={styles.cardMetaRow}>
                {item.customer?.phone && <View style={styles.cardPhoneRow}><Ionicons name="call-outline" size={10.5} color={C.t3} /><Text style={styles.cardPhone}>{item.customer.phone}</Text></View>}
                <View style={styles.cardTimestamp}><Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text><Text style={styles.cardTimeDot}>·</Text><Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardFooter}>
            <View style={styles.footerPill}>
              <Ionicons name="bag-handle-outline" size={12} color={C.brand} />
              <Text style={styles.footerPillText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            {item.deliverySchedule && (
              <View style={[styles.footerPill, styles.footerPillBlue]}>
                <Ionicons name="bicycle-outline" size={12} color={C.info} />
                <Text style={[styles.footerPillText, { color: C.info }]}>{item.deliverySchedule.preferredDay}, {item.deliverySchedule.preferredTime}</Text>
              </View>
            )}
            {addressStr !== '' && (
              <View style={[styles.footerPill, styles.footerPillAddress]}>
                <Ionicons name="location-outline" size={12} color={C.t2} />
                <Text style={styles.footerPillAddressText} numberOfLines={1}>{addressStr}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardChevronWrap}><Ionicons name="chevron-forward" size={17} color="#C5C5C5" /></View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const VendorOrdersScreen = () => {
  const navigation = useNavigation();
  const { orders, loading: contextLoading, refreshing: contextRefreshing, error: contextError, refreshVendorData, refetchOrders } = useVendor();
  const [activeFilter, setActiveFilter] = useState('All');
  const filteredOrders = activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter);
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const preparingCount = orders.filter(o => ['confirmed', 'Processing'].includes(o.status)).length;
  const doneCount = orders.filter(o => o.status === 'Delivered').length;

  if (contextLoading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={C.t1} /></TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}><ActivityIndicator size="large" color={C.brand} /><Text style={styles.loadingText}>Loading orders…</Text></View>
      </SafeAreaView>
    );
  }

  const ListHeaderComponent = () => (
    <View>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={C.t1} /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerTitle}>My Orders</Text><Text style={styles.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''} total</Text></View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshVendorData} activeOpacity={0.75}><Ionicons name="refresh-outline" size={19} color={C.brand} /></TouchableOpacity>
      </View>
      {orders.length > 0 && (
        <View style={styles.statsRow}>
          <StatCard label="Pending" count={pendingCount} color={C.accent} bg={C.accentBg} />
          <StatCard label="Active" count={preparingCount} color={C.info} bg={C.infoBg} />
          <StatCard label="Delivered" count={doneCount} color={C.success} bg={C.successBg} />
          <StatCard label="Total" count={orders.length} color={C.brand} bg={C.brandBg} />
        </View>
      )}
      {contextError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={C.danger} />
          <Text style={styles.errorText}>{contextError}</Text>
          <TouchableOpacity onPress={refreshVendorData} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.filterWrapper}>
        <FlatList data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={f => f} contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => {
            const active = activeFilter === f;
            const cfg = f !== 'All' ? STATUS_CONFIG[f] : null;
            const count = f === 'All' ? orders.length : orders.filter(o => o.status === f).length;
            return (
              <TouchableOpacity style={[styles.filterTab, active && styles.filterTabActive, active && cfg && { backgroundColor: cfg.text, borderColor: cfg.text }]} onPress={() => setActiveFilter(f)} activeOpacity={0.78}>
                {cfg && <Ionicons name={cfg.icon} size={13} color={active ? '#fff' : cfg.text} style={{ marginRight: 4 }} />}
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{f === 'All' ? 'All' : cfg?.label}</Text>
                {count > 0 && <View style={[styles.filterBadge, active && styles.filterBadgeActive]}><Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text></View>}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredOrders} keyExtractor={item => item._id}
        renderItem={({ item, index }) => <OrderCard item={item} onPress={order => navigation.navigate('VendorOrderDetail', { order })} index={index} />}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={contextRefreshing} onRefresh={refreshVendorData} tintColor={C.brand} colors={[C.brand]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}><Ionicons name="clipboard-outline" size={40} color={C.brandBorder} /></View>
            <Text style={styles.emptyTitle}>{activeFilter === 'All' ? 'No orders yet' : `No ${activeFilter} orders`}</Text>
            <Text style={styles.emptySub}>{activeFilter === 'All' ? "When customers place orders, they'll appear here." : `You have no ${activeFilter} orders right now.`}</Text>
            {activeFilter !== 'All' && <TouchableOpacity style={styles.emptyResetBtn} onPress={() => setActiveFilter('All')} activeOpacity={0.8}><Text style={styles.emptyResetText}>Show all orders</Text></TouchableOpacity>}
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  simpleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.t1, letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: C.t3, marginTop: 1, fontWeight: '500' },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.035)' },
  statIconWrap: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statCount: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: C.t3, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.2 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.dangerBg, padding: 12, marginHorizontal: 16, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: C.dangerBorder },
  errorText: { flex: 1, fontSize: 13, color: C.danger, marginLeft: 8, fontWeight: '500' },
  retryBtn: { marginLeft: 8 },
  retryText: { fontWeight: '800', color: C.brand, fontSize: 13 },
  filterWrapper: { paddingTop: 16, paddingBottom: 6 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1.5, borderColor: '#EAEAEA' },
  filterTabActive: { borderColor: C.brand },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#616161' },
  filterTabTextActive: { color: '#fff' },
  filterBadge: { marginLeft: 6, backgroundColor: '#F0F0F0', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#616161' },
  filterBadgeTextActive: { color: '#fff' },
  listContent: { paddingBottom: 40, paddingTop: 4 },
  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 20, marginHorizontal: 16, marginTop: 12, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#F2F2F2' },
  cardBody: { flex: 1, padding: 15 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardOrderNumWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  cardOrderNum: { fontSize: 12.5, fontWeight: '800', color: C.brand, letterSpacing: 0.2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  cardCustomerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAvatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F9F5', justifyContent: 'center', alignItems: 'center', marginRight: 11, flexShrink: 0, borderWidth: 1.5 },
  cardAvatarInitial: { fontSize: 14.5, fontWeight: '800', color: C.brand },
  cardCustomerInfo: { flex: 1 },
  cardCustomerName: { fontSize: 14.5, fontWeight: '700', color: C.t1, marginBottom: 2 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  cardPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardPhone: { fontSize: 11, color: C.t3, fontWeight: '500' },
  cardTimestamp: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 11, color: C.t3, fontWeight: '500' },
  cardTimeDot: { fontSize: 11, color: '#D5D5D5' },
  cardTime: { fontSize: 11, color: C.t3, fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: '#F4F4F4', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.brandBg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  footerPillBlue: { backgroundColor: C.infoBg },
  footerPillText: { fontSize: 11, fontWeight: '700', color: C.brand },
  footerPillAddress: { flex: 1, maxWidth: width * 0.45, backgroundColor: '#F6F6F6' },
  footerPillAddressText: { fontSize: 11, color: '#8A8A8A', fontWeight: '500', flexShrink: 1 },
  cardChevronWrap: { justifyContent: 'center', paddingRight: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#616161', fontWeight: '500' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#3A3A3A', marginBottom: 6 },
  emptySub: { fontSize: 14, color: C.t3, textAlign: 'center', lineHeight: 20 },
  emptyResetBtn: { marginTop: 22, backgroundColor: C.brandBg, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, borderWidth: 1, borderColor: C.brandBorder },
  emptyResetText: { fontSize: 13, fontWeight: '800', color: C.brand },
});

export default VendorOrdersScreen;