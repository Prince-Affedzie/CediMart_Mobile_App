// src/vendorscreens/AddProductScreen.js
import React, { useState, useRef, useMemo } from 'react';
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
import { createProduct } from '../apis/vendorApi';
import { aiProductDetailsGenerator } from '../apis/aiApi';
import Toast from 'react-native-toast-message';
import {CONDITION_OPTIONS,SUBCATEGORIES_MAP,VALID_CATEGORIES,CAMPUS_OPTIONS,AVAILABLE_TAGS } from '../data/General'
import AIProductGeneratorFAB from '../components/AIProductGeneratorFAB';
const { width, height } = Dimensions.get('window');
import CommissionNotice from '../components/Referralprogramnotice'
import { useVendor } from '../context/VendorContext';


// ─── Teal + Coral Palette (matches UpdateProductScreen) ────────────────────
const C = {
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  white:        '#FFFFFF',
  black:        '#000000',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
};

const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─────────────────────────────────────────────────────────────────────────────
// AI AUTOFILL MATCHING HELPERS
// Gemini returns free-text category/subcategory guesses that won't always
// equal one of our schema keys exactly, so these normalize and fuzzy-match
// the suggestion against our known options. If nothing matches confidently,
// callers should leave the field blank rather than force an invalid value.
// ─────────────────────────────────────────────────────────────────────────────
const normalizeForMatch = (str = '') =>
  String(str).toLowerCase().trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const matchCategoryKey = (suggestion) => {
  if (!suggestion) return null;
  const norm = normalizeForMatch(suggestion);

  let found = VALID_CATEGORIES.find((c) => normalizeForMatch(c.key) === norm);
  if (found) return found.key;

  found = VALID_CATEGORIES.find((c) => {
    const key = normalizeForMatch(c.key);
    return norm.includes(key) || key.includes(norm);
  });
  return found ? found.key : null;
};

const matchSubcategoryKey = (suggestion, categoryKey) => {
  if (!suggestion || !categoryKey) return null;
  const options = SUBCATEGORIES_MAP[categoryKey] || [];
  const norm = normalizeForMatch(suggestion);

  let found = options.find(
    (o) => normalizeForMatch(o.key) === norm || normalizeForMatch(o.label) === norm
  );
  if (found) return found.key;

  found = options.find((o) => {
    const key = normalizeForMatch(o.key);
    const label = normalizeForMatch(o.label);
    return norm.includes(key) || key.includes(norm) || norm.includes(label) || label.includes(norm);
  });
  return found ? found.key : null;
};

// ── Small helper-text row used under tricky fields ──────────────────────────
const HelperText = ({ children, icon = 'information-circle-outline' }) => (
  <View style={styles.helperRow}>
    <Ionicons name={icon} size={13} color={C.t3} style={{ marginTop: 1 }} />
    <Text style={styles.helperText}>{children}</Text>
  </View>
);

// ── Inline field error ────────────────────────────────────────────────────────
const FieldError = ({ children }) => (
  <View style={styles.fieldErrorRow}>
    <Ionicons name="alert-circle" size={13} color={C.danger} />
    <Text style={styles.fieldErrorText}>{children}</Text>
  </View>
);

// ── Small "this came from Ask Cedi, please check it" pill ──────────────────
const AiDraftBadge = () => (
  <View style={styles.aiDraftBadge}>
    <Ionicons name="sparkles" size={10} color="#8E5FD9" />
    <Text style={styles.aiDraftBadgeText}>AI draft</Text>
  </View>
);

