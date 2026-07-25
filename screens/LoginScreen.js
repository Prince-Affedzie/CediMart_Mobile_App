// src/screens/auth/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';

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

// ─── Loading Overlay ───────────────────────────────────────────────────────
const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    if (visible) {
      Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh" size={40} color={C.brand} />
            </Animated.View>
          </View>
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login: authLogin, google_login, signUpByApple } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const vendorPulseAnim = useRef(new Animated.Value(1)).current;
  const vendorArrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({ webClientId: '34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com' });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(vendorPulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
      Animated.timing(vendorPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(vendorArrowAnim, { toValue: -8, duration: 600, useNativeDriver: true }),
      Animated.timing(vendorArrowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10,15}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isLoading = loading || googleLoading || appleLoading;

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setGoogleLoading(true);
    let navigatedAway = false;
    try {
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); await new Promise(resolve => setTimeout(resolve, 300)); } catch (signOutError) { console.log('Sign out check (non-critical):', signOutError); }
      const res = await GoogleSignin.signIn();
      const idToken = res?.data?.idToken || res?.idToken;
      if (!idToken) throw new Error('No ID token received from Google. Please try again.');
      const response = await google_login({ token: idToken });
      if (response?.success) {
        navigatedAway = true;
        setGoogleLoading(false);
        navigation.navigate('MainTabs');
        Alert.alert('Welcome to CediMart!', `Welcome back! 🎉`, [{ text: 'Continue' }]);
      } else {
        Alert.alert('Login Failed', response?.error || response?.message || "Login failed. Please check your internet connectivity or ensure you have created an account.");
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED: console.log('User cancelled Google Sign-In flow'); break;
        case statusCodes.IN_PROGRESS: Alert.alert('Google Sign-In In Progress', 'A sign-in operation is already running.'); break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE: Alert.alert('Google Play Services Not Available', 'Google Play Services are not available or outdated. Please update.'); break;
        default: Alert.alert('Google Sign-In Failed', error.message || 'An error occurred during Google Sign-In. Please try again.');
      }
    } finally { if (!navigatedAway) setGoogleLoading(false); }
  };

  const handleAppleLogin = async () => {
    if (isLoading) return;
    setAppleLoading(true);
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) { Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.'); setAppleLoading(false); return; }
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      const { identityToken, email, fullName, user: appleUserId } = credential;
      if (!identityToken) throw new Error('No identity token received from Apple');
      const response = await signUpByApple({ token: identityToken, appleUserId, email: email || undefined, firstName: fullName?.givenName || "", lastName: fullName?.familyName || "" });
      if (response?.success) { setAppleLoading(false); navigation.navigate('MainTabs'); }
      else { Alert.alert('Sign In Failed', response.message || 'We could not sign you in.'); }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') console.log('User cancelled the flow');
      else { console.error('Apple Login Error:', error); Alert.alert('Apple Login Failed', error.message || 'An unexpected error occurred.'); }
    } finally { setAppleLoading(false); }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await authLogin({ phone: formData.phone.trim(), password: formData.password });
      if (response?.success) { setTimeout(() => { Alert.alert('Welcome to CediMart!', `Welcome back! 🎉`, [{ text: 'Continue' }]); }, 100); }
      else { Alert.alert('Login Failed', response?.error || response?.message || "Issues maybe Internet connectivity or you haven't created an account with Us."); }
    } catch (error) { console.error('Login error:', error); Alert.alert('Login Failed', "An unexpected error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const handleInputChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' })); };
  const handleForgotPassword = () => navigation.navigate('ForgotPassword');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={BrandLogo} style={styles.brandLogo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue</Text>
          </View>

          {/* ─── VENDOR LOGIN CARD ─── */}
          <TouchableOpacity style={styles.vendorBannerWrapper} onPress={() => navigation.navigate('VendorLogin')} disabled={isLoading} activeOpacity={0.9}>
            <Animated.View style={[styles.vendorBanner, { transform: [{ scale: vendorPulseAnim }] }]}>
              <View style={styles.vendorBannerAccent} />
              <View style={styles.vendorBannerContent}>
                <View style={styles.vendorTextSection}>
                  <View style={styles.vendorTitleRow}>
                    <Text style={styles.vendorBannerTitle}>Selling on CediMart?</Text>
                    <View style={styles.vendorBadge}><Text style={styles.vendorBadgeText}>VENDOR</Text></View>
                  </View>
                </View>
              </View>
              <View style={styles.vendorCTAContainer}>
                <View style={styles.vendorCTALeft}>
                  <Text style={styles.vendorCTAText}>Login as Vendor Here</Text>
                  <Animated.View style={{ transform: [{ translateX: vendorArrowAnim }] }}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Animated.View>
                </View>
                <View style={styles.vendorCTARight}><Text style={styles.vendorCTASubtext}>It's free!</Text></View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}>For Buyers</Text><View style={styles.divider} /></View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialButton, googleLoading && styles.socialButtonDisabled]} onPress={handleGoogleLogin} disabled={isLoading} activeOpacity={0.7}>
              {googleLoading ? (
                <View style={styles.socialButtonLoading}><ActivityIndicator size="small" color="#DB4437" /><Text style={[styles.socialButtonText, { marginLeft: 8 }]}>Connecting...</Text></View>
              ) : (
                <><Image source={GoogleLogo} style={styles.googleLogo} /><Text style={styles.socialButtonText}>Continue with Google</Text></>
              )}
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={[styles.socialButton, styles.appleButton, appleLoading && styles.socialButtonDisabled]} onPress={handleAppleLogin} disabled={isLoading} activeOpacity={0.7}>
                {appleLoading ? (
                  <View style={styles.socialButtonLoading}><ActivityIndicator size="small" color="#FFFFFF" /><Text style={[styles.socialButtonText, styles.appleButtonText, { marginLeft: 8 }]}>Connecting...</Text></View>
                ) : (
                  <><Ionicons name="logo-apple" size={22} color="#FFFFFF" style={styles.appleIcon} /><Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text></>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}>OR</Text><View style={styles.divider} /></View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your phone number" value={formData.phone} onChangeText={(text) => handleInputChange('phone', text.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" maxLength={15} editable={!isLoading} autoCapitalize="none" />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}><Text style={styles.label}>Password</Text><TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}><Text style={[styles.forgotPassword, isLoading && styles.disabledText]}>Forgot Password?</Text></TouchableOpacity></View>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.passwordInput]} placeholder="Enter your password" value={formData.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={!showPassword} editable={!isLoading} autoCapitalize="none" onSubmitEditing={handleLogin} returnKeyType="go" />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} disabled={isLoading}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isLoading ? "#999" : "#666"} /></TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.rememberContainer} disabled={isLoading}>
              <View style={[styles.checkbox, isLoading && styles.checkboxDisabled]}><Ionicons name="checkmark" size={16} color="#FFFFFF" /></View>
              <Text style={[styles.rememberText, isLoading && styles.disabledText]}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              {loading ? (
                <View style={styles.buttonLoadingContent}><ActivityIndicator size="small" color="#FFFFFF" /><Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Signing In...</Text></View>
              ) : (
                <><Text style={styles.loginButtonText}>Sign In as Buyer</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></>
              )}
            </TouchableOpacity>

            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupLinkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLoading}><Text style={[styles.signupLink, isLoading && styles.disabledText]}>Sign Up</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <LoadingOverlay visible={isLoading} message={googleLoading ? "Signing in with Google..." : appleLoading ? "Signing in with Apple..." : loading ? "Logging in..." : "Please wait..."} />
      </Animated.View>
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
  title: { fontSize: 32, fontWeight: 'bold', color: C.brandD, marginBottom: 8 },
  subtitle: { fontSize: 16, color: C.t2, textAlign: 'center' },

  // Vendor Banner
  vendorBannerWrapper: { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, shadowColor: C.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
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
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotPassword: { fontSize: 14, color: C.brand, fontWeight: '600' },
  disabledText: { color: '#999' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray100, borderRadius: 12, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 16 },
  inputError: { borderColor: C.danger, backgroundColor: C.dangerBg },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 14 },
  passwordInput: { paddingRight: 40 },
  eyeButton: { position: 'absolute', right: 16, padding: 8 },
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, marginLeft: 4 },
  googleLogo: { width: 20, height: 20, marginRight: 12 },
  rememberContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 4, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxDisabled: { backgroundColor: C.brandBorder },
  rememberText: { fontSize: 14, color: '#666' },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.brand, borderRadius: 12, paddingVertical: 16, marginBottom: 14 },
  loginButtonDisabled: { backgroundColor: C.brandBorder },
  buttonLoadingContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: C.gray200 },
  dividerText: { paddingHorizontal: 16, color: '#666', fontSize: 14 },
  socialContainer: { paddingHorizontal: 20, marginBottom: 24 },
  socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: C.gray200, marginBottom: 12 },
  socialButtonDisabled: { backgroundColor: C.gray100, borderColor: C.gray200 },
  socialButtonLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  appleButton: { backgroundColor: '#000000', borderColor: '#000000' },
  appleButtonText: { color: '#FFFFFF' },
  appleIcon: { marginRight: 12 },
  signupLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16, paddingBottom: 8 },
  signupLinkText: { fontSize: 16, color: '#666' },
  signupLink: { fontSize: 16, color: C.brand, fontWeight: 'bold' },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { backgroundColor: 'white', padding: 30, borderRadius: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, minWidth: 200 },
  loadingSpinner: { marginBottom: 15 },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
});

export default LoginScreen;