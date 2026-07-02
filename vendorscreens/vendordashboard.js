// src/screens/vendor/VendorDashboardScreen.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfileDetails, getMyProducts } from '../apis/vendorApi';
import { NotificationContext } from '../context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const CAMPUS_LABELS = {
  UG: 'University of Ghana', KNUST: 'KNUST', UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba', UPSA: 'UPSA', GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University', ATU: 'Accra Technical University', OTHER: 'Other',
};

const CONDITION_LABELS = {
  'new': { label: 'New', bg: '#E8F5E9', text: '#2E7D32' },
  'like-new': { label: 'Like New', bg: '#E8F5E9', text: '#2E7D32' },
  'excellent': { label: 'Excellent', bg: '#E3F2FD', text: '#1565C0' },
  'good': { label: 'Good', bg: '#FFF8E1', text: '#F57F17' },
  'fair': { label: 'Fair', bg: '#FFF3E0', text: '#E65100' },
  'slightly-used': { label: 'Slightly Used', bg: '#FFF3E0', text: '#E65100' },
  'for-parts': { label: 'For Parts', bg: '#FFEBEE', text: '#C62828' },
};

const StatCard = ({ value, label, hint, iconName, iconBg, iconColor }) => (
  <View style={styles.statCard}>
    <View style={styles.statRight}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  </View>
);

const ActionCard = ({ label, hint, iconName, iconBg, iconColor, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.actionCard, disabled && styles.actionCardDisabled]}
    onPress={onPress}
    activeOpacity={disabled ? 1 : 0.78}
    disabled={disabled}
  >
    <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName} size={22} color={iconColor} />
    </View>
    <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>{label}</Text>
    <Text style={styles.actionHint}>{hint}</Text>
  </TouchableOpacity>
);