// ─── DropdownSelector ───────────────────────────────────────────────────────
const DropdownSelector = ({
  label, placeholder, items, selectedValue, onSelect, required, renderItem, style, disabled, error, badge,
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    if (disabled) return;
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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const selectedItem = items.find(
    (item) => (typeof item === 'string' ? item : item.key) === selectedValue,
  );

  const triggerLabel = selectedItem
    ? typeof selectedItem === 'string'
      ? selectedItem
      : (selectedItem.icon ? selectedItem.icon + '  ' : '') + (selectedItem.label || formatDisplayName(selectedItem.key))
    : placeholder;

  return (
    <View style={style}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={[styles.dropdownLabel, { marginBottom: 0 }]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {badge}
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          visible && styles.dropdownButtonFocused,
          disabled && styles.dropdownButtonDisabled,
          error && styles.dropdownButtonError,
        ]}
        activeOpacity={0.8}
        onPress={openSheet}
        disabled={disabled}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder, disabled && styles.dropdownButtonTextDisabled]} numberOfLines={1}>
          {triggerLabel}
        </Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={disabled ? C.t3 : visible ? C.brand : error ? C.danger : C.t3} />
      </TouchableOpacity>
      {!!error && <FieldError>{error}</FieldError>}

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
        <Animated.View style={[bsStyles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[bsStyles.sheet, { transform: [{ translateY }] }]}>
          <View style={bsStyles.handle} />
          <View style={bsStyles.sheetHeader}>
            <Text style={bsStyles.sheetTitle}>{label || placeholder}</Text>
            <TouchableOpacity style={bsStyles.closeBtn} onPress={closeSheet}>
              <Ionicons name="close" size={18} color={C.t2} />
            </TouchableOpacity>
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
                <TouchableOpacity
                  style={[bsStyles.item, isSelected && bsStyles.itemActive]}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.75}
                >
                  {renderItem ? (
                    renderItem({ item, isSelected })
                  ) : (
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {item.icon && <Text style={bsStyles.itemEmoji}>{item.icon}</Text>}
                        <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>
                          {item.label || formatDisplayName(item.key)}
                        </Text>
                      </View>
                      {item.hint && (
                        <Text style={bsStyles.itemHint}>{item.hint}</Text>
                      )}
                    </View>
                  )}
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.brand} style={{ marginLeft: 'auto' }} />}
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
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: height * 0.62, paddingHorizontal: 16, paddingTop: 10,
    shadowColor: C.black, shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1, shadowRadius: 18, elevation: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.t1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  itemActive: { backgroundColor: C.brandBg, borderBottomColor: 'transparent' },
  itemEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  itemText: { fontSize: 15, color: C.t2, fontWeight: '500', flex: 1 },
  itemTextActive: { color: C.brand, fontWeight: '700' },
  itemHint: { fontSize: 11.5, color: C.t3, marginTop: 2, marginLeft: 44 },
});

const FloatingInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, required, error, maxLength, badge }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[
        styles.floatWrap,
        focused && styles.floatWrapFocused,
        multiline && styles.floatWrapMulti,
        error && styles.floatWrapError,
        { marginBottom: 0 },
      ]}>
        <View style={styles.floatHeader}>
          <Ionicons name={icon} size={14} color={error ? C.danger : focused ? C.brand : C.t3} />
          <Text style={[styles.floatLabel, focused && styles.floatLabelFocused, error && styles.floatLabelError]}>
            {label}{required ? ' *' : ''}
          </Text>
          {badge}
          {maxLength && (
            <Text style={styles.charCount}>{(value?.length || 0)}/{maxLength}</Text>
          )}
        </View>
        <TextInput
          style={[styles.floatInput, multiline && styles.floatInputMulti]}
          placeholder={placeholder}
          placeholderTextColor="#C5C5C5"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {!!error && <FieldError>{error}</FieldError>}
    </View>
  );
};

// ─── SectionCard — consistent card shell used by every section ─────────────
const SectionCard = ({ title, subtitle, accent = C.brand, children }) => (
  <View style={styles.card}>
    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
    <View style={styles.cardInner}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.sectionHint}>{subtitle}</Text>}
      {children}
    </View>
  </View>
);

