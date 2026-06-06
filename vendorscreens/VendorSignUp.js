// src/screens/auth/VendorSignUpScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { sendOTPVendor, verifyOTP } from '../apis/authApi';
import { createVendorProfile } from '../apis/vendorApi';

const STEPS = {
  PHONE: 0,
  OTP: 1,
  PROFILE: 2,
};

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

const CATEGORY_OPTIONS = [
  { key: 'electronics',           label: 'Electronics',           icon: '🔌' },
  { key: 'phones and tablets',    label: 'Phones & Tablets',      icon: '📱' },
  { key: 'computers and laptops', label: 'Computers & Laptops',   icon: '💻' },
  { key: 'gaming',                label: 'Gaming',                icon: '🎮' },
  { key: 'fashion',               label: 'Fashion',               icon: '👕' },
  { key: 'books-course-materials',label: 'Books & Course Materials', icon: '📚' },
  { key: 'hostel-items',          label: 'Hostel Items',          icon: '🏠' },
  { key: 'appliances',            label: 'Appliances',            icon: '🔧' },
  { key: 'furniture',             label: 'Furniture',             icon: '🪑' },
  { key: 'beauty and grooming',   label: 'Beauty & Grooming',     icon: '💄' },
  { key: 'sports and fitness',    label: 'Sports & Fitness',      icon: '⚽' },
  { key: 'accessories',           label: 'Accessories',           icon: '⌚' },
  { key: 'food and drinks',       label: 'Food & Drinks',         icon: '🍕' },
  { key: 'services',              label: 'Services',              icon: '🛠️' },
  { key: 'other',                 label: 'Other',                 icon: '📦' },
];

const LoadingOverlay = ({ visible, message = 'Please wait...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    if (visible) {
      Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 900, useNativeDriver: true })).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 14 }}>
            <Ionicons name="refresh" size={40} color="#4CAF50" />
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
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Ionicons name={step.icon} size={16} color={isActive ? '#fff' : '#bbb'} />
                )}
              </View>
              <Text style={[styles.stepLabel, (isActive || isCompleted) && styles.stepLabelActive]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.stepConnector, currentStep > index && styles.stepConnectorCompleted]} />
            )}
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
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        editable={editable}
        style={styles.otpHiddenInput}
        caretHidden
      />
    </TouchableOpacity>
  );
};

