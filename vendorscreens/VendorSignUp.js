// src/screens/auth/VendorSignUpScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated, Alert, Image, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import * as Haptics from 'expo-haptics';
import { sendOTPVendor, verifyOTP } from '../apis/authApi';
import { createVendorProfile } from '../apis/vendorApi';
import SupportFAB from '../components/SupportFAB';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  brandDim:     'rgba(13,148,136,0.08)',
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
  gray50:       '#FAFAFA',
  gray100:      '#F5F5F5',
  gray200:      '#E5E7EB',
};

const STEPS = { PHONE: 0, OTP: 1, PROFILE: 2 };

const CAMPUS_OPTIONS = [
  { key: 'UG', label: 'University of Ghana' }, { key: 'KNUST', label: 'KNUST' },
  { key: 'UCC', label: 'University of Cape Coast' }, { key: 'UEW', label: 'University of Education, Winneba' },
  { key: 'UPSA', label: 'UPSA' }, { key: 'GIMPA', label: 'GIMPA' },
  { key: 'ASHESI', label: 'Ashesi University' }, { key: 'ATU', label: 'Accra Technical University' },
  { key: 'OTHER', label: 'Other' },
];

const BUSINESS_TYPE_OPTIONS = [
  { key: 'product', label: 'Products', icon: 'cube-outline', desc: 'I sell physical items' },
  { key: 'service', label: 'Services', icon: 'construct-outline', desc: 'I offer a service' },
  { key: 'both', label: 'Both', icon: 'layers-outline', desc: 'Products & services' },
];

const CATEGORY_OPTIONS = [
  { key: 'electronics', label: 'Electronics', icon: 'hardware-chip-outline', color: '#2563EB' },
  { key: 'phones and tablets', label: 'Phones & Tablets', icon: 'phone-portrait-outline', color: '#7C3AED' },
  { key: 'computers and laptops', label: 'Computers & Laptops', icon: 'laptop-outline', color: '#0891B2' },
  { key: 'gaming', label: 'Gaming', icon: 'game-controller-outline', color: '#DB2777' },
  { key: 'fashion', label: 'Fashion', icon: 'shirt-outline', color: '#DC2626' },
  { key: 'books-course-materials', label: 'Books & Course Materials', icon: 'book-outline', color: '#B45309' },
  { key: 'hostel-items', label: 'Hostel Items', icon: 'bed-outline', color: '#0D9488' },
  { key: 'appliances', label: 'Appliances', icon: 'tv-outline', color: '#475569' },
  { key: 'furniture', label: 'Furniture', icon: 'cube-outline', color: '#92400E' },
  { key: 'beauty and grooming', label: 'Beauty & Grooming', icon: 'sparkles-outline', color: '#EC4899' },
  { key: 'sports and fitness', label: 'Sports & Fitness', icon: 'basketball-outline', color: '#16A34A' },
  { key: 'accessories', label: 'Accessories', icon: 'watch-outline', color: '#CA8A04' },
  { key: 'food and drinks', label: 'Food & Drinks', icon: 'fast-food-outline', color: '#EA580C' },
  { key: 'services', label: 'Services', icon: 'construct-outline', color: '#0284C7' },
  { key: 'tutoring-education', label: 'Tutoring & Education', icon: 'school-outline', color: '#4F46E5' },
  { key: 'photography-media', label: 'Photography & Media', icon: 'camera-outline', color: '#0EA5E9' },
  { key: 'graphic-design-printing', label: 'Graphic Design & Printing', icon: 'color-palette-outline', color: '#9333EA' },
  { key: 'repair-services', label: 'Repair Services', icon: 'build-outline', color: '#65A30D' },
  { key: 'events-catering', label: 'Events & Catering', icon: 'restaurant-outline', color: '#F59E0B' },
  { key: 'accommodation-housing', label: 'Accommodation & Housing', icon: 'home-outline', color: '#0F766E' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

// ─── Press-scale wrapper for tactile, premium feedback ─────────────────────
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

// ─── Sub-components ─────────────────────────────────────────────────────────

const LoadingOverlay = ({ visible, message = 'Please wait...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    if (visible) Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 900, useNativeDriver: true })).start();
    else spinValue.setValue(0);
  }, [visible]);
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 14 }}>
            <Ionicons name="refresh" size={40} color={C.brand} />
          </Animated.View>
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { icon: 'call-outline', label: 'Phone' },
    { icon: 'shield-checkmark-outline', label: 'Verify' },
    { icon: 'person-outline', label: 'Profile' },
  ];
  return (
    <View style={styles.stepIndicatorContainer}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > index;
        const isActive = currentStep === index;
        return (
          <React.Fragment key={index}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, isCompleted && styles.stepCircleCompleted, isActive && styles.stepCircleActive]}>
                {isCompleted ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Ionicons name={step.icon} size={16} color={isActive ? '#fff' : '#bbb'} />}
              </View>
              <Text style={[styles.stepLabel, (isActive || isCompleted) && styles.stepLabelActive]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 && <View style={[styles.stepConnector, currentStep > index && styles.stepConnectorCompleted]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const OTPInput = ({ value, onChange, editable }) => {
  const inputRef = useRef(null);
  const digits = value.padEnd(6, ' ').split('');
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
      {digits.map((digit, i) => (
        <View key={i} style={[styles.otpBox, digit.trim() !== '' && styles.otpBoxFilled, value.length === i && styles.otpBoxActive]}>
          <Text style={styles.otpDigit}>{digit.trim()}</Text>
        </View>
      ))}
      <TextInput ref={inputRef} value={value} onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} editable={editable} style={styles.otpHiddenInput} caretHidden />
    </TouchableOpacity>
  );
};