const AddProductScreen = ({ navigation }) => {
  const [name,           setName]           = useState('');
  const [category,       setCategory]       = useState('');
  const [subcategory,    setSubcategory]    = useState('');
  const [brand,          setBrand]          = useState('');
  const [price,          setPrice]          = useState('');
  const [negotiable,     setNegotiable]     = useState(false);
  const [condition,      setCondition]      = useState('good');
  const [description,    setDescription]    = useState('');
  const [campus,         setCampus]         = useState('');
  const [campusArea,     setCampusArea]     = useState('');
  const [hostel,         setHostel]         = useState('');
  const [selectedTags,   setSelectedTags]   = useState([]);
  const [countInStock,   setCountInStock]   = useState('1');
  const [images,         setImages]         = useState([]);
  const [loading,        setLoading]        = useState(false);

  // Discount fields
  const [hasDiscount,      setHasDiscount]      = useState(false);
  const [originalPrice,    setOriginalPrice]    = useState('');
  const [discountPercent,  setDiscountPercent]  = useState('');
  const [discountStartDate,setDiscountStartDate] = useState('');
  const [discountEndDate,  setDiscountEndDate]  = useState('');


  const {
      profile,
    } = useVendor();

  // Specifications fields
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [showSpecs, setShowSpecs] = useState(false);

  // Field-level errors — populated after a submit attempt
  const [errors, setErrors] = useState({});

  // AI-assisted listing draft
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftFields, setAiDraftFields] = useState({});
  const [aiUsedOnce, setAiUsedOnce] = useState(false);

  const scrollRef = useRef(null);

  const subcategoryOptions = useMemo(() => SUBCATEGORIES_MAP[category] || [], [category]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubcategory('');
    setErrors(prev => ({ ...prev, category: null }));
    setAiDraftFields(prev => ({ ...prev, category: false, subcategory: false }));
  };

  const pickImages = () => {
    Alert.alert('Add product photos', 'Where would you like to add photos from?', [
      {
        text: '📷  Take a photo',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.75, maxWidth: 1200, maxHeight: 1200 },
            (response) => {
              if (!response.didCancel && response.assets?.length > 0) {
                const asset = response.assets[0];
                setImages(prev => [...prev, { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `product_${Date.now()}.jpg` }]);
                setErrors(prev => ({ ...prev, images: null }));
              }
            }
          );
        },
      },
      {
        text: '🖼️  Choose from library',
        onPress: () => {
          launchImageLibrary(
            { mediaType: 'photo', quality: 0.75, maxWidth: 1200, maxHeight: 1200, selectionLimit: 10 - images.length },
            (response) => {
              if (!response.didCancel && response.assets?.length > 0) {
                const newImages = response.assets.map(asset => ({
                  uri: asset.uri, type: asset.type || 'image/jpeg',
                  name: asset.fileName || `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`,
                }));
                setImages(prev => [...prev, ...newImages].slice(0, 10));
                setErrors(prev => ({ ...prev, images: null }));
              }
            }
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));
  const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

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

  // ── AI autofill ──
  const handleAiAutofill = async () => {
    if (images.length === 0 || aiLoading) return;
    setAiLoading(true);

    try {
      const cover = images[0];
      const formData = new FormData();
      formData.append('productImage', {
        uri: Platform.OS === 'ios' ? cover.uri.replace('file://', '') : cover.uri,
        type: cover.type || 'image/jpeg',
        name: cover.name || `cover_${Date.now()}.jpg`,
      });

      const response = await aiProductDetailsGenerator(formData);
      const data = response?.data?.data || response?.data;
      if (!data) throw new Error('No suggestions returned');

      const filled = [];
      const nextDraftFlags = {};

      if (data.name) {
        setName(String(data.name).slice(0, 80));
        nextDraftFlags.name = true;
        filled.push('title');
      }

      if (data.description) {
        setDescription(String(data.description).slice(0, 500));
        nextDraftFlags.description = true;
        filled.push('description');
      }

      const matchedCategory = matchCategoryKey(data.suggestedCategory);
      let categoryWasUnmatched = !!data.suggestedCategory && !matchedCategory;

      if (matchedCategory) {
        setCategory(matchedCategory);
        setErrors(prev => ({ ...prev, category: null }));
        nextDraftFlags.category = true;
        filled.push('category');

        const matchedSubcategory = matchSubcategoryKey(data.suggestedSubcategory, matchedCategory);
        if (matchedSubcategory) {
          setSubcategory(matchedSubcategory);
          nextDraftFlags.subcategory = true;
          filled.push('subcategory');
        }
      }

      setAiDraftFields(nextDraftFlags);
      setAiUsedOnce(true);

      Alert.alert('Success', 'CediAi have Drafted an auto fill for your Listing');

      if (categoryWasUnmatched) {
        Alert.alert("Couldn't pick a category for you", 'Please pick a category yourself');
      }
    } catch (error) {
      Alert.alert('error', "CediAi couldn't analyze that photo");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Section validators ───────────────────────────────────────────
  const validatePhotos = () => {
    const next = {};
    if (images.length === 0) next.images = "Add at least one photo so buyers can see what they're getting.";
    return next;
  };

  const validateDetails = () => {
    const next = {};
    if (!name.trim()) next.name = 'Give your item a name buyers will recognize.';
    if (!category) next.category = 'Pick the category that best fits your item.';
    return next;
  };

  const validatePricing = () => {
    const next = {};
    if (!price.trim()) next.price = 'Enter a price for this item.';
    else if (isNaN(parseFloat(price)) || parseFloat(price) < 0) next.price = 'Enter a valid price (e.g. 150.00).';

    if (hasDiscount) {
      if (originalPrice && (isNaN(parseFloat(originalPrice)) || parseFloat(originalPrice) <= 0)) {
        next.originalPrice = 'Original price should be a number greater than 0.';
      }
      if (discountPercent && (isNaN(parseFloat(discountPercent)) || parseFloat(discountPercent) < 0 || parseFloat(discountPercent) > 100)) {
        next.discountPercent = 'Discount should be a number between 0 and 100.';
      }
    }
    return next;
  };

  const validateLocation = () => {
    const next = {};
    if (!campus) next.campus = "Select the campus where you'll meet buyers.";
    return next;
  };

  const validateAll = () => ({
    ...validatePhotos(),
    ...validateDetails(),
    ...validatePricing(),
    ...validateLocation(),
  });

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  // ── Per-section completion ────────────────────────────────────────────
  const photosComplete   = images.length > 0;
  const detailsComplete  = !!name.trim() && !!category && !!condition;
  const pricingComplete  = !!price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0;
  const locationComplete = !!campus;

  const completedCount = [photosComplete, detailsComplete, pricingComplete, locationComplete].filter(Boolean).length;
  const completionPct = Math.round((completedCount / 4) * 100);

  const handleSubmit = async () => {
    const next = validateAll();
    const errorKeys = Object.keys(next);

    if (errorKeys.length > 0) {
      setErrors(next);
      scrollToTop();
      Toast.show({
        type: 'error',
        text1: 'A few things need fixing',
        text2: `${errorKeys.length} field${errorKeys.length > 1 ? 's' : ''} need${errorKeys.length === 1 ? 's' : ''} your attention.`,
      });
      return;
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
      if (campusArea.trim()) formData.append('location[campusArea]', campusArea.trim());
      if (hostel.trim()) formData.append('location[hostel]', hostel.trim());
      formData.append('countInStock', parseInt(countInStock) || 1);
      selectedTags.forEach(tag => formData.append('tags[]', tag));

      const filledSpecs = specifications.filter(s => s.key.trim() && s.value.trim());
      if (filledSpecs.length > 0) {
        const specsObj = {};
        filledSpecs.forEach(s => { specsObj[s.key.trim()] = s.value.trim(); });
        formData.append('specifications', JSON.stringify(specsObj));
      }

      if (hasDiscount) {
        if (originalPrice) formData.append('originalPrice', parseFloat(originalPrice));
        if (discountPercent) formData.append('discountPercentage', parseFloat(discountPercent));
        if (discountStartDate) formData.append('discountStartDate', discountStartDate);
        if (discountEndDate) formData.append('discountEndDate', discountEndDate);
        formData.append('isOnSale', 'true');
      }

      images.forEach((img) => {
        formData.append('productImages', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          type: img.type,
          name: img.name,
        });
      });

      const response = await createProduct(formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (response?.data?.success || response?.status === 201) {
        Alert.alert('success', `"${name.trim()}" is now live on CediMart.`);
        navigation.navigate('VendorMainTabs', { screen: 'MyProducts' });
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Could not list item', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.t1} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>List Item</Text>
            <Text style={styles.headerSub}>Sell to students on your campus</Text>
          </View>
          <View style={[styles.headerCompletionBadge, completionPct === 100 && styles.headerCompletionBadgeDone]}>
            <Text style={[styles.headerCompletionText, completionPct === 100 && styles.headerCompletionTextDone]}>
              {completionPct}%
            </Text>
          </View>
        </View>

        <CommissionNotice vendorId={profile._id}/>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Product Photos ── */}
          <SectionCard title="Product Photos" accent={C.brandD} subtitle="Up to 10 photos. The first one becomes your cover image.">
            <View style={styles.imageGrid}>
              {images.map((img, i) => (
                <View key={i} style={styles.imageThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={22} color={C.danger} />
                  </TouchableOpacity>
                  {i === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>}
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity
                  style={[styles.imageAddBtn, errors.images && styles.imageAddBtnError]}
                  onPress={pickImages}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={32} color={errors.images ? C.danger : C.brand} />
                  <Text style={[styles.imageAddText, errors.images && { color: C.danger }]}>
                    {images.length === 0 ? 'Add Photos' : `${images.length}/10`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <HelperText icon="bulb-outline">
              Clear, well-lit photos sell faster. Show any wear or damage honestly — it builds trust with buyers.
            </HelperText>
            {!!errors.images && <FieldError>{errors.images}</FieldError>}
          </SectionCard>

          {/* ── Item Details ── */}
          <SectionCard title="Item Details" accent={C.brand} subtitle="Give buyers a clear, recognizable name and category.">
            <FloatingInput
              label="Product Name" icon="pricetag-outline"
              placeholder="e.g. iPhone 13 Pro Max 256GB"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setAiDraftFields(prev => ({ ...prev, name: false }));
                if (v.trim()) setErrors(prev => ({ ...prev, name: null }));
              }}
              required
              error={errors.name}
              maxLength={80}
              badge={aiDraftFields.name && <AiDraftBadge />}
            />
            <DropdownSelector
              label="Category" placeholder="Select category" items={VALID_CATEGORIES}
              selectedValue={category} onSelect={handleCategoryChange} required style={{ marginBottom: 14 }}
              error={errors.category}
              badge={aiDraftFields.category && <AiDraftBadge />}
              renderItem={({ item, isSelected }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{item.icon}</Text>
                  <Text style={[bsStyles.itemText, { marginLeft: 12 }, isSelected && bsStyles.itemTextActive]}>{formatDisplayName(item.key)}</Text>
                </View>
              )}
            />
            <DropdownSelector
              label="Subcategory (optional)" placeholder="Select subcategory" items={subcategoryOptions}
              selectedValue={subcategory}
              onSelect={(v) => { setSubcategory(v); setAiDraftFields(prev => ({ ...prev, subcategory: false })); }}
              style={{ marginBottom: 14 }}
              disabled={!category || subcategoryOptions.length === 0}
              badge={aiDraftFields.subcategory && <AiDraftBadge />}
            />
            {!category && (
              <HelperText>Choose a category first to see matching subcategories.</HelperText>
            )}
            <FloatingInput label="Brand (optional)" icon="bookmark-outline" placeholder="e.g. Apple, Samsung, Nike" value={brand} onChangeText={setBrand} />
            <DropdownSelector
              label="Condition" placeholder="Select condition" items={CONDITION_OPTIONS}
              selectedValue={condition} onSelect={setCondition} required style={{ marginBottom: 4 }}
            />
            <HelperText>Be honest about condition — accurate listings get fewer cancelled deals.</HelperText>
          </SectionCard>

          {/* ── Pricing ── */}
          <SectionCard title="Pricing" accent={C.brand} subtitle="You can always edit this later.">
            <Text style={styles.quickLabel}>Price (GH₵) <Text style={styles.required}>*</Text></Text>
            <View style={[styles.priceInputFull, errors.price && styles.priceInputFullError]}>
              <View style={styles.currencyTag}><Text style={styles.currencyText}>GH₵</Text></View>
              <TextInput
                style={styles.priceInputField}
                placeholder="0.00"
                placeholderTextColor="#C5C5C5"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={(v) => { setPrice(v); if (v.trim() && !isNaN(parseFloat(v))) setErrors(prev => ({ ...prev, price: null })); }}
              />
            </View>
            {!!errors.price && <FieldError>{errors.price}</FieldError>}

            <TouchableOpacity style={[styles.negotiableBtn, negotiable && styles.negotiableBtnActive]} onPress={() => setNegotiable(!negotiable)}>
              <Ionicons name={negotiable ? 'pricetag' : 'pricetag-outline'} size={18} color={negotiable ? '#fff' : C.brand} />
              <Text style={[styles.negotiableText, negotiable && styles.negotiableTextActive]}>Price is negotiable</Text>
            </TouchableOpacity>
            <HelperText>
              Turning this on lets buyers know they can message you to haggle.
            </HelperText>

            <Text style={styles.quickLabel}>Quantity Available</Text>
            <TextInput style={styles.simpleInput} placeholder="1" placeholderTextColor="#C5C5C5" keyboardType="numeric" value={countInStock} onChangeText={setCountInStock} />
            <HelperText>
              How many of this exact item do you have to sell? Most listings are 1.
            </HelperText>

            {/* Discount Section */}
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.discountToggle, hasDiscount && styles.discountToggleActive]}
                onPress={() => setHasDiscount(!hasDiscount)}
              >
                <Ionicons name="pricetag" size={18} color={hasDiscount ? '#fff' : C.brand} />
                <Text style={[styles.discountToggleText, hasDiscount && styles.discountToggleTextActive]}>
                  {hasDiscount ? 'Discount applied' : 'Add discount (optional)'}
                </Text>
                <Ionicons name={hasDiscount ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={hasDiscount ? '#fff' : C.brand} />
              </TouchableOpacity>

              {hasDiscount && (
                <View style={styles.discountFields}>
                  <HelperText icon="information-circle-outline">
                    Show buyers the original price was higher, so the deal feels real. All fields here are optional.
                  </HelperText>
                  <FloatingInput
                    label="Original Price (GH₵)" icon="pricetag-outline" placeholder="e.g. 1500.00"
                    value={originalPrice} onChangeText={setOriginalPrice} keyboardType="decimal-pad"
                    error={errors.originalPrice}
                  />
                  <FloatingInput
                    label="Discount Percentage (%)" icon="trending-down-outline" placeholder="e.g. 20"
                    value={discountPercent} onChangeText={setDiscountPercent} keyboardType="numeric"
                    error={errors.discountPercent}
                  />
                  <View style={styles.dateRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.quickLabel}>Start Date</Text>
                      <TextInput style={styles.simpleInput} placeholder="YYYY-MM-DD" placeholderTextColor="#C5C5C5" value={discountStartDate} onChangeText={setDiscountStartDate} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.quickLabel}>End Date</Text>
                      <TextInput style={styles.simpleInput} placeholder="YYYY-MM-DD" placeholderTextColor="#C5C5C5" value={discountEndDate} onChangeText={setDiscountEndDate} />
                    </View>
                  </View>
                  <HelperText>Leave dates blank if the discount has no end date.</HelperText>
                </View>
              )}
            </View>
          </SectionCard>

          {/* ── Campus & Location ── */}
          <SectionCard title="Campus & Location" accent={C.brandL} subtitle="Just your campus is required — the rest helps buyers plan a meet-up, but you can skip it.">
            <DropdownSelector
              label="Campus" placeholder="Select your campus" items={CAMPUS_OPTIONS}
              selectedValue={campus}
              onSelect={(v) => { setCampus(v); setErrors(prev => ({ ...prev, campus: null })); }}
              required style={{ marginBottom: 14 }}
              error={errors.campus}
            />
            <FloatingInput
              label="Campus Area (optional)" icon="location-outline"
              placeholder="e.g. Main Campus, North Campus"
              value={campusArea}
              onChangeText={setCampusArea}
            />
            <FloatingInput label="Hostel / Hall (optional)" icon="home-outline" placeholder="e.g. Mensah Sarbah Hall, Pentagon" value={hostel} onChangeText={setHostel} />
            <HelperText icon="shield-checkmark-outline">
              Buyers will use this to arrange a safe meet-up. You won't share your exact address, and you can always confirm details in chat.
            </HelperText>
          </SectionCard>

          {/* ── Description & Tags ── */}
          <SectionCard title="Description & Tags" accent={C.brandBorder} subtitle="Everything in this section is optional — add as much or as little as you like.">
            <FloatingInput
              label="Description" icon="document-text-outline"
              placeholder="Describe your item, reason for selling, what's included, etc."
              value={description}
              onChangeText={(v) => { setDescription(v); setAiDraftFields(prev => ({ ...prev, description: false })); }}
              multiline
              maxLength={500}
              badge={aiDraftFields.description && <AiDraftBadge />}
            />

            <Text style={[styles.quickLabel, { marginTop: 4 }]}>Tags <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.tagsGrid}>
              {AVAILABLE_TAGS.map(({ key, icon }) => {
                const active = selectedTags.includes(key);
                return (
                  <TouchableOpacity key={key} style={[styles.tagChip, active && styles.tagChipActive]} onPress={() => toggleTag(key)} activeOpacity={0.75}>
                    <Text style={styles.tagEmoji}>{icon}</Text>
                    <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>{formatDisplayName(key)}</Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color={C.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.tagCountRow}>
                <Ionicons name="pricetags" size={13} color={C.brand} />
                <Text style={styles.tagCountText}>{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected</Text>
                <TouchableOpacity onPress={() => setSelectedTags([])}><Text style={styles.tagClearText}>Clear all</Text></TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {/* Bottom spacing for fixed button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Fixed Bottom Button ── */}
        <View style={styles.bottomBar}>
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
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.publishBtnText}>List Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── AI autofill FAB ── */}
        <AIProductGeneratorFAB
          onPress={handleAiAutofill}
          loading={aiLoading}
          disabled={images.length === 0}
          hasBeenUsed={aiUsedOnce}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 150,
          }}
        />
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.white,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: C.t1, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  headerCompletionBadge: { backgroundColor: C.brandBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerCompletionBadgeDone: { backgroundColor: C.brand },
  headerCompletionText: { fontSize: 13, fontWeight: '800', color: C.brand },
  headerCompletionTextDone: { color: '#fff' },

  // ── Scroll & cards ────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 20 },
  sectionHint: { fontSize: 12, color: '#999', marginBottom: 12, fontWeight: '500' },
  card: { backgroundColor: C.white, borderRadius: 20, marginBottom: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.t1 },

  // ── Helper / error text ──────────────────────────────────────────────────
  helperRow: { flexDirection: 'row', gap: 6, marginTop: 6, marginBottom: 4, paddingRight: 6 },
  helperText: { flex: 1, fontSize: 11.5, color: C.t3, lineHeight: 16 },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 2 },
  fieldErrorText: { fontSize: 12, color: C.danger, fontWeight: '600', flex: 1 },

  // ── AI draft badge ────────────────────────────────────────────────────────
  aiDraftBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F5F0FC', borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  aiDraftBadgeText: { fontSize: 9.5, fontWeight: '700', color: '#8E5FD9' },

  floatWrap: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: '#FAFAFA' },
  floatWrapFocused: { borderColor: C.brand, backgroundColor: C.white },
  floatWrapError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  floatWrapMulti: { paddingBottom: 16 },
  floatHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  floatLabel: { fontSize: 11, fontWeight: '700', color: C.t3, letterSpacing: 0.3, textTransform: 'uppercase', flex: 1 },
  floatLabelFocused: { color: C.brand },
  floatLabelError: { color: C.danger },
  charCount: { fontSize: 10, color: '#C5C5C5', fontWeight: '600' },
  floatInput: { fontSize: 15.5, color: C.t1, padding: 0 },
  floatInputMulti: { height: 90, textAlignVertical: 'top' },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumbWrap: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  imageRemoveBtn: { position: 'absolute', top: 4, right: 4 },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageAddBtn: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, borderWidth: 1.5, borderColor: C.brandBorder, borderStyle: 'dashed', backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', gap: 4 },
  imageAddBtnError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  imageAddText: { fontSize: 11, color: C.brand, fontWeight: '600' },

  dropdownLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  dropdownButtonFocused: { borderColor: C.brand, backgroundColor: C.white },
  dropdownButtonDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8' },
  dropdownButtonError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  dropdownButtonText: { fontSize: 15.5, color: C.t1, flex: 1 },
  dropdownButtonTextDisabled: { color: C.t3 },
  dropdownPlaceholder: { color: '#C5C5C5' },

  quickLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  required: { color: C.danger },
  optional: { color: C.t3, fontWeight: '500', textTransform: 'none', fontSize: 12 },

  priceInputFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  priceInputFullError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  currencyTag: { backgroundColor: C.brandBg, paddingHorizontal: 14, height: 52, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' },
  currencyText: { fontSize: 15, fontWeight: '800', color: C.brand },
  priceInputField: { flex: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '700', color: C.t1 },
  negotiableBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0', marginTop: 14, marginBottom: 0 },
  negotiableBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  negotiableText: { fontSize: 13, fontWeight: '600', color: '#666' },
  negotiableTextActive: { color: '#fff' },
  simpleInput: { backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: C.t1, fontWeight: '600' },

  discountToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  discountToggleActive: { backgroundColor: C.accent, borderColor: C.accent },
  discountToggleText: { fontSize: 13, fontWeight: '600', color: C.brand, flex: 1 },
  discountToggleTextActive: { color: '#fff' },
  discountFields: { paddingTop: 8, paddingHorizontal: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 22, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  tagChipActive: { backgroundColor: C.brandBg, borderColor: C.brandBorder },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive: { color: C.brand, fontWeight: '700' },
  tagCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagCountText: { fontSize: 12, color: C.brand, fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: C.danger, fontWeight: '600' },

  // ── Fixed Bottom Bar ─────────────────────────────────────────────────────
  bottomBar: {
    backgroundColor: C.white,
    bottom:32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: C.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  publishBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.brandD,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: C.brandD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  publishBtnDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0 },
  publishBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default AddProductScreen;