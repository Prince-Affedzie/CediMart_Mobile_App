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
  { key: 'new',            label: 'Brand New' },
  { key: 'like-new',       label: 'Like New' },
  { key: 'excellent',      label: 'Excellent' },
  { key: 'good',           label: 'Good' },
  { key: 'fair',           label: 'Fair' },
  { key: 'slightly-used',  label: 'Slightly Used' },
  { key: 'for-parts',      label: 'For Parts' },
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
  { key: 'featured',         icon: '⭐' },
  { key: 'urgent-sale',      icon: '⚡' },
  { key: 'popular',          icon: '🔥' },
  { key: 'discounted',       icon: '🏷️' },
  { key: 'new-arrival',      icon: '🆕' },
  { key: 'student-favorite', icon: '❤️' },
];

const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

const DropdownSelector = ({
  label, placeholder, items, selectedValue, onSelect, required, renderItem, style, disabled,
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
        style={[styles.dropdownButton, visible && styles.dropdownButtonFocused, disabled && styles.dropdownButtonDisabled]}
        activeOpacity={0.8}
        onPress={openSheet}
        disabled={disabled}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder, disabled && styles.dropdownButtonTextDisabled]} numberOfLines={1}>
          {triggerLabel}
        </Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={disabled ? '#D0D0D0' : visible ? '#2E7D32' : '#9E9E9E'} />
      </TouchableOpacity>

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
                    <>
                      {item.icon && <Text style={bsStyles.itemEmoji}>{item.icon}</Text>}
                      <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>
                        {item.label || formatDisplayName(item.key)}
                      </Text>
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
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  itemActive: { backgroundColor: '#F1F8F3', borderBottomColor: 'transparent' },
  itemEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  itemText: { fontSize: 15, color: '#424242', fontWeight: '500', flex: 1 },
  itemTextActive: { color: '#1B5E20', fontWeight: '700' },
});

const STEPS = ['Photos', 'Details', 'Pricing', 'Location'];

