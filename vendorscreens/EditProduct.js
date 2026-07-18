// src/vendorscreens/UpdateProductScreen.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { getProductById, updateProduct, deleteProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';
import {CONDITION_OPTIONS,SUBCATEGORIES_MAP,VALID_CATEGORIES,CAMPUS_OPTIONS,AVAILABLE_TAGS } from '../data/General'

const { width, height } = Dimensions.get('window');


const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─── DropdownSelector ───────────────────────────────────────────────────────
const DropdownSelector = ({
  label, placeholder, items, selectedValue, onSelect, required, renderItem, style, disabled,
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    if (disabled) return;
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 1, tension: 68, friction: 13, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleSelect = (key) => { onSelect(key); closeSheet(); };

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  const selectedItem = items.find((item) => (typeof item === 'string' ? item : item.key) === selectedValue);

  const triggerLabel = selectedItem
    ? typeof selectedItem === 'string' ? selectedItem : (selectedItem.icon ? selectedItem.icon + '  ' : '') + (selectedItem.label || formatDisplayName(selectedItem.key))
    : placeholder;

  return (
    <View style={style}>
      {label && <Text style={styles.dropdownLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <TouchableOpacity
        style={[styles.dropdownButton, visible && styles.dropdownButtonFocused, disabled && styles.dropdownButtonDisabled]}
        activeOpacity={0.8} onPress={openSheet} disabled={disabled}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder, disabled && styles.dropdownButtonTextDisabled]} numberOfLines={1}>{triggerLabel}</Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={disabled ? '#D0D0D0' : visible ? '#2E7D32' : '#9E9E9E'} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
        <Animated.View style={[bsStyles.backdrop, { opacity: backdropAnim }]}><Pressable style={{ flex: 1 }} onPress={closeSheet} /></Animated.View>
        <Animated.View style={[bsStyles.sheet, { transform: [{ translateY }] }]}>
          <View style={bsStyles.handle} />
          <View style={bsStyles.sheetHeader}>
            <Text style={bsStyles.sheetTitle}>{label || placeholder}</Text>
            <TouchableOpacity style={bsStyles.closeBtn} onPress={closeSheet}><Ionicons name="close" size={18} color="#616161" /></TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.key)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => {
              const key = typeof item === 'string' ? item : item.key;
              const isSelected = selectedValue === key;
              return (
                <TouchableOpacity style={[bsStyles.item, isSelected && bsStyles.itemActive]} onPress={() => handleSelect(key)} activeOpacity={0.75}>
                  {renderItem ? renderItem({ item, isSelected }) : (
                    <>
                      {item.icon && <Text style={bsStyles.itemEmoji}>{item.icon}</Text>}
                      <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>{item.label || formatDisplayName(item.key)}</Text>
                    </>
                  )}
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2E7D32" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </View>
  );
};

const bsStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: height * 0.62, paddingHorizontal: 16, paddingTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  itemActive: { backgroundColor: '#F1F8F3', borderBottomColor: 'transparent' },
  itemEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  itemText: { fontSize: 15, color: '#424242', fontWeight: '500', flex: 1 },
  itemTextActive: { color: '#1B5E20', fontWeight: '700' },
});

const FloatingInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.floatWrap, focused && styles.floatWrapFocused, multiline && styles.floatWrapMulti]}>
      <View style={styles.floatHeader}>
        <Ionicons name={icon} size={14} color={focused ? '#2E7D32' : '#9E9E9E'} />
        <Text style={[styles.floatLabel, focused && styles.floatLabelFocused]}>{label}{required ? ' *' : ''}</Text>
      </View>
      <TextInput style={[styles.floatInput, multiline && styles.floatInputMulti]} placeholder={placeholder} placeholderTextColor="#C5C5C5" value={value} onChangeText={onChangeText} keyboardType={keyboardType || 'default'} multiline={multiline} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} textAlignVertical={multiline ? 'top' : 'center'} />
    </View>
  );
};

