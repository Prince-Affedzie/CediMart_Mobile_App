// src/components/RecommendEarnButton.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { generateReferralLink } from '../apis/referralApi';
import { shareProductForReferral } from '../utils/shareUtils';
import { useAuth } from '../context/AuthContext';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  brand:    '#0D9488',
  brandL:   '#14B8A6',
  brandD:   '#0F766E',
  brandBg:  '#F0FDFA',
  accent:   '#F97316',
  accentBg: '#FFF7ED',
  accentBorder: '#FED7AA',
  success:  '#059669',
  successBg:'#ECFDF5',
  t1:       '#0F172A',
  t2:       '#475569',
  t3:       '#94A3B8',
  white:    '#FFFFFF',
};

export default function RecommendEarnButton({ product, style }) {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Generate referral link & share ───────────────────────────────────────
  const handleRecommendAndShare = async () => {
    // ⭐ Check auth ONLY when tapped
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to Earn Rewards 💚',
        'Create a free account or log in to earn commission when friends buy through your recommendation link.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Auth', { screen: 'Login' })
          },
          { 
            text: 'Create Account', 
            onPress: () => navigation.navigate('Auth', { screen: 'SignUp' })
          },
        ]
      );
      return;
    }

    if (!product?._id) {
      Alert.alert('Error', 'Product information is missing.');
      return;
    }

    setLoading(true);
    try {
      const res = await generateReferralLink(product._id);
      
      if (res?.success) {
        const data = res.data;
        setReferralData(data);
        setExpanded(true);

        await shareProductForReferral(
          product,
          data.referralCode,
          data.commissionPct,
          data.estimatedEarning
        );
      } else {
        Alert.alert('Error', res?.message || 'Could not generate referral link.');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to generate referral link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copy referral link ───────────────────────────────────────────────────
  const handleCopyLink = async () => {
    if (!referralData?.shareUrl) return;
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(referralData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copied!', 'Share link copied to clipboard.');
    }
  };

  // ── Share again (after link generated) ───────────────────────────────────
  const handleShareAgain = async () => {
    if (!referralData) return;
    setLoading(true);
    try {
      await shareProductForReferral(
        product,
        referralData.referralCode,
        referralData.commissionPct,
        referralData.estimatedEarning
      );
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main CTA Button — always shows Recommend & Earn */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={handleRecommendAndShare}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={C.white} />
        ) : (
          <>
            <Ionicons name="gift-outline" size={18} color={C.white} />
            <Text style={styles.mainButtonText}>
              💚 Recommend & Earn
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Share this product and earn commission when friends buy
      </Text>

      {/* Expanded section — shows after link is generated */}
      {expanded && referralData && (
        <View style={styles.expandedSection}>
          {/* Earning info card */}
          <View style={styles.earningCard}>
            <View style={styles.earningRow}>
              <Ionicons name="cash-outline" size={16} color={C.accent} />
              <Text style={styles.earningText}>
                Earn{' '}
                <Text style={styles.earningAmount}>
                  GH₵ {referralData.estimatedEarning}
                </Text>
                {' '}({referralData.commissionPct}% commission)
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
              activeOpacity={0.75}
            >
              <Ionicons 
                name={copied ? 'checkmark-circle' : 'copy-outline'} 
                size={16} 
                color={copied ? C.success : C.brand} 
              />
              <Text style={[styles.copyButtonText, copied && { color: C.success }]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareAgain}
              disabled={loading}
              activeOpacity={0.75}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <Ionicons name="share-social-outline" size={16} color={C.white} />
                  <Text style={styles.shareButtonText}>Share Again</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  mainButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 11,
    color: C.t3,
    marginTop: 6,
    lineHeight: 16,
  },
  expandedSection: {
    marginTop: 12,
    gap: 10,
  },
  earningCard: {
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 12,
    padding: 12,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  earningAmount: {
    fontWeight: '800',
    color: C.accent,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.brandBg,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.brand,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.brand,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
});