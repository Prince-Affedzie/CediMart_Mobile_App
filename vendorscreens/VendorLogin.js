// src/screens/auth/VendorLoginScreen.js
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const BrandLogo = require('../assets/cedimart_logo.png');

const VendorLoginScreen = ({ navigation }) => {
  const { vendor_login } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (trimmed.length < 9) {
      setError('Please enter a valid phone number.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await vendor_login({ phone: trimmed });
      if(res.success){
         setSuccess(true);
        }else(
          Alert.alert('Login Failed', res?.error || res?.message || "Issues maybe Internet connectivity or you haven't created an account with Us.")
        )
    } catch (err) {
      const message = err?.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button – same position as customer login would use */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color="#1B5E20" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header with Brand Logo ── */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={BrandLogo}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>CediMart</Text>
            </View>
            <Text style={styles.title}>Welcome Back, Vendor</Text>
            <Text style={styles.subtitle}>Sign in to your vendor store</Text>
          </View>

          {/* ── Form Card (styled exactly like customer login inputs) ── */}
          <View style={styles.form}>
            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <Animated.View style={[styles.inputContainer, error && styles.inputError, { transform: [{ translateX: shakeAnim }] }]}>
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
                  editable={!loading && !success}
                />
              </Animated.View>
              {error !== '' && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || success}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Signing In...</Text>
                </View>
              ) : success ? (
                <View style={styles.buttonLoadingContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Welcome!</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Bottom Links – same rows as customer login */}
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Not a vendor? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={[styles.linkAction, loading && styles.disabledText]}>
                  Shop as customer
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.linkRow}>
              <TouchableOpacity
                onPress={() => Alert.alert('Info', 'Please contact your market admin to register.')}
                disabled={loading}
              >
                <Text style={[styles.linkAction, loading && styles.disabledText]}>
                  Need help registering?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',      // same as customer login background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  title: {
    fontSize: 32,
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
  countryPrefix: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: '#F1F8E9',
    marginRight: 10,
  },
  countryPrefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 14,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
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
});

export default VendorLoginScreen;