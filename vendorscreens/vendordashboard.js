// src/screens/vendor/VendorDashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfileDetails, getMyProducts } from '../apis/vendorApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
const StatCard = ({ value, label, hint, iconName, iconBg, iconColor }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName} size={20} color={iconColor} />
    </View>
    <View style={styles.statRight}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Action Card
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────
const ProductCard = ({ product, onPress }) => {
  const name = product.name || 'Product';
  const price = product.price != null ? `GH₵ ${product.price.toFixed(2)}` : '—';

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(product)} activeOpacity={0.82}>
      {product.image ? (
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.productInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{name}</Text>
        <Text style={styles.productPrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const VendorDashboardScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
        setProducts(productsRes.data.data || productsRes.data || []);
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

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['vendorToken', 'vendorData']);
    navigation.reset({ index: 0, routes: [{ name: 'VendorLogin' }] });
  };

  const productCount = products.length;
  const isVerified = profile?.is_verified;

  // ── Loading state ──
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBg} />
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
        {/* ── Scrollable content ── */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
            colors={['#2E7D32']}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Top row */}
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>{greeting}</Text>
            <Text style={styles.headerStoreName} numberOfLines={1}>
              {profile?.name || 'My Store'}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={18} color="#E8F5E9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile band */}
        {profile && (
          <View style={styles.profileBand}>
            {profile.profile_image ? (
              <Image source={{ uri: profile.profile_image }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileInitial}>
                  {profile.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
              <Text style={styles.profileMeta} numberOfLines={1}>
                {profile.market_name ? `${profile.market_name} · Accra` : 'Accra'}
              </Text>
            </View>
            <View style={[styles.verifiedBadge, !isVerified && styles.pendingBadge]}>
              <View style={[styles.badgeDot, !isVerified && styles.badgeDotPending]} />
              <Text style={styles.badgeText}>{isVerified ? 'Verified' : 'Pending'}</Text>
            </View>
          </View>
        )}
      </View>

      
        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B71C1C" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard
            value={productCount}
            label="Products"
            hint="Active listings"
            iconName="cube-outline"
            iconBg="#E8F5E9"
            iconColor="#2E7D32"
          />
          <StatCard
            value={isVerified ? 'Live' : 'Pending'}
            label="Store status"
            hint={isVerified ? 'Visible to buyers' : 'Awaiting approval'}
            iconName={isVerified ? 'checkmark-circle-outline' : 'time-outline'}
            iconBg={isVerified ? '#E8F5E9' : '#FFF3E0'}
            iconColor={isVerified ? '#2E7D32' : '#E65100'}
          />
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <ActionCard
            label="My products"
            hint={`${productCount} item${productCount !== 1 ? 's' : ''}`}
            iconName="list-outline"
            iconBg="#E8F5E9"
            iconColor="#2E7D32"
            onPress={() => navigation.navigate('MyProducts')}
          />
          <ActionCard
            label="Add product"
            hint="New listing"
            iconName="add-circle-outline"
            iconBg="#FFF3E0"
            iconColor="#E65100"
            onPress={() => navigation.navigate('AddProduct')}
          />
          <ActionCard
            label="Edit profile"
            hint="Update your info"
            iconName="person-outline"
            iconBg="#E3F2FD"
            iconColor="#1565C0"
            onPress={() => navigation.navigate('Settings')}
          />
          <ActionCard
            label="Analytics"
            hint="Coming soon"
            iconName="bar-chart-outline"
            iconBg="#F3E5F5"
            iconColor="#7B1FA2"
            disabled
          />
        </View>

        {/* ── Orders slot (reserved for future) ── */}
        <View style={styles.ordersCard}>
          <View style={styles.ordersLeft}>
            <View style={styles.ordersIconWrap}>
              <Ionicons name="cart-outline" size={22} color="#2E7D32" />
            </View>
            <View>
              <Text style={styles.ordersTitle}>Orders</Text>
              <Text style={styles.ordersSub}>Order management coming soon</Text>
            </View>
          </View>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </View>

        {/* ── Recent products ── */}
        {products.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productStrip}
            >
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onPress={(p) => navigation.navigate('ProductDetail', { productId: p._id,product: p })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2EE',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#1B5E20',
    
  },

  // ── Header ──
  header: {
    borderTopRightRadius:8,
    borderTopLeftRadius:8,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    marginBottom:12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
    maxWidth: width - 120,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile band
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
    borderColor: 'rgba(255,255,255,0.3)',
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
    color: '#1B5E20',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileMeta: {
    fontSize: 12,
    color: '#A5D6A7',
    marginTop: 2,
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
    backgroundColor: '#E65100',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A5D6A7',
  },
  badgeDotPending: {
    backgroundColor: '#FFCC80',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Scroll content ──
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 12,
  },

  // Error banner
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
    fontWeight: '500',
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
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
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statRight: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2714',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '500',
    marginTop: 2,
  },
  statHint: {
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 2,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2714',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ── Actions ──
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
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
    opacity: 0.55,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2714',
    marginBottom: 3,
  },
  actionLabelDisabled: {
    color: '#9E9E9E',
  },
  actionHint: {
    fontSize: 11,
    color: '#AAAAAA',
  },

  // ── Orders reserved slot ──
  ordersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  ordersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ordersIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2714',
  },
  ordersSub: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 2,
  },
  comingSoonPill: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Recent products ──
  recentSection: {
    marginBottom: 4,
  },
  productStrip: {
    gap: 10,
    paddingRight: 4,
  },
  productCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 90,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productBody: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B2714',
    marginBottom: 4,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B5E20',
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2EE',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#757575',
  },
});

export default VendorDashboardScreen;