const DropdownSelector = ({ label, placeholder, items, selectedValue, onSelect, required, style }) => {
  const [visible, setVisible] = useState(false);
  const selectedItem = items.find(i => i.key === selectedValue);
  
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setVisible(true)} activeOpacity={0.8}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {selectedItem?.icon && (
            <View style={styles.dropdownSelectedIcon}>
              <Ionicons name={selectedItem.icon} size={18} color={C.brand} />
            </View>
          )}
          <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder]} numberOfLines={1}>
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={C.t3} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={() => setVisible(false)} />
        <View style={styles.dropdownSheet}>
          <View style={styles.dropdownHandle} />
          <Text style={styles.dropdownSheetTitle}>{label || placeholder}</Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {items.map(item => {
              const isSelected = selectedValue === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); onSelect(item.key); setVisible(false); }}
                >
                  {item.icon && (
                    <View style={[styles.dropdownItemIconWrap, isSelected && styles.dropdownItemIconWrapActive]}>
                      <Ionicons name={item.icon} size={18} color={isSelected ? '#fff' : C.brand} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{item.label}</Text>
                    {item.desc && <Text style={styles.dropdownItemDesc}>{item.desc}</Text>}
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.brand} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Categories bottom sheet: searchable, multi-select, premium design ────
const CategorySheet = ({ visible, options, selectedValues, onToggle, onClear, onClose }) => {
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.categorySheet}>
        <View style={styles.dropdownHandle} />
        
        {/* Premium Header */}
        <View style={styles.categorySheetHeader}>
          <View style={styles.categoryHeaderIcon}>
            <Ionicons name="pricetags-outline" size={22} color={C.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.categorySheetTitle}>What do you sell?</Text>
            <Text style={styles.categorySheetSubtitle}>Select all that apply</Text>
          </View>
          {selectedValues.length > 0 && (
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.categoryClearBtn}>
              <Text style={styles.categoryClearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.categorySearchBar}>
          <Ionicons name="search-outline" size={17} color={C.t3} />
          <TextInput
            style={styles.categorySearchInput}
            placeholder="Search categories..."
            placeholderTextColor={C.t3}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={C.t3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected count badge */}
        {selectedValues.length > 0 && (
          <View style={styles.selectedCountBadge}>
            <Ionicons name="checkmark-circle" size={14} color={C.brand} />
            <Text style={styles.selectedCountText}>
              {selectedValues.length} {selectedValues.length === 1 ? 'category' : 'categories'} selected
            </Text>
          </View>
        )}

        <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
          {filtered.map(opt => {
            const isSelected = selectedValues.includes(opt.key);
            return (
              <Pressy
                key={opt.key}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); onToggle(opt.key); }}
                style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                scaleTo={0.97}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: opt.color + '15' }]}>
                  <Ionicons name={opt.icon} size={19} color={opt.color} />
                </View>
                <Text style={[styles.categoryRowLabel, isSelected && styles.categoryRowLabelSelected]}>{opt.label}</Text>
                <View style={[styles.categoryCheckbox, isSelected && styles.categoryCheckboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </Pressy>
            );
          })}
          {filtered.length === 0 && (
            <View style={styles.categoryNoResultsWrap}>
              <Ionicons name="search-outline" size={32} color={C.t3} />
              <Text style={styles.categoryNoResults}>No categories match "{query}"</Text>
            </View>
          )}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Done Button */}
        <Pressy onPress={onClose} style={styles.categoryDoneBtn} scaleTo={0.96}>
          <Text style={styles.categoryDoneBtnText}>
            {selectedValues.length > 0 ? `Done · ${selectedValues.length} selected` : 'Done'}
          </Text>
        </Pressy>
      </View>
    </Modal>
  );
};