const StepIndicator = ({ currentStep }) => (
  <View style={styles.stepRow}>
    {STEPS.map((label, i) => {
      const done = i < currentStep;
      const active = i === currentStep;
      return (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
              {done ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
        </React.Fragment>
      );
    })}
  </View>
);

const FloatingInput = ({ label, icon, value, onChangeText, placeholder, keyboardType, multiline, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.floatWrap, focused && styles.floatWrapFocused, multiline && styles.floatWrapMulti]}>
      <View style={styles.floatHeader}>
        <Ionicons name={icon} size={14} color={focused ? '#2E7D32' : '#9E9E9E'} />
        <Text style={[styles.floatLabel, focused && styles.floatLabelFocused]}>{label}{required ? ' *' : ''}</Text>
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

  const currentStep = images.length === 0 ? 0 : !name || !category ? 1 : !price ? 2 : !campus || !campusArea ? 3 : 4;
  const completionPct = Math.round((currentStep / (STEPS.length - 1)) * 100);

  const subcategoryOptions = useMemo(() => SUBCATEGORIES_MAP[category] || [], [category]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubcategory('');
  };

  const pickImages = () => {
    Alert.alert('Product Photos', 'Choose a source', [
      {
        text: '📷  Camera',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 1200 },
            (response) => {
              if (!response.didCancel && response.assets?.length > 0) {
                const asset = response.assets[0];
                setImages(prev => [...prev, { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `product_${Date.now()}.jpg` }]);
              }
            }
          );
        },
      },
      {
        text: '🖼️  Photo Library',
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

  const handleSubmit = async () => {
    if (!name.trim())      return Alert.alert('Missing Info', 'Product name is required');
    if (!category)         return Alert.alert('Missing Info', 'Please select a category');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) return Alert.alert('Missing Info', 'Please enter a valid price');
    if (!campus)           return Alert.alert('Missing Info', 'Please select your campus');
    if (!campusArea.trim()) return Alert.alert('Missing Info', 'Campus area is required');
    if (images.length === 0) return Alert.alert('Missing Info', 'At least one product image is required');

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

      images.forEach((img) => {
        formData.append('productImages', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          type: img.type,
          name: img.name,
        });
      });

      const response = await createProduct(formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (response?.data?.success || response?.status === 201) {
        Alert.alert( 'success',  'Product Listed Successfully!');
        navigation.goBack();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong.';
      Alert.alert( 'error', msg );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>List Item</Text>
            <Text style={styles.headerSub}>Sell to students on your campus</Text>
          </View>
          <View style={styles.headerCompletionBadge}>
            <Text style={styles.headerCompletionText}>{completionPct}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <StepIndicator currentStep={currentStep} />

          <SectionCard title="Product Photos" subtitle="Up to 10 photos. First photo is the cover." accent="#1B5E20" stepNum="01">
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
                <TouchableOpacity style={styles.imageAddBtn} onPress={pickImages} activeOpacity={0.8}>
                  <Ionicons name="add" size={32} color="#2E7D32" />
                  <Text style={styles.imageAddText}>{images.length === 0 ? 'Add Photos' : `${images.length}/10`}</Text>
                </TouchableOpacity>
              )}
            </View>
          </SectionCard>

          <SectionCard title="Item Details" subtitle="What are you selling?" accent="#2E7D32" stepNum="02">
            <FloatingInput label="Product Name" icon="pricetag-outline" placeholder="e.g. iPhone 13 Pro Max 256GB" value={name} onChangeText={setName} required />
            <DropdownSelector
              label="Category" placeholder="Select category" items={VALID_CATEGORIES}
              selectedValue={category} onSelect={handleCategoryChange} required style={{ marginBottom: 14 }}
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
            <FloatingInput label="Brand (optional)" icon="bookmark-outline" placeholder="e.g. Apple, Samsung, Nike" value={brand} onChangeText={setBrand} />
            <DropdownSelector
              label="Condition" placeholder="Select condition" items={CONDITION_OPTIONS}
              selectedValue={condition} onSelect={setCondition} required style={{ marginBottom: 4 }}
            />
          </SectionCard>

          <SectionCard title="Pricing" subtitle="Set your price" accent="#388E3C" stepNum="03">
            <Text style={styles.quickLabel}>Price (GH₵) <Text style={styles.required}>*</Text></Text>
            <View style={styles.priceInputFull}>
              <View style={styles.currencyTag}><Text style={styles.currencyText}>GH₵</Text></View>
              <TextInput style={styles.priceInputField} placeholder="0.00" placeholderTextColor="#C5C5C5" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
            </View>
            <TouchableOpacity style={[styles.negotiableBtn, negotiable && styles.negotiableBtnActive]} onPress={() => setNegotiable(!negotiable)}>
              <Ionicons name={negotiable ? 'pricetag' : 'pricetag-outline'} size={18} color={negotiable ? '#fff' : '#2E7D32'} />
              <Text style={[styles.negotiableText, negotiable && styles.negotiableTextActive]}>Price is negotiable</Text>
            </TouchableOpacity>
            <Text style={styles.quickLabel}>Quantity Available</Text>
            <TextInput style={styles.simpleInput} placeholder="1" placeholderTextColor="#C5C5C5" keyboardType="numeric" value={countInStock} onChangeText={setCountInStock} />
          </SectionCard>

          <SectionCard title="Campus & Location" subtitle="Where can buyers find you?" accent="#43A047" stepNum="04">
            <DropdownSelector label="Campus" placeholder="Select your campus" items={CAMPUS_OPTIONS} selectedValue={campus} onSelect={setCampus} required style={{ marginBottom: 14 }} />
            <FloatingInput label="Campus Area" icon="location-outline" placeholder="e.g. Main Campus, North Campus" value={campusArea} onChangeText={setCampusArea} required />
            <FloatingInput label="Hostel / Hall (optional)" icon="home-outline" placeholder="e.g. Mensah Sarbah Hall, Pentagon" value={hostel} onChangeText={setHostel} />
          </SectionCard>

          <SectionCard title="Description & Tags" subtitle="Help buyers find your item" accent="#66BB6A" stepNum="05">
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

          {name && category && price && campus && campusArea && images.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-done-circle" size={18} color="#2E7D32" />
                <Text style={styles.summaryTitle}>Ready to List</Text>
              </View>
              {[
                ['Item', name],
                ['Category', formatDisplayName(category)],
                subcategory ? ['Subcategory', formatDisplayName(subcategory)] : null,
                ['Price', `GH₵ ${parseFloat(price || 0).toFixed(2)}${negotiable ? ' (negotiable)' : ''}`],
                ['Condition', formatDisplayName(condition)],
                ['Campus', CAMPUS_OPTIONS.find(c => c.key === campus)?.label || campus],
                ['Photos', `${images.length} image(s)`],
              ].filter(Boolean).map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>{k}</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.publishBtn, loading && styles.publishBtnDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <View style={styles.publishIcon}><Ionicons name="rocket-outline" size={20} color="#2E7D32" /></View>
                <Text style={styles.publishBtnText}>List on Cedimart</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },
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
  headerCompletionText: { fontSize: 13, fontWeight: '800', color: '#2E7D32' },
  progressBarBg: { height: 3, backgroundColor: '#E8E8E8' },
  progressBarFill: { height: 3, backgroundColor: '#2E7D32' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4, marginBottom: 14 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  stepDone: { backgroundColor: '#4CAF50' },
  stepActive: { backgroundColor: '#1B5E20', borderWidth: 2, borderColor: '#A5D6A7' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#9E9E9E' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  stepLabelActive: { color: '#1B5E20', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  cardStepBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardStepNum: { fontSize: 13, fontWeight: '900', letterSpacing: -0.5 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
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
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 22, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  tagChipActive: { backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  tagEmoji: { fontSize: 13 },
  tagLabel: { fontSize: 12.5, color: '#555', fontWeight: '500' },
  tagLabelActive: { color: '#2E7D32', fontWeight: '700' },
  tagCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  tagCountText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },
  tagClearText: { fontSize: 12, color: '#E53935', fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#C8E6C9', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  summaryKey: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', flex: 0.4 },
  summaryVal: { fontSize: 13, color: '#1A1A1A', fontWeight: '700', flex: 0.6, textAlign: 'right' },
  publishBtn: { backgroundColor: '#1B5E20', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  publishBtnDisabled: { backgroundColor: '#81C784', shadowOpacity: 0 },
  publishIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  publishBtnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default AddProductScreen;