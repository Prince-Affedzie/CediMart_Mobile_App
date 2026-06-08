// src/screens/OrdersScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getMyOrder } from '../apis/orderApi';

const { width } = Dimensions.get('window');

// ─── Stat component ───────────────────────────────────────────────────────────
const Stat = ({ value, label, highlight }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, highlight && { color: '#FFD54F' }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OrdersScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, cancelled: 0, processing: 0, out_for_delivery: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const filters = [
    { id: 'all',              label: 'All',        icon: 'apps-outline',             color: '#2E7D32' },
    { id: 'pending',          label: 'Pending',     icon: 'time-outline',             color: '#F57F17' },
    { id: 'processing',       label: 'Processing',  icon: 'sync-outline',             color: '#1565C0' },
    { id: 'out_for_delivery', label: 'On the way',  icon: 'bicycle-outline',          color: '#6A1B9A' },
    { id: 'delivered',        label: 'Delivered',   icon: 'checkmark-circle-outline', color: '#2E7D32' },
    { id: 'cancelled',        label: 'Cancelled',   icon: 'close-circle-outline',     color: '#C62828' },
  ];

  const STATUS_META = {
    'Pending':           { color: '#F57F17', bg: '#FFF8E1', icon: 'time-outline' },
    'Processing':        { color: '#1565C0', bg: '#E3F2FD', icon: 'sync-outline' },
    'Out for Delivery':  { color: '#6A1B9A', bg: '#F3E5F5', icon: 'bicycle-outline' },
    'Delivered':         { color: '#2E7D32', bg: '#E8F5E9', icon: 'checkmark-circle-outline' },
    'Cancelled':         { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline' },
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrder();
      console.log(response)
      if (response.status === 200) {
        const data = response.data.data || response.data.orders || [];
        setOrders(data);
        calculateStats(data);
        animateIn();
      } else {
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (list) => {
    const s = { total: list.length, pending: 0, delivered: 0, cancelled: 0, processing: 0, out_for_delivery: 0 };
    list.forEach(o => {
      const st = (o.status || 'Pending').toLowerCase().replace(/ /g, '_');
      if (st === 'delivered') s.delivered++;
      else if (st === 'cancelled') s.cancelled++;
      else if (st === 'processing') s.processing++;
      else if (st === 'out_for_delivery') s.out_for_delivery++;
      else s.pending++;
    });
    setStats(s);
  };

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => {
        const st = (o.status || 'Pending').toLowerCase().replace(/ /g, '_');
        if (filter === 'pending') return ['pending', 'processing', 'out_for_delivery'].includes(st);
        return st === filter;
      });

  const getFilterCount = (id) => {
    if (id === 'all') return stats.total;
    if (id === 'pending') return stats.pending + stats.processing + stats.out_for_delivery;
    return stats[id] || 0;
  };

  const formatDate = (ds) => {
    try {
      const d = new Date(ds), now = new Date();
      const days = Math.ceil(Math.abs(now - d) / 86400000);
      if (days === 0) return `Today · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (days === 1) return `Yesterday · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (days < 7) return `${days} days ago`;
      return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return 'Invalid date'; }
  };

  const getStatusText = (status) => {
    const map = { pending: 'Pending', processing: 'Processing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
    return map[(status || 'Pending').toLowerCase().replace(/ /g, '_')] || 'Pending';
  };

  // Helper to get product image from array
  // Helper to get product image
const getProductImage = (item) => {
  console.log(item)
  if (!item) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
  
  // Backend already resolves image to a string or null
  if (item.image && item.image !== null) return item.image;
  
  // Check nested product
  const product = item.product;
  if (product?.images?.length > 0) return product.images[0];
  if (product?.image) return product.image;
  
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
};

  const handleReorder = () => {
    Alert.alert('Reorder', 'This feature is coming soon!', [{ text: 'OK' }]);
  };

  // ─── STATIC NAVIGATION BAR ─────────────────────────────────────────────────
  const StaticNavBar = () => {
    return (
      <SafeAreaView edges={['top']} style={styles.navBarContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          
          <View style={styles.navRight}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={22} color="#6C757D" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={22} color="#6C757D" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // ─── SCROLLABLE HEADER ─────────────────────────────────────────────────────
  const ScrollableHeader = () => {
    const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';
    const activeCount = stats.pending + stats.processing + stats.out_for_delivery;

    return (
      <View style={styles.scrollableHeader}>
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.welcomeText}>Hello, {firstName}!</Text>
            <Text style={styles.greetingText}>My Orders</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1774698867/delivery_vtq4ru.jpg' }}
              style={styles.avatarImage}
            />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Stat value={stats.total} label="Total" />
          <View style={styles.statsDivider} />
          <Stat value={activeCount} label="Active" highlight={activeCount > 0} />
          <View style={styles.statsDivider} />
          <Stat value={stats.delivered} label="Delivered" />
        </View>

        {activeCount > 0 && (
          <View style={styles.activeNudge}>
            <View style={styles.nudgeDot} />
            <Text style={styles.nudgeText}>
              {activeCount} order{activeCount > 1 ? 's' : ''} currently active
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── FILTERS ───────────────────────────────────────────────────────────────
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filtersScroll}
      >
        {filters.map(f => {
          const active = filter === f.id;
          const count = getFilterCount(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip, 
                active && { backgroundColor: f.color, borderColor: f.color }
              ]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.75}
            >
              <Ionicons 
                name={f.icon} 
                size={14} 
                color={active ? '#fff' : '#6C757D'} 
              />
              <Text style={[
                styles.filterChipText, 
                active && styles.filterChipTextActive
              ]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.filterBadge,
                  active ? styles.filterBadgeActive : styles.filterBadgeInactive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    active && { color: '#fff' }
                  ]}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─── RESULTS ROW ───────────────────────────────────────────────────────────
  const renderResultsRow = () => (
    <View style={styles.resultsRow}>
      <Text style={styles.resultsText}>
        {filteredOrders.length} {filter !== 'all' ? filter.replace('_', ' ') : ''} 
        order{filteredOrders.length !== 1 ? 's' : ''}
      </Text>
      {filter !== 'all' && (
        <TouchableOpacity style={styles.clearButton} onPress={() => setFilter('all')}>
          <Ionicons name="close-circle" size={14} color="#ADB5BD" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── ORDER CARD ────────────────────────────────────────────────────────────
  // src/screens/OrdersScreen.js
// ─── ORDER CARD ────────────────────────────────────────────────────────────
const renderOrderItem = ({ item }) => {
  const statusText = getStatusText(item.status);
  const meta = STATUS_META[statusText] || STATUS_META['Pending'];
  const normalizedStatus = (item.status || 'Pending').toLowerCase().replace(/ /g, '_');
  
  // ✅ FIX: Use item.items (what the backend returns) instead of item.orderItems
  const orderItems = item.items || item.orderItems || [];
  const itemCount = item.itemsCount || orderItems.length || 0;
  const totalPrice = item.totalPrice || item.orderTotal || 0;
  const firstItem = orderItems[0];
  
  // ✅ FIX: Backend already resolves the image, so firstItem.image should work
  // But keep the fallback helper just in case
  const firstImg = firstItem?.image || getProductImage(firstItem);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
        activeOpacity={0.92}
      >
        <View style={[styles.orderAccent, { backgroundColor: meta.color }]} />
        <View style={styles.orderCardInner}>
          {/* Header */}
          <View style={styles.orderCardHeader}>
            <View style={styles.orderIdRow}>
              <View style={[styles.orderIdIcon, { backgroundColor: meta.bg }]}>
                <Ionicons name="receipt-outline" size={14} color={meta.color} />
              </View>
              <View>
                <Text style={styles.orderIdText}>#{item.orderNumber || (item._id || '').substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDateText}>{item.createdAt || item.orderDate}</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={11} color={meta.color} />
              <Text style={[styles.statusPillText, { color: meta.color }]}>{statusText}</Text>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.orderPreviewRow}>
            <View style={styles.previewImageWrap}>
              <Image source={{ uri: firstImg }} style={styles.previewImage} />
              {itemCount > 1 && (
                <View style={styles.previewMore}>
                  <Text style={styles.previewMoreText}>+{itemCount - 1}</Text>
                </View>
              )}
            </View>
            <View style={styles.previewDetails}>
              <View style={styles.previewItemCountRow}>
                <Ionicons name="layers-outline" size={12} color="#ADB5BD" />
                <Text style={styles.previewItemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.previewTotal}>GH₵ {typeof totalPrice === 'string' ? totalPrice : totalPrice?.toFixed ? totalPrice.toFixed(2) : totalPrice}</Text>
              {item.deliverySchedule?.preferredDay && (
                <View style={styles.previewDelivery}>
                  <Ionicons name="calendar-outline" size={12} color="#4CAF50" />
                  <Text style={styles.previewDeliveryText}>{item.deliverySchedule.preferredDay}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: meta.bg }]} 
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
            >
              <Ionicons name={normalizedStatus === 'delivered' ? 'receipt-outline' : 'navigate-outline'} size={18} color={meta.color} />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.orderActionsRow}>
            {normalizedStatus === 'delivered' ? (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleReorder(item)} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={14} color="#fff" />
                <Text style={styles.actionBtnPrimaryText}>Reorder</Text>
              </TouchableOpacity>
            ) : normalizedStatus !== 'cancelled' ? (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnTrack]} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })} activeOpacity={0.8}>
                <Ionicons name="locate-outline" size={14} color="#1565C0" />
                <Text style={styles.actionBtnTrackText}>Track Order</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionBtnPlaceholder} />
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGhost]} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })} activeOpacity={0.8}>
              <Text style={styles.actionBtnGhostText}>View Details</Text>
              <Ionicons name="chevron-forward" size={13} color="#ADB5BD" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

  // ─── EMPTY ──────────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="bag-handle-outline" size={38} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>{filter === 'all' ? 'No orders yet' : `No ${filter.replace('_', ' ')} orders`}</Text>
      <Text style={styles.emptySub}>
        {filter === 'all' ? "You haven't placed any orders yet. Start shopping!" : `You don't have any ${filter.replace('_', ' ')} orders at the moment.`}
      </Text>
      {filter !== 'all' ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => setFilter('all')}>
          <Ionicons name="apps-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>View All Orders</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Products')}>
          <Ionicons name="storefront-outline" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── NOT AUTHENTICATED ─────────────────────────────────────────────────────
  if (!isAuthenticated && !loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
          <View style={styles.authHero}>
            <TouchableOpacity style={styles.navBtnLight} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#2C3E50" />
            </TouchableOpacity>
            <View style={styles.authHeroText}>
              <Text style={styles.authHeroTitleLight}>My Orders</Text>
              <Text style={styles.authHeroSubLight}>Track and manage your orders</Text>
            </View>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1774698867/delivery_vtq4ru.jpg' }}
              style={styles.riderAvatarImage}
            />
          </View>
        </SafeAreaView>
        <View style={styles.authBody}>
          <View style={styles.authCard}>
            <View style={styles.authIconBg}>
              <Ionicons name="lock-closed-outline" size={28} color="#2E7D32" />
            </View>
            <Text style={styles.authCardTitle}>Sign in to continue</Text>
            <Text style={styles.authCardSub}>View your order history, track deliveries and manage your account.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
          <View style={styles.authHero}>
            <TouchableOpacity style={styles.navBtnLight} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#2C3E50" />
            </TouchableOpacity>
            <View style={styles.authHeroText}>
              <Text style={styles.authHeroTitleLight}>My Orders</Text>
            </View>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1774698867/delivery_vtq4ru.jpg' }}
              style={styles.riderAvatarImage}
            />
          </View>
        </SafeAreaView>
        <View style={styles.loadingBody}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          <Text style={styles.loadingTitle}>Fetching your orders</Text>
          <Text style={styles.loadingSub}>Please wait a moment…</Text>
        </View>
      </View>
    );
  }

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StaticNavBar />
      
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id || item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4CAF50']} 
            tintColor="#4CAF50" 
          />
        }
        ListHeaderComponent={
          <>
            <ScrollableHeader />
            {renderFilters()}
            {renderResultsRow()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─── Styles (unchanged) ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { flexGrow: 1, paddingBottom: 32 },
  navBarContainer: {
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 3, zIndex: 10,
  },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center',
  },
  navRight: { flexDirection: 'row', gap: 12 },
  scrollableHeader: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greetingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  greetingTextContainer: { flex: 1 },
  welcomeText: { fontSize: 14, color: '#6C757D', fontWeight: '500', marginBottom: 4 },
  greetingText: { fontSize: 28, fontWeight: '800', color: '#212529', letterSpacing: -0.5 },
  avatarContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8F9FA',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: '#4CAF50', elevation: 4,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  statsContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12,
  },
  statsDivider: { width: 1, height: 32, backgroundColor: '#E9ECEF' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#212529', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#6C757D', fontWeight: '600', letterSpacing: 0.3 },
  activeNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF8E1', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFE0B2',
  },
  nudgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD54F' },
  nudgeText: { fontSize: 12, color: '#F57F17', fontWeight: '700' },
  filtersContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filtersScroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#E9ECEF', backgroundColor: '#F8F9FA', gap: 5,
  },
  filterChipText: { fontSize: 13, color: '#6C757D', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  filterBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeInactive: { backgroundColor: '#E9ECEF' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#6C757D' },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 10,
  },
  resultsText: { fontSize: 13, color: '#ADB5BD', fontWeight: '500' },
  clearButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  clearButtonText: { fontSize: 12, color: '#ADB5BD', fontWeight: '600' },
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  orderAccent: { height: 3.5, width: '100%' },
  orderCardInner: { padding: 16 },
  orderCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIdIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  orderIdText: { fontSize: 14, fontWeight: '700', color: '#212529' },
  orderDateText: { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20, gap: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  orderPreviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F8F9FA',
  },
  previewImageWrap: { position: 'relative' },
  previewImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#F8F9FA' },
  previewMore: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  previewMoreText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  previewDetails: { flex: 1 },
  previewItemCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  previewItemCount: { fontSize: 12, color: '#ADB5BD', fontWeight: '500' },
  previewTotal: { fontSize: 22, fontWeight: '800', color: '#2E7D32', marginBottom: 4 },
  previewDelivery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewDeliveryText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  quickAction: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  orderActionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 5,
  },
  actionBtnPrimary: {
    backgroundColor: '#2E7D32', shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3,
  },
  actionBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtnTrack: { backgroundColor: '#E3F2FD' },
  actionBtnTrackText: { color: '#1565C0', fontSize: 13, fontWeight: '700' },
  actionBtnGhost: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF' },
  actionBtnGhostText: { color: '#6C757D', fontSize: 13, fontWeight: '600' },
  actionBtnPlaceholder: { flex: 1 },
  emptyContainer: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 40, paddingBottom: 32 },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32',
    paddingVertical: 13, paddingHorizontal: 24, borderRadius: 13, gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  riderAvatarImage: { width: 80, height: 80, resizeMode: 'contain' },
  navBtnLight: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center',
  },
  authHero: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22,
    borderBottomWidth: 1, borderBottomColor: '#F1F3F5',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  authHeroText: { flex: 1, alignItems: 'center' },
  authHeroTitleLight: {
    fontSize: 28, fontWeight: '900', color: '#212529', letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 4,
  },
  authHeroSubLight: { fontSize: 13, color: '#6C757D', marginTop: 3, textAlign: 'center' },
  authBody: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F8F9FA' },
  authCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  authIconBg: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  authCardTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  authCardSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32',
    paddingVertical: 13, paddingHorizontal: 28, borderRadius: 13, gap: 8,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loadingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F8F9FA' },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F8E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
  loadingSub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center' },
});

export default OrdersScreen;