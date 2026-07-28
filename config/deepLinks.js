// src/config/deepLinks.js
import { Platform } from 'react-native';

export const DEEP_LINK_PREFIXES = [
  'cedimart://',
  'https://cedi-mart-web.vercel.app',
  'https://www.cedi-mart-web.vercel.app',
];

export const DEEP_LINK_CONFIG = {
  screens: {
    // Auth screens
    Login: 'login',
    SignUp: 'signup',
    VendorLogin: 'vendor-login',
    VendorSignUp: 'vendor-signup',
    
    // Product screens
    ProductDetail: 'product/:productId',
    GuestProductDetail: 'g/product/:productId',
    
    // ⭐ NEW: Referral product detail — with referral code in the URL
   //ProductDetail: 'p/:productId',       // cedimart://p/PRODUCT_ID?ref=CODE
    
    // Vendor screens
    VendorDetail: 'vendor/:vendorId',
    
    // Tag screens
    TagProducts: 'tag/:tag',
    
    // ⭐ NEW: Rewards wallet screen
    RewardsWallet: 'rewards',
    
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

// ── Helper functions ───────────────────────────────────────────────────────

export const getDeepLink = (path) => `cedimart://${path}`;

export const getWebLink = (path) => `https://cedi-mart-web.vercel.app/${path}`;

export const getProductLink = (productId, useWebLink = true) => {
  const path = `product/${productId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

export const getGuestProductLink = (productId, useWebLink = true) => {
  const path = `g/product/${productId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};


export const getReferralProductLink = (productId, referralCode, useWebLink = true) => {
  const path = `product/${productId}?ref=${referralCode}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

export const getVendorLink = (vendorId, useWebLink = true) => {
  const path = `vendor/${vendorId}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

export const getTagLink = (tag, useWebLink = true) => {
  const path = `tag/${tag}`;
  return useWebLink ? getWebLink(path) : getDeepLink(path);
};

export const getAppStoreLink = () => ({
  ios: 'https://apps.apple.com/us/app/cedimart/id6762318566',
  android: 'https://play.google.com/store/apps/details?id=com.freshyfood.factory',
});