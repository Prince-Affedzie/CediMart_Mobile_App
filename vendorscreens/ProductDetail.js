// src/vendorscreens/VendorProductDetailScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getProductById, updateProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const VALID_CATEGORIES = [
  { key: 'vegetable', icon: '🥦', label: 'Vegetable' },
  { key: 'fruit',     icon: '🍎', label: 'Fruit' },
  { key: 'staple',    icon: '🌾', label: 'Staple' },
  { key: 'herb',      icon: '🌿', label: 'Herb' },
  { key: 'tuber',     icon: '🥔', label: 'Tuber' },
  { key: 'grain',     icon: '🌽', label: 'Grain' },
  { key: 'cereal',    icon: '🥣', label: 'Cereal' },
  { key: 'meat',      icon: '🥩', label: 'Meat' },
  { key: 'poultry',   icon: '🍗', label: 'Poultry' },
  { key: 'seafood',   icon: '🐟', label: 'Seafood' },
  { key: 'frozen-food', icon: '🧊', label: 'Frozen Food' },
  { key: 'spice',     icon: '🌶️', label: 'Spice' },
  { key: 'other',     icon: '📦', label: 'Other' },
];

const VALID_UNITS = [
  { key: 'kg',      label: 'Kilogram (kg)' },
  { key: 'g',       label: 'Gram (g)' },
  { key: 'piece',   label: 'Piece' },
  { key: 'pieces',  label: 'Pieces' },
  { key: 'bunch',   label: 'Bunch' },
  { key: 'bag',     label: 'Bag' },
  { key: 'pack',    label: 'Pack' },
  { key: 'basket',  label: 'Basket' },
  { key: 'olonka',  label: 'Olonka' },
];

const AVAILABLE_TAGS = [
  { key: 'organic',        icon: '🌱' },
  { key: 'farm_fresh',     icon: '🚜' },
  { key: 'locally_sourced',icon: '📍' },
  { key: 'fresh_today',    icon: '✨' },
  { key: 'seasonal',       icon: '🍂' },
  { key: 'popular',        icon: '🔥' },
  { key: 'best_selling',   icon: '⭐' },
  { key: 'new_arrival',    icon: '🆕' },
  { key: 'discounted',     icon: '🏷️' },
  { key: 'perishable',     icon: '⏱️' },
  { key: 'ready_to_cook',  icon: '👨‍🍳' },
  { key: 'ready_to_eat',   icon: '🍽️' },
];

const formatLabel = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─────────────────────────────────────────────
// ✅ FIXED IMAGE PICKER HELPER
// Fixes: asset.type ("image") → correct MIME via asset.mimeType
// Fixes: FormData file object needs explicit Content-Type header on submit
// ─────────────────────────────────────────────
const pickImageFromLibrary = async () => {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission Required', 'Allow access to your photos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  // ✅ FIX: Use asset.mimeType (expo-image-picker v14+), fallback gracefully
  const mimeType = asset.mimeType || 'image/jpeg';
  // ✅ FIX: Derive extension from mimeType, not from asset.type
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = asset.fileName || `product_${Date.now()}.${ext}`;

  return { uri: asset.uri, type: mimeType, name: fileName };
};

const pickImageFromCamera = async () => {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission Required', 'Camera access is needed.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/jpeg';
  const ext = mimeType.split('/')[1] || 'jpg';
  return { uri: asset.uri, type: mimeType, name: asset.fileName || `product_${Date.now()}.${ext}` };
};

