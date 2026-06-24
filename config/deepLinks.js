// src/config/deepLinks.js
import { Platform } from 'react-native';

export const DEEP_LINK_PREFIXES = [
  'cedimart://',
  'https://freshy-food-frontend.vercel.app',
  'https://www.freshy-food-frontend.vercel.app',
];

export const DEEP_LINK_CONFIG = {
  screens: {
    // Auth screens
    Login: 'login',
    SignUp: 'signup',
    VendorLogin: 'vendor-login',
    VendorSignUp: 'vendor-signup',
    
    // Product screens - DIFFERENT PATTERNS to avoid conflicts
    ProductDetail: 'product/:productId',        // For authenticated users
    GuestProductDetail: 'g/product/:productId',  // For guest/non-authenticated users
    
    // Vendor screens
    VendorDetail: 'vendor/:vendorId',
    
    // Tag screens
    TagProducts: 'tag/:tag',
    
    // Main tabs
    MainTabs: {
      screens: {
        Home: 'home',
        Products: 'products',
        Cart: 'cart',
        Profile: 'profile',
      },
    },
  },
};

// Helper functions for generating links
export const getDeepLink = (path) => {
  return `cedimart://${path}`;
};

export const getWebLink = (path) => {
  return `https://freshy-food-frontend.vercel.app/${path}`;
};

/**
 * Get product link for authenticated users
 */
export const getProductLink = (productId, useWebLink = true) => {
  const path = `product/${productId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

/**
 * Get product link for guest/non-authenticated users
 */
export const getGuestProductLink = (productId, useWebLink = true) => {
  const path = `g/product/${productId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

/**
 * Get vendor profile link
 */
export const getVendorLink = (vendorId, useWebLink = true) => {
  const path = `vendor/${vendorId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

/**
 * Get tag products link
 */
export const getTagLink = (tag, useWebLink = true) => {
  const path = `tag/${tag}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

/**
 * Get app store download link
 */
export const getAppStoreLink = () => {
  return Platform.select({
    ios: 'https://apps.apple.com/us/app/cedimart/id6762318566',
    android: 'https://play.google.com/store/apps/details?id=com.freshyfood.factory',
  });
};