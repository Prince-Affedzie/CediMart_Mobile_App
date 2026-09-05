// src/screens/VendorDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
  Dimensions, Alert, Modal, Platform, FlatList,
  Animated, Pressable, Share, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getVendorById } from '../apis/vendorApi';
import { getFeed } from '../apis/feedApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFollowStore } from '../stores/useFollowStore';
import ChatFAB from '../components/ChatFAB';
import { shareVendorProfile } from '../utils/shareUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const BANNER_HEIGHT = 190;

const CAMPUS_LABELS = {
  UG: 'University of Ghana', KNUST: 'KNUST', UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba', UPSA: 'UPSA', GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University', ATU: 'Accra Technical University', OTHER: 'Other',
};

const BUSINESS_TYPE_LABELS = {
  'product': 'Products',
  'service': 'Services',
  'both': 'Products & Services',
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

const CATEGORY_LABELS = {
  'electronics': 'Electronics', 'phones and tablets': 'Phones & Tablets',
  'computers and laptops': 'Computers & Laptops', 'gaming': 'Gaming',
  'fashion': 'Fashion', 'books-course-materials': 'Books & Course Materials',
  'hostel-items': 'Hostel Items', 'appliances': 'Appliances',
  'furniture': 'Furniture', 'beauty and grooming': 'Beauty & Grooming',
  'sports and fitness': 'Sports & Fitness', 'accessories': 'Accessories',
  'food and drinks': 'Food & Drinks', 'services': 'Services', 'other': 'Other',
};

const CATEGORY_COLORS = {
  'electronics': '#2563EB',
  'phones and tablets': '#7C3AED',
  'computers and laptops': '#0891B2',
  'gaming': '#DB2777',
  'fashion': '#DC2626',
  'books-course-materials': '#B45309',
  'hostel-items': '#0D9488',
  'appliances': '#475569',
  'furniture': '#92400E',
  'beauty and grooming': '#EC4899',
  'sports and fitness': '#16A34A',
  'accessories': '#CA8A04',
  'food and drinks': '#EA580C',
  'services': '#0284C7',
  'other': '#64748B',
};

const C = {
  brand: '#0D9488', brandL: '#14B8A6', brandD: '#0F766E',
  brandBg: '#F0FDFA', brandBorder: '#99F6E4',
  accent: '#F97316', accentBg: '#FFF7ED', accentBorder: '#FED7AA',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  bg: '#F8FAFC', surface: '#FFFFFF', elev: '#F1F5F9',
  t1: '#0F172A', t2: '#475569', t3: '#94A3B8',
  white: '#FFFFFF', gold: '#F59E0B', skeleton: '#EEF2F6',
  info: '#0284C7', infoBg: '#F0F9FF',
};

const shade = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const b = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
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

// ─── Press-scale wrapper for tactile card feedback ─────────────────────────
const Pressy = ({ onPress, style, children, scaleTo = 0.96, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => !disabled && Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => !disabled && Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ─── Feed Post Card ─────────────────────────────────────────────────────────
const FeedPostCard = ({ post, onPress }) => {
  const typeCfg = FEED_TYPE_CONFIG[post.type] || FEED_TYPE_CONFIG.product_reel;
  const hasMedia = post.media?.length > 0;
  return (
    <Pressy onPress={onPress} style={s.feedCard} scaleTo={0.98}>
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
            <Text style={s.feedStatText}>{formatCount(post.commentCount || 0)}</Text>
          </View>
          <Text style={s.feedTime}>{getTimeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </Pressy>
  );
};

// ─── Skeleton loading state ─────────────────────────────────────────────────
const SkeletonBlock = ({ style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });
  return <Animated.View style={[{ backgroundColor: C.skeleton, borderRadius: 8 }, style, { opacity }]} />;
};

const VendorDetailSkeleton = () => (
  <View style={{ flex: 1 }}>
    <SkeletonBlock style={{ width: '100%', height: BANNER_HEIGHT, borderRadius: 0 }} />
    <View style={{ paddingHorizontal: 16 }}>
      <SkeletonBlock style={{ width: 80, height: 80, borderRadius: 40, marginTop: -40, borderWidth: 3, borderColor: C.bg }} />
      <SkeletonBlock style={{ width: '55%', height: 18, marginTop: 16 }} />
      <SkeletonBlock style={{ width: '35%', height: 13, marginTop: 8 }} />
      <SkeletonBlock style={{ width: '70%', height: 13, marginTop: 8 }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <SkeletonBlock style={{ flex: 1, height: 60, borderRadius: 14 }} />
        <SkeletonBlock style={{ flex: 1, height: 60, borderRadius: 14 }} />
        <SkeletonBlock style={{ flex: 1, height: 60, borderRadius: 14 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
        <SkeletonBlock style={{ width: CARD_WIDTH, height: 190, borderRadius: 14 }} />
        <SkeletonBlock style={{ width: CARD_WIDTH, height: 190, borderRadius: 14 }} />
      </View>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const VendorDetailScreen = ({ route, navigation }) => {
  const { vendorId } = route.params;
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isFollowing: checkIsFollowing, follow, unfollow } = useFollowStore();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [sharing, setSharing] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('products');

  // Feed
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const modalScale = useRef(new Animated.Value(0.85)).current;

  // Get vendor user ID for follow check
  const vendorUserId = vendor?.user?._id || vendor?.user;
  const isFollowingVendor = vendorUserId ? checkIsFollowing(vendorUserId) : false;

  const fetchVendor = async () => {
    try {
      setError(null);
      const res = await getVendorById(vendorId);
      if (res.status === 200 && res.data.success) {
        const vendorData = res.data.data;
        setVendor(vendorData);
        setFollowerCount(vendorData.user?.followersCount || vendorData.followersCount || 0);
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
      const res = await getFeed({ limit: 20, author: userId });
      const vendorPosts = res.data?.data?.posts || [];
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
    if (!vendorUserId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFollowLoading(true);
    try {
      if (isFollowingVendor) {
        await unfollow(vendorUserId);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await follow(vendorUserId);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    if (sharing || !vendor) return;
    setSharing(true);
    try {
      const result = await shareVendorProfile(vendor);
      if (result?.success) {
        Toast.show({ type: 'success', text1: 'Vendor shared successfully!' });
      } else if (!result?.cancelled) {
        Toast.show({ type: 'error', text1: 'Failed to share profile' });
      }
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({ type: 'error', text1: 'Could not share profile' });
    } finally {
      setSharing(false);
    }
  };

  const handleTabChange = (tab) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  const handleWhatsApp = () => {
    if (vendor?.whatsapp) {
      const phone = vendor.whatsapp.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${phone}`).catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp');
      });
    }
  };

  const handleInstagram = () => {
    if (vendor?.instagram) {
      const handle = vendor.instagram.replace('@', '');
      Linking.openURL(`https://instagram.com/${handle}`).catch(() => {
        Alert.alert('Error', 'Could not open Instagram');
      });
    }
  };

  useEffect(() => { fetchVendor(); }, [vendorId]);
  const onRefresh = () => { setRefreshing(true); fetchVendor(); };

  useEffect(() => {
    if (modalVisible) {
      modalScale.setValue(0.85);
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
    }
  }, [modalVisible]);

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
      Haptics.selectionAsync().catch(() => {});
      setAddingProductId(product._id); setAddedProductName(product.name);
      await addToCart(product._id, 1); setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2200);
    } catch { Alert.alert('Error', 'Failed to add item to cart.'); }
    finally { setAddingProductId(null); }
  };

  const isValidImage = (url) => url && !url.includes('default_banner') && !url.includes('default_profile');
  const products = vendor?.products || [];
  const bannerCategoryColor = CATEGORY_COLORS[vendor?.categories?.[0]] || C.brandD;
  const hasRating = vendor?.rating > 0 || vendor?.numReviews > 0;
  const categories = vendor?.categories || [];
  const businessType = vendor?.businessType;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <VendorDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !vendor) {
    return (
      <SafeAreaView style={[s.container, s.centered, { padding: 32 }]} edges={['top']}>
        <View style={s.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
        </View>
        <Text style={s.errorTitle}>Couldn't load this store</Text>
        <Text style={s.loadingText}>{error || 'Vendor not found'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); fetchVendor(); }} activeOpacity={0.85}>
          <Ionicons name="refresh" size={15} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <Animated.View style={[s.successModal, { transform: [{ scale: modalScale }] }]}>
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
          </Animated.View>
        </View>
      </Modal>

      <FlatList
        data={activeTab === 'products' ? products : activeTab === 'posts' ? feedPosts : []}
        keyExtractor={(item, index) => item._id || index.toString()}
        numColumns={activeTab === 'products' ? 2 : 1}
        key={activeTab}
        columnWrapperStyle={activeTab === 'products' ? { paddingHorizontal: 10 } : undefined}
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
                <LinearGradient
                  colors={[bannerCategoryColor, shade(bannerCategoryColor, 25)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.bannerImage}
                >
                  <Ionicons name="storefront-outline" size={90} color="rgba(255,255,255,0.10)" style={s.bannerIconDecor} />
                </LinearGradient>
              )}
              <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={s.bannerTopScrim} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(10,30,18,0.35)']} style={s.bannerBottomScrim} pointerEvents="none" />

              <View style={s.bannerTopBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.circleBtn}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleShare} 
                  style={[s.circleBtn, sharing && s.circleBtnDisabled]}
                  disabled={sharing}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="share-outline" size={19} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Info */}
            <View style={s.profileSection}>
              <View style={s.avatarRing}>
                {isValidImage(vendor.profileImage) ? (
                  <Image source={{ uri: vendor.profileImage }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={s.avatarInitial}>{vendor.name?.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                )}
                {vendor.isVerified && (
                  <View style={s.avatarVerifiedBadge}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                )}
              </View>

              <View style={s.profileStats}>
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(products.length)}</Text>
                    <Text style={s.statLabel}>Products</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(followerCount)}</Text>
                    <Text style={s.statLabel}>Followers</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{formatCount(feedPosts.length)}</Text>
                    <Text style={s.statLabel}>Posts</Text>
                  </View>
                </View>

                <Pressy onPress={handleFollow} style={[s.followBtn, isFollowingVendor && s.followBtnActive]} disabled={followLoading} scaleTo={0.95}>
                  {followLoading ? (
                    <ActivityIndicator size="small" color={isFollowingVendor ? C.brand : '#fff'} />
                  ) : (
                    <>
                      <Ionicons name={isFollowingVendor ? 'checkmark' : 'person-add-outline'} size={13} color={isFollowingVendor ? C.brand : '#fff'} style={{ marginRight: 5 }} />
                      <Text style={[s.followBtnText, isFollowingVendor && s.followBtnTextActive]}>
                        {isFollowingVendor ? 'Following' : 'Follow'}
                      </Text>
                    </>
                  )}
                </Pressy>
              </View>
            </View>

            {/* Name & Bio */}
            <View style={s.nameSection}>
              <View style={s.nameRow}>
                <Text style={s.vendorName}>{vendor.name}</Text>
                {vendor.isVerified && <Ionicons name="checkmark-circle" size={16} color={C.info} style={{ marginLeft: 5 }} />}
              </View>
              {vendor.storeName && <Text style={s.storeName}>{vendor.storeName}</Text>}

              <View style={s.metaLine}>
                {vendor.campus && (
                  <View style={s.metaItem}>
                    <Ionicons name="school-outline" size={12} color={C.t3} />
                    <Text style={s.metaItemText}>{CAMPUS_LABELS[vendor.campus] || vendor.campus}</Text>
                  </View>
                )}
                {hasRating && (
                  <View style={s.metaItem}>
                    <Ionicons name="star" size={12} color={C.gold} />
                    <Text style={s.metaItemText}>{(vendor.rating || 0).toFixed(1)} ({vendor.numReviews || 0})</Text>
                  </View>
                )}
                {vendor.totalSales > 0 && (
                  <View style={s.metaItem}>
                    <Ionicons name="bag-check-outline" size={12} color={C.t3} />
                    <Text style={s.metaItemText}>{formatCount(vendor.totalSales)} sold</Text>
                  </View>
                )}
                {businessType && (
                  <View style={s.metaItem}>
                    <Ionicons name="briefcase-outline" size={12} color={C.brand} />
                    <Text style={[s.metaItemText, { color: C.brand, fontWeight: '600' }]}>
                      {BUSINESS_TYPE_LABELS[businessType] || businessType}
                    </Text>
                  </View>
                )}
              </View>

              {/* Categories */}
              {categories.length > 0 && (
                <View style={s.categoriesWrap}>
                  {categories.slice(0, 4).map(cat => (
                    <View key={cat} style={[s.categoryChip, { backgroundColor: (CATEGORY_COLORS[cat] || C.brand) + '15' }]}>
                      <Text style={[s.categoryChipText, { color: CATEGORY_COLORS[cat] || C.brand }]}>
                        {CATEGORY_LABELS[cat] || cat}
                      </Text>
                    </View>
                  ))}
                  {categories.length > 4 && (
                    <View style={[s.categoryChip, { backgroundColor: C.gray100 }]}>
                      <Text style={[s.categoryChipText, { color: C.t3 }]}>+{categories.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Opening Hours */}
              {vendor.openingHours && (
                <View style={s.openingHoursRow}>
                  <Ionicons name="time-outline" size={13} color={C.accent} />
                  <Text style={s.openingHoursText}>{vendor.openingHours}</Text>
                </View>
              )}

              {/* Location Details */}
              {vendor.location?.campusArea && (
                <View style={s.locationRow}>
                  <Ionicons name="location-outline" size={13} color={C.t3} />
                  <Text style={s.locationText}>
                    {vendor.location.campusArea}
                    {vendor.location.hostel ? ` · ${vendor.location.hostel}` : ''}
                  </Text>
                </View>
              )}

              {/* Bio */}
              {vendor.bio && (
                <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)} activeOpacity={0.8}>
                  <Text style={s.bioText} numberOfLines={showFullBio ? undefined : 3}>
                    {vendor.bio}
                  </Text>
                  {vendor.bio.length > 120 && (
                    <Text style={s.readMoreText}>{showFullBio ? 'Show less' : 'Read more'}</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Social Links */}
              {(vendor.whatsapp || vendor.instagram) && (
                <View style={s.socialRow}>
                  {vendor.whatsapp && (
                    <TouchableOpacity style={s.socialBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                      <Text style={s.socialBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.instagram && (
                    <TouchableOpacity style={s.socialBtn} onPress={handleInstagram} activeOpacity={0.8}>
                      <Ionicons name="logo-instagram" size={16} color="#E4405F" />
                      <Text style={s.socialBtnText}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
              <TouchableOpacity
                style={[s.tab, activeTab === 'products' && s.tabActive]}
                onPress={() => handleTabChange('products')}
              >
                <Ionicons name="grid-outline" size={16} color={activeTab === 'products' ? C.brand : C.t3} />
                <Text style={[s.tabText, activeTab === 'products' && s.tabTextActive]}>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, activeTab === 'posts' && s.tabActive]}
                onPress={() => handleTabChange('posts')}
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
              <Pressy
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id, product: item })}
                style={s.productCard}
                scaleTo={0.97}
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
              </Pressy>
            );
          }
          return <FeedPostCard post={item} onPress={() => navigation.navigate('FeedPostDetail', { postId: item._id })} />;
        }}
        ListEmptyComponent={
          activeTab === 'posts' && feedLoading ? (
            <View style={s.emptyState}><ActivityIndicator size="small" color={C.brand} /></View>
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name={activeTab === 'products' ? 'cube-outline' : 'newspaper-outline'} size={32} color={C.brand} />
              </View>
              <Text style={s.emptyText}>{activeTab === 'products' ? 'No products yet' : 'No posts yet'}</Text>
            </View>
          )
        }
      />

      <ChatFAB
        recipientId={vendor?.user?._id || vendor?.user}
        isAuthenticated={isAuthenticated}
        currentUserId={user?._id || user?.id}
        style={{
          position: 'absolute',
          bottom: 74,
          right: 16,
        }}
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
  loadingText: { marginTop: 4, fontSize: 14, color: C.t3, textAlign: 'center' },
  errorIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: C.t1, marginBottom: 4 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 22, backgroundColor: C.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Hero
  heroBanner: { height: BANNER_HEIGHT, backgroundColor: C.brandD, position: 'relative', overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerIconDecor: { position: 'absolute', right: -20, bottom: -20 },
  bannerTopScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  bannerBottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70 },
  bannerTopBar: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  circleBtnDisabled: { opacity: 0.6 },

  // Profile
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, gap: 20,
  },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.surface, overflow: 'visible', backgroundColor: C.brandBg, marginTop: -40, ...shadow(0.12, 8, 4) },
  avatar: { width: '100%', height: '100%', borderRadius: 37 },
  avatarFallback: { flex: 1, borderRadius: 37, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 30, fontWeight: '800', color: '#fff' },
  avatarVerifiedBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.info, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.surface,
  },

  profileStats: { flex: 1, gap: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: C.elev },
  statValue: { fontSize: 18, fontWeight: '800', color: C.t1 },
  statLabel: { fontSize: 11, color: C.t3, marginTop: 2 },

  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.brand, paddingVertical: 9, borderRadius: 10,
  },
  followBtnActive: { backgroundColor: C.brandBg, borderWidth: 1.5, borderColor: C.brand },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: C.brand },

  // Name section
  nameSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  vendorName: { fontSize: 17, fontWeight: '800', color: C.t1 },
  storeName: { fontSize: 13, color: C.t2, marginTop: 2 },
  metaLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItemText: { fontSize: 12, color: C.t2, fontWeight: '500' },
  
  // Categories
  categoriesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  categoryChipText: { fontSize: 11, fontWeight: '700' },
  
  // Opening hours
  openingHoursRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  openingHoursText: { fontSize: 12.5, color: C.t2, fontWeight: '500' },
  
  // Location
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  locationText: { fontSize: 12.5, color: C.t2 },
  
  // Bio
  bioText: { fontSize: 13, color: C.t2, marginTop: 10, lineHeight: 19 },
  readMoreText: { fontSize: 12, color: C.brand, fontWeight: '600', marginTop: 4 },
  
  // Social links
  socialRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.elev,
  },
  socialBtnText: { fontSize: 12, fontWeight: '600', color: C.t1 },

  // Tabs
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    marginTop: 16, paddingHorizontal: 16,
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
  productCard: { width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', margin: 6, ...shadow(0.05, 8, 3) },
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
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.t3, fontWeight: '500' },

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