// ─── Trigger card that opens the CategorySheet ──────────────────────────────
const CategoryPickerTrigger = ({ label, selectedValues, options, onPress, style }) => {
  const selectedOpts = options.filter(o => selectedValues.includes(o.key));
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <Pressy onPress={onPress} style={styles.categoryTriggerBtn} scaleTo={0.97}>
        {selectedOpts.length > 0 ? (
          <View style={styles.categoryTriggerContent}>
            <View style={styles.categoryTriggerIcons}>
              {selectedOpts.slice(0, 4).map((opt, i) => (
                <View
                  key={opt.key}
                  style={[
                    styles.categoryTriggerIconCircle,
                    { backgroundColor: opt.color, marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                  ]}
                >
                  <Ionicons name={opt.icon} size={13} color="#fff" />
                </View>
              ))}
              {selectedOpts.length > 4 && (
                <View style={[styles.categoryTriggerIconCircle, { backgroundColor: C.brand, marginLeft: -8, zIndex: 6 }]}>
                  <Text style={styles.categoryTriggerMoreText}>+{selectedOpts.length - 4}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTriggerText}>
                {selectedOpts.length} {selectedOpts.length === 1 ? 'category' : 'categories'} selected
              </Text>
              <Text style={styles.categoryTriggerSubtext} numberOfLines={1}>
                {selectedOpts.map(o => o.label).join(', ')}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.categoryTriggerPlaceholder}>Tap to select categories</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={C.t3} />
      </Pressy>
    </View>
  );
};

// ─── Business type dropdown selector ───────────────────────────────────────
const BusinessTypeSelector = ({ value, onChange, style }) => (
  <View style={style}>
    <Text style={styles.label}>What kind of business is this? <Text style={styles.required}>*</Text></Text>
    <DropdownSelector 
      label={null}
      placeholder="Select business type"
      items={BUSINESS_TYPE_OPTIONS}
      selectedValue={value}
      onSelect={onChange}
      required
    />
  </View>
);

// ─── Search tags chip input ─────────────────────────────────────────────────
const TagInput = ({ label, placeholder, tags, onChange, style }) => {
  const [text, setText] = useState('');
  const addTag = () => {
    const t = text.trim().toLowerCase();
    if (t && !tags.includes(t)) { Haptics.selectionAsync().catch(() => {}); onChange([...tags, t]); }
    setText('');
  };
  const removeTag = (tag) => { Haptics.selectionAsync().catch(() => {}); onChange(tags.filter(t => t !== tag)); };
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label} <Text style={styles.optional}>(optional)</Text></Text>}
      <View style={styles.tagInputRow}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Ionicons name="pricetags-outline" size={18} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={C.t3}
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTag}
            returnKeyType="done"
            blurOnSubmit={false}
          />
        </View>
        <Pressy onPress={addTag} style={[styles.tagAddBtn, !text.trim() && styles.tagAddBtnDisabled]} disabled={!text.trim()} scaleTo={0.9}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressy>
      </View>
      {tags.length > 0 && (
        <View style={styles.tagsWrap}>
          {tags.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={C.brand} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.tagHint}>e.g. "braids", "iphone repair", "wedding photography" — helps people find you when they search</Text>
    </View>
  );
};