const DropdownSelector = ({ label, placeholder, items, selectedValue, onSelect, required, style }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder]} numberOfLines={1}>
          {selectedValue
            ? items.find(i => i.key === selectedValue)?.label || selectedValue
            : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9E9E9E" />
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
                  onPress={() => { onSelect(item.key); setVisible(false); }}
                >
                  {item.icon && <Text style={styles.dropdownItemIcon}>{item.icon}</Text>}
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#2E7D32" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const MultiSelectChips = ({ label, options, selectedValues, onToggle, style }) => (
  <View style={style}>
    {label && <Text style={styles.label}>{label} <Text style={styles.optional}>(optional)</Text></Text>}
    <View style={styles.chipsGrid}>
      {options.map(option => {
        const isSelected = selectedValues.includes(option.key);
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onToggle(option.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{option.icon}</Text>
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const VendorSignUpScreen = ({ navigation }) => {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [campus, setCampus] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [hostel, setHostel] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [bio, setBio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [storeBanner, setStoreBanner] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOTP = async () => {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (trimmed.length < 9) {
      setError('Please enter a valid phone number.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await sendOTPVendor(trimmed);
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.OTP);
        setResendCooldown(60);
      } else {
        Alert.alert('Error', response?.data?.message || 'Failed to send verification code.');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const trimmed = phone.trim().replace(/\s/g, '');
      const response = await verifyOTP(trimmed, otp);
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.PROFILE);
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtp('');
    setError('');
    setLoading(true);
    try {
      const trimmed = phone.trim().replace(/\s/g, '');
      const response = await sendOTPVendor(trimmed);
      if (response?.data?.success || response?.status === 200) {
        setResendCooldown(60);
        Alert.alert('Code Sent', 'A new verification code has been sent.');
      }
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setLoading(false); }
  };

  const pickProfileImage = () => {
    Alert.alert('Profile Photo', 'Choose a source', [
      { text: '📷  Camera', onPress: () => { launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 800, maxHeight: 800 }, (r) => { if (!r.didCancel && r.assets?.length) setProfileImage({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `profile_${Date.now()}.jpg` }); }); } },
      { text: '🖼️  Photo Library', onPress: () => { launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 800, maxHeight: 800 }, (r) => { if (!r.didCancel && r.assets?.length) setProfileImage({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `profile_${Date.now()}.jpg` }); }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickStoreBanner = () => {
    Alert.alert('Store Banner', 'Choose a source', [
      { text: '📷  Camera', onPress: () => { launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 600 }, (r) => { if (!r.didCancel && r.assets?.length) setStoreBanner({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `banner_${Date.now()}.jpg` }); }); } },
      { text: '🖼️  Photo Library', onPress: () => { launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 1200, maxHeight: 600 }, (r) => { if (!r.didCancel && r.assets?.length) setStoreBanner({ uri: r.assets[0].uri, type: r.assets[0].type || 'image/jpeg', name: r.assets[0].fileName || `banner_${Date.now()}.jpg` }); }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleCategory = (key) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const handleSubmitProfile = async () => {
    if (!fullName.trim()) return Alert.alert('Missing Info', 'Please enter your full name.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', fullName.trim());
      formData.append('phone', phone.trim().replace(/\s/g, ''));

      if (storeName.trim()) formData.append('storeName', storeName.trim());
      if (campus) formData.append('campus', campus);
      if (campusArea.trim()) formData.append('campusArea', campusArea.trim());
      if (hostel.trim()) formData.append('hostel', hostel.trim());
      if (bio.trim()) formData.append('bio', bio.trim());
      if (whatsapp.trim()) formData.append('whatsapp', whatsapp.trim());
      if (instagram.trim()) formData.append('instagram', instagram.trim());

      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => formData.append('categories[]', cat));
      }

      if (profileImage) {
        formData.append('profileImage', {
          uri: Platform.OS === 'ios' ? profileImage.uri.replace('file://', '') : profileImage.uri,
          type: profileImage.type,
          name: profileImage.name,
        });
      }

      if (storeBanner) {
        formData.append('storeBanner', {
          uri: Platform.OS === 'ios' ? storeBanner.uri.replace('file://', '') : storeBanner.uri,
          type: storeBanner.type,
          name: storeBanner.name,
        });
      }

      const response = await createVendorProfile(formData);

      if (response?.data?.success || response?.status === 201) {
        Alert.alert(
          'Account Created! 🎉',
          'Your vendor account has been created successfully. You can now sign in.',
          [{ text: 'Sign In', onPress: () => navigation.navigate('VendorLogin') }]
        );
      } else {
        throw new Error('Failed to create account');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="storefront-outline" size={28} color="#4CAF50" />
        </View>
        <Text style={styles.stepTitle}>Create Vendor Account</Text>
        <Text style={styles.stepSubtitle}>Enter your phone number to get started</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Animated.View style={[styles.inputContainer, error && styles.inputError, { transform: [{ translateX: shakeAnim }] }]}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor="#BDBDBD" value={phone} onChangeText={(t) => { setError(''); setPhone(t.replace(/[^0-9]/g, '')); }} keyboardType="phone-pad" maxLength={10} editable={!loading} returnKeyType="done" onSubmitEditing={handleSendOTP} />
          </Animated.View>
          {error !== '' && <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#F44336" /><Text style={styles.errorText}>{error}</Text></View>}
        </View>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleSendOTP} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Send Verification Code</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
        </TouchableOpacity>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('VendorLogin')} disabled={loading}>
            <Text style={[styles.linkAction, loading && styles.disabledText]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}><Ionicons name="shield-checkmark-outline" size={28} color="#4CAF50" /></View>
        <Text style={styles.stepTitle}>Verify Your Phone</Text>
        <Text style={styles.stepSubtitle}>We sent a 6-digit code to <Text style={styles.phoneHighlight}>+233 {phone}</Text></Text>
      </View>
      <OTPInput value={otp} onChange={setOtp} editable={!loading} />
      {error !== '' && <View style={[styles.errorRow, { justifyContent: 'center', marginTop: 10 }]}><Ionicons name="alert-circle-outline" size={14} color="#F44336" /><Text style={styles.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[styles.primaryButton, (loading || otp.length < 6) && styles.primaryButtonDisabled]} onPress={handleVerifyOTP} disabled={loading || otp.length < 6} activeOpacity={0.8}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Verify & Continue</Text><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /></>}
      </TouchableOpacity>
      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
          <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && styles.resendLinkDisabled]}>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backLinkRow} onPress={() => { setStep(STEPS.PHONE); setOtp(''); setError(''); }} disabled={loading}>
        <Ionicons name="chevron-back" size={16} color="#4CAF50" /><Text style={styles.backLinkText}>Change phone number</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}><Ionicons name="person-outline" size={28} color="#4CAF50" /></View>
        <Text style={styles.stepTitle}>Complete Your Profile</Text>
        <Text style={styles.stepSubtitle}>Tell us about your store</Text>
      </View>

      <View style={styles.form}>
        {/* Profile Image & Banner */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Profile Photo</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickProfileImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage.uri }} style={styles.profileImagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={28} color="#A5D6A7" /><Text style={styles.imagePlaceholderText}>Add Photo</Text></View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>Store Banner <Text style={styles.optional}>(optional)</Text></Text>
          <TouchableOpacity style={styles.bannerPicker} onPress={pickStoreBanner} activeOpacity={0.8}>
            {storeBanner ? (
              <Image source={{ uri: storeBanner.uri }} style={styles.bannerImagePreview} />
            ) : (
              <View style={styles.bannerPlaceholder}><Ionicons name="image-outline" size={28} color="#A5D6A7" /><Text style={styles.imagePlaceholderText}>Add Banner</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="#BDBDBD" value={fullName} onChangeText={setFullName} editable={!loading} />
          </View>
        </View>

        {/* Store Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputContainer}>
            <Ionicons name="storefront-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="e.g. Kwame's Electronics" placeholderTextColor="#BDBDBD" value={storeName} onChangeText={setStoreName} editable={!loading} />
          </View>
        </View>

        {/* Campus */}
        <DropdownSelector
          label="Campus"
          placeholder="Select your campus"
          items={CAMPUS_OPTIONS}
          selectedValue={campus}
          onSelect={setCampus}
          style={{ marginBottom: 20 }}
        />

        {/* Campus Area */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Campus Area</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="e.g. Main Campus, North Campus" placeholderTextColor="#BDBDBD" value={campusArea} onChangeText={setCampusArea} editable={!loading} />
          </View>
        </View>

        {/* Hostel / Hall */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hostel / Hall <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="e.g. Mensah Sarbah Hall, Pentagon" placeholderTextColor="#BDBDBD" value={hostel} onChangeText={setHostel} editable={!loading} />
          </View>
        </View>

        {/* Categories */}
        <MultiSelectChips
          label="What do you sell?"
          options={CATEGORY_OPTIONS}
          selectedValues={selectedCategories}
          onToggle={toggleCategory}
          style={{ marginBottom: 20 }}
        />

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell buyers about yourself and what you sell..."
              placeholderTextColor="#BDBDBD"
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

        <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleSubmitProfile} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryButtonText}>Create Account</Text><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /></>}
        </TouchableOpacity>

        <View style={styles.termsText}>
          <Ionicons name="information-circle-outline" size={14} color="#9E9E9E" />
          <Text style={styles.termsTextContent}>By creating an account, you agree to our Terms of Service and Privacy Policy.</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => { if (step === STEPS.PHONE) navigation.goBack(); else if (step === STEPS.OTP) { setStep(STEPS.PHONE); setOtp(''); setError(''); } else setStep(STEPS.OTP); }} disabled={loading}>
            <Ionicons name="chevron-back" size={22} color="#1B5E20" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1B5E20', letterSpacing: 0.2 },
  scrollContent: { flexGrow: 1, paddingBottom: 50 },
  stepIndicatorWrapper: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 },
  stepIndicatorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  stepCircleCompleted: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  stepLabel: { fontSize: 11, color: '#bbb', fontWeight: '600' },
  stepLabelActive: { color: '#2E7D32' },
  stepConnector: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 6, marginBottom: 20, borderRadius: 1 },
  stepConnectorCompleted: { backgroundColor: '#4CAF50' },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  stepHeader: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  stepIconBadge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#C8E6C9' },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 15, color: '#777', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  phoneHighlight: { fontWeight: '700', color: '#2E7D32' },
  form: {},
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  required: { color: '#F44336' },
  optional: { color: '#9E9E9E', fontWeight: '500', fontSize: 13 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 16 },
  textAreaContainer: { alignItems: 'flex-start', paddingTop: 12 },
  inputError: { borderColor: '#F44336', backgroundColor: '#FFF5F5' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 14 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 0 },
  charCount: { fontSize: 11, color: '#BDBDBD', alignSelf: 'flex-end', marginTop: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  errorText: { fontSize: 12, color: '#F44336' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 16, marginTop: 8, gap: 8, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonDisabled: { backgroundColor: '#A5D6A7', shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 15, color: '#666' },
  linkAction: { fontSize: 15, color: '#4CAF50', fontWeight: 'bold' },
  disabledText: { color: '#999' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 24, position: 'relative' },
  otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  otpBoxFilled: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  otpBoxActive: { borderColor: '#4CAF50', borderWidth: 2, backgroundColor: '#fff', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  otpDigit: { fontSize: 22, fontWeight: '700', color: '#1B5E20' },
  otpHiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 14 },
  resendPrompt: { fontSize: 14, color: '#777' },
  resendLink: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  resendLinkDisabled: { color: '#bbb' },
  backLinkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 },
  backLinkText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  imageSection: { marginBottom: 20, alignItems: 'center' },
  imagePicker: { marginTop: 8 },
  profileImagePreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#C8E6C9' },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F8E9', borderWidth: 2, borderColor: '#C8E6C9', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  imagePlaceholderText: { fontSize: 11, color: '#A5D6A7', fontWeight: '600' },
  bannerPicker: { marginTop: 8, width: '100%' },
  bannerImagePreview: { width: '100%', height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#C8E6C9' },
  bannerPlaceholder: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#F1F8E9', borderWidth: 2, borderColor: '#C8E6C9', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 14 },
  dropdownButtonText: { fontSize: 16, color: '#333', flex: 1 },
  dropdownPlaceholder: { color: '#BDBDBD' },
  dropdownBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  dropdownSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: '60%' },
  dropdownHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  dropdownSheetTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownItemActive: { backgroundColor: '#F1F8F3' },
  dropdownItemIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  dropdownItemText: { fontSize: 15, fontWeight: '500', color: '#424242', flex: 1 },
  dropdownItemTextActive: { color: '#1B5E20', fontWeight: '700' },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#F1F8F3', borderColor: '#81C784' },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#2E7D32', fontWeight: '700' },
  termsText: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 16, paddingHorizontal: 4 },
  termsTextContent: { flex: 1, fontSize: 12, color: '#9E9E9E', lineHeight: 17 },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5, minWidth: 200 },
  loadingText: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'center' },
});

export default VendorSignUpScreen;