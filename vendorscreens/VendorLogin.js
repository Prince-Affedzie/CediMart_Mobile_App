// src/screens/auth/VendorLoginScreen.js
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
import { useAuth } from '../context/AuthContext';
import { getOTP, verifyOTP } from '../apis/authApi';

const BrandLogo = require('../assets/cedimart_logo.png');

const STEPS = {
  PHONE: 0,
  OTP: 1,
};

const LoadingOverlay = ({ visible, message = 'Please wait...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

const OTPInput = ({ value, onChange, editable }) => {
  const inputRef = useRef(null);
  const digits = value.padEnd(6, ' ').split('');

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.otpRow}
    >
      {digits.map((digit, i) => (
        <View
          key={i}
          style={[
            styles.otpBox,
            digit.trim() !== '' && styles.otpBoxFilled,
            value.length === i && styles.otpBoxActive,
          ]}
        >
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

const VendorLoginScreen = ({ navigation }) => {
  const { vendor_login } = useAuth();
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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
      const response = await getOTP(trimmed);
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.OTP);
        setResendCooldown(60);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to send verification code. Please try again.'
        );
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Network error. Please check your connection.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const trimmed = phone.trim().replace(/\s/g, '');
      const response = await verifyOTP(trimmed, otp);

      if (response?.data?.success || response?.status === 200) {
        const vendorRes = await vendor_login({ phone: trimmed });
        if (vendorRes.success) {
          setStep(STEPS.PHONE);
          setOtp('');
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDashboard' }],
          });
        } else {
          Alert.alert(
            'Login Failed',
            vendorRes?.error || vendorRes?.message || "You haven't created a vendor account with us."
          );
          setStep(STEPS.PHONE);
          setOtp('');
        }
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Verification failed. Please try again.';
      setError(message);
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
      const response = await getOTP(trimmed);
      if (response?.data?.success || response?.status === 200) {
        setResendCooldown(60);
        Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
      } else {
        Alert.alert('Error', 'Failed to resend code. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={BrandLogo} style={styles.brandLogo} resizeMode="contain" />
         
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your vendor store</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Animated.View
            style={[
              styles.inputContainer,
              error && styles.inputError,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#BDBDBD"
              value={phone}
              onChangeText={(text) => {
                setError('');
                setPhone(text.replace(/[^0-9]/g, ''));
              }}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
            />
          </Animated.View>
          {error !== '' && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Login</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        
        <View style={styles.linkRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('VendorSignUp')}
            disabled={loading}
          >
            <Text style={[styles.linkAction, loading && styles.disabledText]}>
              Don't have Vendor Account?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#4CAF50" />
        </View>
        <Text style={styles.stepTitle}>Verify Your Phone</Text>
        <Text style={styles.stepSubtitle}>
          We sent a 6-digit code to{' '}
          <Text style={styles.phoneHighlight}>+233 {phone}</Text>
        </Text>
      </View>

      <OTPInput value={otp} onChange={setOtp} editable={!loading} />
      {error !== '' && (
        <View style={[styles.errorRow, { justifyContent: 'center', marginTop: 10 }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, (loading || otp.length < 6) && styles.primaryButtonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading || otp.length < 6}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
          <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && styles.resendLinkDisabled]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backLinkRow}
        onPress={() => { setStep(STEPS.PHONE); setOtp(''); setError(''); }}
        disabled={loading}
      >
        <Ionicons name="chevron-back" size={16} color="#4CAF50" />
        <Text style={styles.backLinkText}>Change phone number</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === STEPS.PHONE) navigation.goBack();
              else { setStep(STEPS.PHONE); setOtp(''); setError(''); }
            }}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={22} color="#1B5E20" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Vendor Sign In</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === STEPS.PHONE && renderPhoneStep()}
          {step === STEPS.OTP && renderOTPStep()}
        </ScrollView>

        <LoadingOverlay
          visible={loading}
          message={
            step === STEPS.PHONE
              ? 'Sending verification code...'
              : 'Verifying your phone...'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: 60,
    height: 60,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 14,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#666',
  },
  linkAction: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  stepIconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#2E7D32',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24,
    position: 'relative',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  otpBoxActive: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 14,
  },
  resendPrompt: {
    fontSize: 14,
    color: '#777',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  resendLinkDisabled: {
    color: '#bbb',
  },
  backLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  backLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default VendorLoginScreen;