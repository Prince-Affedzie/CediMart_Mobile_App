// src/screens/VendorDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
  Dimensions, Alert, Modal, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorById } from '../apis/vendorApi';
import { getFeed } from '../apis/feedApi';
import { followUser } from '../apis/userApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CAMPUS_LABELS = {
  UG: 'University of Ghana', KNUST: 'KNUST', UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba', UPSA: 'UPSA', GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University', ATU: 'Accra Technical University', OTHER: 'Other',
};

const FEED_TYPE_CONFIG = {
  product_reel: { icon: 'pricetag-outline', color: '#0D9488', label: 'Product' },
  service_reel: { icon: 'construct-outline', color: '#7C3AED', label: 'Service' },
  lifestyle: { icon: 'camera-outline', color: '#F97316', label: 'Lifestyle' },
  campus_event: { icon: 'calendar-outline', color: '#0284C7', label: 'Event' },
  campus_hack: { icon: 'bulb-outline', color: '#F59E0B', label: 'Campus Hack' },
  funny_moment: { icon: 'happy-outline', color: '#EC4899', label: 'Funny' },
  achievement: { icon: 'trophy-outline', color: '#059669', label: 'Achievement' },
};

const C = {
  brand: '#0D9488', brandL: '#14B8A6', brandD: '#0F766E',
  brandBg: '#F0FDFA', brandBorder: '#99F6E4',
  accent: '#F97316', accentBg: '#FFF7ED', accentBorder: '#FED7AA',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  bg: '#F8FAFC', surface: '#FFFFFF', elev: '#F1F5F9',
  t1: '#0F172A', t2: '#475569', t3: '#94A3B8',
  white: '#FFFFFF', gold: '#F59E0B',
};

