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
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const VALID_CATEGORIES = [
  { key: 'electronics',         icon: '🔌' },
  { key: 'phones and tablets',      icon: '📱' },
  { key: 'computers and laptops',   icon: '💻' },
  { key: 'gaming',              icon: '🎮' },
  { key: 'fashion',             icon: '👕' },
  { key: 'books-course-materials', icon: '📚' },
  { key: 'hostel-items',        icon: '🏠' },
  { key: 'appliances',          icon: '🔧' },
  { key: 'furniture',           icon: '🪑' },
  { key: 'beauty and grooming',     icon: '💄' },
  { key: 'sports and fitness',      icon: '⚽' },
  { key: 'accessories',         icon: '⌚' },
  { key: 'food and drinks',         icon: '🍕' },
  { key: 'services',            icon: '🛠️' },
  { key: 'other',               icon: '📦' },
];

const SUBCATEGORIES_MAP = {
  'electronics': [
    { key: 'headphones-earbuds', label: 'Headphones & Earbuds' },
    { key: 'speakers', label: 'Speakers' },
    { key: 'chargers-cables', label: 'Chargers & Cables' },
    { key: 'power-banks', label: 'Power Banks' },
    { key: 'smartwatches', label: 'Smartwatches' },
    { key: 'cameras', label: 'Cameras' },
    { key: 'other-electronics', label: 'Other Electronics' },
  ],
  'phones and tablets': [
    { key: 'smartphones', label: 'Smartphones' },
    { key: 'tablets', label: 'Tablets' },
    { key: 'ipads', label: 'iPads' },
    { key: 'phone-cases', label: 'Phone Cases' },
    { key: 'screen-protectors', label: 'Screen Protectors' },
    { key: 'other-phone-accessories', label: 'Other Accessories' },
  ],
  'computers and laptops': [
    { key: 'laptops', label: 'Laptops' },
    { key: 'desktops', label: 'Desktops' },
    { key: 'monitors', label: 'Monitors' },
    { key: 'keyboards', label: 'Keyboards' },
    { key: 'mouse', label: 'Mouse' },
    { key: 'laptop-bags', label: 'Laptop Bags' },
    { key: 'software', label: 'Software' },
    { key: 'other-computer-accessories', label: 'Other Accessories' },
  ],
  'gaming': [
    { key: 'consoles', label: 'Consoles' },
    { key: 'games', label: 'Games' },
    { key: 'controllers', label: 'Controllers' },
    { key: 'gaming-accessories', label: 'Gaming Accessories' },
  ],
  'fashion': [
    { key: 'men-clothing', label: 'Men Clothing' },
    { key: 'women-clothing', label: 'Women Clothing' },
    { key: 'unisex-clothing', label: 'Unisex Clothing' },
    { key: 'shoes', label: 'Shoes' },
    { key: 'bags', label: 'Bags' },
    { key: 'watches', label: 'Watches' },
    { key: 'jewelry', label: 'Jewelry' },
    { key: 'other-fashion', label: 'Other Fashion' },
  ],
  'books-course-materials': [
    { key: 'textbooks', label: 'Textbooks' },
    { key: 'course-notes', label: 'Course Notes' },
    { key: 'past-questions', label: 'Past Questions' },
    { key: 'stationery', label: 'Stationery' },
    { key: 'novels', label: 'Novels' },
    { key: 'other-books', label: 'Other Books' },
  ],
  'hostel-items': [
    { key: 'bedding', label: 'Bedding' },
    { key: 'kitchenware', label: 'Kitchenware' },
    { key: 'cleaning-supplies', label: 'Cleaning Supplies' },
    { key: 'storage', label: 'Storage' },
    { key: 'lighting', label: 'Lighting' },
    { key: 'other-hostel', label: 'Other Hostel Items' },
  ],
  'appliances': [
    { key: 'fans', label: 'Fans' },
    { key: 'heaters', label: 'Heaters' },
    { key: 'irons', label: 'Irons' },
    { key: 'kettles', label: 'Kettles' },
    { key: 'blenders', label: 'Blenders' },
    { key: 'microwaves', label: 'Microwaves' },
    { key: 'other-appliances', label: 'Other Appliances' },
  ],
  'furniture': [
    { key: 'chairs', label: 'Chairs' },
    { key: 'tables-desks', label: 'Tables & Desks' },
    { key: 'beds-mattresses', label: 'Beds & Mattresses' },
    { key: 'shelves', label: 'Shelves' },
    { key: 'other-furniture', label: 'Other Furniture' },
  ],
  'beauty and grooming': [
    { key: 'skincare', label: 'Skincare' },
    { key: 'makeup', label: 'Makeup' },
    { key: 'hair-care', label: 'Hair Care' },
    { key: 'perfumes', label: 'Perfumes' },
    { key: 'nail-care', label: 'Nail Care' },
    { key: 'other-beauty', label: 'Other Beauty' },
  ],
  'sports and fitness': [
    { key: 'sports-equipment', label: 'Sports Equipment' },
    { key: 'gym-gear', label: 'Gym Gear' },
    { key: 'activewear', label: 'Activewear' },
    { key: 'other-sports', label: 'Other Sports' },
  ],
  'accessories': [
    { key: 'phone-accessories', label: 'Phone Accessories' },
    { key: 'laptop-accessories', label: 'Laptop Accessories' },
    { key: 'fashion-accessories', label: 'Fashion Accessories' },
    { key: 'other-accessories', label: 'Other Accessories' },
  ],
  'food and drinks': [
    { key: 'snacks', label: 'Snacks' },
    { key: 'drinks', label: 'Drinks' },
    { key: 'homemade-meals', label: 'Homemade Meals' },
    { key: 'baked-goods', label: 'Baked Goods' },
    { key: 'other-food', label: 'Other Food' },
  ],
  'services': [
    { key: 'tutoring', label: 'Tutoring' },
    { key: 'graphic-design', label: 'Graphic Design' },
    { key: 'photography', label: 'Photography' },
    { key: 'printing-photocopy', label: 'Printing & Photocopy' },
    { key: 'laundry', label: 'Laundry' },
    { key: 'barbering-hairdressing', label: 'Barbering & Hairdressing' },
    { key: 'tech-repairs', label: 'Tech Repairs' },
    { key: 'other-services', label: 'Other Services' },
  ],
  'other': [
    { key: 'miscellaneous', label: 'Miscellaneous' },
  ],
};

