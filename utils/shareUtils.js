// src/utils/shareUtils.js
import { Platform } from 'react-native';
import RNShare from 'react-native-share';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  getProductLink, 
  getGuestProductLink, 
  getReferralProductLink,   // ⭐ NEW
  getVendorLink, 
  getAppStoreLink 
} from '../config/deepLinks';

// ── Helpers ─────────────────────────────────────────────────────────────────

const downloadImage = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    const urlParts = imageUrl.split('?')[0];
    const urlSegments = urlParts.split('/');
    let filename = urlSegments[urlSegments.length - 1];
    if (!filename.includes('.')) filename = `product-image-${Date.now()}.jpg`;
    const filePath = `${FileSystem.cacheDirectory}${filename}`;
    const downloadResult = await FileSystem.downloadAsync(imageUrl, filePath);
    return downloadResult.uri;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
};

const shareWithRNShare = async (options) => {
  try {
    const shareOptions = {
      title: options.title || 'CediMart',
      message: options.message || '',
      url: options.url || '',
      type: options.type || 'text/plain',
      subject: options.subject || options.title || 'CediMart',
      ...(options.urls && { urls: options.urls }),
      ...(options.failOnCancel === false ? { failOnCancel: false } : {}),
    };
    const result = await RNShare.open(shareOptions);
    return { success: true, result };
  } catch (error) {
    if (error.message === 'User did not share') return { success: false, cancelled: true };
    console.error('Share error:', error);
    return { success: false, error };
  }
};

const getStoreLinks = () => {
  const links = getAppStoreLink();
  return `App Store: ${links.ios}\nGoogle Play: ${links.android}`;
};

const buildProductMessage = (product, shareLink, includeDescription = true) => {
  const productName = product.name || 'Product';
  const price = product.price?.toFixed(2) || '0.00';
  let message = `${productName}\nPrice: GH₵ ${price}\n`;
  if (product.discountInfo?.isOnSale) {
    const discountPct = product.discountInfo.discountPercentage || 
      Math.round(((product.discountInfo.originalPrice - product.price) / product.discountInfo.originalPrice) * 100);
    message += `Discount: ${discountPct}% OFF (Original: GH₵ ${product.discountInfo.originalPrice?.toFixed(2)})\n`;
  }
  if (product.condition) message += `Condition: ${product.condition.replace(/-/g, ' ')}\n`;
  if (product.category) message += `Category: ${product.category.replace(/-/g, ' ')}\n`;
  if (product.campus) message += `Campus: ${product.campus}\n`;
  if (product.negotiable) message += `Price: Negotiable\n`;
  if (product.description && includeDescription) {
    const desc = product.description.length > 120 ? product.description.substring(0, 120) + '...' : product.description;
    message += `\nDescription: ${desc}\n`;
  }
  message += `\n――――――――――――――――――\nView on CediMart:\n${shareLink}\n\nDownload the CediMart app for the best student deals!\n${getStoreLinks()}`;
  return message;
};

// ═══════════════════════════════════════════════════════════════════════════
// ⭐ NEW: Recommend & Earn — share with referral code
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Share a product with YOUR referral code to earn commission.
 * This generates a unique link that tracks back to you.
 * 
 * @param {Object} product - The product to share
 * @param {String} referralCode - Your personal referral code from the backend
 * @param {Number} commissionPct - The commission percentage (e.g., 3, 5, 8)
 * @param {Number} estimatedEarning - How much you'll earn if friend buys
 */