const ProductCard = ({ product, onPress }) => {
  const imageUri = product.images?.[0] || product.image;
  const conditionCfg = CONDITION_LABELS[product.condition];
  const isAvailable = product.isAvailable && (product.countInStock ?? 0) > 0;

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(product)} activeOpacity={0.85}>
      <View style={styles.productImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImg} resizeMode="cover" />
        ) : (
          <View style={styles.productImgPlaceholder}>
            <Ionicons name="cube-outline" size={30} color="#A5D6A7" />
          </View>
        )}
        {conditionCfg && (
          <View style={[styles.conditionBadge, { backgroundColor: conditionCfg.bg }]}>
            <Text style={[styles.conditionBadgeText, { color: conditionCfg.text }]}>{conditionCfg.label}</Text>
          </View>
        )}
        {product.negotiable && (
          <View style={styles.negotiableTag}>
            <Text style={styles.negotiableTagText}>Negotiable</Text>
          </View>
        )}
        {!isAvailable && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Sold Out</Text>
          </View>
        )}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.campus && (
          <View style={styles.campusPill}>
            <Ionicons name="school-outline" size={9} color="#2E7D32" />
            <Text style={styles.campusPillText}>{product.campus}</Text>
          </View>
        )}
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>GH₵ {product.price?.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const VendorDashboardScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { notifications } = useContext(NotificationContext);
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, productsRes] = await Promise.all([
        getMyProfileDetails(),
        getMyProducts(),
      ]);

      if (profileRes?.status === 200) {
        setProfile(profileRes.data.data || profileRes.data);
      } else {
        setError('Could not load profile.');
      }

      if (productsRes?.status === 200) {
        const data = productsRes.data?.data || productsRes.data || [];
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to load dashboard. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  const handleNotificationPress = async () => {
    navigation.navigate('Notification');
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  };

  const productCount = products.length;
  const isVerified = profile?.isVerified;
  const activeCount = products.filter(p => p.isAvailable && (p.countInStock ?? 0) > 0).length;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerGreeting}>{greeting}</Text>
              <Text style={styles.headerStoreName} numberOfLines={1}>
                {profile?.storeName || profile?.name || 'My Store'}
              </Text>
            </View>
            <View style={styles.headerBtns}>
              <TouchableOpacity 
                style={styles.iconBtn} 
                onPress={() => navigation.navigate('Account')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="person-outline" size={18} color="#E8F5E9" />
              </TouchableOpacity>
              
              {/* ✅ FIXED: Notification button with properly positioned badge */}
              <TouchableOpacity 
                style={styles.notifBtn} 
                onPress={handleNotificationPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons 
                  name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} 
                  size={20} 
                  color="#E8F5E9" 
                />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {profile && (
            <View style={styles.profileBand}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileInitial}>{profile.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {profile.campus ? CAMPUS_LABELS[profile.campus] || profile.campus : 'Campus not set'}
                  {profile.location?.campusArea ? ` · ${profile.location.campusArea}` : ''}
                </Text>
              </View>
              <View style={[styles.verifiedBadge, !isVerified && styles.pendingBadge]}>
                <View style={[styles.badgeDot, !isVerified && styles.badgeDotPending]} />
                <Text style={styles.badgeText}>{isVerified ? 'Verified' : 'Pending'}</Text>
              </View>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B71C1C" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard value={productCount} label="Products" hint={`${activeCount} active`} iconName="cube-outline" iconBg="#E8F5E9" iconColor="#2E7D32" />
          <StatCard value={profile?.rating?.toFixed(1) || '0.0'} label="Rating" hint={`${profile?.numReviews || 0} reviews`} iconName="star-outline" iconBg="#FFF8E1" iconColor="#F57F17" />
          <StatCard value={profile?.totalSales || 0} label="Sales" hint="Total sold" iconName="cart-outline" iconBg="#E3F2FD" iconColor="#1565C0" />
        </View>

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <ActionCard label="My products" hint={`${productCount} item${productCount !== 1 ? 's' : ''}`} iconName="list-outline" iconBg="#E8F5E9" iconColor="#2E7D32" onPress={() => navigation.navigate('MyProducts')} />
          <ActionCard label="Add product" hint="New listing" iconName="add-circle-outline" iconBg="#FFF3E0" iconColor="#E65100" onPress={() => navigation.navigate('AddProduct')} />
          <ActionCard label="Edit profile" hint="Update your info" iconName="person-outline" iconBg="#E3F2FD" iconColor="#1565C0" onPress={() => navigation.navigate('Account')} />
          <ActionCard label="Analytics" hint="Coming soon" iconName="bar-chart-outline" iconBg="#F3E5F5" iconColor="#7B1FA2" disabled />
        </View>

        {/* Products Grid */}
        {products.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Listings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {products.slice(0, 6).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onPress={handleProductPress}
                />
              ))}
            </View>
          </View>
        )}

        {products.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cube-outline" size={36} color="#A5D6A7" />
            </View>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>Start selling by adding your first listing</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  header: {
    backgroundColor: '#1B5E20',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 28, 
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerGreeting: {
    fontSize: 12, 
    color: '#81C784', 
    fontWeight: '600',
    letterSpacing: 0.5, 
    textTransform: 'uppercase', 
    marginBottom: 4,
  },
  headerStoreName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    letterSpacing: -0.4,
  },
  headerBtns: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 4,
    alignItems: 'center',
  },
  iconBtn: {
    width: 38, 
    height: 38, 
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  // ✅ FIXED: Notification button with relative positioning for badge
  notifBtn: {
    width: 38, 
    height: 38, 
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',  // ← Required for absolute badge positioning
  },
  // ✅ FIXED: Properly positioned notification badge
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4D4F',  // ← Bright red for visibility
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#1B5E20',  // ← Matches header background
    zIndex: 10,
  },
  notifBadgeText: {
    color: '#FFFFFF',  // ← White text for contrast
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  
  profileBand: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)', 
    borderRadius: 16, 
    padding: 13, 
    gap: 12,
  },
  profileAvatar: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.3)' 
  },
  profileAvatarPlaceholder: {
    width: 46, 
    height: 46, 
    borderRadius: 23,
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileInitial: { 
    fontSize: 19, 
    fontWeight: '800', 
    color: '#1B5E20' 
  },
  profileInfo: { 
    flex: 1 
  },
  profileName: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  profileMeta: { 
    fontSize: 12, 
    color: '#A5D6A7', 
    marginTop: 2 
  },
  verifiedBadge: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5,
    backgroundColor: '#388E3C', 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 6,
  },
  pendingBadge: { 
    backgroundColor: '#E65100' 
  },
  badgeDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#A5D6A7' 
  },
  badgeDotPending: { 
    backgroundColor: '#FFCC80' 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },

  scrollContent: { 
    paddingHorizontal: 12 
  },
  errorBanner: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: '#FFEBEE', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: '#FFCDD2',
  },
  errorBannerText: { 
    flex: 1, 
    fontSize: 13, 
    color: '#B71C1C', 
    fontWeight: '500' 
  },

  statsGrid: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 22 
  },
  statCard: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 14,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    elevation: 2,
  },
  statRight: { 
    flex: 1 
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1B2714', 
    letterSpacing: -0.3 
  },
  statLabel: { 
    fontSize: 11, 
    color: '#888888', 
    fontWeight: '500', 
    marginTop: 2 
  },
  statHint: { 
    fontSize: 10, 
    color: '#BBBBBB', 
    marginTop: 2 
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1B2714' 
  },
  seeAllText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#2E7D32' 
  },

  actionsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: 22 
  },
  actionCard: {
    width: (width - 42) / 2, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    elevation: 2,
  },
  actionCardDisabled: { 
    opacity: 0.55 
  },
  actionIconWrap: { 
    width: 42, 
    height: 42, 
    borderRadius: 13, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  actionLabel: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1B2714', 
    marginBottom: 3 
  },
  actionLabelDisabled: { 
    color: '#9E9E9E' 
  },
  actionHint: { 
    fontSize: 11, 
    color: '#AAAAAA' 
  },

  productsSection: { 
    marginBottom: 4 
  },
  productsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  productCard: {
    width: CARD_WIDTH, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14,
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#F0F0F0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, 
    shadowRadius: 5, 
    elevation: 2,
  },
  productImgWrap: { 
    position: 'relative' 
  },
  productImg: { 
    width: '100%', 
    height: 130 
  },
  productImgPlaceholder: {
    width: '100%', 
    height: 130, 
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute', 
    top: 6, 
    left: 6,
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 6,
  },
  conditionBadgeText: { 
    fontSize: 9, 
    fontWeight: '700' 
  },
  negotiableTag: {
    position: 'absolute', 
    top: 6, 
    right: 6,
    backgroundColor: '#1B5E20', 
    borderRadius: 6,
    paddingHorizontal: 6, 
    paddingVertical: 2,
  },
  negotiableTagText: { 
    color: '#fff', 
    fontSize: 9, 
    fontWeight: '700' 
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  soldOutText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  productBody: { 
    padding: 10 
  },
  productName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#1B2714', 
    marginBottom: 4, 
    lineHeight: 17 
  },
  campusPill: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3,
    backgroundColor: '#E8F5E9', 
    alignSelf: 'flex-start',
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 8, 
    marginBottom: 8,
  },
  campusPillText: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: '#2E7D32' 
  },
  productFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  productPrice: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#1B5E20' 
  },

  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20 
  },
  emptyIconWrap: {
    width: 72, 
    height: 72, 
    borderRadius: 36,
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1B2714', 
    marginBottom: 6 
  },
  emptySub: { 
    fontSize: 13, 
    color: '#9E9E9E', 
    textAlign: 'center', 
    lineHeight: 19, 
    marginBottom: 20 
  },
  emptyBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: '#2E7D32', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 14,
  },
  emptyBtnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700' 
  },

  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F0F2EE' 
  },
  loadingText: { 
    marginTop: 14, 
    fontSize: 15, 
    color: '#757575' 
  },
});

export default VendorDashboardScreen;