const VendorSignUpScreen = ({ navigation }) => {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [campus, setCampus] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [hostel, setHostel] = useState('');
  const [businessType, setBusinessType] = useState('product');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [searchTags, setSearchTags] = useState([]);
  const [openingHours, setOpeningHours] = useState('');
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [storeBanner, setStoreBanner] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }), Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true })]).start();
  }, [step]);

  useEffect(() => { if (resendCooldown <= 0) return; const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000); return () => clearTimeout(timer); }, [resendCooldown]);

  const triggerShake = () => {
    Animated.sequence([Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }), Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }), Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }), Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }), Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true })]).start();
  };

  const handleSendOTP = async () => {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (trimmed.length < 9) { setError('Please enter a valid phone number.'); triggerShake(); return; }
    setLoading(true); setError('');
    try {
      const response = await sendOTPVendor(trimmed);
      if (response?.data?.success || response?.status === 200) { setStep(STEPS.OTP); setResendCooldown(180); }
      else Alert.alert('Error', response?.data?.message || 'Failed to send verification code.');
    } catch (err) { Alert.alert('Error', err?.response?.data?.message || 'Network error.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const response = await verifyOTP(phone.trim().replace(/\s/g, ''), otp);
      if (response?.data?.success || response?.status === 200) setStep(STEPS.PROFILE);
      else setError('Invalid or expired code. Please try again.');
    } catch (err) { setError(err?.response?.data?.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtp(''); setError(''); setLoading(true);
    try {
      const response = await sendOTPVendor(phone.trim().replace(/\s/g, ''));
      if (response?.data?.success || response?.status === 200) { setResendCooldown(180); Alert.alert('Code Sent', 'A new verification code has been sent.'); }
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setLoading(false); }
  };

  const pickProfileImage = () => {
    Alert.alert('Business Logo', 'Choose a source', [
      { text: '📷  Camera', onPress: () => launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 800, maxHeight: 800 }, (r) => { if (!r.didCancel && r.assets?.length) setProfileImage({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `profile_${Date.now()}.jpg` }); }) },
      { text: '🖼️  Photo Library', onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 800, maxHeight: 800 }, (r) => { if (!r.didCancel && r.assets?.length) setProfileImage({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `profile_${Date.now()}.jpg` }); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickStoreBanner = () => {
    Alert.alert('Store Banner', 'Choose a source', [
      { text: '📷  Camera', onPress: () => launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 600 }, (r) => { if (!r.didCancel && r.assets?.length) setStoreBanner({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `banner_${Date.now()}.jpg` }); }) },
      { text: '🖼️  Photo Library', onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 600 }, (r) => { if (!r.didCancel && r.assets?.length) setStoreBanner({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `banner_${Date.now()}.jpg` }); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleCategory = (key) => { setSelectedCategories(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]); };

  const categorySectionLabel =
    businessType === 'service' ? 'What services do you offer?' :
    businessType === 'both' ? 'What do you sell or offer?' :
    'What do you sell?';

  const handleSubmitProfile = async () => {
    if (!fullName.trim()) return Alert.alert('Missing Info', 'Please enter your full name.');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', fullName.trim());
      formData.append('phone', phone.trim().replace(/\s/g, ''));
      formData.append('businessType', businessType);
      if (storeName.trim()) formData.append('storeName', storeName.trim());
      if (campus) formData.append('campus', campus);
      if (campusArea.trim()) formData.append('campusArea', campusArea.trim());
      if (hostel.trim()) formData.append('hostel', hostel.trim());
      if (openingHours.trim()) formData.append('openingHours', openingHours.trim());
      if (bio.trim()) formData.append('bio', bio.trim());
      if (whatsapp.trim()) formData.append('whatsapp', whatsapp.trim());
      if (instagram.trim()) formData.append('instagram', instagram.trim());
      if (selectedCategories.length > 0) selectedCategories.forEach(cat => formData.append('categories[]', cat));
      if (searchTags.length > 0) searchTags.forEach(tag => formData.append('searchTags[]', tag));
      if (profileImage) formData.append('profileImage', { uri: Platform.OS === 'ios' ? profileImage.uri.replace('file://', '') : profileImage.uri, type: profileImage.type, name: profileImage.name });
      if (storeBanner) formData.append('storeBanner', { uri: Platform.OS === 'ios' ? storeBanner.uri.replace('file://', '') : storeBanner.uri, type: storeBanner.type, name: storeBanner.name });
      const response = await createVendorProfile(formData);
      if (response?.data?.success || response?.status === 201) {
        Alert.alert('Account Created! 🎉', 'Your vendor account has been created successfully. You can now sign in.', [{ text: 'Sign In', onPress: () => navigation.navigate('VendorLogin') }]);
      } else throw new Error('Failed to create account');
    } catch (err) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  // ── Render functions ──────────────────────────────────────────────────────

  const renderPhoneStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}><Ionicons name="storefront-outline" size={28} color={C.brand} /></View>
        <Text style={styles.stepTitle}>Create Vendor Account</Text>
        <Text style={styles.stepSubtitle}>Enter your phone number to get started</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Animated.View style={[styles.inputContainer, error && styles.inputError, { transform: [{ translateX: shakeAnim }] }]}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor={C.t3} value={phone} onChangeText={(t) => { setError(''); setPhone(t.replace(/[^0-9]/g, '')); }} keyboardType="phone-pad" maxLength={10} editable={!loading} returnKeyType="done" onSubmitEditing={handleSendOTP} />
          </Animated.View>
          {error !== '' && <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color={C.danger} /><Text style={styles.errorText}>{error}</Text></View>}
        </View>
        <Pressy onPress={handleSendOTP} style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} disabled={loading} scaleTo={0.97}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Send Verification Code</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
        </Pressy>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Already have vendor account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('VendorLogin')} disabled={loading}><Text style={[styles.linkAction, loading && styles.disabledText]}>Sign In</Text></TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}><Ionicons name="shield-checkmark-outline" size={28} color={C.brand} /></View>
        <Text style={styles.stepTitle}>Verify Your Phone</Text>
        <Text style={styles.stepSubtitle}>We sent a 6-digit code to <Text style={styles.phoneHighlight}> {phone}</Text></Text>
      </View>
      <OTPInput value={otp} onChange={setOtp} editable={!loading} />
      {error !== '' && <View style={[styles.errorRow, { justifyContent: 'center', marginTop: 10 }]}><Ionicons name="alert-circle-outline" size={14} color={C.danger} /><Text style={styles.errorText}>{error}</Text></View>}
      <Pressy onPress={handleVerifyOTP} style={[styles.primaryButton, (loading || otp.length < 6) && styles.primaryButtonDisabled]} disabled={loading || otp.length < 6} scaleTo={0.97}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Verify & Continue</Text><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /></>}
      </Pressy>
      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
          <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && styles.resendLinkDisabled]}> {resendCooldown > 0 ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` : 'Resend Code'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backLinkRow} onPress={() => { setStep(STEPS.PHONE); setOtp(''); setError(''); }} disabled={loading}>
        <Ionicons name="chevron-back" size={16} color={C.brand} /><Text style={styles.backLinkText}>Change phone number</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}><Ionicons name="person-outline" size={28} color={C.brand} /></View>
        <Text style={styles.stepTitle}>Complete Your Profile</Text>
        <Text style={styles.stepSubtitle}>Tell us about your store</Text>
      </View>
      <View style={styles.form}>
        <BusinessTypeSelector value={businessType} onChange={setBusinessType} style={{ marginBottom: 20 }} />

        <View style={styles.imageSection}>
          <Text style={styles.label}>Profile Photo</Text>
          <Pressy onPress={pickProfileImage} style={styles.imagePicker} scaleTo={0.94}>
            {profileImage ? (
              <View>
                <Image source={{ uri: profileImage.uri }} style={styles.profileImagePreview} />
                <View style={styles.imageEditBadge}><Ionicons name="pencil" size={12} color="#fff" /></View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={28} color={C.brandBorder} /><Text style={styles.imagePlaceholderText}>Add Photo</Text></View>
            )}
          </Pressy>
        </View>
        <View style={styles.imageSection}>
          <Text style={styles.label}>Store Banner <Text style={styles.optional}>(optional)</Text></Text>
          <Pressy onPress={pickStoreBanner} style={styles.bannerPicker} scaleTo={0.97}>
            {storeBanner ? (
              <View>
                <Image source={{ uri: storeBanner.uri }} style={styles.bannerImagePreview} resizeMode="cover" />
                <View style={styles.imageEditBadge}><Ionicons name="pencil" size={12} color="#fff" /></View>
              </View>
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="image-outline" size={32} color={C.brandBorder} />
                <Text style={styles.imagePlaceholderText}>Add Banner</Text>
                <Text style={styles.bannerPlaceholderHint}>Recommended: 1200 x 600</Text>
              </View>
            )}
          </Pressy>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}><Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor={C.t3} value={fullName} onChangeText={setFullName} editable={!loading} /></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputContainer}><Ionicons name="storefront-outline" size={20} color="#666" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="e.g. Kwame's Electronics" placeholderTextColor={C.t3} value={storeName} onChangeText={setStoreName} editable={!loading} /></View>
        </View>
        <DropdownSelector label="Campus" placeholder="Select your campus" items={CAMPUS_OPTIONS} selectedValue={campus} onSelect={setCampus} style={{ marginBottom: 20 }} />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Campus Area</Text>
          <View style={styles.inputContainer}><Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="e.g. Main Campus, North Campus" placeholderTextColor={C.t3} value={campusArea} onChangeText={setCampusArea} editable={!loading} /></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hostel / Hall <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputContainer}><Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="e.g. Mensah Sarbah Hall, Pentagon" placeholderTextColor={C.t3} value={hostel} onChangeText={setHostel} editable={!loading} /></View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Opening Hours <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputContainer}><Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="e.g. Mon-Fri, 9am-6pm" placeholderTextColor={C.t3} value={openingHours} onChangeText={setOpeningHours} editable={!loading} /></View>
        </View>

        <CategoryPickerTrigger
          label={categorySectionLabel}
          selectedValues={selectedCategories}
          options={CATEGORY_OPTIONS}
          onPress={() => setCategorySheetVisible(true)}
          style={{ marginBottom: 20 }}
        />
        <CategorySheet
          visible={categorySheetVisible}
          options={CATEGORY_OPTIONS}
          selectedValues={selectedCategories}
          onToggle={toggleCategory}
          onClear={() => setSelectedCategories([])}
          onClose={() => setCategorySheetVisible(false)}
        />

        <TagInput label="Search tags" placeholder="Type a tag, then press enter" tags={searchTags} onChange={setSearchTags} style={{ marginBottom: 20 }} />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Tell buyers about your business, what makes your brand unique, and what they can expect when they buy from you..." 
              placeholderTextColor={C.t3} 
              value={bio} 
              onChangeText={setBio} 
              multiline 
              maxLength={500} 
              editable={!loading} 
              textAlignVertical="top" 
            />
          </View>
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>
        <Pressy onPress={handleSubmitProfile} style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} disabled={loading} scaleTo={0.97}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Create Account</Text><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /></>}
        </Pressy>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => { if (step === STEPS.PHONE) navigation.goBack(); else if (step === STEPS.OTP) { setStep(STEPS.PHONE); setOtp(''); setError(''); } else setStep(STEPS.OTP); }} disabled={loading}>
            <Ionicons name="chevron-back" size={22} color={C.brand} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Vendor Sign Up</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.stepIndicatorWrapper}><StepIndicator currentStep={step} /></View>
          <View style={styles.content}>
            {step === STEPS.PHONE && renderPhoneStep()}
            {step === STEPS.OTP && renderOTPStep()}
            {step === STEPS.PROFILE && renderProfileStep()}
          </View>
        </ScrollView>
        <LoadingOverlay visible={loading} message={step === STEPS.PHONE ? 'Sending verification code...' : step === STEPS.OTP ? 'Verifying your phone...' : 'Creating your account...'} />
      </KeyboardAvoidingView>
      <SupportFAB/>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: C.brand, letterSpacing: 0.2 },
  scrollContent: { flexGrow: 1, paddingBottom: 50 },
  stepIndicatorWrapper: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  stepIndicatorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.gray100, borderWidth: 2, borderColor: C.gray200, justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: C.brand, borderColor: C.brand, shadowColor: C.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  stepCircleCompleted: { backgroundColor: C.brandD, borderColor: C.brandD },
  stepLabel: { fontSize: 10, color: '#bbb', fontWeight: '600' },
  stepLabelActive: { color: C.brand },
  stepConnector: { flex: 1, height: 2, backgroundColor: C.gray200, marginHorizontal: 6, marginBottom: 20, borderRadius: 1 },
  stepConnectorCompleted: { backgroundColor: C.brand },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  stepHeader: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  stepIconBadge: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: C.brandBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    borderWidth: 2, borderColor: C.brandBorder,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  stepTitle: { fontSize: 24, fontWeight: '800', color: C.t1, marginBottom: 6, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, color: C.t2, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  phoneHighlight: { fontWeight: '700', color: C.brand },
  form: {},
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: C.t1, marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' },
  required: { color: C.danger },
  optional: { color: C.t3, fontWeight: '500', fontSize: 11, textTransform: 'none' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.gray200, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  textAreaContainer: { alignItems: 'flex-start', paddingTop: 12 },
  inputError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: C.t1, paddingVertical: 14 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 0 },
  charCount: { fontSize: 11, color: C.t3, alignSelf: 'flex-end', marginTop: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  errorText: { fontSize: 12, color: C.danger },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.brand, borderRadius: 16, paddingVertical: 16, marginTop: 8, gap: 8, shadowColor: C.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  primaryButtonDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: C.t2 },
  linkAction: { fontSize: 14, color: C.brand, fontWeight: 'bold' },
  disabledText: { color: C.t3 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 24, position: 'relative' },
  otpBox: { width: 48, height: 56, borderRadius: 14, borderWidth: 2, borderColor: C.gray200, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center' },
  otpBoxFilled: { borderColor: C.brand, backgroundColor: C.brandBg },
  otpBoxActive: { borderColor: C.brand, borderWidth: 2, backgroundColor: C.white, shadowColor: C.brand, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  otpDigit: { fontSize: 22, fontWeight: '700', color: C.brand },
  otpHiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 14 },
  resendPrompt: { fontSize: 14, color: C.t2 },
  resendLink: { fontSize: 14, fontWeight: '700', color: C.brand },
  resendLinkDisabled: { color: C.t3 },
  backLinkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 },
  backLinkText: { fontSize: 14, color: C.brand, fontWeight: '600' },
  imageSection: { marginBottom: 18, alignItems: 'center' },
  imagePicker: { marginTop: 8 },
  profileImagePreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: C.brandBorder },
  imageEditBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.brandBg, borderWidth: 2, borderColor: C.brandBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  imagePlaceholderText: { fontSize: 11, color: C.brandBorder, fontWeight: '600' },
  bannerPicker: { marginTop: 8, width: '100%' },
  bannerImagePreview: { width: 325, height: 160, borderRadius: 14, borderWidth: 2, borderColor: C.brandBorder },
  bannerPlaceholder: { width: '325%', height: 160, borderRadius: 14, backgroundColor: C.brandBg, borderWidth: 2, borderColor: C.brandBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8 },
  bannerPlaceholderHint: { fontSize: 10, color: C.t3 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.gray200, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownSelectedIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  dropdownButtonText: { fontSize: 15, color: C.t1, flex: 1 },
  dropdownPlaceholder: { color: C.t3 },
  dropdownBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dropdownSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: '60%' },
  dropdownHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.gray200, alignSelf: 'center', marginBottom: 20 },
  dropdownSheetTitle: { fontSize: 18, fontWeight: '800', color: C.t1, marginBottom: 16 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownItemActive: { backgroundColor: C.brandBg },
  dropdownItemIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  dropdownItemIconWrapActive: { backgroundColor: C.brand },
  dropdownItemText: { fontSize: 15, fontWeight: '500', color: C.t2, flex: 1 },
  dropdownItemTextActive: { color: C.brand, fontWeight: '700' },
  dropdownItemDesc: { fontSize: 11, color: C.t3, marginTop: 2 },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { backgroundColor: C.white, padding: 30, borderRadius: 16, alignItems: 'center', shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5, minWidth: 200 },
  loadingText: { fontSize: 15, fontWeight: '600', color: C.t1, textAlign: 'center' },

  // Category picker trigger + bottom sheet
  categoryTriggerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.gray200,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  categoryTriggerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  categoryTriggerIcons: { flexDirection: 'row', alignItems: 'center' },
  categoryTriggerIconCircle: {
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  categoryTriggerMoreText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  categoryTriggerText: { fontSize: 13, fontWeight: '700', color: C.t1 },
  categoryTriggerSubtext: { fontSize: 11, color: C.t3, marginTop: 2 },
  categoryTriggerPlaceholder: { fontSize: 15, color: C.t3, flex: 1 },

  categorySheet: {
    backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, maxHeight: '80%',
  },
  categorySheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 },
  categoryHeaderIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.brandBg,
    justifyContent: 'center', alignItems: 'center',
  },
  categorySheetTitle: { fontSize: 18, fontWeight: '800', color: C.t1 },
  categorySheetSubtitle: { fontSize: 12, color: C.t3, marginTop: 2 },
  categoryClearBtn: {
    backgroundColor: C.accentBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: C.accentBorder,
  },
  categoryClearText: { fontSize: 12, fontWeight: '700', color: C.accent },
  categorySearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.gray50, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 10,
    borderWidth: 1, borderColor: C.gray200,
  },
  categorySearchInput: { flex: 1, fontSize: 14, color: C.t1, height: '100%' },
  selectedCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.brandBg, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginBottom: 8,
  },
  selectedCountText: { fontSize: 11, fontWeight: '700', color: C.brand },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 10, borderRadius: 14, marginBottom: 2,
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryRowSelected: { backgroundColor: C.brandBg, borderColor: C.brandBorder },
  categoryIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  categoryRowLabel: { flex: 1, fontSize: 14, color: C.t1, fontWeight: '500' },
  categoryRowLabelSelected: { fontWeight: '700', color: C.brandD },
  categoryCheckbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: C.gray200,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryCheckboxActive: { backgroundColor: C.brand, borderColor: C.brand },
  categoryNoResultsWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  categoryNoResults: { fontSize: 13, color: C.t3 },
  categoryDoneBtn: {
    marginBottom:12,
    backgroundColor: C.brand, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  categoryDoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Search tags chip input
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagAddBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', shadowColor: C.brand, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  tagAddBtnDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brandBg, borderWidth: 1, borderColor: C.brandBorder,
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7,
  },
  tagChipText: { fontSize: 12.5, color: C.brandD, fontWeight: '600' },
  tagHint: { fontSize: 11, color: C.t3, marginTop: 8, lineHeight: 15 },
});

export default VendorSignUpScreen;