export const shareProductForReferral = async (product, referralCode, commissionPct = 3, estimatedEarning = 0) => {
  try {
    const productId = product._id || product.id;
    const shareLink = getReferralProductLink(productId, referralCode, true);
    const productName = product.name || 'Product';
    const price = product.price?.toFixed(2) || '0.00';
    
    // ⭐ Referral-specific message — highlights the "recommended by a friend" aspect
    let message = `💚 Recommended by a friend!\n\n`;
    message += `🛍️ ${productName}\n`;
    message += `💰 GH₵ ${price}\n`;
    
    if (product.condition) {
      message += `✨ ${product.condition.replace(/-/g, ' ')} condition\n`;
    }
    
    if (product.campus) {
      message += `📍 ${product.campus}\n`;
    }
    
    if (product.discountInfo?.isOnSale) {
      const discountPct = product.discountInfo.discountPercentage || 
        Math.round(((product.discountInfo.originalPrice - product.price) / product.discountInfo.originalPrice) * 100);
      message += `🏷️ ${discountPct}% OFF — Was GH₵ ${product.discountInfo.originalPrice?.toFixed(2)}\n`;
    }
    
    if (product.description) {
      const desc = product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description;
      message += `\n📝 ${desc}\n`;
    }
    
    message += `\n――――――――――――――――――\n`;
    message += `🔗 Check it out:\n${shareLink}\n\n`;
    message += `📲 Get the CediMart app for the best campus deals!\n`;
    message += getStoreLinks();
    
    const imageUrl = product.images?.[0] || product.image;
    let localImageUri = null;
    if (imageUrl) localImageUri = await downloadImage(imageUrl);
    
    if (localImageUri) {
      return await shareWithRNShare({
        title: `💚 ${productName} — GH₵ ${price} on CediMart`,
        message: message,
        url: localImageUri,
        type: 'image/jpeg',
        subject: `Check out ${productName} on CediMart`,
      });
    }
    
    return await shareWithRNShare({
      title: `💚 ${productName} — GH₵ ${price} on CediMart`,
      message: message,
      subject: `Check out ${productName} on CediMart`,
    });
    
  } catch (error) {
    console.error('Share for referral error:', error);
    return { success: false, error };
  }
};

/**
 * ⭐ NEW: Get just the referral link (for copying, not full share sheet)
 */
export const getReferralShareLink = (productId, referralCode) => {
  return getReferralProductLink(productId, referralCode, true);
};

/**
 * ⭐ NEW: Build a referral share message for custom sharing (WhatsApp, etc.)
 */
