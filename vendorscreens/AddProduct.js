// src/vendorscreens/AddProductScreen.js
import React, { useState, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { createProduct } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const VALID_CATEGORIES = [
  { key: 'vegetable',   icon: '🥦' },
  { key: 'fruit',       icon: '🍎' },
  { key: 'staple',      icon: '🌾' },
  { key: 'herb',        icon: '🌿' },
  { key: 'tuber',       icon: '🥔' },
  { key: 'grain',       icon: '🌽' },
  { key: 'cereal',      icon: '🥣' },
  { key: 'meat',        icon: '🥩' },
  { key: 'poultry',     icon: '🍗' },
  { key: 'seafood',     icon: '🐟' },
  { key: 'frozen-food', icon: '🧊' },
  { key: 'spice',       icon: '🌶️' },
  { key: 'other',       icon: '📦' },
];

const VALID_UNITS = ['kg', 'g', 'piece', 'pieces', 'bunch', 'bag', 'pack', 'basket', 'olonka'];

const AVAILABLE_TAGS = [
  { key: 'organic',         icon: '🌱' },
  { key: 'farm_fresh',      icon: '🚜' },
  { key: 'locally_sourced', icon: '📍' },
  { key: 'fresh_today',     icon: '✨' },
  { key: 'seasonal',        icon: '🍂' },
  { key: 'popular',         icon: '🔥' },
  { key: 'best_selling',    icon: '⭐' },
  { key: 'new_arrival',     icon: '🆕' },
  { key: 'discounted',      icon: '🏷️' },
  { key: 'perishable',      icon: '⏱️' },
  { key: 'ready_to_cook',   icon: '👨‍🍳' },
  { key: 'ready_to_eat',    icon: '🍽️' },
];

const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─────────────────────────────────────────────
// BOTTOM SHEET DROPDOWN
// Slides up from the bottom — never floats in
// the middle of the screen regardless of where
// the trigger button lives on the page.
// ─────────────────────────────────────────────
const DropdownSelector = ({
  label,
  placeholder,
  items,
  selectedValue,
  onSelect,
  required,
  renderItem,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 1, tension: 68, friction: 13, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleSelect = (key) => { onSelect(key); closeSheet(); };

  // Sheet slides from the bottom (translateY: height → 0)
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const selectedItem = items.find(
    (item) => (typeof item === 'string' ? item : item.key) === selectedValue,
  );

  // Build the trigger button display text
  const triggerLabel = selectedItem
    ? typeof selectedItem === 'string'
      ? selectedItem
      : (selectedItem.icon ? selectedItem.icon + '  ' : '') + formatDisplayName(selectedItem.key)
    : placeholder;

  return (
    <View style={style}>
      {label && (
        <Text style={styles.dropdownLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* ── Trigger button ── */}
      <TouchableOpacity
        style={[styles.dropdownButton, visible && styles.dropdownButtonFocused]}
        activeOpacity={0.8}
        onPress={openSheet}
      >
        <Text
          style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder]}
          numberOfLines={1}
        >
          {triggerLabel}
        </Text>
        <Ionicons
          name={visible ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={visible ? '#2E7D32' : '#9E9E9E'}
        />
      </TouchableOpacity>

      {/* ── Bottom-sheet modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        {/* Animated backdrop — tap outside to close */}
        <Animated.View style={[bsStyles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>

        {/* Animated sheet panel */}
        <Animated.View style={[bsStyles.sheet, { transform: [{ translateY }] }]}>
          {/* Drag handle */}
          <View style={bsStyles.handle} />

          {/* Sheet header */}
          <View style={bsStyles.sheetHeader}>
            <Text style={bsStyles.sheetTitle}>{label || placeholder}</Text>
            <TouchableOpacity style={bsStyles.closeBtn} onPress={closeSheet}>
              <Ionicons name="close" size={18} color="#616161" />
            </TouchableOpacity>
          </View>

          {/* Item list */}
          <FlatList
            data={items}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.key)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => {
              const key        = typeof item === 'string' ? item : item.key;
              const isSelected = selectedValue === key;
              return (
                <TouchableOpacity
                  style={[bsStyles.item, isSelected && bsStyles.itemActive]}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.75}
                >
                  {renderItem ? (
                    renderItem({ item, isSelected })
                  ) : (
                    <>
                      {item.icon && <Text style={bsStyles.itemEmoji}>{item.icon}</Text>}
                      <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>
                        {typeof item === 'string' ? item : formatDisplayName(item.key)}
                      </Text>
                    </>
                  )}
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2E7D32"
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </View>
  );
};

// Isolated bottom-sheet styles so they never clash with the main StyleSheet
const bsStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: height * 0.62,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 15, paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  itemActive: {
    backgroundColor: '#F1F8F3',
    borderBottomColor: 'transparent',
  },
  itemEmoji:        { fontSize: 22, width: 32, textAlign: 'center' },
  itemText:         { fontSize: 15, color: '#424242', fontWeight: '500', flex: 1 },
  itemTextActive:   { color: '#1B5E20', fontWeight: '700' },
});

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────
const STEPS = ['Photo', 'Details', 'Pricing', 'Tags'];

const StepIndicator = ({ currentStep }) => (
  <View style={styles.stepRow}>
    {STEPS.map((label, i) => {
      const done   = i < currentStep;
      const active = i === currentStep;
      return (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
              {done
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, done && styles.stepLineDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────
// FLOATING LABEL INPUT
// ─────────────────────────────────────────────
const FloatingInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.floatWrap, focused && styles.floatWrapFocused, multiline && styles.floatWrapMulti]}>
      <View style={styles.floatHeader}>
        <Ionicons name={icon} size={14} color={focused ? '#2E7D32' : '#9E9E9E'} />
        <Text style={[styles.floatLabel, focused && styles.floatLabelFocused]}>
          {label}{required ? ' *' : ''}
        </Text>
      </View>
      <TextInput
        style={[styles.floatInput, multiline && styles.floatInputMulti]}
        placeholder={placeholder}
        placeholderTextColor="#C5C5C5"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────
const SectionCard = ({ title, subtitle, accent = '#2E7D32', children, stepNum }) => (
  <View style={styles.card}>
    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
    <View style={styles.cardInner}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardStepBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.cardStepNum, { color: accent }]}>{stepNum}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  </View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const AddProductScreen = ({ navigation }) => {
  const [name,         setName]         = useState('');
  const [category,     setCategory]     = useState('');
  const [price,        setPrice]        = useState('');
  const [unit,         setUnit]         = useState('');
  const [stock,        setStock]        = useState('');
  const [description,  setDescription]  = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isAvailable,  setIsAvailable]  = useState(true);
  const [image,        setImage]        = useState(null);
  const [loading,      setLoading]      = useState(false);

  const currentStep = !image ? 0 : !name || !category ? 1 : !price || !unit ? 2 : 3;
  const completionPct = Math.round((currentStep / (STEPS.length - 1)) * 100);

  // ── Image picking ──────────────────────────
  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert('Permission Denied', 'We need access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      setImage({ uri: asset.uri, type: mimeType, name: asset.fileName || `product_${Date.now()}.${ext}` });
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert('Permission Denied', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.85 });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      setImage({ uri: asset.uri, type: mimeType, name: asset.fileName || `product_${Date.now()}.${ext}` });
    }
  };

  const showImagePicker = () => {
    Alert.alert('Product Photo', 'Choose a source', [
      { text: '📷  Camera',       onPress: takePhoto },
      { text: '🖼️  Photo Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Tags ───────────────────────────────────
  const toggleTag = (tag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── Submit ─────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim())  return Alert.alert('Missing Info', 'Product name is required');
    if (!category)     return Alert.alert('Missing Info', 'Please select a category');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return Alert.alert('Missing Info', 'Please enter a valid price');
    if (!unit)         return Alert.alert('Missing Info', 'Please select a unit');
    if (!image)        return Alert.alert('Missing Info', 'Product image is required');

    const stockCount = stock.trim() ? parseInt(stock, 10) : 0;
    if (isNaN(stockCount) || stockCount < 0)
      return Alert.alert('Missing Info', 'Stock must be a non-negative number');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name',         name.trim());
      formData.append('category',     category);
      formData.append('price',        parseFloat(price));
      formData.append('unit',         unit);
      formData.append('countInStock', stockCount);
      formData.append('description',  description.trim() || '');
      formData.append('isAvailable',  isAvailable.toString());
      selectedTags.forEach(tag => formData.append('tags[]', tag));
      formData.append('productImage', {
        uri:  Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
        type: image.type,
        name: image.name,
      });

      const response = await createProduct(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response?.data?.success || response?.status === 201) {
        Toast.show({ type: 'success', text1: 'Published!', text2: `${name} is now live.` });
        navigation.goBack();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong.';
      Toast.show({ type: 'error', text1: 'Failed to Publish', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>New Product</Text>
            <Text style={styles.headerSub}>Fill in all required fields</Text>
          </View>
          <View style={styles.headerCompletionBadge}>
            <Text style={styles.headerCompletionText}>{completionPct}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator currentStep={currentStep} />

          {/* ════════════════
              01  PHOTO
              ════════════════ */}
          <SectionCard title="Product Photo" subtitle="Clear photos sell faster" accent="#1B5E20" stepNum="01">
            {image ? (
              <View style={styles.imgPreviewWrap}>
                <Image source={{ uri: image.uri }} style={styles.imgPreview} resizeMode="cover" />
                <View style={styles.imgQualityBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.imgQualityText}>Photo ready</Text>
                </View>
                <View style={styles.imgActions}>
                  <TouchableOpacity style={styles.imgAction} onPress={showImagePicker}>
                    <Ionicons name="camera-outline" size={15} color="#fff" />
                    <Text style={styles.imgActionText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.imgAction, styles.imgActionDanger]} onPress={() => setImage(null)}>
                    <Ionicons name="trash-outline" size={15} color="#fff" />
                    <Text style={styles.imgActionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={showImagePicker} activeOpacity={0.8}>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="image-outline" size={36} color="#2E7D32" />
                </View>
                <Text style={styles.uploadTitle}>Add Product Photo</Text>
                <Text style={styles.uploadSub}>Tap to choose from library or camera</Text>
                <View style={styles.uploadFormats}>
                  <Text style={styles.uploadFormatText}>JPG · PNG · WebP  •  4:3 recommended</Text>
                </View>
              </TouchableOpacity>
            )}
          </SectionCard>

          {/* ════════════════
              02  BASIC INFO
              ════════════════ */}
          <SectionCard title="Basic Information" subtitle="Name & category" accent="#2E7D32" stepNum="02">
            <FloatingInput
              label="Product Name"
              icon="pricetag-outline"
              placeholder="e.g. Fresh Roma Tomatoes"
              value={name}
              onChangeText={setName}
              required
            />

            {/* Category — bottom sheet */}
            <DropdownSelector
              label="Category"
              placeholder="Select product category"
              items={VALID_CATEGORIES}
              selectedValue={category}
              onSelect={setCategory}
              required
              style={{ marginBottom: 4 }}
              renderItem={({ item, isSelected }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{item.icon}</Text>
                  <Text style={[bsStyles.itemText, { marginLeft: 12 }, isSelected && bsStyles.itemTextActive]}>
                    {formatDisplayName(item.key)}
                  </Text>
                </View>
              )}
            />
          </SectionCard>

          {/* ════════════════
              03  PRICING & INVENTORY
              ════════════════ */}
          <SectionCard title="Pricing & Inventory" subtitle="Set your price, unit & stock" accent="#388E3C" stepNum="03">

            {/* Price */}
            <Text style={styles.quickLabel}>Price (GH₵) <Text style={styles.required}>*</Text></Text>
            <View style={styles.priceInputFull}>
              <View style={styles.currencyTag}>
                <Text style={styles.currencyText}>GH₵</Text>
              </View>
              <TextInput
                style={styles.priceInputField}
                placeholder="0.00"
                placeholderTextColor="#C5C5C5"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            {/* Unit — bottom sheet */}
            <DropdownSelector
              label="Unit"
              placeholder="Select a unit"
              items={VALID_UNITS}
              selectedValue={unit}
              onSelect={setUnit}
              required
              style={{ marginBottom: 14 }}
            />

            {/* Stock */}
            <Text style={styles.quickLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.simpleInput}
              placeholder="e.g. 50"
              placeholderTextColor="#C5C5C5"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />

            {/* Availability */}
            <Text style={styles.quickLabel}>Availability</Text>
            <View style={styles.availRow}>
              <TouchableOpacity
                style={[styles.availOption, isAvailable && styles.availOptionActive]}
                onPress={() => setIsAvailable(true)}
              >
                <View style={[styles.availDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.availText, isAvailable && styles.availTextActive]}>In Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.availOption, !isAvailable && styles.availOptionInactive]}
                onPress={() => setIsAvailable(false)}
              >
                <View style={[styles.availDot, { backgroundColor: '#E53935' }]} />
                <Text style={[styles.availText, !isAvailable && styles.availTextInactive]}>Out of Stock</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ════════════════
              04  DESCRIPTION & TAGS
              ════════════════ */}
          <SectionCard title="Description & Tags" subtitle="Help buyers find your product" accent="#43A047" stepNum="04">
            <FloatingInput
              label="Description"
              icon="document-text-outline"
              placeholder="Describe origin, quality, freshness..."
              value={description}
              onChangeText={setDescription}
              multiline
            />

           {/*} <Text style={[styles.quickLabel, { marginTop: 4 }]}>Tags <Text style={styles.optional}>(optional)</Text></Text>
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
                      {formatDisplayName(key)}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.tagCountRow}>
                <Ionicons name="pricetags" size={13} color="#2E7D32" />
                <Text style={styles.tagCountText}>{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected</Text>
                <TouchableOpacity onPress={() => setSelectedTags([])}>
                  <Text style={styles.tagClearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}*/}
          </SectionCard>

          {/* ── READY SUMMARY ── */}
          {name && category && price && unit && image && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-done-circle" size={18} color="#2E7D32" />
                <Text style={styles.summaryTitle}>Ready to Publish</Text>
              </View>
              {[
                ['Name',     name],
                ['Category', formatDisplayName(category)],
                ['Price',    `GH₵ ${parseFloat(price || 0).toFixed(2)} / ${unit}`],
                ['Stock',    `${stock || '0'} units · ${isAvailable ? 'In Stock ✅' : 'Out of Stock'}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>{k}</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── PUBLISH BUTTON ── */}
          <TouchableOpacity
            style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={styles.publishIcon}>
                  <Ionicons name="rocket-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.publishBtnText}>Publish Product</Text>
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
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
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  // ── HEADER ──
  header: {
    borderTopRightRadius: 8, borderTopLeftRadius: 8,
    backgroundColor: '#1B5E20',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:          { flex: 1 },
  headerTitle:           { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:             { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  headerCompletionBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerCompletionText:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  progressBarBg:         { height: 3, backgroundColor: '#C8E6C9' },
  progressBarFill:       { height: 3, backgroundColor: '#4CAF50' },

  // ── STEP BAR ──
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff', marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  stepItem:        { alignItems: 'center', gap: 4 },
  stepLine:        { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4, marginBottom: 14 },
  stepLineDone:    { backgroundColor: '#4CAF50' },
  stepCircle:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  stepDone:        { backgroundColor: '#4CAF50' },
  stepActive:      { backgroundColor: '#1B5E20', borderWidth: 2, borderColor: '#A5D6A7' },
  stepNum:         { fontSize: 11, fontWeight: '700', color: '#9E9E9E' },
  stepNumActive:   { color: '#fff' },
  stepLabel:       { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  stepLabelActive: { color: '#1B5E20', fontWeight: '700' },

  // ── SCROLL ──
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20 },

  // ── SECTION CARD ──
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    marginBottom: 14, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardAccent:     { width: 4 },
  cardInner:      { flex: 1, padding: 18 },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  cardStepBadge:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardStepNum:    { fontSize: 13, fontWeight: '900', letterSpacing: -0.5 },
  cardTitle:      { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  cardSubtitle:   { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },

  // ── FLOATING INPUT ──
  floatWrap: {
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
    backgroundColor: '#FAFAFA', marginBottom: 14,
  },
  floatWrapFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  floatWrapMulti:   { paddingBottom: 16 },
  floatHeader:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  floatLabel:       { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 0.3, textTransform: 'uppercase' },
  floatLabelFocused:{ color: '#2E7D32' },
  floatInput:       { fontSize: 15.5, color: '#1A1A1A', padding: 0 },
  floatInputMulti:  { height: 90, textAlignVertical: 'top' },

  // ── IMAGE ──
  imgPreviewWrap:  { height: 220, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imgPreview:      { width: '100%', height: '100%' },
  imgQualityBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  imgQualityText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  imgActions: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  imgAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  imgActionDanger: { backgroundColor: 'rgba(211,47,47,0.85)' },
  imgActionText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  uploadBox: {
    height: 190, backgroundColor: '#F1F8F3', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  uploadIconWrap:   { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  uploadTitle:      { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  uploadSub:        { fontSize: 13, color: '#888' },
  uploadFormats:    { marginTop: 8, backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  uploadFormatText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },

  // ── DROPDOWN TRIGGER (shared) ──
  dropdownLabel: {
    fontSize: 12, fontWeight: '700', color: '#616161',
    letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA',
  },
  dropdownButtonFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  dropdownButtonText:    { fontSize: 15.5, color: '#1A1A1A', flex: 1 },
  dropdownPlaceholder:   { color: '#C5C5C5' },

  // ── QUICK LABEL ──
  quickLabel: {
    fontSize: 12, fontWeight: '700', color: '#616161',
    letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },
  required: { color: '#E53935' },
  optional: { color: '#9E9E9E', fontWeight: '500', textTransform: 'none', fontSize: 12 },

  // ── PRICE ──
  priceInputFull: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 14, overflow: 'hidden', marginBottom: 14,
  },
  currencyTag: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 14,
    height: 52, justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#E0E0E0',
  },
  currencyText:  { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  priceInputField: { flex: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },

  // ── SIMPLE INPUT (stock) ──
  simpleInput: {
    backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: '#1A1A1A', fontWeight: '600', marginBottom: 14,
  },

  // ── AVAILABILITY ──
  availRow:           { flexDirection: 'row', gap: 10, marginBottom: 4 },
  availOption:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  availOptionActive:  { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  availOptionInactive:{ backgroundColor: '#FFEBEE', borderColor: '#E53935' },
  availDot:           { width: 9, height: 9, borderRadius: 5 },
  availText:          { fontSize: 13, fontWeight: '600', color: '#666' },
  availTextActive:    { color: '#2E7D32' },
  availTextInactive:  { color: '#C62828' },

  // ── TAGS ──
  tagsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 22, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  tagChipActive:{ backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  tagEmoji:     { fontSize: 13 },
  tagLabel:     { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive:{ color: '#2E7D32', fontWeight: '700' },
  tagCountRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagCountText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: '#E53935', fontWeight: '600' },

  // ── SUMMARY CARD ──
  summaryCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#C8E6C9', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  summaryTitle:  { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  summaryKey:    { fontSize: 12, color: '#9E9E9E', fontWeight: '600', flex: 0.4 },
  summaryVal:    { fontSize: 13, color: '#1A1A1A', fontWeight: '700', flex: 0.6, textAlign: 'right' },

  // ── PUBLISH BUTTON ──
  publishBtn: {
    backgroundColor: '#1B5E20', paddingVertical: 18, paddingHorizontal: 24,
    borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  publishBtnDisabled: { backgroundColor: '#81C784', shadowOpacity: 0 },
  publishIcon:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  publishBtnText:     { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default AddProductScreen;