const CONDITION_OPTIONS = [
  { key: 'new',            label: 'Brand New',     hint: 'Unopened or unused' },
  { key: 'like-new',       label: 'Like New',       hint: 'Used briefly, no visible wear' },
  { key: 'excellent',      label: 'Excellent',      hint: 'Minimal signs of use' },
  { key: 'good',           label: 'Good',           hint: 'Normal wear, works perfectly' },
  { key: 'fair',           label: 'Fair',           hint: 'Visible wear, fully functional' },
  { key: 'slightly-used',  label: 'Slightly Used',  hint: 'Light use, minor marks' },
  { key: 'for-parts',      label: 'For Parts',      hint: 'Not fully working' },
];

const CAMPUS_OPTIONS = [
  { key: 'UG',     label: 'University of Ghana' },
  { key: 'KNUST',  label: 'KNUST' },
  { key: 'UCC',    label: 'University of Cape Coast' },
  { key: 'UEW',    label: 'University of Education, Winneba' },
  { key: 'UPSA',   label: 'UPSA' },
  { key: 'GIMPA',  label: 'GIMPA' },
  { key: 'ASHESI', label: 'Ashesi University' },
  { key: 'ATU',    label: 'Accra Technical University' },
  { key: 'OTHER',  label: 'Other' },
];

const AVAILABLE_TAGS = [
  { key: 'urgent-sale',      icon: '⚡' },
  { key: 'popular',          icon: '🔥' },
  { key: 'discounted',       icon: '🏷️' },
  { key: 'new-arrival',      icon: '🆕' },
  { key: 'student-favorite', icon: '❤️' },
];

