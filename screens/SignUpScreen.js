// src/screens/auth/SignUpScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, KeyboardAvoidingView,
  Platform, Animated, Easing, Dimensions, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SignUp } from '../apis/userApi';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';
import FullScreenLoader from '../components/FullScreenLoader';
import usePushNotifications from "../hooks/usePushNotification";

const GoogleLogo = require('../assets/Google-logo.png');
const BrandLogo = require('../assets/cedimart_logo.png');

const { width } = Dimensions.get('window');

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
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

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', confirmPassword: '' });
  const { expoPushToken, syncTokenWithBackend } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login: authLogin, google_signUp, signUpByApple } = useAuth();

  const scrollViewRef = useRef(null);
  const buttonRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const vendorPulseAnim = useRef(new Animated.Value(1)).current;
  const vendorArrowAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({ webClientId: '34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com' });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(vendorPulseAnim, { toValue: 1.02, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(vendorPulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(vendorArrowAnim, { toValue: -8, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(vendorArrowAnim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (loading || googleLoading || appleLoading) {
      Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
    } else { spinValue.setValue(0); }
  }, [loading, googleLoading, appleLoading]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    else if (formData.firstName.length < 2) newErrors.firstName = 'First name must be at least 2 characters';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    else if (formData.lastName.length < 2) newErrors.lastName = 'Last name must be at least 2 characters';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10,15}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isLoading = loading || googleLoading || appleLoading;

  const handleGoogleSignUp = async () => {
    if (isLoading) return;
    setGoogleLoading(true);
    let navigatedAway = false;
    try {
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (Platform.OS === 'android') { try { await GoogleSignin.signOut(); await new Promise(resolve => setTimeout(resolve, 300)); } catch (signOutError) { console.log('Sign out check (non-critical):', signOutError); } }
      const res = await GoogleSignin.signIn();
      const idToken = res?.data?.idToken || res?.idToken;
      if (!idToken) throw new Error('No ID token received from Google. Please try again.');
      const response = await google_signUp({ token: idToken });
      if (response?.success) {
        const userId = response.data?.user?._id;
        if (userId && expoPushToken) { try { await syncTokenWithBackend(userId, expoPushToken); } catch (pushError) { console.log('Push token sync failed (non-critical):', pushError); } }
        navigatedAway = true;
        setGoogleLoading(false);
        navigation.navigate('MainTabs');
        setTimeout(() => { Alert.alert('Welcome to CediMart! 🎉', 'Your account has been created successfully.', [{ text: 'Continue' }]); }, 500);
      } else { Alert.alert('Registration Failed', response?.error || response?.message || 'Please try again.'); }
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) console.log('User cancelled Google Sign-In');
      else if (error.code === statusCodes.IN_PROGRESS) Alert.alert('Sign-In In Progress', 'Please wait for the current sign-in to complete.');
      else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) Alert.alert('Google Play Services', 'Google Play Services are not available or need to be updated.');
      else Alert.alert('Google Sign-Up Failed', error.message || 'An error occurred. Please try again.');
    } finally { if (!navigatedAway) setGoogleLoading(false); }
  };

  const handleAppleSignUp = async () => {
    if (isLoading) return;
    setAppleLoading(true);
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) { Alert.alert('Not Available', 'Apple Sign-In is only available on iOS.'); setAppleLoading(false); return; }
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      const { identityToken, email, fullName, user: appleUserId } = credential;
      if (!identityToken) throw new Error('No identity token received.');
      const response = await signUpByApple({ token: identityToken, appleUserId, email: email || undefined, firstName: fullName?.givenName || "", lastName: fullName?.familyName || "" });
      if (response?.success) {
        const userId = response.data.user?._id;
        await syncTokenWithBackend(userId, expoPushToken);
        setAppleLoading(false);
        setTimeout(() => { Alert.alert('Welcome!', `Successfully signed in with Apple 🎉`); navigation.navigate('MainTabs'); }, 500);
      } else { Alert.alert('Sign In Failed', response.message || 'Check your connection.'); }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') console.log('User cancelled Apple Sign-In');
      else Alert.alert('Apple Auth Error', error.message);
    } finally { setAppleLoading(false); }
  };

  const handleSignUp = async () => {
    if (isLoading) return;
    Keyboard.dismiss();
    setTimeout(async () => {
      if (!validateForm()) return;
      setLoading(true);
      try {
        const response = await SignUp({ firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), phone: formData.phone.trim(), password: formData.password });
        if (response.status === 200 || response.success) {
          const loginResponse = await authLogin({ phone: formData.phone.trim(), password: formData.password });
          if (loginResponse.success) {
            setTimeout(() => { navigation.navigate('MainTabs'); Alert.alert('Welcome to CediMart!', `Welcome! Your account has been created successfully 🎉`, [{ text: 'Continue' }]); }, 100);
          } else { Alert.alert('Login Failed', 'Account created but auto-login failed. Please login manually.'); }
        } else { Alert.alert('Registration Failed', response.error || response.message || 'Registration failed. Please try again.'); }
      } catch (error) { console.error('Signup error:', error); Alert.alert('Account creation Failed', 'An unexpected error occurred. Please try again.'); }
      finally { setLoading(false); }
    }, 50);
  };

  const handleInputChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' })); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}><Image source={BrandLogo} style={styles.brandLogo} resizeMode="contain" /></View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our community of buyers and sellers</Text>
          </View>

          {/* Vendor Sign Up Card */}
          <TouchableOpacity style={styles.vendorBannerWrapper} onPress={() => navigation.navigate('VendorSignUp')} disabled={isLoading} activeOpacity={0.9}>
            <Animated.View style={[styles.vendorBanner, { transform: [{ scale: vendorPulseAnim }] }]}>
              <View style={styles.vendorBannerAccent} />
              <View style={styles.vendorBannerContent}>
                <View style={styles.vendorTextSection}>
                  <View style={styles.vendorTitleRow}>
                    <Text style={styles.vendorBannerTitle}>Wants to sell on CediMart?</Text>
                    <View style={styles.vendorBadge}><Text style={styles.vendorBadgeText}>NEW</Text></View>
                  </View>
                </View>
              </View>
              <View style={styles.vendorCTAContainer}>
                <View style={styles.vendorCTALeft}>
                  <Text style={styles.vendorCTAText}>Create Vendor Account Here</Text>
                  <Animated.View style={{ transform: [{ translateX: vendorArrowAnim }] }}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></Animated.View>
                </View>
                <View style={styles.vendorCTARight}><Text style={styles.vendorCTASubtext}>It's free!</Text></View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}> For Buyers </Text><View style={styles.divider} /></View>

          {/* Social Sign Up */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialButton, googleLoading && styles.socialButtonDisabled]} onPress={handleGoogleSignUp} disabled={isLoading} activeOpacity={0.7}>
              {googleLoading ? (
                <View style={styles.socialButtonLoading}><Animated.View style={{ transform: [{ rotate: spin }] }}><Ionicons name="refresh" size={20} color="#DB4437" /></Animated.View><Text style={styles.socialButtonText}>Connecting...</Text></View>
              ) : (<><Image source={GoogleLogo} style={styles.googleLogo} /><Text style={styles.socialButtonText}>Continue with Google</Text></>)}
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={[styles.socialButton, styles.appleButton, appleLoading && styles.socialButtonDisabled]} onPress={handleAppleSignUp} disabled={isLoading} activeOpacity={0.7}>
                {appleLoading ? (
                  <View style={styles.socialButtonLoading}><Animated.View style={{ transform: [{ rotate: spin }] }}><Ionicons name="refresh" size={20} color="#FFFFFF" /></Animated.View><Text style={[styles.socialButtonText, styles.appleButtonText]}>Connecting...</Text></View>
                ) : (<><Ionicons name="logo-apple" size={22} color="#FFFFFF" style={styles.appleIcon} /><Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text></>)}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}> OR </Text><View style={styles.divider} /></View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={[styles.nameInputGroup, { marginRight: 8 }]}>
                <Text style={styles.label}>First Name</Text>
                <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="John" value={formData.firstName} onChangeText={(text) => handleInputChange('firstName', text)} autoCapitalize="words" editable={!isLoading} maxLength={30} returnKeyType="next" blurOnSubmit={false} />
                </View>
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={[styles.nameInputGroup, { marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Doe" value={formData.lastName} onChangeText={(text) => handleInputChange('lastName', text)} autoCapitalize="words" editable={!isLoading} maxLength={30} returnKeyType="next" />
                </View>
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 0541234567" value={formData.phone} onChangeText={(text) => handleInputChange('phone', text.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" maxLength={15} editable={!isLoading} returnKeyType="next" blurOnSubmit={false} />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.passwordInput]} placeholder="••••••••" value={formData.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={!showPassword} editable={!isLoading} returnKeyType="next" blurOnSubmit={false} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} disabled={isLoading}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isLoading ? "#999" : "#666"} /></TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <View style={styles.passwordHintContainer}><Ionicons name="information-circle-outline" size={14} color="#666" /><Text style={styles.hintText}>Must be at least 6 characters long</Text></View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.passwordInput]} placeholder="••••••••" value={formData.confirmPassword} onChangeText={(text) => handleInputChange('confirmPassword', text)} secureTextEntry={!showConfirmPassword} editable={!isLoading} returnKeyType="done" onSubmitEditing={() => { if (!isLoading) handleSignUp(); }} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}><Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isLoading ? "#999" : "#666"} /></TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity style={styles.termsContainer} disabled={isLoading} activeOpacity={0.7}>
              <View style={styles.checkboxContainer}><View style={[styles.checkbox, isLoading && styles.checkboxDisabled]}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View></View>
              <Text style={styles.termsText}>I agree to the <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Text> and <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity ref={buttonRef} style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]} onPress={handleSignUp} disabled={isLoading} activeOpacity={0.8}>
              {loading ? (
                <View style={styles.buttonLoadingContent}><Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}><Ionicons name="refresh" size={20} color="#FFFFFF" /></Animated.View><Text style={styles.signUpButtonText}>Creating Account...</Text></View>
              ) : (<><Text style={styles.signUpButtonText}>Create Buyer Account</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></>)}
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}><Text style={[styles.loginLink, isLoading && styles.disabledText]}>Sign In</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <FullScreenLoader
        visible={isLoading} loadingType="auth"
        loadingText={googleLoading ? "Creating account with Google..." : appleLoading ? "Creating account with Apple..." : loading ? "Creating your account..." : "Please wait..."}
        subText={googleLoading ? "Setting up your CediMart account..." : appleLoading ? "Setting up your CediMart account..." : loading ? "We're creating your account..." : "Processing your request..."}
        icon={googleLoading ? "logo-google" : appleLoading ? "logo-apple" : "person-add"}
        iconColor={googleLoading ? "#DB4437" : appleLoading ? "#000000" : C.brand}
        backgroundColor="rgba(255, 255, 255, 0.98)"
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  animatedContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20, alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  brandLogo: { width: 60, height: 60, marginRight: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: C.brandD, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: C.t2, textAlign: 'center' },

  // Vendor Banner
  vendorBannerWrapper: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, shadowColor: C.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  vendorBanner: { borderRadius: 20, overflow: 'hidden', backgroundColor: C.white, borderWidth: 2, borderColor: C.brand },
  vendorBannerAccent: { height: 4, backgroundColor: C.brand },
  vendorBannerContent: { flexDirection: 'row', padding: 16, gap: 14 },
  vendorTextSection: { flex: 1 },
  vendorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  vendorBannerTitle: { fontSize: 17, fontWeight: '800', color: C.t1 },
  vendorBadge: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  vendorBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  vendorCTAContainer: { backgroundColor: C.brand, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vendorCTALeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vendorCTAText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  vendorCTASubtext: { color: '#99F6E4', fontSize: 13, fontWeight: '700' },
  vendorCTARight: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },

  form: { paddingHorizontal: 20 },
  nameRow: { flexDirection: 'row', marginBottom: 20 },
  nameInputGroup: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray100, borderRadius: 12, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 16 },
  inputError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 14 },
  passwordInput: { paddingRight: 40 },
  eyeButton: { position: 'absolute', right: 16, padding: 8 },
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, marginLeft: 4 },
  passwordHintContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 },
  hintText: { fontSize: 12, color: '#666', marginLeft: 6 },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingHorizontal: 4 },
  checkboxContainer: { marginTop: 2, marginRight: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  checkboxDisabled: { backgroundColor: C.brandBorder },
  termsText: { fontSize: 13, color: '#666', lineHeight: 18, flex: 1 },
  linkText: { color: C.brand, fontWeight: '600' },
  signUpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.brand, borderRadius: 12, paddingVertical: 16, marginBottom: 24, shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  signUpButtonDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0.1 },
  signUpButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  buttonLoadingContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: C.gray200 },
  dividerText: { paddingHorizontal: 12, color: '#666', fontSize: 13, fontWeight: '500', backgroundColor: C.white },
  socialContainer: { paddingHorizontal: 20, marginBottom: 20 },
  socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: C.gray200, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  googleLogo: { width: 20, height: 20, marginRight: 12 },
  socialButtonDisabled: { backgroundColor: C.gray100, borderColor: C.gray200 },
  socialButtonLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  appleButton: { backgroundColor: '#000000', borderColor: '#000000', marginTop: 12 },
  appleButtonText: { color: '#FFFFFF' },
  appleIcon: { marginRight: 12 },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginLinkText: { fontSize: 16, color: '#666' },
  loginLink: { fontSize: 16, color: C.brand, fontWeight: 'bold' },
  disabledText: { color: '#999' },
});

export default SignUpScreen;