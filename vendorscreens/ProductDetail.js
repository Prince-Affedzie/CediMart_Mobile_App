// src/vendorscreens/VendorProductDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProductById, deleteProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CAMPUS_LABELS = {
  UG: 'University of Ghana',
  KNUST: 'KNUST',
  UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba',
  UPSA: 'UPSA',
  GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University',
  ATU: 'Accra Technical University',
  OTHER: 'Other',
};

const CONDITION_COLORS = {
  'new':           { bg: '#E8F5E9', text: '#2E7D32', label: 'Brand New' },
  'like-new':      { bg: '#E8F5E9', text: '#2E7D32', label: 'Like New' },
  'excellent':     { bg: '#E8F5E9', text: '#2E7D32', label: 'Excellent' },
  'good':          { bg: '#FFF8E1', text: '#F9A825', label: 'Good' },
  'fair':          { bg: '#FFF3E0', text: '#E65100', label: 'Fair' },
  'slightly-used': { bg: '#FFF3E0', text: '#E65100', label: 'Slightly Used' },
  'for-parts':     { bg: '#FFEBEE', text: '#C62828', label: 'For Parts' },
};

const TAG_LABELS = {
  'featured':         '⭐ Featured',
  'urgent-sale':      '⚡ Urgent Sale',
  'popular':          '🔥 Popular',
  'discounted':       '🏷️ Discounted',
  'new-arrival':      '🆕 New Arrival',
  'student-favorite': '❤️ Student Favorite',
};

const InfoGridItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color="#2E7D32" />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const VendorProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product: initialProduct, productId } = route.params;

  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [deleting, setDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (initialProduct) {
      setLoading(false);
    } else if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (!loading && product) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading, product]);

  const fetchProduct = async () => {
    try {
      const res = await getProductById(productId);
      const data = res?.data?.data?.product || res?.data?.data || res?.data;
      if (data) {
        setProduct(data);
      } else {
        Alert.alert('Error', 'Product not found.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load product.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      `Permanently delete "${product?.name}"?\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProduct(product._id || productId);
              Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing has been removed.' });
              navigation.goBack();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to delete' });
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const conditionInfo = CONDITION_COLORS[product.condition] || CONDITION_COLORS['good'];

  const infoItems = [
    { icon: 'grid-outline', label: 'Category', value: product.category?.replace(/-/g, ' ') },
    { icon: 'school-outline', label: 'Campus', value: CAMPUS_LABELS[product.campus] || product.campus },
    { icon: 'location-outline', label: 'Location', value: product.location?.campusArea || '—' },
    ...(product.location?.hostel ? [{ icon: 'home-outline', label: 'Hostel / Hall', value: product.location.hostel }] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('UpdateProduct', { productId: product._id || productId })}
          style={styles.headerEditBtn}
        >
          <Ionicons name="create-outline" size={18} color="#1A1A1A" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {images.length > 0 && (
          <View style={styles.imageGallery}>
            <View style={styles.mainImageWrap}>
              <Image
                source={{ uri: images[activeImageIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {product.negotiable && (
                <View style={styles.negotiableBadge}>
                  <Ionicons name="pricetag" size={12} color="#fff" />
                  <Text style={styles.negotiableText}>Negotiable</Text>
                </View>
              )}
              {images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>{activeImageIndex + 1}/{images.length}</Text>
                </View>
              )}
            </View>

            {images.length > 1 && (
              <FlatList
                horizontal
                data={images}
                keyExtractor={(_, i) => i.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbStrip}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setActiveImageIndex(index)}
                    style={[styles.thumbWrap, activeImageIndex === index && styles.thumbActive]}
                  >
                    <Image source={{ uri: item }} style={styles.thumb} resizeMode="cover" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={[styles.conditionBadge, { backgroundColor: conditionInfo.bg }]}>
              <Text style={[styles.conditionText, { color: conditionInfo.text }]}>{conditionInfo.label}</Text>
            </View>
          </View>
          {product.brand ? (
            <Text style={styles.brandText}>{product.brand}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>GH₵ {product.price?.toFixed(2)}</Text>
            {product.negotiable && (
              <View style={styles.negotiableChip}>
                <Text style={styles.negotiableChipText}>Price negotiable</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product Info</Text>
          <View style={styles.infoGrid}>
            {infoItems.map((item, index) => (
              <InfoGridItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{product.countInStock ?? 0}</Text>
              <Text style={styles.statLabel}>In Stock</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{product.views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{product.favorites || 0}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
          <View style={[styles.statusBar, { backgroundColor: product.isAvailable ? '#E8F5E9' : '#FFEBEE' }]}>
            <View style={[styles.statusDot, { backgroundColor: product.isAvailable ? '#4CAF50' : '#E53935' }]} />
            <Text style={[styles.statusText, { color: product.isAvailable ? '#2E7D32' : '#C62828' }]}>
              {product.isAvailable ? 'Available for sale' : 'Sold Out'}
            </Text>
          </View>
        </View>

        {product.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        ) : null}

        {product.tags?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {product.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{TAG_LABELS[tag] || tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {product.numReviews > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.reviewSummary}>
              <Ionicons name="star" size={20} color="#F9A825" />
              <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.reviewCount}>({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('UpdateProduct', { productId: product._id || productId })}
            activeOpacity={0.88}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editBtnText}>Edit Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#C62828" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#C62828" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F5F2' },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  headerEditBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },

  imageGallery: { marginBottom: 4 },
  mainImageWrap: {
    width: '100%', height: 280,
    backgroundColor: '#E0E0E0', position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  negotiableBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(249,115,22,0.9)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  negotiableText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imageCounter: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  thumbStrip: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  thumbWrap: {
    width: 56, height: 56, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent', overflow: 'hidden',
  },
  thumbActive: { borderColor: '#2E7D32' },
  thumb: { width: '100%', height: '100%' },

  titleSection: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12,
    borderRadius: 16, padding: 16,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 10, marginBottom: 6,
  },
  productName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  conditionBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  conditionText: { fontSize: 11, fontWeight: '700' },
  brandText: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 8 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  price: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  negotiableChip: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: '#FFB74D',
  },
  negotiableChipText: { fontSize: 11, fontWeight: '700', color: '#E65100' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 16, padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2EE',
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E8E8E8' },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, borderRadius: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  description: { fontSize: 14, color: '#555', lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#F1F8F3', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },

  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  reviewCount: { fontSize: 13, color: '#999', fontWeight: '500' },

  actions: {
    flexDirection: 'row', gap: 12,
    marginHorizontal: 12, marginTop: 20,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#1B5E20', paddingVertical: 16,
    borderRadius: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  editBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  deleteBtn: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FFCDD2',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: '#C62828', marginTop: 2 },
});

export default VendorProductDetailScreen;