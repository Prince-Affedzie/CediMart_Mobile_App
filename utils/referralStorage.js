// src/utils/referralStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cm_referral';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches the web `cm_ref` cookie's max-age

/**
 * Persist a referral code captured from a deep link (?ref=CODE).
 * Last-touch wins: calling this again with a new code overwrites the old one,
 * so the most recent link someone tapped gets credit — same behavior as the
 * web app's cookie.
 */
export async function saveReferralCode(code, productId = null) {
  if (!code) return;
  try {
    const payload = { code, productId, capturedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[Referral] Failed to save referral code:', err);
  }
}

/**
 * Read back the stored referral code, if any and not expired.
 * Returns null if there isn't one, or if it's older than 30 days.
 */
export async function getReferralCode() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const { code, capturedAt } = JSON.parse(raw);
    if (!code || !capturedAt) return null;

    if (Date.now() - capturedAt > EXPIRY_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code;
  } catch (err) {
    console.warn('[Referral] Failed to read referral code:', err);
    return null;
  }
}

/**
 * Call this after a referral has actually been rewarded (e.g. right after a
 * successful checkout that included the code), so the same link doesn't
 * keep crediting the referrer on every future unrelated purchase.
 *
 * If you'd rather let one referral link earn credit for every purchase within
 * the 30-day window instead of just the first, simply don't call this after
 * checkout — getReferralCode() will keep returning it until it expires.
 */
export async function clearReferralCode() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Referral] Failed to clear referral code:', err);
  }
}