// ─────────────────────────────────────────────
// DROPDOWN COMPONENT
// A reusable bottom-sheet style picker modal
// ─────────────────────────────────────────────
const DropdownPicker = ({ label, icon, value, options, onSelect, placeholder, renderOption }) => {
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const handleSelect = (item) => {
    onSelect(item.key);
    closeModal();
  };

  const selectedOption = options.find(o => o.key === value);

  return (
    <>
      <TouchableOpacity style={styles.dropdownTrigger} onPress={openModal} activeOpacity={0.8}>
        <View style={styles.dropdownTriggerLeft}>
          <Ionicons name={icon} size={16} color={value ? '#2E7D32' : '#9E9E9E'} />
          <Text style={[styles.dropdownTriggerText, !value && styles.dropdownPlaceholder]}>
            {selectedOption
              ? `${selectedOption.icon ? selectedOption.icon + '  ' : ''}${selectedOption.label}`
              : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#9E9E9E" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[styles.dropdownBackdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeModal} />
        </Animated.View>
        <Animated.View style={[styles.dropdownSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dropdownHandle} />
          <View style={styles.dropdownSheetHeader}>
            <Text style={styles.dropdownSheetTitle}>{label}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.dropdownCloseBtn}>
              <Ionicons name="close" size={20} color="#424242" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const selected = item.key === value;
              return (
                <TouchableOpacity
                  style={[styles.dropdownOption, selected && styles.dropdownOptionSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.75}
                >
                  {item.icon && <Text style={styles.dropdownOptionEmoji}>{item.icon}</Text>}
                  <Text style={[styles.dropdownOptionLabel, selected && styles.dropdownOptionLabelSelected]}>
                    {item.label}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </>
  );
};

// ─────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
  <View style={styles.fieldWrap}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required && <Text style={styles.fieldRequired}> *</Text>}
      {hint && <Text style={styles.fieldHint}> · {hint}</Text>}
    </View>
    {children}
  </View>
);

// ─────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────
const Card = ({ title, iconName, children }) => (
  <View style={styles.card}>
    <View style={styles.cardTitleRow}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={iconName} size={15} color="#2E7D32" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const VendorProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product: initialProduct } = route.params;

  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // Image state
  const [existingImage, setExistingImage] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  // Dirty tracking — know if anything changed
  const [isDirty, setIsDirty] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── LOAD ──────────────────────────────────
  useEffect(() => {
    if (initialProduct) {
      populateForm(initialProduct);
      setLoading(false);
    } else {
      (async () => {
        try {
          const res = await getProductById(route.params.productId);
          if (res?.status === 200) {
            const prod = res.data.data || res.data;
            setProduct(prod);
            populateForm(prod);
          } else {
            Alert.alert('Error', 'Product not found.');
            navigation.goBack();
          }
        } catch {
          Alert.alert('Error', 'Failed to load product.');
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [loading]);

  const populateForm = (prod) => {
    setName(prod.name || '');
    setCategory(prod.category || '');
    setPrice(prod.price != null ? prod.price.toString() : '');
    setUnit(prod.unit || '');
    setStock(prod.countInStock != null ? prod.countInStock.toString() : '0');
    setDescription(prod.description || '');
    setSelectedTags(Array.isArray(prod.tags) ? prod.tags : []);
    setIsAvailable(prod.isAvailable !== undefined ? prod.isAvailable : true);
    setExistingImage(prod.image || '');
    setImagePreview(prod.image || '');
  };

  // ── IMAGE ACTIONS ─────────────────────────
  const handlePickImage = async (source = 'library') => {
    const picked = source === 'camera'
      ? await pickImageFromCamera()
      : await pickImageFromLibrary();
    if (!picked) return;
    setNewImage(picked);
    setImagePreview(picked.uri);
    setRemoveImage(false);
    setIsDirty(true);
  };

  const showImageOptions = () => {
    Alert.alert('Change Photo', 'Choose a source', [
      { text: '📷  Camera', onPress: () => handlePickImage('camera') },
      { text: '🖼️  Photo Library', onPress: () => handlePickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveImage = () => {
    if (newImage) {
      setNewImage(null);
      setImagePreview(existingImage);
    } else {
      Alert.alert('Remove Image', 'Are you sure you want to remove the product image?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { setRemoveImage(true); setImagePreview(''); setIsDirty(true); } },
      ]);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setIsDirty(true);
  };

  // ── SUBMIT ────────────────────────────────
  // ✅ FIX: Pass explicit multipart/form-data header so axios builds correct boundary
  const handleSave = async () => {
    if (!name.trim())  return Alert.alert('Missing Field', 'Product name is required.');
    if (!category)     return Alert.alert('Missing Field', 'Please select a category.');
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return Alert.alert('Missing Field', 'Enter a valid price greater than 0.');
    if (!unit)         return Alert.alert('Missing Field', 'Please select a unit.');
    const stockCount = stock.trim() ? parseInt(stock, 10) : 0;
    if (isNaN(stockCount) || stockCount < 0)
      return Alert.alert('Missing Field', 'Stock must be a non-negative number.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name',         name.trim());
      formData.append('category',     category);
      formData.append('price',        parseFloat(price).toString());
      formData.append('unit',         unit);
      formData.append('countInStock', stockCount.toString());
      formData.append('description',  description.trim());
      formData.append('isAvailable',  isAvailable.toString());

      // Tags as array
      selectedTags.forEach(tag => formData.append('tags[]', tag));

      if (newImage) {
        // ✅ FIX: Correct FormData file object — type must be a valid MIME string
        formData.append('productImage', {
          uri: Platform.OS === 'ios' ? newImage.uri.replace('file://', '') : newImage.uri,
          type: newImage.type,   // already fixed to be "image/jpeg" etc.
          name: newImage.name,
        });
      } else if (removeImage) {
        formData.append('remove_image', 'true');
      }

      // ✅ FIX: Explicit Content-Type with multipart/form-data so axios
      // attaches the correct boundary — without this, RN axios sometimes
      // sends the wrong header and the server rejects the body.
      const res = await updateProduct(product._id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.status === 200) {
        setIsDirty(false);
        Toast.show({ type: 'success', text1: '✅ Product Updated', text2: 'All changes saved successfully.' });
        navigation.goBack();
      } else {
        throw new Error(res?.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err?.response?.data || err?.message || err);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err?.response?.data?.message || err?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── DELETE ────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      '🗑️  Delete Product',
      `Are you sure you want to permanently delete "${product?.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await deleteProduct(product._id);
              if (res?.status === 200 || res?.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Product Deleted',
                  text2: `"${product?.name}" has been removed.`,
                });
                navigation.goBack();
              } else {
                throw new Error(res?.data?.message || 'Delete failed');
              }
            } catch (err) {
              console.error('Delete error:', err?.response?.data || err?.message || err);
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: err?.response?.data?.message || err?.message || 'Please try again.',
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── LOADING STATE ─────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Product</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── RENDER ────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Product</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{product?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          style={[styles.headerSaveBtn, (!isDirty || submitting) && styles.headerSaveBtnDim]}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.headerSaveBtnText}>Save</Text>}
        </TouchableOpacity>
      </Animated.View>

      {/* Dirty indicator strip */}
      {isDirty && (
        <View style={styles.dirtyStrip}>
          <Ionicons name="alert-circle-outline" size={13} color="#E65100" />
          <Text style={styles.dirtyText}>You have unsaved changes</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ════════════════
              01  PHOTO
              ════════════════ */}
          <Card title="Product Photo" iconName="image-outline">
            {imagePreview ? (
              <View style={styles.imgWrap}>
                <Image source={{ uri: imagePreview }} style={styles.imgPreview} resizeMode="cover" />

                {/* State badge */}
                {(newImage || removeImage) && (
                  <View style={[styles.imgBadge, removeImage && styles.imgBadgeDanger]}>
                    <Ionicons name={newImage ? 'checkmark-circle' : 'warning'} size={12} color="#fff" />
                    <Text style={styles.imgBadgeText}>
                      {newImage ? 'New image ready' : 'Will be removed'}
                    </Text>
                  </View>
                )}

                {/* Overlay actions */}
                <View style={styles.imgOverlayActions}>
                  <TouchableOpacity style={styles.imgOverlayBtn} onPress={showImageOptions}>
                    <Ionicons name="camera-outline" size={15} color="#fff" />
                    <Text style={styles.imgOverlayBtnText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.imgOverlayBtn, styles.imgOverlayBtnRed]} onPress={handleRemoveImage}>
                    <Ionicons name="trash-outline" size={15} color="#fff" />
                    <Text style={styles.imgOverlayBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.imgUploadBox} onPress={showImageOptions} activeOpacity={0.8}>
                <View style={styles.imgUploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.imgUploadTitle}>Add Product Photo</Text>
                <Text style={styles.imgUploadSub}>Tap to choose from camera or library</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* ════════════════
              02  BASIC INFO
              ════════════════ */}
          <Card title="Basic Information" iconName="information-circle-outline">
            <Field label="Product Name" required>
              <View style={styles.inputWrap}>
                <Ionicons name="pricetag-outline" size={15} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={v => { setName(v); setIsDirty(true); }}
                  placeholder="e.g. Fresh Roma Tomatoes"
                  placeholderTextColor="#C5C5C5"
                />
              </View>
            </Field>

            <Field label="Category" required>
              <DropdownPicker
                label="Select Category"
                icon="grid-outline"
                value={category}
                options={VALID_CATEGORIES}
                onSelect={v => { setCategory(v); setIsDirty(true); }}
                placeholder="Choose a category..."
              />
            </Field>
          </Card>

          {/* ════════════════
              03  PRICING
              ════════════════ */}
          <Card title="Pricing & Inventory" iconName="cash-outline">
            {/* Price */}
            <Field label="Price" required>
              <View style={styles.priceWrap}>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>GH₵</Text>
                </View>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={v => { setPrice(v); setIsDirty(true); }}
                  placeholder="0.00"
                  placeholderTextColor="#C5C5C5"
                  keyboardType="decimal-pad"
                />
              </View>
            </Field>

            {/* Unit */}
            <Field label="Unit" required>
              <DropdownPicker
                label="Select Unit"
                icon="scale-outline"
                value={unit}
                options={VALID_UNITS}
                onSelect={v => { setUnit(v); setIsDirty(true); }}
                placeholder="Choose a unit..."
              />
            </Field>

            {/* Stock + Availability */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Field label="Stock Qty">
                  <View style={styles.inputWrap}>
                    <Ionicons name="layers-outline" size={15} color="#9E9E9E" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={stock}
                      onChangeText={v => { setStock(v); setIsDirty(true); }}
                      placeholder="0"
                      placeholderTextColor="#C5C5C5"
                      keyboardType="numeric"
                    />
                  </View>
                </Field>
              </View>

              <View style={{ flex: 1 }}>
                <Field label="Availability">
                  <View style={styles.availRow}>
                    <TouchableOpacity
                      style={[styles.availChip, isAvailable && styles.availChipOn]}
                      onPress={() => { setIsAvailable(true); setIsDirty(true); }}
                    >
                      <View style={[styles.availDot, { backgroundColor: '#4CAF50' }]} />
                      <Text style={[styles.availText, isAvailable && styles.availTextOn]}>In Stock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.availChip, !isAvailable && styles.availChipOff]}
                      onPress={() => { setIsAvailable(false); setIsDirty(true); }}
                    >
                      <View style={[styles.availDot, { backgroundColor: '#E53935' }]} />
                      <Text style={[styles.availText, !isAvailable && styles.availTextOff]}>Out</Text>
                    </TouchableOpacity>
                  </View>
                </Field>
              </View>
            </View>
          </Card>

          {/* ════════════════
              04  DESCRIPTION
              ════════════════ */}
          <Card title="Description" iconName="document-text-outline">
            <Field label="Product Description" hint="optional">
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={v => { setDescription(v); setIsDirty(true); }}
                  placeholder="Describe origin, quality, freshness..."
                  placeholderTextColor="#C5C5C5"
                  multiline
                  textAlignVertical="top"
                />
              </View>
              {description.length > 0 && (
                <Text style={styles.charCount}>{description.length} characters</Text>
              )}
            </Field>
          </Card>

          {/* ════════════════
              05  TAGS
              ════════════════ 
          <Card title="Product Tags" iconName="pricetags-outline">
            <Text style={styles.tagsHint}>Tap to toggle — helps customers find your product</Text>
            <View style={styles.tagsGrid}>
              {AVAILABLE_TAGS.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => toggleTag(key)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tagEmoji}>{icon}</Text>
                    <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                      {formatLabel(key)}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.tagSummary}>
                <Ionicons name="pricetags" size={13} color="#2E7D32" />
                <Text style={styles.tagSummaryText}>
                  {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
                </Text>
                <TouchableOpacity onPress={() => { setSelectedTags([]); setIsDirty(true); }}>
                  <Text style={styles.tagClearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}

          </Card>*/}

          {/* ── SAVE BUTTON ── */}
          {/* ── ACTION BUTTONS ── */}
          <TouchableOpacity
            style={[styles.saveBtn, (submitting || deleting) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={submitting || deleting}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={styles.saveBtnIcon}>
                  <Ionicons name="checkmark" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.saveBtnText}>Save Changes</Text>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.75)" />
              </>
            )}
          </TouchableOpacity>

          {/* ── DELETE BUTTON ── */}
          <TouchableOpacity
            style={[styles.deleteBtn, (deleting || submitting) && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={deleting || submitting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#C62828" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={17} color="#C62828" />
                <Text style={styles.deleteBtnText}>Delete Product</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F5F2' },

  // ── HEADER ──
  header: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  headerSaveBtn: {
    backgroundColor: '#4CAF50', paddingHorizontal: 18,
    paddingVertical: 8, borderRadius: 20,
  },
  headerSaveBtnDim: { backgroundColor: 'rgba(255,255,255,0.2)' },
  headerSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Dirty strip
  dirtyStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#FFE0B2',
  },
  dirtyText: { fontSize: 12, color: '#E65100', fontWeight: '600' },

  // ── LOADING ──
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#616161' },

  // ── SCROLL ──
  scroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },

  // ── CARD ──
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },

  // ── FIELD ──
  fieldWrap: { marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#616161', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldRequired: { fontSize: 12, color: '#E53935', fontWeight: '700' },
  fieldHint: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },

  // ── INPUT ──
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, backgroundColor: '#FAFAFA',
    paddingHorizontal: 12, minHeight: 48,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingVertical: 10 },
  textAreaWrap: { alignItems: 'flex-start', paddingTop: 10 },
  textArea: { height: 100, paddingTop: 0 },
  charCount: { fontSize: 11, color: '#BDBDBD', alignSelf: 'flex-end', marginTop: 4 },

  // ── PRICE ──
  priceWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, backgroundColor: '#FAFAFA', overflow: 'hidden',
  },
  currencyBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 14,
    height: 48, justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#E0E0E0',
  },
  currencyText: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  priceInput: { flex: 1, paddingHorizontal: 14, fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  // ── TWO COL ──
  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },

  // ── AVAILABILITY ──
  availRow: { flexDirection: 'row', gap: 8 },
  availChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent',
  },
  availChipOn:  { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  availChipOff: { backgroundColor: '#FFEBEE', borderColor: '#E53935' },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '600', color: '#9E9E9E' },
  availTextOn:  { color: '#2E7D32' },
  availTextOff: { color: '#C62828' },

  // ── IMAGE ──
  imgWrap: { borderRadius: 16, overflow: 'hidden', height: 220, position: 'relative' },
  imgPreview: { width: '100%', height: '100%' },
  imgBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(46,125,50,0.85)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  imgBadgeDanger: { backgroundColor: 'rgba(198,40,40,0.85)' },
  imgBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imgOverlayActions: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', gap: 8,
  },
  imgOverlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  imgOverlayBtnRed: { backgroundColor: 'rgba(198,40,40,0.85)' },
  imgOverlayBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  imgUploadBox: {
    height: 180, borderRadius: 16,
    backgroundColor: '#F1F8F3',
    borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  imgUploadIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  imgUploadTitle: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  imgUploadSub: { fontSize: 13, color: '#888' },

  // ── DROPDOWN ──
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12,
    backgroundColor: '#FAFAFA', paddingHorizontal: 14, paddingVertical: 13,
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dropdownTriggerText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  dropdownPlaceholder: { color: '#C5C5C5', fontWeight: '400' },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dropdownSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingHorizontal: 16, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
  },
  dropdownHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 12,
  },
  dropdownSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  dropdownSheetTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  dropdownCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  dropdownOptionSelected: { backgroundColor: '#F1F8F3', borderRadius: 10, paddingHorizontal: 10 },
  dropdownOptionEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  dropdownOptionLabel: { flex: 1, fontSize: 15, color: '#424242', fontWeight: '500' },
  dropdownOptionLabelSelected: { color: '#1B5E20', fontWeight: '700' },

  // ── TAGS ──
  tagsHint: { fontSize: 12, color: '#9E9E9E', marginBottom: 12, marginTop: -8 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 22, backgroundColor: '#F5F5F5',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tagChipActive: { backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive: { color: '#2E7D32', fontWeight: '700' },
  tagSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  tagSummaryText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: '#E53935', fontWeight: '600' },

  // ── SAVE BUTTON ──
  saveBtn: {
    backgroundColor: '#1B5E20', paddingVertical: 17, paddingHorizontal: 24,
    borderRadius: 18, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 12,
    marginTop: 6,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  saveBtnDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0 },
  saveBtnIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // ── DELETE BUTTON ──
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 12,
    paddingVertical: 15, paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1.5, borderColor: '#FFCDD2',
    shadowColor: '#C62828', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#C62828' },
});

export default VendorProductDetailScreen;