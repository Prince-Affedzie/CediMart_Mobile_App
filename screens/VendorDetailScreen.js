// src/screens/VendorDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorById } from '../apis/vendorApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const VendorDetailScreen = ({ route, navigation }) => {
  const { vendorId } = route.params; // vendorId passed from navigation
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Fetch vendor details
  const fetchVendor = async () => {
    try {
      setError(null);
      const res = await getVendorById(vendorId);
      if (res.status === 200 && res.data.success) {
        console.log(res.data.data)
        setVendor(res.data.data);
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

  useEffect(() => { fetchVendor(); }, [vendorId]);

  const onRefresh = () => { setRefreshing(true); fetchVendor(); };

  // Handle add to cart
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
    if (product.stock <= 0 || product.countInStock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    try {
      setAddingProductId(product.id || product._id);
      setAddedProductName(product.name);
      await addToCart(product.id || product._id, 1);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to add item to cart.');
    } finally {
      setAddingProductId(null);
    }
  };

  const products = vendor?.products || [];
  const isValidImage = (url) => url && !url.includes('default_banner') && !url.includes('default_profile');

  // Loading skeleton
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading vendor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !vendor) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
       
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={50} color="#BDBDBD" />
          <Text style={styles.errorText}>{error || 'Vendor not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchVendor(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cart Success Modal */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.successTitle}>Added to Cart!</Text>
            <Text style={styles.successMessage}>{addedProductName} has been added to your cart</Text>
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={() => { setModalVisible(false); navigation.navigate('Cart'); }}
            >
              <Text style={styles.viewCartButtonText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Banner with back button */}
        <View style={styles.headerBanner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAbsolute}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {isValidImage(vendor.store_banner) ? (
            <Image source={{ uri: vendor.store_banner }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          <View style={styles.bannerOverlay} />
        </View>

        {/* Profile image + name */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            {isValidImage(vendor.profile_image) ? (
              <Image source={{ uri: vendor.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>{vendor.name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.marketName}>{vendor.market_name}</Text>
          </View>
          <View style={styles.verificationRow}>
            <Ionicons
              name={vendor.is_verified ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={vendor.is_verified ? '#2E7D32' : '#F57C00'}
            />
            <Text style={[styles.verificationText, { color: vendor.is_verified ? '#2E7D32' : '#F57C00' }]}>
              {vendor.is_verified ? 'Verified Vendor' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.infoCardsRow}>
          {vendor.contact && (
            <View style={styles.infoCard}>
              <Ionicons name="call-outline" size={18} color="#2E7D32" />
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{vendor.contact}</Text>
            </View>
          )}
          {vendor.location && (
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={18} color="#2E7D32" />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{vendor.location}</Text>
            </View>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.productsTitle}>
            Products ({products.length})
          </Text>
          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={40} color="#BDBDBD" />
              <Text style={styles.emptyProductsText}>No products available yet.</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => {
                const isInCart = getQuantityInCart(product._id) > 0;
                const isAdding = addingProductId === (product.id || product._id);
                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product._id, product })}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }}
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      {product.price != null && (
                        <Text style={styles.productPrice}>GH₵ {product.price.toFixed(2)}</Text>
                      )}
                      <TouchableOpacity
                        style={[styles.addToCartBtn, isInCart && styles.addToCartBtnActive]}
                        onPress={() => handleAddToCart(product)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name={isInCart ? 'checkmark' : 'cart-outline'} size={16} color="#fff" />
                        )}
                        <Text style={styles.addToCartText}>{isInCart ? 'Added' : 'Add'}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 40 },

  // Header skeleton
  header: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#616161' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#616161', marginTop: 10, marginBottom: 20 },
  retryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // Banner
  headerBanner: {
    height: 180,
    position: 'relative',
    backgroundColor: '#2E7D32',
  },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#388E3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile section
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  profileImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: { width: '100%', height: '100%' },
  profilePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: { fontSize: 36, fontWeight: '700', color: '#2E7D32' },
  nameContainer: { alignItems: 'center', marginBottom: 4 },
  vendorName: { fontSize: 22, fontWeight: '700', color: '#212121', textAlign: 'center' },
  marketName: { fontSize: 14, color: '#757575', marginTop: 2 },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  verificationText: { fontSize: 13, fontWeight: '600', marginLeft: 5 },

  // Info cards
  infoCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoLabel: { fontSize: 12, color: '#9E9E9E', marginTop: 6, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#212121', textAlign: 'center' },

  // Products section
  productsSection: { paddingHorizontal: 16 },
  productsTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  emptyProducts: { alignItems: 'center', paddingVertical: 30 },
  emptyProductsText: { fontSize: 15, color: '#9E9E9E', marginTop: 8 },

  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  productImage: { width: '100%', height: 130, resizeMode: 'cover' },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 4, lineHeight: 18 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 4,
  },
  addToCartBtnActive: { backgroundColor: '#388E3C' },
  addToCartText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Cart modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#1B5E20', marginTop: 10 },
  successMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginVertical: 16 },
  viewCartButton: { backgroundColor: '#4CAF50', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  viewCartButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  continueButton: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50' },
  continueButtonText: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },
});

export default VendorDetailScreen;