const formatCount = (count) => {
  if (!count && count !== 0) return '';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const getTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ─── Feed Post Card ─────────────────────────────────────────────────────────
const FeedPostCard = ({ post, onPress }) => {
  const typeCfg = FEED_TYPE_CONFIG[post.type] || FEED_TYPE_CONFIG.product_reel;
  const hasMedia = post.media?.length > 0;
  return (
    <TouchableOpacity style={s.feedCard} onPress={onPress} activeOpacity={0.9}>
      {hasMedia ? (
        <View style={s.feedMediaWrap}>
          <Image source={{ uri: post.media[0].url }} style={s.feedMedia} />
          {post.media.length > 1 && (
            <View style={s.feedMediaCount}>
              <Ionicons name="images-outline" size={10} color="#fff" />
              <Text style={s.feedMediaCountText}>{post.media.length}</Text>
            </View>
          )}
          <View style={[s.feedTypeBadge, { backgroundColor: typeCfg.color + 'CC' }]}>
            <Text style={s.feedTypeText}>{typeCfg.label}</Text>
          </View>
        </View>
      ) : (
        <View style={[s.feedMediaWrap, s.feedMediaTextOnly]}>
          <Ionicons name={typeCfg.icon} size={24} color={typeCfg.color} />
        </View>
      )}
      <View style={s.feedBody}>
        <Text style={s.feedTitle} numberOfLines={2}>{post.title}</Text>
        <View style={s.feedStats}>
          <View style={s.feedStat}>
            <Ionicons name="heart-outline" size={11} color={C.t3} />
            <Text style={s.feedStatText}>{formatCount(post.likes?.length || 0)}</Text>
          </View>
          <View style={s.feedStat}>
            <Ionicons name="chatbubble-outline" size={10} color={C.t3} />
            <Text style={s.feedStatText}>{formatCount(post.comments?.length || 0)}</Text>
          </View>
          <Text style={s.feedTime}>{getTimeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const VendorDetailScreen = ({ route, navigation }) => {
  const { vendorId } = route.params;
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'posts'

  // Feed & Follow
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const fetchVendor = async () => {
    try {
      setError(null);
      const res = await getVendorById(vendorId);
      if (res.status === 200 && res.data.success) {
        const vendorData = res.data.data;
        setVendor(vendorData);
        setFollowerCount(vendorData.followersCount || vendorData.followers?.length || 0);
        if (vendorData.user) {
          fetchVendorFeed(vendorData.user._id || vendorData.user);
        }
      } else {
        setError('Vendor not found.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVendorFeed = async (userId) => {
    setFeedLoading(true);
    try {
      const res = await getFeed({ limit: 20 });
      const allPosts = res.data?.data?.posts || [];
      const vendorPosts = allPosts.filter(
        post => post.author?._id === userId || post.author === userId
      );
      setFeedPosts(vendorPosts);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to follow vendors.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    const vendorUserId = vendor?.user?._id || vendor?.user;
    if (!vendorUserId) return;
    setFollowLoading(true);
    try {
      const res = await followUser(vendorUserId);
      if (res.data?.success) {
        setIsFollowing(res.data.data.isFollowing);
        setFollowerCount(prev => res.data.data.isFollowing ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => { fetchVendor(); }, [vendorId]);
  const onRefresh = () => { setRefreshing(true); fetchVendor(); };

  const getQuantityInCart = (productId) => {
    const item = cartItems.find(i => i.product?._id === productId || i.productId === productId);
    return item?.quantity ?? 0;
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to add items to cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!product.isAvailable || (product.countInStock ?? 0) <= 0) {
      Alert.alert('Unavailable', `${product.name} is no longer available.`);
      return;
    }
    try {
      setAddingProductId(product._id); setAddedProductName(product.name);
      await addToCart(product._id, 1); setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2200);
    } catch { Alert.alert('Error', 'Failed to add item to cart.'); }
    finally { setAddingProductId(null); }
  };

  const isValidImage = (url) => url && !url.includes('default_banner') && !url.includes('default_profile');
  const products = vendor?.products || [];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={C.brand} />
      </SafeAreaView>
    );
  }

  if (error || !vendor) {
    return (
      <SafeAreaView style={[s.container, s.centered, { padding: 32 }]} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={52} color={C.t3} />
        <Text style={[s.loadingText, { marginTop: 12 }]}>{error || 'Vendor not found'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); fetchVendor(); }}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.successModal}>
            <View style={s.modalIconRing}><Ionicons name="checkmark" size={28} color="#fff" /></View>
            <Text style={s.successTitle}>Added to Cart</Text>
            <Text style={s.successMsg}>{addedProductName}</Text>
            <TouchableOpacity style={s.modalPrimaryBtn} onPress={() => { setModalVisible(false); navigation.navigate('Cart'); }}>
              <Ionicons name="cart-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.modalPrimaryBtnText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSecondaryBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalSecondaryText}>Continue Browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={activeTab === 'products' ? products : feedPosts}
        keyExtractor={(item, index) => item._id || index.toString()}
        numColumns={activeTab === 'products' ? 2 : 1}
        key={activeTab} // Force re-render on tab change
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View>
            {/* Hero Banner */}
            <View style={s.heroBanner}>
              {isValidImage(vendor.storeBanner) ? (
                <Image source={{ uri: vendor.storeBanner }} style={s.bannerImage} />
              ) : (
                <View style={s.bannerFallback} />
              )}
              <View style={s.bannerScrim} />
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Info — horizontal layout like Instagram */}
            <View style={s.profileSection}>
              <View style={s.avatarRing}>
                {isValidImage(vendor.profileImage) ? (
                  <Image source={{ uri: vendor.profileImage }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{vendor.name?.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                )}
              </View>

              <View style={s.profileStats}>
                {/* Stats Row */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(products.length)}</Text>
                    <Text style={s.statLabel}>Products</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(followerCount)}</Text>
                    <Text style={s.statLabel}>Followers</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(feedPosts.length)}</Text>
                    <Text style={s.statLabel}>Posts</Text>
                  </View>
                </View>

                {/* Follow Button + Verified Badge in one row */}
                <View style={s.actionRow}>
                  {vendor.isVerified && (
                    <View style={s.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={13} color={C.success} />
                      <Text style={s.verifiedText}>Verified</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.followBtn, isFollowing && s.followBtnActive]}
                    onPress={handleFollow}
                    disabled={followLoading}
                    activeOpacity={0.85}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={isFollowing ? C.brand : '#fff'} />
                    ) : (
                      <Text style={[s.followBtnText, isFollowing && s.followBtnTextActive]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Name & Bio */}
            <View style={s.nameSection}>
              <Text style={s.vendorName}>{vendor.name}</Text>
              {vendor.storeName && <Text style={s.storeName}>{vendor.storeName}</Text>}
              {vendor.campus && (
                <Text style={s.campusText}>{CAMPUS_LABELS[vendor.campus] || vendor.campus}</Text>
              )}
              {vendor.bio && <Text style={s.bioText}>{vendor.bio}</Text>}
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
              <TouchableOpacity
                style={[s.tab, activeTab === 'products' && s.tabActive]}
                onPress={() => setActiveTab('products')}
              >
                <Ionicons name="grid-outline" size={16} color={activeTab === 'products' ? C.brand : C.t3} />
                <Text style={[s.tabText, activeTab === 'products' && s.tabTextActive]}>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, activeTab === 'posts' && s.tabActive]}
                onPress={() => setActiveTab('posts')}
              >
                <Ionicons name="newspaper-outline" size={16} color={activeTab === 'posts' ? C.brand : C.t3} />
                <Text style={[s.tabText, activeTab === 'posts' && s.tabTextActive]}>Posts</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'products') {
            const isInCart = getQuantityInCart(item._id) > 0;
            const isAdding = addingProductId === item._id;
            const isAvailable = item.isAvailable && (item.countInStock ?? 0) > 0;
            return (
              <TouchableOpacity
                style={s.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id, product: item })}
                activeOpacity={0.88}
              >
                <View style={s.productImgWrap}>
                  <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300/F5F5F5/BDBDBD?text=No+Image' }} style={s.productImg} />
                  {!isAvailable && <View style={s.outOfStockOverlay}><Text style={s.outOfStockText}>Sold Out</Text></View>}
                </View>
                <View style={s.productBody}>
                  <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
                  <View style={s.productFooter}>
                    <Text style={s.productPrice}>GH₵ {Number(item.price).toFixed(2)}</Text>
                    <TouchableOpacity
                      style={[s.cartBtn, isInCart && s.cartBtnActive, !isAvailable && s.cartBtnDisabled]}
                      onPress={() => handleAddToCart(item)}
                      disabled={isAdding || !isAvailable}
                      activeOpacity={0.8}
                    >
                      {isAdding ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={isInCart ? 'checkmark' : 'add'} size={14} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }
          return <FeedPostCard post={item} onPress={() => navigation.navigate('FeedPostDetail', { postId: item._id })} />;
        }}
        ListEmptyComponent={
          activeTab === 'posts' && feedLoading ? (
            <View style={s.emptyState}><ActivityIndicator size="small" color={C.brand} /></View>
          ) : (
            <View style={s.emptyState}>
              <Ionicons name={activeTab === 'products' ? 'cube-outline' : 'newspaper-outline'} size={40} color={C.t3} />
              <Text style={s.emptyText}>{activeTab === 'products' ? 'No products yet' : 'No posts yet'}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const shadow = (opacity = 0.06, radius = 10, y = 4) =>
  Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
    android: { elevation: Math.round(radius * 0.6) },
  });

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 60 },
  loadingText: { marginTop: 12, fontSize: 15, color: C.t3 },
  retryBtn: { marginTop: 20, backgroundColor: C.brand, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Hero
  heroBanner: { height: 180, backgroundColor: C.brandD, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: C.brandD },
  bannerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,30,18,0.45)' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

  // Profile — horizontal layout
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, gap: 20,
  },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.surface, overflow: 'hidden', backgroundColor: C.brandBg, marginTop: -40, ...shadow(0.12, 8, 4) },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: '#fff' },

  profileStats: { flex: 1, gap: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: C.t1 },
  statLabel: { fontSize: 11, color: C.t3, marginTop: 2 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: C.success },
  followBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.brand, paddingVertical: 9, borderRadius: 8,
  },
  followBtnActive: { backgroundColor: C.brandBg, borderWidth: 1.5, borderColor: C.brand },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: C.brand },

  // Name section
  nameSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  vendorName: { fontSize: 16, fontWeight: '800', color: C.t1 },
  storeName: { fontSize: 13, color: C.t2, marginTop: 2 },
  campusText: { fontSize: 12, color: C.t3, marginTop: 4 },
  bioText: { fontSize: 13, color: C.t2, marginTop: 6, lineHeight: 19 },

  // Tabs
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    marginTop: 14, paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, marginRight: 24,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.brand },
  tabText: { fontSize: 13.5, fontWeight: '600', color: C.t3 },
  tabTextActive: { color: C.brand },

  // Products
  productCard: { width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', margin: 6, ...shadow(0.04, 6, 2) },
  productImgWrap: { width: '100%', height: 130, position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  outOfStockText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  productBody: { padding: 10 },
  productName: { fontSize: 12.5, fontWeight: '600', color: C.t1, lineHeight: 17, marginBottom: 6 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 14, fontWeight: '800', color: C.accent },
  cartBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  cartBtnActive: { backgroundColor: C.brandD },
  cartBtnDisabled: { backgroundColor: C.t3 },

  // Feed posts
  feedCard: {
    backgroundColor: C.surface, borderRadius: 14, marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...shadow(0.04, 6, 2),
  },
  feedMediaWrap: { height: 180, backgroundColor: '#F1F5F9', position: 'relative' },
  feedMedia: { width: '100%', height: '100%' },
  feedMediaTextOnly: { justifyContent: 'center', alignItems: 'center' },
  feedMediaCount: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  feedMediaCountText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  feedTypeBadge: { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  feedTypeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  feedBody: { padding: 10 },
  feedTitle: { fontSize: 13, fontWeight: '600', color: C.t1, lineHeight: 18, marginBottom: 6 },
  feedStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  feedStatText: { fontSize: 10.5, color: C.t3, fontWeight: '500' },
  feedTime: { fontSize: 10, color: C.t3, marginLeft: 'auto' },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 8, fontSize: 14, color: C.t3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successModal: { backgroundColor: C.surface, borderRadius: 22, padding: 30, alignItems: 'center', width: '100%', maxWidth: 340, ...shadow(0.12, 20, 8) },
  modalIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 18, fontWeight: '800', color: C.t1, marginBottom: 4 },
  successMsg: { fontSize: 13, color: C.t2, textAlign: 'center', marginBottom: 22 },
  modalPrimaryBtn: { width: '100%', flexDirection: 'row', backgroundColor: C.brand, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  modalPrimaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalSecondaryBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.brandBorder, alignItems: 'center' },
  modalSecondaryText: { color: C.brand, fontSize: 13, fontWeight: '600' },
});

export default VendorDetailScreen;