const SectionCard = ({ title, accent = '#2E7D32', children, changed }) => (
  <View style={styles.card}>
    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
    <View style={styles.cardInner}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {changed && <View style={styles.changedBadge}><Text style={styles.changedBadgeText}>Edited</Text></View>}
      </View>
      {children}
    </View>
  </View>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const UpdateProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [originalProduct, setOriginalProduct] = useState(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [condition, setCondition] = useState('good');
  const [description, setDescription] = useState('');
  const [campus, setCampus] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [hostel, setHostel] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [countInStock, setCountInStock] = useState('1');
  const [isAvailable, setIsAvailable] = useState(true);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  // Discount fields
  const [hasDiscount, setHasDiscount] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountStartDate, setDiscountStartDate] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');

  // Specifications fields
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);

  const subcategoryOptions = useMemo(() => SUBCATEGORIES_MAP[category] || [], [category]);

  useEffect(() => { fetchProduct(); }, [productId]);

  const fetchProduct = async () => {
    setFetching(true); setFetchError(null);
    try {
      const response = await getProductById(productId);
      const product = response?.data?.data?.product || response?.data?.data || response?.data;
      if (!product) throw new Error('Product not found');
      setOriginalProduct(product);
      setName(product.name || '');
      setCategory(product.category || '');
      setSubcategory(product.subcategory || '');
      setBrand(product.brand || '');
      setPrice(product.price?.toString() || '');
      setNegotiable(product.negotiable || false);
      setCondition(product.condition || 'good');
      setDescription(product.description || '');
      setCampus(product.campus || '');
      setCampusArea(product.location?.campusArea || '');
      setHostel(product.location?.hostel || '');
      setSelectedTags(product.tags || []);
      setCountInStock(product.countInStock?.toString() || '1');
      setIsAvailable(product.isAvailable !== undefined ? product.isAvailable : true);
      setExistingImages(product.images || []);

      // Populate discount fields
      if (product.discountInfo) {
        setHasDiscount(product.discountInfo.isOnSale || !!product.discountInfo.originalPrice || !!product.discountInfo.discountPercentage);
        setOriginalPrice(product.discountInfo.originalPrice?.toString() || '');
        setDiscountPercent(product.discountInfo.discountPercentage?.toString() || '');
        setDiscountStartDate(product.discountInfo.discountStartDate ? product.discountInfo.discountStartDate.slice(0, 10) : '');
        setDiscountEndDate(product.discountInfo.discountEndDate ? product.discountInfo.discountEndDate.slice(0, 10) : '');
      }

      // Populate specifications
      if (product.specifications) {
        const specs = product.specifications;
        if (typeof specs === 'object' && !Array.isArray(specs)) {
          // Convert object to array of key-value pairs
          const specsArray = Object.entries(specs).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecifications(specsArray.length > 0 ? specsArray : [{ key: '', value: '' }]);
        } else if (Array.isArray(specs)) {
          setSpecifications(specs.length > 0 ? specs : [{ key: '', value: '' }]);
        }
      }
    } catch (error) {
      setFetchError(error?.response?.data?.message || error?.message || 'Failed to load product');
      Alert.alert('error', error?.response?.data?.message || error?.message);
    } finally { setFetching(false); }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubcategory('');
  };

  // Specifications helpers
  const addSpecField = () => setSpecifications(prev => [...prev, { key: '', value: '' }]);
  const removeSpecField = (index) => {
    if (specifications.length <= 1) return;
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };
  const updateSpecField = (index, field, value) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  // Get original specs as array for comparison
  const getOriginalSpecsArray = () => {
    if (!originalProduct?.specifications) return [];
    const specs = originalProduct.specifications;
    if (typeof specs === 'object' && !Array.isArray(specs)) {
      return Object.entries(specs).map(([key, value]) => ({ key, value: String(value) }));
    }
    if (Array.isArray(specs)) return specs;
    return [];
  };

  const hasChanges = originalProduct && (
    name !== (originalProduct.name || '') ||
    category !== (originalProduct.category || '') ||
    subcategory !== (originalProduct.subcategory || '') ||
    brand !== (originalProduct.brand || '') ||
    price !== (originalProduct.price?.toString() || '') ||
    negotiable !== (originalProduct.negotiable || false) ||
    condition !== (originalProduct.condition || 'good') ||
    description !== (originalProduct.description || '') ||
    campus !== (originalProduct.campus || '') ||
    campusArea !== (originalProduct.location?.campusArea || '') ||
    hostel !== (originalProduct.location?.hostel || '') ||
    JSON.stringify(selectedTags.sort()) !== JSON.stringify((originalProduct.tags || []).sort()) ||
    countInStock !== (originalProduct.countInStock?.toString() || '1') ||
    isAvailable !== (originalProduct.isAvailable !== undefined ? originalProduct.isAvailable : true) ||
    newImages.length > 0 ||
    removedImageUrls.length > 0 ||
    // Discount change detection
    originalPrice !== (originalProduct.discountInfo?.originalPrice?.toString() || '') ||
    discountPercent !== (originalProduct.discountInfo?.discountPercentage?.toString() || '') ||
    discountStartDate !== (originalProduct.discountInfo?.discountStartDate?.slice(0, 10) || '') ||
    discountEndDate !== (originalProduct.discountInfo?.discountEndDate?.slice(0, 10) || '') ||
    hasDiscount !== (originalProduct.discountInfo?.isOnSale || !!originalProduct.discountInfo?.originalPrice || !!originalProduct.discountInfo?.discountPercentage) ||
    // Specifications change detection
    JSON.stringify(specifications.filter(s => s.key.trim() || s.value.trim())) !== JSON.stringify(getOriginalSpecsArray())
  );

  const pickNewImages = () => {
    const remainingSlots = 10 - (existingImages.length + newImages.length);
    if (remainingSlots <= 0) { Toast.show({ type: 'info', text1: 'Limit reached', text2: 'Maximum 10 photos allowed' }); return; }
    Alert.alert('Add Photos', 'Choose a source', [
      { text: '📷  Camera', onPress: () => { launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200 }, (response) => { if (!response.didCancel && response.assets?.length > 0) { const asset = response.assets[0]; setNewImages(prev => [...prev, { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `product_${Date.now()}.jpg` }]); } }); } },
      { text: '🖼️  Photo Library', onPress: () => { launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200, selectionLimit: remainingSlots }, (response) => { if (!response.didCancel && response.assets?.length > 0) { const imgs = response.assets.map(asset => ({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg` })); setNewImages(prev => [...prev, ...imgs].slice(0, remainingSlots + prev.length)); } }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeExistingImage = (url) => {
    if (existingImages.length + newImages.length - removedImageUrls.length <= 1) { Toast.show({ type: 'info', text1: 'Cannot remove', text2: 'At least one image is required' }); return; }
    setRemovedImageUrls(prev => [...prev, url]);
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const removeNewImage = (index) => setNewImages(prev => prev.filter((_, i) => i !== index));
  const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert('Missing Info', 'Product name is required');
    if (!category) return Alert.alert('Missing Info', 'Please select a category');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) return Alert.alert('Missing Info', 'Please enter a valid price');
    if (!campus) return Alert.alert('Missing Info', 'Please select your campus');
    if (!campusArea.trim()) return Alert.alert('Missing Info', 'Campus area is required');
    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) return Alert.alert('Missing Info', 'At least one product image is required');

    if (hasDiscount) {
      if (originalPrice && (isNaN(parseFloat(originalPrice)) || parseFloat(originalPrice) <= 0)) {
        return Alert.alert('Invalid', 'Original price must be a valid positive number');
      }
      if (discountPercent && (isNaN(parseFloat(discountPercent)) || parseFloat(discountPercent) < 0 || parseFloat(discountPercent) > 100)) {
        return Alert.alert('Invalid', 'Discount percentage must be between 0 and 100');
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category);
      if (subcategory) formData.append('subcategory', subcategory);
      formData.append('brand', brand.trim() || '');
      formData.append('price', parseFloat(price));
      formData.append('negotiable', negotiable.toString());
      formData.append('condition', condition);
      formData.append('description', description.trim() || '');
      formData.append('campus', campus);
      formData.append('location[campusArea]', campusArea.trim());
      if (hostel.trim()) formData.append('location[hostel]', hostel.trim());
      formData.append('countInStock', parseInt(countInStock) || 1);
      formData.append('isAvailable', isAvailable.toString());
      selectedTags.forEach(tag => formData.append('tags[]', tag));
      if (removedImageUrls.length > 0) removedImageUrls.forEach(url => formData.append('removedImages[]', url));
      newImages.forEach((img) => { formData.append('productImages', { uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri, type: img.type, name: img.name }); });

      // Append discount fields
      if (hasDiscount) {
        if (originalPrice) formData.append('originalPrice', parseFloat(originalPrice));
        if (discountPercent) formData.append('discountPercentage', parseFloat(discountPercent));
        if (discountStartDate) formData.append('discountStartDate', discountStartDate);
        if (discountEndDate) formData.append('discountEndDate', discountEndDate);
        formData.append('isOnSale', 'true');
      } else {
        // Clear discount if toggle is off
        formData.append('discountInfo', JSON.stringify({}));
      }

      // Append specifications as JSON
      const filledSpecs = specifications.filter(s => s.key.trim() && s.value.trim());
      if (filledSpecs.length > 0) {
        const specsObj = {};
        filledSpecs.forEach(s => { specsObj[s.key.trim()] = s.value.trim(); });
        formData.append('specifications', JSON.stringify(specsObj));
      }

      const response = await updateProduct(productId, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.success || response.status === 200 || response?.data?.success) {
        Alert.alert('success', `${name} has been updated.`);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('error', error?.response?.data?.message || error?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try { await deleteProduct(productId); Toast.show({ type: 'success', text1: 'Deleted', text2: 'Listing removed.' }); navigation.goBack(); }
        catch (error) { Toast.show({ type: 'error', text1: 'Error', text2: error?.response?.data?.message || 'Failed to delete' }); }
        finally { setLoading(false); }
      }},
    ]);
  };

  if (fetching) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#1A1A1A" /></TouchableOpacity><View style={styles.headerCenter}><Text style={styles.headerTitle}>Edit Listing</Text></View><View style={{ width: 36 }} /></View>
      <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>Loading product...</Text></View>
    </SafeAreaView>
  );

  if (fetchError) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#1A1A1A" /></TouchableOpacity><View style={styles.headerCenter}><Text style={styles.headerTitle}>Edit Listing</Text></View><View style={{ width: 36 }} /></View>
      <View style={styles.loadingContainer}><Ionicons name="alert-circle-outline" size={48} color="#E53935" /><Text style={styles.errorText}>{fetchError}</Text><TouchableOpacity style={styles.retryBtn} onPress={fetchProduct}><Text style={styles.retryBtnText}>Retry</Text></TouchableOpacity></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color="#1A1A1A" /></TouchableOpacity>
          <View style={styles.headerCenter}><Text style={styles.headerTitle}>Edit Listing</Text><Text style={styles.headerSub} numberOfLines={1}>{name || 'Untitled'}</Text></View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}><Ionicons name="trash-outline" size={20} color="#E53935" /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SectionCard title="Product Photos" accent="#1B5E20" changed={newImages.length > 0 || removedImageUrls.length > 0}>
            <Text style={styles.sectionHint}>{existingImages.length + newImages.length}/10 photos · First image is the cover</Text>
            <View style={styles.imageGrid}>
              {existingImages.map((url, i) => (
                <View key={`existing-${i}`} style={styles.imageThumbWrap}>
                  <Image source={{ uri: url }} style={styles.imageThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeExistingImage(url)}><Ionicons name="close-circle" size={22} color="#E53935" /></TouchableOpacity>
                  {i === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>}
                </View>
              ))}
              {newImages.map((img, i) => (
                <View key={`new-${i}`} style={styles.imageThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeNewImage(i)}><Ionicons name="close-circle" size={22} color="#E53935" /></TouchableOpacity>
                  <View style={[styles.coverBadge, { backgroundColor: 'rgba(46,125,50,0.8)' }]}><Text style={styles.coverBadgeText}>New</Text></View>
                </View>
              ))}
              {existingImages.length + newImages.length < 10 && (
                <TouchableOpacity style={styles.imageAddBtn} onPress={pickNewImages} activeOpacity={0.8}><Ionicons name="add" size={32} color="#2E7D32" /><Text style={styles.imageAddText}>Add</Text></TouchableOpacity>
              )}
            </View>
            {removedImageUrls.length > 0 && (
              <View style={styles.removedImagesBar}><Ionicons name="information-circle-outline" size={16} color="#E65100" /><Text style={styles.removedImagesText}>{removedImageUrls.length} image(s) will be removed on save</Text></View>
            )}
          </SectionCard>

          <SectionCard title="Item Details" accent="#2E7D32" changed={name !== (originalProduct?.name || '') || category !== (originalProduct?.category || '') || subcategory !== (originalProduct?.subcategory || '') || brand !== (originalProduct?.brand || '') || condition !== (originalProduct?.condition || 'good')}>
            <FloatingInput label="Product Name" icon="pricetag-outline" placeholder="e.g. iPhone 13 Pro Max 256GB" value={name} onChangeText={setName} required />
            <DropdownSelector label="Category" placeholder="Select category" items={VALID_CATEGORIES} selectedValue={category} onSelect={handleCategoryChange} required style={{ marginBottom: 14 }} renderItem={({ item, isSelected }) => (<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{item.icon}</Text><Text style={[bsStyles.itemText, { marginLeft: 12 }, isSelected && bsStyles.itemTextActive]}>{formatDisplayName(item.key)}</Text></View>)} />
            <DropdownSelector label="Subcategory (optional)" placeholder="Select subcategory" items={subcategoryOptions} selectedValue={subcategory} onSelect={setSubcategory} style={{ marginBottom: 14 }} disabled={!category || subcategoryOptions.length === 0} />
            <FloatingInput label="Brand (optional)" icon="bookmark-outline" placeholder="e.g. Apple, Samsung, Nike" value={brand} onChangeText={setBrand} />
            <DropdownSelector label="Condition" placeholder="Select condition" items={CONDITION_OPTIONS} selectedValue={condition} onSelect={setCondition} required style={{ marginBottom: 4 }} />
          </SectionCard>

          <SectionCard title="Pricing & Availability" accent="#388E3C" changed={price !== (originalProduct?.price?.toString() || '') || negotiable !== (originalProduct?.negotiable || false) || countInStock !== (originalProduct?.countInStock?.toString() || '1') || isAvailable !== (originalProduct?.isAvailable !== undefined ? originalProduct.isAvailable : true) || originalPrice !== (originalProduct?.discountInfo?.originalPrice?.toString() || '') || discountPercent !== (originalProduct?.discountInfo?.discountPercentage?.toString() || '')}>
            <Text style={styles.quickLabel}>Price (GH₵) <Text style={styles.required}>*</Text></Text>
            <View style={styles.priceInputFull}><View style={styles.currencyTag}><Text style={styles.currencyText}>GH₵</Text></View><TextInput style={styles.priceInputField} placeholder="0.00" placeholderTextColor="#C5C5C5" keyboardType="decimal-pad" value={price} onChangeText={setPrice} /></View>
            <TouchableOpacity style={[styles.negotiableBtn, negotiable && styles.negotiableBtnActive]} onPress={() => setNegotiable(!negotiable)}><Ionicons name={negotiable ? 'pricetag' : 'pricetag-outline'} size={18} color={negotiable ? '#fff' : '#2E7D32'} /><Text style={[styles.negotiableText, negotiable && styles.negotiableTextActive]}>Price is negotiable</Text></TouchableOpacity>
            <Text style={styles.quickLabel}>Quantity Available</Text>
            <TextInput style={styles.simpleInput} placeholder="1" placeholderTextColor="#C5C5C5" keyboardType="numeric" value={countInStock} onChangeText={setCountInStock} />
            <Text style={styles.quickLabel}>Status</Text>
            <View style={styles.availRow}>
              <TouchableOpacity style={[styles.availOption, isAvailable && styles.availOptionActive]} onPress={() => setIsAvailable(true)}><View style={[styles.availDot, { backgroundColor: '#4CAF50' }]} /><Text style={[styles.availText, isAvailable && styles.availTextActive]}>Available</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.availOption, !isAvailable && styles.availOptionInactive]} onPress={() => setIsAvailable(false)}><View style={[styles.availDot, { backgroundColor: '#E53935' }]} /><Text style={[styles.availText, !isAvailable && styles.availTextInactive]}>Sold Out</Text></TouchableOpacity>
            </View>

            {/* Discount Section */}
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.discountToggle, hasDiscount && styles.discountToggleActive]}
                onPress={() => setHasDiscount(!hasDiscount)}
              >
                <Ionicons name="pricetag" size={18} color={hasDiscount ? '#fff' : '#2E7D32'} />
                <Text style={[styles.discountToggleText, hasDiscount && styles.discountToggleTextActive]}>
                  {hasDiscount ? 'Discount applied' : 'Add discount (optional)'}
                </Text>
                <Ionicons name={hasDiscount ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={hasDiscount ? '#fff' : '#2E7D32'} />
              </TouchableOpacity>

              {hasDiscount && (
                <View style={styles.discountFields}>
                  <FloatingInput
                    label="Original Price (GH₵)"
                    icon="pricetag-outline"
                    placeholder="e.g. 1500.00"
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                    keyboardType="decimal-pad"
                  />
                  <FloatingInput
                    label="Discount Percentage (%)"
                    icon="trending-down-outline"
                    placeholder="e.g. 20"
                    value={discountPercent}
                    onChangeText={setDiscountPercent}
                    keyboardType="numeric"
                  />
                  <View style={styles.dateRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.quickLabel}>Start Date</Text>
                      <TextInput
                        style={styles.simpleInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#C5C5C5"
                        value={discountStartDate}
                        onChangeText={setDiscountStartDate}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.quickLabel}>End Date</Text>
                      <TextInput
                        style={styles.simpleInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#C5C5C5"
                        value={discountEndDate}
                        onChangeText={setDiscountEndDate}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </SectionCard>

          {/* Specifications Section */}
          <SectionCard 
            title="Specifications (Optional)" 
            accent="#8E24AA" 
            changed={JSON.stringify(specifications.filter(s => s.key.trim() || s.value.trim())) !== JSON.stringify(getOriginalSpecsArray())}
          >
            <Text style={styles.sectionHint}>Add product details like storage, color, weight, material</Text>
            {specifications.map((spec, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.specInput}
                    placeholder="Spec name (e.g. Color)"
                    placeholderTextColor="#C5C5C5"
                    value={spec.key}
                    onChangeText={(v) => updateSpecField(index, 'key', v)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.specInput}
                    placeholder="Value (e.g. Red)"
                    placeholderTextColor="#C5C5C5"
                    value={spec.value}
                    onChangeText={(v) => updateSpecField(index, 'value', v)}
                  />
                </View>
                <TouchableOpacity onPress={() => removeSpecField(index)} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={22} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addSpecBtn} onPress={addSpecField} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={20} color="#2E7D32" />
              <Text style={styles.addSpecBtnText}>Add Specification</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="Campus & Location" accent="#43A047" changed={campus !== (originalProduct?.campus || '') || campusArea !== (originalProduct?.location?.campusArea || '') || hostel !== (originalProduct?.location?.hostel || '')}>
            <DropdownSelector label="Campus" placeholder="Select your campus" items={CAMPUS_OPTIONS} selectedValue={campus} onSelect={setCampus} required style={{ marginBottom: 14 }} />
            <FloatingInput label="Campus Area" icon="location-outline" placeholder="e.g. Main Campus, North Campus" value={campusArea} onChangeText={setCampusArea} required />
            <FloatingInput label="Hostel / Hall (optional)" icon="home-outline" placeholder="e.g. Mensah Sarbah Hall, Pentagon" value={hostel} onChangeText={setHostel} />
          </SectionCard>

          <SectionCard title="Description & Tags" accent="#66BB6A" changed={description !== (originalProduct?.description || '') || JSON.stringify(selectedTags.sort()) !== JSON.stringify((originalProduct?.tags || []).sort())}>
            <FloatingInput label="Description" icon="document-text-outline" placeholder="Describe your item, reason for selling, etc." value={description} onChangeText={setDescription} multiline />
            <Text style={[styles.quickLabel, { marginTop: 4 }]}>Tags <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.tagsGrid}>
              {AVAILABLE_TAGS.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity key={key} style={[styles.tagChip, active && styles.tagChipActive]} onPress={() => toggleTag(key)} activeOpacity={0.75}>
                    <Text style={styles.tagEmoji}>{icon}</Text>
                    <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>{formatDisplayName(key)}</Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.tagCountRow}>
                <Ionicons name="pricetags" size={13} color="#2E7D32" />
                <Text style={styles.tagCountText}>{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected</Text>
                <TouchableOpacity onPress={() => setSelectedTags([])}><Text style={styles.tagClearText}>Clear all</Text></TouchableOpacity>
              </View>
            )}
          </SectionCard>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.updateBtn, (!hasChanges || loading) && styles.updateBtnDisabled]} onPress={handleUpdate} disabled={!hasChanges || loading} activeOpacity={0.88}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={styles.updateBtnText}>{hasChanges ? 'Save Changes' : 'No Changes'}</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteListingBtn} onPress={handleDelete} activeOpacity={0.8}><Ionicons name="trash-outline" size={20} color="#E53935" /></TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  loadingText: { fontSize: 16, color: '#666', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#E53935', textAlign: 'center', fontWeight: '500' },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2E7D32', borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 20 },
  sectionHint: { fontSize: 12, color: '#999', marginBottom: 12, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  changedBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFB74D' },
  changedBadgeText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
  floatWrap: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: '#FAFAFA', marginBottom: 14 },
  floatWrapFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  floatWrapMulti: { paddingBottom: 16 },
  floatHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  floatLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 0.3, textTransform: 'uppercase' },
  floatLabelFocused: { color: '#2E7D32' },
  floatInput: { fontSize: 15.5, color: '#1A1A1A', padding: 0 },
  floatInputMulti: { height: 90, textAlignVertical: 'top' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumbWrap: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  imageRemoveBtn: { position: 'absolute', top: 4, right: 4 },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageAddBtn: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed', backgroundColor: '#F1F8F3', justifyContent: 'center', alignItems: 'center', gap: 4 },
  imageAddText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  removedImagesBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFF3E0', borderRadius: 10, borderWidth: 1, borderColor: '#FFB74D' },
  removedImagesText: { fontSize: 12, fontWeight: '600', color: '#E65100', flex: 1 },
  dropdownLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  dropdownButtonFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  dropdownButtonDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8' },
  dropdownButtonText: { fontSize: 15.5, color: '#1A1A1A', flex: 1 },
  dropdownButtonTextDisabled: { color: '#BDBDBD' },
  dropdownPlaceholder: { color: '#C5C5C5' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  required: { color: '#E53935' },
  optional: { color: '#9E9E9E', fontWeight: '500', textTransform: 'none', fontSize: 12 },
  priceInputFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  currencyTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, height: 52, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' },
  currencyText: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  priceInputField: { flex: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  negotiableBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0', marginBottom: 14 },
  negotiableBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  negotiableText: { fontSize: 13, fontWeight: '600', color: '#666' },
  negotiableTextActive: { color: '#fff' },
  simpleInput: { backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#1A1A1A', fontWeight: '600', marginBottom: 14 },
  availRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  availOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  availOptionActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  availOptionInactive: { backgroundColor: '#FFEBEE', borderColor: '#E53935' },
  availDot: { width: 9, height: 9, borderRadius: 5 },
  availText: { fontSize: 13, fontWeight: '600', color: '#666' },
  availTextActive: { color: '#2E7D32' },
  availTextInactive: { color: '#C62828' },
  discountToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  discountToggleActive: { backgroundColor: '#E65100', borderColor: '#E65100' },
  discountToggleText: { fontSize: 13, fontWeight: '600', color: '#2E7D32', flex: 1 },
  discountToggleTextActive: { color: '#fff' },
  discountFields: { paddingTop: 8, paddingHorizontal: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start' },
  specInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  addSpecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
    backgroundColor: '#F1F8F3',
    marginTop: 4,
  },
  addSpecBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 22, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  tagChipActive: { backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive: { color: '#2E7D32', fontWeight: '700' },
  tagCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagCountText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: '#E53935', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  updateBtn: { flex: 1, backgroundColor: '#1B5E20', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  updateBtnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  updateBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  deleteListingBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FFCDD2', justifyContent: 'center', alignItems: 'center' },
});

export default UpdateProductScreen;