const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD STEP DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { key: 'photos',   label: 'Photos',    icon: 'image-outline' },
  { key: 'details',  label: 'Details',   icon: 'pricetag-outline' },
  { key: 'pricing',  label: 'Pricing',   icon: 'cash-outline' },
  { key: 'specs',    label: 'Specs',     icon: 'list-outline' },
  { key: 'location', label: 'Location',  icon: 'location-outline' },
  { key: 'about',    label: 'About',     icon: 'document-text-outline' },
  { key: 'review',   label: 'Review',    icon: 'checkmark-done-outline' },
];

// ── Small helper-text row used under tricky fields ──────────────────────────
const HelperText = ({ children, icon = 'information-circle-outline' }) => (
  <View style={styles.helperRow}>
    <Ionicons name={icon} size={13} color="#9E9E9E" style={{ marginTop: 1 }} />
    <Text style={styles.helperText}>{children}</Text>
  </View>
);

// ── Inline field error ────────────────────────────────────────────────────────
const FieldError = ({ children }) => (
  <View style={styles.fieldErrorRow}>
    <Ionicons name="alert-circle" size={13} color="#E53935" />
    <Text style={styles.fieldErrorText}>{children}</Text>
  </View>
);

const DropdownSelector = ({
  label, placeholder, items, selectedValue, onSelect, required, renderItem, style, disabled, error,
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
        <Text style={styles.dropdownLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
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
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={disabled ? '#D0D0D0' : visible ? '#2E7D32' : error ? '#E53935' : '#9E9E9E'} />
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
              <Ionicons name="close" size={18} color="#616161" />
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
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: height * 0.62, paddingHorizontal: 16, paddingTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12, shadowRadius: 18, elevation: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  itemActive: { backgroundColor: '#F1F8F3', borderBottomColor: 'transparent' },
  itemEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  itemText: { fontSize: 15, color: '#424242', fontWeight: '500', flex: 1 },
  itemTextActive: { color: '#1B5E20', fontWeight: '700' },
  itemHint: { fontSize: 11.5, color: '#9E9E9E', marginTop: 2, marginLeft: 44 },
});

// ─────────────────────────────────────────────────────────────────────────────
// TOP PROGRESS STEPPER — compact horizontal dots, tap to revisit completed steps
// ─────────────────────────────────────────────────────────────────────────────
const ProgressStepper = ({ steps, currentIndex, furthestIndex, onStepPress }) => (
  <View style={styles.stepperWrap}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperScroll}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reachable = i <= furthestIndex;
        return (
          <React.Fragment key={step.key}>
            <TouchableOpacity
              style={styles.stepperItem}
              disabled={!reachable}
              onPress={() => reachable && onStepPress(i)}
              activeOpacity={reachable ? 0.7 : 1}
            >
              <View style={[
                styles.stepperCircle,
                done && styles.stepperCircleDone,
                active && styles.stepperCircleActive,
              ]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={active ? '#fff' : '#9E9E9E'}
                  />
                )}
              </View>
              <Text style={[styles.stepperLabel, active && styles.stepperLabelActive, done && styles.stepperLabelDone]}>
                {step.label}
              </Text>
            </TouchableOpacity>
            {i < steps.length - 1 && (
              <View style={[styles.stepperLine, i < currentIndex && styles.stepperLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  </View>
);

const FloatingInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, required, error, maxLength }) => {
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
          <Ionicons name={icon} size={14} color={error ? '#E53935' : focused ? '#2E7D32' : '#9E9E9E'} />
          <Text style={[styles.floatLabel, focused && styles.floatLabelFocused, error && styles.floatLabelError]}>
            {label}{required ? ' *' : ''}
          </Text>
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

// ─────────────────────────────────────────────────────────────────────────────
// STEP SHELL — consistent header used by every step screen
// ─────────────────────────────────────────────────────────────────────────────
const StepShell = ({ eyebrow, title, subtitle, children }) => (
  <View style={styles.stepShell}>
    <Text style={styles.stepEyebrow}>{eyebrow}</Text>
    <Text style={styles.stepTitle}>{title}</Text>
    {subtitle && <Text style={styles.stepSubtitle}>{subtitle}</Text>}
    <View style={styles.stepBody}>{children}</View>
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

  // Specifications fields
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);

  // Field-level errors — populated only after a "Next"/submit attempt on that step
  const [errors, setErrors] = useState({});

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0); // lets user tap back to any visited step
  const scrollRef = useRef(null);

  const subcategoryOptions = useMemo(() => SUBCATEGORIES_MAP[category] || [], [category]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubcategory('');
    setErrors(prev => ({ ...prev, category: null }));
  };

  const pickImages = () => {
    Alert.alert('Add product photos', 'Where would you like to add photos from?', [
      {
        text: '📷  Take a photo',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200 },
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
            { mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200, selectionLimit: 10 - images.length },
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

  // ── Per-step validation — only checks the fields relevant to that step ──────
  const validateStep = (index) => {
    const next = {};
    const stepKey = WIZARD_STEPS[index].key;

    if (stepKey === 'photos') {
      if (images.length === 0) next.images = 'Add at least one photo so buyers can see what they’re getting.';
    }

    if (stepKey === 'details') {
      if (!name.trim()) next.name = 'Give your item a name buyers will recognize.';
      if (!category) next.category = 'Pick the category that best fits your item.';
    }

    if (stepKey === 'pricing') {
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
    }

    if (stepKey === 'location') {
      if (!campus) next.campus = 'Select the campus where you’ll meet buyers.';
      if (!campusArea.trim()) next.campusArea = 'Add a campus area so buyers know where to meet you.';
    }

    // 'specs' and 'about' steps are fully optional — nothing required there

    return next;
  };

  // Runs the validation for ALL steps — used right before final submit, so
  // nothing can slip through even if the user jumped around with the stepper.
  const validateAll = () => {
    let combined = {};
    WIZARD_STEPS.forEach((_, i) => { combined = { ...combined, ...validateStep(i) }; });
    return combined;
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const goToStep = (index) => {
    setStepIndex(index);
    setFurthestIndex(prev => Math.max(prev, index));
    scrollToTop();
  };

  const handleNext = () => {
    const stepErrors = validateStep(stepIndex);
    setErrors(prev => ({ ...prev, ...stepErrors }));

    const errorKeys = Object.keys(stepErrors);
    if (errorKeys.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'A few things need fixing',
        text2: `${errorKeys.length} field${errorKeys.length > 1 ? 's' : ''} need${errorKeys.length === 1 ? 's' : ''} your attention.`,
      });
      return;
    }

    if (stepIndex < WIZARD_STEPS.length - 1) {
      goToStep(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
    else navigation.goBack();
  };

  const handleSubmit = async () => {
    const next = validateAll();
    const errorKeys = Object.keys(next);

    if (errorKeys.length > 0) {
      setErrors(next);
      // Jump to the first step that has a problem
      const firstBadStepIndex = WIZARD_STEPS.findIndex((_, i) => {
        const stepErrs = validateStep(i);
        return Object.keys(stepErrs).some(k => next[k]);
      });
      if (firstBadStepIndex !== -1) goToStep(firstBadStepIndex);

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
      formData.append('location[campusArea]', campusArea.trim());
      if (hostel.trim()) formData.append('location[hostel]', hostel.trim());
      formData.append('countInStock', parseInt(countInStock) || 1);
      selectedTags.forEach(tag => formData.append('tags[]', tag));

      // Append specifications as JSON
      const filledSpecs = specifications.filter(s => s.key.trim() && s.value.trim());
      if (filledSpecs.length > 0) {
        const specsObj = {};
        filledSpecs.forEach(s => { specsObj[s.key.trim()] = s.value.trim(); });
        formData.append('specifications', JSON.stringify(specsObj));
      }

      // Append discount fields
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
        Alert.alert( 'success',  `"${name.trim()}" is now live on CediMart.` );
        navigation.goBack();
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

  // ── Per-step completion (drives the stepper dots + footer hint) ────────────
  const photosComplete   = images.length > 0;
  const detailsComplete  = !!name.trim() && !!category && !!condition;
  const pricingComplete  = !!price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0;
  const locationComplete = !!campus && !!campusArea.trim();

  const completedCount = [photosComplete, detailsComplete, pricingComplete, locationComplete].filter(Boolean).length;
  const completionPct = Math.round((completedCount / 4) * 100);

  const currentStepKey = WIZARD_STEPS[stepIndex].key;
  const isFirstStep = stepIndex === 0;
  const isLastStep  = stepIndex === WIZARD_STEPS.length - 1;
  const isReviewStep = currentStepKey === 'review';

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS — each returns just the body for that step
  // ─────────────────────────────────────────────────────────────────────────

  const renderPhotosStep = () => (
    <StepShell
      eyebrow="STEP 1 OF 7"
      title="Add product photos"
      subtitle="Up to 10 photos. The first one becomes your cover image."
    >
      <View style={styles.imageGrid}>
        {images.map((img, i) => (
          <View key={i} style={styles.imageThumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
            <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(i)}>
              <Ionicons name="close-circle" size={22} color="#E53935" />
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
            <Ionicons name="add" size={32} color={errors.images ? '#E53935' : '#2E7D32'} />
            <Text style={[styles.imageAddText, errors.images && { color: '#E53935' }]}>
              {images.length === 0 ? 'Add Photos' : `${images.length}/10`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <HelperText icon="bulb-outline">
        Clear, well-lit photos sell faster. Show any wear or damage honestly — it builds trust with buyers.
      </HelperText>
      {!!errors.images && <FieldError>{errors.images}</FieldError>}
    </StepShell>
  );

  const renderDetailsStep = () => (
    <StepShell
      eyebrow="STEP 2 OF 7"
      title="What are you selling?"
      subtitle="Give buyers a clear, recognizable name and category."
    >
      <FloatingInput
        label="Product Name" icon="pricetag-outline"
        placeholder="e.g. iPhone 13 Pro Max 256GB"
        value={name}
        onChangeText={(v) => { setName(v); if (v.trim()) setErrors(prev => ({ ...prev, name: null })); }}
        required
        error={errors.name}
        maxLength={80}
      />
      <DropdownSelector
        label="Category" placeholder="Select category" items={VALID_CATEGORIES}
        selectedValue={category} onSelect={handleCategoryChange} required style={{ marginBottom: 14 }}
        error={errors.category}
        renderItem={({ item, isSelected }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{item.icon}</Text>
            <Text style={[bsStyles.itemText, { marginLeft: 12 }, isSelected && bsStyles.itemTextActive]}>{formatDisplayName(item.key)}</Text>
          </View>
        )}
      />
      <DropdownSelector
        label="Subcategory (optional)" placeholder="Select subcategory" items={subcategoryOptions}
        selectedValue={subcategory} onSelect={setSubcategory} style={{ marginBottom: 14 }}
        disabled={!category || subcategoryOptions.length === 0}
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
    </StepShell>
  );

  const renderPricingStep = () => (
    <StepShell
      eyebrow="STEP 3 OF 7"
      title="Set your price"
      subtitle="You can always edit this later."
    >
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
        <Ionicons name={negotiable ? 'pricetag' : 'pricetag-outline'} size={18} color={negotiable ? '#fff' : '#2E7D32'} />
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
          <Ionicons name="pricetag" size={18} color={hasDiscount ? '#fff' : '#2E7D32'} />
          <Text style={[styles.discountToggleText, hasDiscount && styles.discountToggleTextActive]}>
            {hasDiscount ? 'Discount applied' : 'Add discount (optional)'}
          </Text>
          <Ionicons name={hasDiscount ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={hasDiscount ? '#fff' : '#2E7D32'} />
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
    </StepShell>
  );

  const renderSpecsStep = () => (
    <StepShell
      eyebrow="STEP 4 OF 7 · OPTIONAL"
      title="Add specifications"
      subtitle="Things like storage, color, weight, or material help buyers compare."
    >
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
          <TouchableOpacity onPress={() => removeSpecField(index)} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color="#E53935" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addSpecBtn} onPress={addSpecField} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={20} color="#2E7D32" />
        <Text style={styles.addSpecBtnText}>Add Specification</Text>
      </TouchableOpacity>
      <HelperText>
        Specs help buyers compare items quickly — e.g. "Storage: 256GB" or "Material: Leather". Feel free to skip this step.
      </HelperText>
    </StepShell>
  );

  const renderLocationStep = () => (
    <StepShell
      eyebrow="STEP 5 OF 7"
      title="Where can buyers find you?"
      subtitle="This helps buyers arrange a safe meet-up nearby."
    >
      <DropdownSelector
        label="Campus" placeholder="Select your campus" items={CAMPUS_OPTIONS}
        selectedValue={campus}
        onSelect={(v) => { setCampus(v); setErrors(prev => ({ ...prev, campus: null })); }}
        required style={{ marginBottom: 14 }}
        error={errors.campus}
      />
      <FloatingInput
        label="Campus Area" icon="location-outline"
        placeholder="e.g. Main Campus, North Campus"
        value={campusArea}
        onChangeText={(v) => { setCampusArea(v); if (v.trim()) setErrors(prev => ({ ...prev, campusArea: null })); }}
        required
        error={errors.campusArea}
      />
      <FloatingInput label="Hostel / Hall (optional)" icon="home-outline" placeholder="e.g. Mensah Sarbah Hall, Pentagon" value={hostel} onChangeText={setHostel} />
      <HelperText icon="shield-checkmark-outline">
        Buyers will use this to arrange a safe meet-up. You won't share your exact address.
      </HelperText>
    </StepShell>
  );

  const renderAboutStep = () => (
    <StepShell
      eyebrow="STEP 6 OF 7 · OPTIONAL"
      title="Description & tags"
      subtitle="Help your item show up in the right searches and filters."
    >
      <FloatingInput
        label="Description" icon="document-text-outline"
        placeholder="Describe your item, reason for selling, what's included, etc."
        value={description} onChangeText={setDescription} multiline
        maxLength={500}
      />
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
      <HelperText>Tags help your item show up in the right filters — pick what genuinely applies. Feel free to skip this step.</HelperText>
    </StepShell>
  );

  const renderReviewStep = () => (
    <StepShell
      eyebrow="STEP 7 OF 7"
      title="Review & publish"
      subtitle="Double-check everything looks right before going live."
    >
      {/* Cover image preview */}
      {images.length > 0 && (
        <View style={styles.reviewImageRow}>
          <Image source={{ uri: images[0].uri }} style={styles.reviewCoverImg} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewName} numberOfLines={2}>{name || 'Untitled item'}</Text>
            <Text style={styles.reviewPrice}>
              GH₵ {parseFloat(price || 0).toFixed(2)}{negotiable ? ' · Negotiable' : ''}
            </Text>
            <Text style={styles.reviewPhotoCount}>{images.length} photo{images.length !== 1 ? 's' : ''} added</Text>
          </View>
          <TouchableOpacity onPress={() => goToStep(0)} style={styles.reviewEditBtn}>
            <Ionicons name="create-outline" size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="checkmark-done-circle" size={18} color="#2E7D32" />
          <Text style={styles.summaryTitle}>Listing Summary</Text>
        </View>
        {[
          ['Item', name || '—', 1],
          ['Category', category ? formatDisplayName(category) : '—', 1],
          subcategory ? ['Subcategory', formatDisplayName(subcategory), 1] : null,
          ['Brand', brand || '—', 1],
          ['Condition', formatDisplayName(condition), 1],
          ['Price', `GH₵ ${parseFloat(price || 0).toFixed(2)}${negotiable ? ' (negotiable)' : ''}`, 2],
          hasDiscount && discountPercent ? ['Discount', `${discountPercent}% off`, 2] : null,
          hasDiscount && originalPrice ? ['Original Price', `GH₵ ${parseFloat(originalPrice || 0).toFixed(2)}`, 2] : null,
          ['Quantity', countInStock || '1', 2],
          ['Campus', CAMPUS_OPTIONS.find(c => c.key === campus)?.label || campus || '—', 4],
          ['Area', campusArea || '—', 4],
          hostel ? ['Hostel / Hall', hostel, 4] : null,
          ['Photos', `${images.length} image(s)`, 0],
          selectedTags.length > 0 ? ['Tags', selectedTags.map(formatDisplayName).join(', '), 5] : null,
        ].filter(Boolean).map(([k, v, stepToEdit]) => (
          <TouchableOpacity
            key={k}
            style={styles.summaryRow}
            onPress={() => goToStep(stepToEdit)}
            activeOpacity={0.6}
          >
            <Text style={styles.summaryKey}>{k}</Text>
            <Text style={styles.summaryVal} numberOfLines={1}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {description ? (
        <View style={styles.reviewDescBox}>
          <Text style={styles.reviewDescLabel}>Description</Text>
          <Text style={styles.reviewDescText} numberOfLines={4}>{description}</Text>
        </View>
      ) : null}

      {/* Gentle nudge when form isn't ready, instead of a silent disabled button */}
      {completionPct < 100 && (
        <View style={styles.incompleteNotice}>
          <Ionicons name="information-circle-outline" size={16} color="#E65100" />
          <Text style={styles.incompleteNoticeText}>
            {4 - completedCount} required section{4 - completedCount > 1 ? 's' : ''} still need attention. Tap any row above to fix it.
          </Text>
        </View>
      )}
    </StepShell>
  );

  const STEP_RENDERERS = {
    photos: renderPhotosStep,
    details: renderDetailsStep,
    pricing: renderPricingStep,
    specs: renderSpecsStep,
    location: renderLocationStep,
    about: renderAboutStep,
    review: renderReviewStep,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name={isFirstStep ? 'close' : 'arrow-back'} size={22} color="#1A1A1A" />
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

        {/* ── Top progress stepper ── */}
        <ProgressStepper
          steps={WIZARD_STEPS}
          currentIndex={stepIndex}
          furthestIndex={furthestIndex}
          onStepPress={goToStep}
        />

        {/* ── Active step content ── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {STEP_RENDERERS[currentStepKey]()}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* ── Bottom navigation bar ── */}
      

{/* ── Bottom navigation bar ── */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.backNavBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#424242" />
            <Text style={styles.backNavBtnText}>{isFirstStep ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>

          {isReviewStep ? (
            <TouchableOpacity
              style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Text style={styles.publishBtnText}>List on CediMart</Text>
                  <Ionicons name="rocket-outline" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
              <Text style={styles.nextBtnText}>
                {WIZARD_STEPS[stepIndex + 1]?.key === 'review' ? 'Review' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  headerCompletionBadge: { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerCompletionBadgeDone: { backgroundColor: '#2E7D32' },
  headerCompletionText: { fontSize: 13, fontWeight: '800', color: '#2E7D32' },
  headerCompletionTextDone: { color: '#fff' },

  // ── Progress stepper ──────────────────────────────────────────────────────
  stepperWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  stepperScroll: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  stepperItem: { alignItems: 'center', gap: 5, width: 58 },
  stepperLine: { width: 20, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 2, marginBottom: 18 },
  stepperLineDone: { backgroundColor: '#4CAF50' },
  stepperCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8E8E8',
  },
  stepperCircleDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  stepperCircleActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  stepperLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', textAlign: 'center' },
  stepperLabelActive: { color: '#1B5E20', fontWeight: '800' },
  stepperLabelDone: { color: '#4CAF50', fontWeight: '700' },

  // ── Step shell ────────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 46 , marginBottom:36},
  stepShell: {},
  stepEyebrow: { fontSize: 11, fontWeight: '800', color: '#4CAF50', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  stepTitle: { fontSize: 23, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.4, marginBottom: 5 },
  stepSubtitle: { fontSize: 13.5, color: '#888', lineHeight: 19, marginBottom: 22 },
  stepBody: {},

  // ── Helper / error text ──────────────────────────────────────────────────
  helperRow: { flexDirection: 'row', gap: 6, marginTop: 6, marginBottom: 4, paddingRight: 6 },
  helperText: { flex: 1, fontSize: 11.5, color: '#9E9E9E', lineHeight: 16 },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 2 },
  fieldErrorText: { fontSize: 12, color: '#E53935', fontWeight: '600', flex: 1 },

  floatWrap: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: '#FAFAFA' },
  floatWrapFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  floatWrapError: { borderColor: '#E53935', backgroundColor: '#FFF8F8' },
  floatWrapMulti: { paddingBottom: 16 },
  floatHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  floatLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 0.3, textTransform: 'uppercase', flex: 1 },
  floatLabelFocused: { color: '#2E7D32' },
  floatLabelError: { color: '#E53935' },
  charCount: { fontSize: 10, color: '#C5C5C5', fontWeight: '600' },
  floatInput: { fontSize: 15.5, color: '#1A1A1A', padding: 0 },
  floatInputMulti: { height: 90, textAlignVertical: 'top' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumbWrap: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  imageRemoveBtn: { position: 'absolute', top: 4, right: 4 },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageAddBtn: { width: (width - 68) / 3, height: (width - 68) / 3, borderRadius: 12, borderWidth: 1.5, borderColor: '#A5D6A7', borderStyle: 'dashed', backgroundColor: '#F1F8F3', justifyContent: 'center', alignItems: 'center', gap: 4 },
  imageAddBtnError: { borderColor: '#E53935', backgroundColor: '#FFF8F8' },
  imageAddText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  dropdownLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  dropdownButtonFocused: { borderColor: '#2E7D32', backgroundColor: '#fff' },
  dropdownButtonDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8' },
  dropdownButtonError: { borderColor: '#E53935', backgroundColor: '#FFF8F8' },
  dropdownButtonText: { fontSize: 15.5, color: '#1A1A1A', flex: 1 },
  dropdownButtonTextDisabled: { color: '#BDBDBD' },
  dropdownPlaceholder: { color: '#C5C5C5' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#616161', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  required: { color: '#E53935' },
  optional: { color: '#9E9E9E', fontWeight: '500', textTransform: 'none', fontSize: 12 },
  priceInputFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  priceInputFullError: { borderColor: '#E53935', backgroundColor: '#FFF8F8' },
  currencyTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, height: 52, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' },
  currencyText: { fontSize: 15, fontWeight: '800', color: '#2E7D32' },
  priceInputField: { flex: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  negotiableBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0', marginTop: 14, marginBottom: 0 },
  negotiableBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  negotiableText: { fontSize: 13, fontWeight: '600', color: '#666' },
  negotiableTextActive: { color: '#fff' },
  simpleInput: { backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#1A1A1A', fontWeight: '600' },
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
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 22, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  tagChipActive: { backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive: { color: '#2E7D32', fontWeight: '700' },
  tagCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagCountText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: '#E53935', fontWeight: '600' },

  // ── Review step ───────────────────────────────────────────────────────────
  reviewImageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  reviewCoverImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F5F5F5' },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  reviewPrice: { fontSize: 13, fontWeight: '800', color: '#1B5E20', marginBottom: 2 },
  reviewPhotoCount: { fontSize: 11, color: '#9E9E9E' },
  reviewEditBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#C8E6C9', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  summaryKey: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', flex: 0.4 },
  summaryVal: { fontSize: 13, color: '#1A1A1A', fontWeight: '700', flex: 0.6, textAlign: 'right' },

  reviewDescBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  reviewDescLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  reviewDescText: { fontSize: 13.5, color: '#424242', lineHeight: 20 },

  incompleteNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3E0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 12, borderWidth: 1, borderColor: '#FFE0B2',
  },
  incompleteNoticeText: { fontSize: 12.5, color: '#E65100', fontWeight: '600', flex: 1 },

  
bottomNav: {
  flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingHorizontal: 18, paddingTop: 14,
  backgroundColor: '#fff',
  borderTopWidth: 1, borderTopColor: '#F0F0F0',
  shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.05, shadowRadius: 8, elevation: 6,
   bottom: 50,
 
},
  backNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  backNavBtnText: { fontSize: 14, fontWeight: '700', color: '#424242' },
  nextBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#1B5E20', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  publishBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: '#1B5E20', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 10, elevation: 6,
  },
  publishBtnDisabled: { backgroundColor: '#81C784', shadowOpacity: 0 },
  publishBtnText: { fontSize: 15.5, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default AddProductScreen;