// src/components/RecommendEarnFAB.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { generateReferralLink } from '../apis/referralApi';
import { shareProductForReferral } from '../utils/shareUtils';
import { useAuth } from '../context/AuthContext';

// ─── Teal + Coral + Gold Palette ──────────────────────────────────────────
const C = {
  brand:    '#0D9488',
  brandL:   '#14B8A6',
  brandD:   '#0F766E',
  brandBg:  '#F0FDFA',
  accent:   '#F97316',
  accentBg: '#FFF7ED',
  accentBorder: '#FED7AA',
  gold:     '#F59E0B',
  goldBg:   '#FFFBEB',
  success:  '#059669',
  successBg:'#ECFDF5',
  t1:       '#0F172A',
  t2:       '#475569',
  t3:       '#94A3B8',
  white:    '#FFFFFF',
  shadow:   '#000',
};

export default function RecommendEarnFAB({ product }) {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideUp, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Generate referral link & share ───────────────────────────────────────
  const handleRecommend = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to Earn Rewards 💚',
        'Create a free account or log in to earn commission when friends buy through your recommendation link.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
          { text: 'Create Account', onPress: () => navigation.navigate('Auth', { screen: 'SignUp' }) },
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
        
        // Expand the panel
        Animated.spring(expandAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: false,
        }).start();
        
        setExpanded(true);
        await shareProductForReferral(product, data.referralCode, data.commissionPct, data.estimatedEarning);
      } else {
        Alert.alert('Error', res?.message || 'Could not generate referral link.');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to generate referral link.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copy link ────────────────────────────────────────────────────────────
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

  // ── Share again ──────────────────────────────────────────────────────────
  const handleShareAgain = async () => {
    if (!referralData) return;
    setLoading(true);
    try {
      await shareProductForReferral(product, referralData.referralCode, referralData.commissionPct, referralData.estimatedEarning);
    } catch (err) {
      console.log('Share cancelled:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Collapse ─────────────────────────────────────────────────────────────
  const handleCollapse = () => {
    Animated.spring(expandAnim, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start(() => setExpanded(false));
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideUp }],
          opacity: opacityAnim,
        }
      ]}
      pointerEvents="box-none"
    >
      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fab, expanded && styles.fabExpanded]}
        onPress={expanded ? handleCollapse : handleRecommend}
        disabled={loading}
        activeOpacity={0.85}
      >
        <View style={styles.fabInner}>
          {loading ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <>
              <Ionicons 
                name={expanded ? "close" : "gift-outline"} 
                size={20} 
                color={C.white} 
              />
              {!expanded && (
                <Text style={styles.fabText}>Recommend & Earn</Text>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Panel */}
      {expanded && (
        <Animated.View 
          style={[
            styles.panel,
            {
              maxHeight: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: expandAnim,
            }
          ]}
        >
          {/* Earning info */}
          <View style={styles.earningBadge}>
            <Ionicons name="cash-outline" size={14} color={C.gold} />
            <Text style={styles.earningText}>
              Earn <Text style={styles.earningAmount}>GH₵ {referralData?.estimatedEarning}</Text>
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopyLink} activeOpacity={0.7}>
              <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={14} color={copied ? C.success : C.brand} />
              <Text style={[styles.actionBtnText, copied && { color: C.success }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShareAgain} disabled={loading} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={14} color={C.brand} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 230,
    right: 16,
    zIndex: 999,
    elevation: 10,
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: C.accent,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  fabExpanded: {
    backgroundColor: C.t1,
    borderColor: C.t3,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fabText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    width: 200,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  earningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.goldBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  earningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  earningAmount: {
    fontWeight: '800',
    color: C.accent,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.brandBg,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.brand,
  },
});