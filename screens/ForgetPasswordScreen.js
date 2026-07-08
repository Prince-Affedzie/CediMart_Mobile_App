// src/screens/auth/ForgotPasswordScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOTP, verifyOTP, resetPassword } from '../apis/authApi'; // adjust path as needed

// ─── Step Config ────────────────────────────────────────────────────────────
const STEPS = {
  PHONE: 0,
  OTP: 1,
  NEW_PASSWORD: 2,
  SUCCESS: 3,
};

// ─── Loading Overlay ─────────────────────────────────────────────────────────
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

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { icon: 'call-outline', label: 'Phone' },
    { icon: 'shield-checkmark-outline', label: 'Verify' },
    { icon: 'lock-closed-outline', label: 'Reset' },
  ];

  return (
    <View style={styles.stepIndicatorContainer}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > index;
        const isActive = currentStep === index;
        return (
          <React.Fragment key={index}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={isActive ? '#fff' : '#bbb'}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isActive || isCompleted) && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  currentStep > index && styles.stepConnectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── OTP Input ───────────────────────────────────────────────────────────────
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

// ─── Password Strength ───────────────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#E0E0E0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: '', color: '#E0E0E0' },
    { label: 'Weak', color: '#F44336' },
    { label: 'Fair', color: '#FF9800' },
    { label: 'Good', color: '#FFC107' },
    { label: 'Strong', color: '#4CAF50' },
  ];
  return { score, ...levels[score] };
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Slide animation for step transitions
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [step]);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Step 0: Send OTP ────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const newErrors = {};
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10,15}$/.test(phone)) newErrors.phone = 'Enter a valid phone number';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await getOTP(phone.trim());
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.OTP);
        setResendCooldown(180);
      } else {
        Alert.alert('Error', response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await verifyOTP(phone.trim(), otp);
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.NEW_PASSWORD);
      } else {
        setErrors({ otp: 'Invalid or expired code. Please try again.' });
      }
    } catch (error) {
      setErrors({ otp: error?.response?.data?.message || 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Reset Password ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    const newErrors = {};
    if (!newPassword) newErrors.newPassword = 'Password is required';
    else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await resetPassword(phone.trim(), newPassword);
      if (response?.data?.success || response?.status === 200) {
        setStep(STEPS.SUCCESS);
        navigation.navigate('Login')
      } else {
        Alert.alert('Error', response?.data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtp('');
    setErrors({});
    setLoading(true);
    try {
      const response = await getOTP(phone.trim());
      if (response?.data?.success || response?.status === 200) {
        setResendCooldown(180);
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

  const passwordStrength = getPasswordStrength(newPassword);

  // ─── Render Steps ────────────────────────────────────────────────────────

  const renderPhoneStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="call-outline" size={28} color="#4CAF50" />
        </View>
        <Text style={styles.stepTitle}>Forgot Password?</Text>
        <Text style={styles.stepSubtitle}>
          No worries! Enter your registered phone number and we'll send you a verification code.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
          <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={(t) => {
              setPhone(t.replace(/[^0-9]/g, ''));
              if (errors.phone) setErrors({});
            }}
            keyboardType="phone-pad"
            maxLength={15}
            editable={!loading}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSendOTP}
          />
        </View>
        {errors.phone && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
            <Text style={styles.errorText}>{errors.phone}</Text>
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
            <Text style={styles.primaryButtonText}>Send Verification Code</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#4CAF50" />
        </View>
        <Text style={styles.stepTitle}>Enter OTP</Text>
        <Text style={styles.stepSubtitle}>
          We sent a 6-digit code to{' '}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>
      </View>

      <OTPInput value={otp} onChange={setOtp} editable={!loading} />
      {errors.otp && (
        <View style={[styles.errorRow, { justifyContent: 'center', marginTop: 10 }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
          <Text style={styles.errorText}>{errors.otp}</Text>
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
            <Text style={styles.primaryButtonText}>Verify Code</Text>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
          <Text style={[styles.resendLink, (resendCooldown > 0 || loading) && styles.resendLinkDisabled]}>
             {resendCooldown > 0 
           ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` 
            : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backLinkRow}
        onPress={() => { setStep(STEPS.PHONE); setOtp(''); setErrors({}); }}
        disabled={loading}
      >
        <Ionicons name="chevron-back" size={16} color="#4CAF50" />
        <Text style={styles.backLinkText}>Change phone number</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPasswordStep = () => (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="lock-closed-outline" size={28} color="#4CAF50" />
        </View>
        <Text style={styles.stepTitle}>New Password</Text>
        <Text style={styles.stepSubtitle}>
          Create a strong password you haven't used before.
        </Text>
      </View>

      {/* New Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              if (errors.newPassword) setErrors((e) => ({ ...e, newPassword: '' }));
            }}
            secureTextEntry={!showNewPassword}
            editable={!loading}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          </View>
        )}

        {/* Strength Bar */}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarTrack}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthSegment,
                    { backgroundColor: i <= passwordStrength.score ? passwordStrength.color : '#E0E0E0' },
                  ]}
                />
              ))}
            </View>
            {passwordStrength.label ? (
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            ) : null}
          </View>
        )}
        {newPassword.length > 0 && (
          <View style={styles.passwordHints}>
            {[
              { rule: newPassword.length >= 8, text: 'At least 8 characters' },
              { rule: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
              { rule: /[0-9]/.test(newPassword), text: 'One number' },
              { rule: /[^A-Za-z0-9]/.test(newPassword), text: 'One special character' },
            ].map((hint, i) => (
              <View key={i} style={styles.hintRow}>
                <Ionicons
                  name={hint.rule ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={hint.rule ? '#4CAF50' : '#bbb'}
                />
                <Text style={[styles.hintText, hint.rule && styles.hintTextMet]}>
                  {hint.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: '' }));
            }}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
            autoCapitalize="none"
            onSubmitEditing={handleResetPassword}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          </View>
        )}
        {confirmPassword.length > 0 && newPassword === confirmPassword && (
          <View style={[styles.errorRow, { marginTop: 6 }]}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={[styles.errorText, { color: '#4CAF50' }]}>Passwords match</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Reset Password</Text>
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSuccessStep = () => (
    <Animated.View style={[styles.successContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.successIconRing}>
        <View style={styles.successIconInner}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
      </View>
      <Text style={styles.successTitle}>Password Reset!</Text>
      <Text style={styles.successSubtitle}>
        Your password has been updated successfully. You can now sign in with your new password.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Back to Sign In</Text>
        <Ionicons name="log-in-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === STEPS.PHONE || step === STEPS.SUCCESS) navigation.goBack();
            else setStep((s) => s - 1);
          }}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={22} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator (only for first 3 steps) */}
        {step < STEPS.SUCCESS && (
          <View style={styles.stepIndicatorWrapper}>
            <StepIndicator currentStep={step} />
          </View>
        )}

        <View style={styles.content}>
          {step === STEPS.PHONE && renderPhoneStep()}
          {step === STEPS.OTP && renderOTPStep()}
          {step === STEPS.NEW_PASSWORD && renderPasswordStep()}
          {step === STEPS.SUCCESS && renderSuccessStep()}
        </View>
      </ScrollView>

      <LoadingOverlay
        visible={loading}
        message={
          step === STEPS.PHONE ? 'Sending verification code...' :
          step === STEPS.OTP ? 'Verifying code...' :
          'Resetting your password...'
        }
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
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
    paddingBottom: 50,
  },
  stepIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  stepLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#2E7D32',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
    marginBottom: 20,
    borderRadius: 1,
  },
  stepConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
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
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
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
    marginTop: 8,
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
  // OTP
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
    marginTop: 14,
    gap: 2,
  },
  backLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  // Password strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  strengthBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },
  passwordHints: {
    marginTop: 10,
    gap: 5,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#bbb',
  },
  hintTextMet: {
    color: '#4CAF50',
  },
  // Success
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  successIconRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 3,
    borderColor: '#C8E6C9',
  },
  successIconInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  // Loading
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

export default ForgotPasswordScreen;