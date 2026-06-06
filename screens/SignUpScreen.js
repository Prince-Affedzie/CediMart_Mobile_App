// src/screens/auth/SignUpScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SignUp, } from '../apis/userApi';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';
import FullScreenLoader from '../components/FullScreenLoader';
import usePushNotifications from "../hooks/usePushNotification"; 

const GoogleLogo = require('../assets/Google-logo.png');
const BrandLogo = require('../assets/cedimart_logo.png');

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const { expoPushToken, syncTokenWithBackend } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login: authLogin, google_signUp,signUpByApple } = useAuth();
  
  // Refs
  const scrollViewRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Spinner animation ref
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com'
    });
  }, []);

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    // Start spinning animation when loading
    if (loading || googleLoading || appleLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading, googleLoading, appleLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignUp = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setGoogleLoading(true);
    
    try {
      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Sign out first to clear any previous session
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('Sign out error:', signOutError);
      }

      // Sign in with Google
      const res = await GoogleSignin.signIn();
      const idToken = res.data.idToken;
      
      const response = await google_signUp({ token: idToken });

      if (response.success) {
        const userId = response.data.user?._id;
        const tokenSent = await syncTokenWithBackend(userId, expoPushToken);
        setTimeout(() => {
          navigation.navigate('MainTabs');
          Alert.alert(
            'Welcome to CediMart!',
            `Welcome! Your account has been created successfully 🎉`,
            [{ text: 'Continue' }]
          );
        }, 100);
      } else {
        const errorMessage = response.error || 
                            response.message || 
                            'Registration failed. Please try again.';
        Alert.alert('Registration Failed', errorMessage);
      }
      
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          Alert.alert('Google Sign-In Cancelled', 'You cancelled the sign-in process.');
          break;
        case statusCodes.IN_PROGRESS:
          Alert.alert('Google Sign-In In Progress', 'A sign-in operation is already in progress.');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          Alert.alert(
            'Google Play Services Not Available',
            'Google Play Services are not available or outdated. Please update.'
          );
          break;
        default:
          Alert.alert(
            'Google Sign-Up Failed',
            error.message || 'An error occurred during Google Sign-Up. Please try again.'
          );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

 const handleAppleSignUp = async () => {
  if (isLoading) return;
  setAppleLoading(true);

  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS.');
      setAppleLoading(false); // Important to reset here
      return;
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, email, fullName, user: appleUserId } = credential;

    if (!identityToken) {
      throw new Error('No identity token received.');
    }


    const appleAuthData = {
      token: identityToken,
      appleUserId,
      email: email || undefined, 
      firstName: fullName?.givenName || "",
      lastName: fullName?.familyName || "",
    };

    const response = await signUpByApple(appleAuthData);

    if (response?.success) {
      const userId = response.data.user?._id;
      await syncTokenWithBackend(userId, expoPushToken);
      
      setAppleLoading(false);

      setTimeout(() => {
         Alert.alert(
        'Welcome!',
        `Successfully signed in with Apple 🎉`
      );
       navigation.navigate('MainTabs');
       },500)
      
    } else {
      Alert.alert('Sign In Failed', response.message || 'Check your connection.');
    }

  } catch (error) {
    // Correct error code for cancellation is 'ERR_REQUEST_CANCELED'
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // Typically we don't show an alert for a user-initiated cancel
      console.log('User cancelled Apple Sign-In');
    } else {
      Alert.alert('Apple Auth Error', error.message);
    }
  } finally {
    setAppleLoading(false);
  }
};
  const handleSignUp = async () => {
    // Prevent multiple clicks while loading
    if (isLoading) return;
    
    // Dismiss keyboard to prevent any focus issues
    Keyboard.dismiss();
    
    // Small delay to ensure keyboard is dismissed
    setTimeout(async () => {
      if (!validateForm()) return;

      setLoading(true);
      try {
        const signUpData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        };

        const response = await SignUp(signUpData);

        if (response.status === 200 || response.success) {
          // Auto-login after successful signup
          const loginResponse = await authLogin({
            phone: formData.phone.trim(),
            password: formData.password,
          });

          if (loginResponse.success) {
            setTimeout(() => {
              navigation.navigate('MainTabs');
              Alert.alert(
                'Welcome to CediMart!',
                `Welcome! Your account has been created successfully 🎉`,
                [{ text: 'Continue' }]
              );
            }, 100);
          } else {
            Alert.alert('Login Failed', 'Account created but auto-login failed. Please login manually.');
          }
        } else {
          const errorMessage = response.error || 
                              response.message || 
                              'Registration failed. Please try again.';
          Alert.alert('Registration Failed', errorMessage);
        }
      } catch (error) {
        console.error('Signup error:', error);
        Alert.alert('Account creation Failed', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Combined loading state
  const isLoading = loading || googleLoading || appleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Header with Brand Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={BrandLogo}
                style={styles.brandLogo}
                resizeMode="contain"
              />
             
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our community</Text>
          </View>

          {/* Social Sign Up */}
          <View style={styles.socialContainer}>
            {/* Google Button */}
            <TouchableOpacity 
              style={[styles.socialButton, googleLoading && styles.socialButtonDisabled]}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <View style={styles.socialButtonLoading}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="refresh" size={20} color="#DB4437" />
                  </Animated.View>
                  <Text style={styles.socialButtonText}>Connecting...</Text>
                </View>
              ) : (
                <>
                  <Image 
                    source={GoogleLogo}
                    style={styles.googleLogo}
                  />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Sign-In Button - iOS only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton, appleLoading && styles.socialButtonDisabled]}
                onPress={handleAppleSignUp}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <View style={styles.socialButtonLoading}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    </Animated.View>
                    <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                      Connecting...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="#FFFFFF" style={styles.appleIcon} />
                    <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                      Continue with Apple
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Divider with better styling */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.divider} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.nameInputGroup, { marginRight: 8 }]}>
                <Text style={styles.label}>First Name</Text>
                <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    autoCapitalize="words"
                    editable={!isLoading}
                    maxLength={30}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={[styles.nameInputGroup, { marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    autoCapitalize="words"
                    editable={!isLoading}
                    maxLength={30}
                    returnKeyType="next"
                  
                  />
                </View>
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 0541234567"
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!isLoading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isLoading ? "#999" : "#666"}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <View style={styles.passwordHintContainer}>
                <Ionicons name="information-circle-outline" size={14} color="#666" />
                <Text style={styles.hintText}>Must be at least 6 characters long</Text>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (!isLoading) {
                      handleSignUp();
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isLoading ? "#999" : "#666"}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms Agreement */}
            <TouchableOpacity 
              style={styles.termsContainer}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, isLoading && styles.checkboxDisabled]}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.termsText}>
                I agree to the{' '}
                
                <Text 
                  style={styles.linkText}
                  onPress={() => navigation.navigate('TermsOfService')}
                >
                  Terms of Service
                </Text>

                {' '}and{' '}

                <Text 
                  style={styles.linkText}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  Privacy Policy
                </Text>

              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              ref={buttonRef}
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.buttonLoadingContent}>
                  <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  </Animated.View>
                  <Text style={styles.signUpButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')} 
                disabled={isLoading}
              >
                <Text style={[styles.loginLink, isLoading && styles.disabledText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.vendorLinkContainer}
              onPress={() => navigation.navigate('VendorSignUp')} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.vendorLinkContent}>
                <Ionicons name="storefront-outline" size={20} color="#4E342E" />
                <Text style={[styles.vendorLinkText, isLoading && styles.disabledText]}>
                  Are you a vendor? <Text style={styles.vendorLinkBold}>SignUp here</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Full Screen Loader */}
      <FullScreenLoader
        visible={isLoading}
        loadingType="auth"
        loadingText={
          googleLoading ? "Creating account with Google..." : 
          appleLoading ? "Creating account with Apple..." :
          loading ? "Creating your account..." : 
          "Please wait..."
        }
        subText={
          googleLoading ? "Setting up your CediMart account..." : 
          appleLoading ? "Setting up your CediMart account..." :
          loading ? "We're creating your account..." : 
          "Processing your request..."
        }
        icon={
          googleLoading ? "logo-google" : 
          appleLoading ? "logo-apple" : 
          "person-add"
        }
        iconColor={
          googleLoading ? "#DB4437" : 
          appleLoading ? "#000000" : 
          "#4CAF50"
        }
        backgroundColor="rgba(255, 255, 255, 0.98)"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nameInputGroup: {
    flex: 1,
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
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    marginTop: 2,
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDisabled: {
    backgroundColor: '#A5D6A7',
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signUpButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
  },
  socialContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  socialButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    marginTop: 12,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  appleIcon: {
    marginRight: 12,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999',
  },
  benefitsContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  vendorLinkContainer: {
  marginTop: 12,
  marginHorizontal: 20,
  paddingVertical: 14,
  paddingHorizontal: 16,
  backgroundColor: '#FFF8E1',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#FFE082',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
},
vendorLinkContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
vendorLinkText: {
  fontSize: 15,
  color: '#4E342E',
  fontWeight: '500',
},
vendorLinkBold: {
  fontWeight: '700',
  color: '#2E7D32',
  textDecorationLine: 'underline',
},
});

export default SignUpScreen;