export const buildReferralShareMessage = (product, referralLink) => {
  const productName = product.name || 'Product';
  const price = product.price?.toFixed(2) || '0.00';
  
  let message = `💚 Recommended by a friend!\n\n`;
  message += `🛍️ ${productName}\n`;
  message += `💰 GH₵ ${price}\n`;
  
  if (product.campus) message += `📍 ${product.campus}\n`;
  if (product.condition) message += `✨ ${product.condition.replace(/-/g, ' ')}\n`;
  
  message += `\n🔗 ${referralLink}\n\n`;
  message += `📲 Get CediMart: ${getStoreLinks()}`;
  
  return message;
};

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING SHARE FUNCTIONS (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

export const shareProduct = async (product) => {
  try {
    const productId = product._id || product.id;
    const shareLink = getProductLink(productId, true);
    const productName = product.name || 'Product';
    const price = product.price?.toFixed(2) || '0.00';
    const message = buildProductMessage(product, shareLink);
    const imageUrl = product.images?.[0] || product.image;
    let localImageUri = null;
    if (imageUrl) localImageUri = await downloadImage(imageUrl);
    if (localImageUri) {
      return await shareWithRNShare({ title: `${productName} - GH₵ ${price} on CediMart`, message, url: localImageUri, type: 'image/jpeg', subject: `${productName} - GH₵ ${price} on CediMart` });
    }
    return await shareWithRNShare({ title: `${productName} - GH₵ ${price} on CediMart`, message, subject: `${productName} - GH₵ ${price} on CediMart` });
  } catch (error) { console.error('Share product error:', error); return { success: false, error }; }
};

export const shareGuestProduct = async (product) => {
  try {
    const productId = product._id || product.id;
    const shareLink = getGuestProductLink(productId, true);
    const productName = product.name || 'Product';
    const price = product.price?.toFixed(2) || '0.00';
    const message = buildProductMessage(product, shareLink, true);
    const imageUrl = product.images?.[0] || product.image;
    let localImageUri = null;
    if (imageUrl) localImageUri = await downloadImage(imageUrl);
    if (localImageUri) {
      return await shareWithRNShare({ title: `${productName} - GH₵ ${price} on CediMart`, message, url: localImageUri, type: 'image/jpeg', subject: `${productName} - GH₵ ${price} on CediMart` });
    }
    return await shareWithRNShare({ title: `${productName} - GH₵ ${price} on CediMart`, message, subject: `${productName} - GH₵ ${price} on CediMart` });
  } catch (error) { console.error('Share guest product error:', error); return { success: false, error }; }
};

export const shareVendorProfile = async (vendor) => {
  try {
    const vendorName = vendor.name || vendor.storeName || 'Vendor';
    const vendorId = vendor._id || vendor.id;
    const shareLink = getVendorLink(vendorId, true);
    let message = `🛍️ Check out ${vendorName} on CediMart!\n`;
    if (vendor.bio) { const desc = vendor.bio.length > 80 ? vendor.bio.substring(0, 80) + '...' : vendor.bio; message += `\n${desc}\n`; }
    if (vendor.rating) message += `\n⭐ ${vendor.rating.toFixed(1)} rating\n`;
    if (vendor.totalProducts) message += `📦 ${vendor.totalProducts} products listed\n`;
    message += `\n🔗 ${shareLink}\n\n📲 Download CediMart: ${getStoreLinks()}`;
    const imageUrl = vendor.storeBanner || vendor.profileImage || vendor.image;
    let localImageUri = null;
    if (imageUrl) localImageUri = await downloadImage(imageUrl);
    if (localImageUri) return await shareWithRNShare({ title: `Shop from ${vendorName} on CediMart`, message, url: localImageUri, type: 'image/jpeg', subject: `Shop from ${vendorName} on CediMart` });
    return await shareWithRNShare({ title: `Shop from ${vendorName} on CediMart`, message, subject: `Shop from ${vendorName} on CediMart` });
  } catch (error) { console.error('Share vendor error:', error); return { success: false, error }; }
};

export const shareOwnProduct = async (product, vendorName) => {
  try {
    const productId = product._id || product.id;
    const shareLink = getProductLink(productId, true);
    const productName = product.name || 'Product';
    const price = product.price?.toFixed(2) || '0.00';
    let message = `🛍️ New from ${vendorName || 'My Shop'}!\n\n📦 ${productName}\n💰 GH₵ ${price}\n`;
    if (product.discountInfo?.isOnSale) {
      const discountPct = product.discountInfo.discountPercentage || Math.round(((product.discountInfo.originalPrice - product.price) / product.discountInfo.originalPrice) * 100);
      message += `🏷️ ${discountPct}% OFF! Original: GH₵ ${product.discountInfo.originalPrice?.toFixed(2)}\n`;
    }
    if (product.condition) message += `✨ Condition: ${product.condition.replace(/-/g, ' ')}\n`;
    if (product.description) { const desc = product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description; message += `\n📝 ${desc}\n`; }
    message += `\n👉 Get it on CediMart:\n${shareLink}\n\n#CediMart #StudentDeals #CampusShopping`;
    const imageUrl = product.images?.[0] || product.image;
    let localImageUri = null;
    if (imageUrl) localImageUri = await downloadImage(imageUrl);
    if (localImageUri) return await shareWithRNShare({ title: `${productName} by ${vendorName} on CediMart`, message, url: localImageUri, type: 'image/jpeg', subject: `${productName} by ${vendorName} on CediMart` });
    return await shareWithRNShare({ title: `${productName} by ${vendorName} on CediMart`, message, subject: `${productName} by ${vendorName} on CediMart` });
  } catch (error) { console.error('Share own product error:', error); return { success: false, error }; }
};

export const shareAppInvite = async () => {
  try {
    const message = `🎉 Join CediMart - The Student Marketplace!\n\n✅ Buy & sell on campus\n✅ Best student deals\n✅ Free to join\n✅ Trusted by thousands of students\n\n📲 Download now: ${getStoreLinks()}`;
    return await shareWithRNShare({ title: 'Join CediMart - Student Marketplace', message, subject: 'Join CediMart - Student Marketplace' });
  } catch (error) { console.error('Share app error:', error); return { success: false, error }; }
};