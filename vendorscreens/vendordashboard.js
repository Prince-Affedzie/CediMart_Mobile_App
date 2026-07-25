// src/screens/vendor/VendorDashboardScreen.js
import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '../context/NotificationContext';
import { useVendor } from '../context/VendorContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

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
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  infoBorder:   '#BAE6FD',
  white:        '#FFFFFF',
  black:        '#000000',
};

const CAMPUS_LABELS = {
  UG: 'University of Ghana', KNUST: 'KNUST', UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba', UPSA: 'UPSA', GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University', ATU: 'Accra Technical University', OTHER: 'Other',
};

const CONDITION_LABELS = {
  'new':           { label: 'New',           bg: C.successBg, text: C.success },
  'like-new':      { label: 'Like New',      bg: C.successBg, text: C.success },
  'excellent':     { label: 'Excellent',     bg: C.brandBg,   text: C.brand },
  'good':          { label: 'Good',          bg: C.accentBg,  text: '#D97706' },
  'fair':          { label: 'Fair',          bg: '#FFF7ED',   text: '#EA580C' },
  'slightly-used': { label: 'Slightly Used', bg: '#FFF7ED',   text: '#EA580C' },
  'for-parts':     { label: 'For Parts',     bg: C.dangerBg,  text: C.danger },
};

const StatCard = ({ value, label, hint }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
  </View>
);

const ActionCard = ({ label, hint, iconName, iconBg, iconColor, onPress, disabled }) => (
  <TouchableOpacity style={[styles.actionCard, disabled && styles.actionCardDisabled]} onPress={onPress} activeOpacity={disabled ? 1 : 0.78} disabled={disabled}>
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
          <View style={styles.productImgPlaceholder}><Ionicons name="cube-outline" size={30} color={C.brandBorder} /></View>
        )}
        {conditionCfg && (
          <View style={[styles.conditionBadge, { backgroundColor: conditionCfg.bg }]}>
            <Text style={[styles.conditionBadgeText, { color: conditionCfg.text }]}>{conditionCfg.label}</Text>
          </View>
        )}
        {product.negotiable && (
          <View style={styles.negotiableTag}><Text style={styles.negotiableTagText}>Negotiable</Text></View>
        )}
        {!isAvailable && (
          <View style={styles.soldOutOverlay}><Text style={styles.soldOutText}>Sold Out</Text></View>
        )}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.campus && (
          <View style={styles.campusPill}>
            <Ionicons name="school-outline" size={9} color={C.brand} />
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
  const {
    profile, products, loading, refreshing, error,
    refreshVendorData, activeProducts, pendingOrdersCount, totalRevenue,
  } = useVendor();
  const { notifications } = useContext(NotificationContext);
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  };

  const isVerified = profile?.isVerified;
  const productCount = products.length;
  const activeCount = activeProducts.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.brand} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshVendorData} tintColor={C.brand} colors={[C.brand]} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerGreeting}>{greeting}</Text>
              <Text style={styles.headerStoreName} numberOfLines={1}>{profile?.storeName || profile?.name || 'My Store'}</Text>
            </View>
            <View style={styles.headerBtns}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Account')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="person-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notification')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {profile && (
            <View style={styles.profileBand}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}><Text style={styles.profileInitial}>{profile.name?.charAt(0)?.toUpperCase() || '?'}</Text></View>
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
            <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard value={productCount} label="Products" hint={`${activeCount} active`} />
          <StatCard value={profile?.rating?.toFixed(1) || '0.0'} label="Rating" hint={`${profile?.numReviews || 0} reviews`} />
          <StatCard value={profile?.totalSales || 0} label="Sales" hint="Total sold" />
          <StatCard value={`GH₵ ${totalRevenue.toFixed(0)}`} label="Revenue" hint="Completed orders" />
        </View>

        {/* Quick actions */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Quick actions</Text></View>
        <View style={styles.actionsGrid}>
          <ActionCard label="My products" hint={`${productCount} item${productCount !== 1 ? 's' : ''}`} iconName="list-outline" iconBg={C.brandBg} iconColor={C.brand} onPress={() => navigation.navigate('MyProducts')} />
          <ActionCard label="Add product" hint="New listing" iconName="add-circle-outline" iconBg={C.accentBg} iconColor={C.accent} onPress={() => navigation.navigate('AddProduct')} />
          <ActionCard label="Edit profile" hint="Update your info" iconName="person-outline" iconBg={C.infoBg} iconColor={C.info} onPress={() => navigation.navigate('Account')} />
          <ActionCard label="Orders" hint={`${pendingOrdersCount} pending`} iconName="clipboard-outline" iconBg={C.accentBg} iconColor={C.accent} onPress={() => navigation.navigate('Orders')} />
        </View>

        {/* Products Grid */}
        {products.length > 0 ? (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Listings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {products.slice(0, 6).map((product) => (
                <ProductCard key={product._id} product={product} onPress={handleProductPress} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}><Ionicons name="cube-outline" size={36} color={C.brandBorder} /></View>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>Start selling by adding your first listing</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddProduct')}>
              <Ionicons name="add" size={18} color="#fff" /><Text style={styles.emptyBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.brand, borderRadius: 21, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, marginBottom: 12 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft: { flex: 1, marginRight: 12 },
  headerGreeting: { fontSize: 12, color: '#99F6E4', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  headerStoreName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  headerBtns: { flexDirection: 'row', gap: 10, marginTop: 4, alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  notifBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: C.brand, zIndex: 10 },
  notifBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  profileBand: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 13, gap: 12 },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  profileAvatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  profileInitial: { fontSize: 19, fontWeight: '800', color: C.brand },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  profileMeta: { fontSize: 12, color: '#99F6E4', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.success, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  pendingBadge: { backgroundColor: C.accent },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A7F3D0' },
  badgeDotPending: { backgroundColor: '#FED7AA' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 12 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.dangerBg, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.dangerBorder },
  errorBannerText: { flex: 1, fontSize: 13, color: C.danger, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 22, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: 16, padding: 14, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: C.t1, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: C.t3, fontWeight: '500', marginTop: 2 },
  statHint: { fontSize: 10, color: C.t3, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.t1 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: C.brand },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  actionCard: { width: (width - 42) / 2, backgroundColor: C.surface, borderRadius: 16, padding: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  actionCardDisabled: { opacity: 0.55 },
  actionIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: C.t1, marginBottom: 3 },
  actionLabelDisabled: { color: C.t3 },
  actionHint: { fontSize: 11, color: C.t3 },
  productsSection: { marginBottom: 4 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: { width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  productImgWrap: { position: 'relative' },
  productImg: { width: '100%', height: 130 },
  productImgPlaceholder: { width: '100%', height: 130, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  conditionBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  conditionBadgeText: { fontSize: 9, fontWeight: '700' },
  negotiableTag: { position: 'absolute', top: 6, right: 6, backgroundColor: C.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  negotiableTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  soldOutOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  soldOutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: C.t1, marginBottom: 4, lineHeight: 17 },
  campusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.brandBg, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  campusPillText: { fontSize: 10, fontWeight: '600', color: C.brand },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 15, fontWeight: '800', color: C.accent },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.t3, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingText: { marginTop: 14, fontSize: 15, color: C.t2 },
});

export default VendorDashboardScreen;