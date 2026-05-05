// src/screens/auth/WelcomeScreen.js
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
const BrandLogo = require('../assets/cedimart_logo.png');

const WelcomeScreen = ({ navigation }) => {
  const handleLogin = useCallback(() => {
    navigation.navigate('Auth', { screen: 'GuestHome' });
  }, [navigation]);

  const handleSignUp = useCallback(() => {
    navigation.navigate('Auth', { screen: 'SignUp' });
  }, [navigation]);

  const handleSkip = useCallback(() => {
    navigation.replace('Auth');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Image */}
      <Image
        source={{ uri: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1774370636/try1_bo0pm4.jpg' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Gradient Overlays - creates nice depth without extra libraries */}
      <View style={styles.overlay} />
      <View style={styles.accentOverlay} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Brand Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={BrandLogo}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Fresh Groceries</Text>
        <Text style={styles.subtitle}>Delivered Fast & Reliable</Text>

        <Text style={styles.description}>
          Get farm-fresh vegetables, fruits, and quality produce from trusted local farms — right to your doorstep in hours.
        </Text>
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Browse Products And Vendors</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}
           onPress={() => navigation.navigate('PrivacyPolicy')}
          >Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  // Gradient-like overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  accentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 175, 80, 0.20)', // soft green tint matching your brand
  },

  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 30,
  },
  skipText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 4,
  },

  content: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  logoContainer: {
    marginBottom: 28,
  },
  brandLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,           // makes it circular if your logo is square
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },

  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.95,
  },
  description: {
    fontSize: 16.5,
    color: 'rgba(255,255,255,0.90)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '88%',
  },

  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 42 : 32,
    left: 24,
    right: 24,
  },

  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 999,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  loginButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  loginButtonText: {
    color: '#1F2A37',
    fontSize: 16.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  terms: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  termsLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default WelcomeScreen;