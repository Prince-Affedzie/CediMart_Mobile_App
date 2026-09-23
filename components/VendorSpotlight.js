// src/components/VendorSpotlight.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { getVendors } from '../apis/vendorApi';

// ─── Design Tokens (matches DiscoverScreen) ────────────────────────────────
const C = {
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
  skeleton: '#EEF2F6',
  success: '#059669',
  successBg: '#ECFDF5',
};

// ─── Same 21 categories from DiscoverScreen — used only for the fallback
//     initial-circle color when a vendor has no profileImage. ─────────────
const CATEGORY_COLORS = {
  'electronics':                '#2563EB',
  'phones and tablets':         '#7C3AED',
  'computers and laptops':      '#0891B2',
  'gaming':                     '#DB2777',
  'fashion':                    '#DC2626',
  'books-course-materials':     '#B45309',
  'hostel-items':               '#0D9488',
  'appliances':                 '#475569',
  'furniture':                  '#92400E',
  'beauty and grooming':        '#EC4899',
  'sports and fitness':         '#16A34A',
  'accessories':                '#CA8A04',
  'food and drinks':            '#EA580C',
  'services':                   '#0284C7',
  'tutoring-education':         '#4F46E5',
  'photography-media':          '#0EA5E9',
  'graphic-design-printing':    '#9333EA',
  'repair-services':            '#65A30D',
  'events-catering':            '#F59E0B',
  'accommodation-housing':      '#0F766E',
  'other':                      '#64748B',
};

const AVATAR_SIZE = 64;
const MAX_VENDORS = 5;

const isRealImageUrl = (val) => !!val && /^https?:\/\//i.test(val);

const getInitialColor = (vendor) => {
  const primaryCategory = vendor.categories?.[0];
  return CATEGORY_COLORS[primaryCategory] || C.brand;
};

// ─── Press-scale wrapper (same feel as DiscoverScreen) ────────────────────
const Pressy = ({ onPress, style, children, scaleTo = 0.94 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// ─── Single vendor bubble ──────────────────────────────────────────────────
const VendorBubble = ({ vendor, onPress }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasAvatar = isRealImageUrl(vendor.profileImage) && !imgFailed;
  const displayName = vendor.storeName || vendor.name || 'Vendor';
  const initialColor = getInitialColor(vendor);
  const firstChar = displayName.charAt(0).toUpperCase() || '?';

  return (
    <Pressy onPress={onPress} style={styles.bubbleWrap}>
      <View style={styles.bubbleOuter}>
        {hasAvatar ? (
          <Image
            source={{ uri: vendor.profileImage }}
            style={styles.bubbleImg}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[styles.bubbleImg, { backgroundColor: `${initialColor}1A` }]}>
            <Text style={[styles.bubbleInitial, { color: initialColor }]}>{firstChar}</Text>
          </View>
        )}

        {/* Verified checkmark badge */}
        {vendor.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </View>

      <Text style={styles.bubbleLabel} numberOfLines={1}>{displayName}</Text>
    </Pressy>
  );
};

// ─── Skeleton bubble (loading state) ──────────────────────────────────────
const SkeletonBubble = ({ delay = 0 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 800, delay, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [delay, shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  return (
    <View style={styles.bubbleWrap}>
      <Animated.View style={[styles.bubbleOuter, { backgroundColor: C.skeleton, opacity }]} />
      <Animated.View style={[styles.skelLine, { opacity }]} />
    </View>
  );
};

// ─── Main component ────────────────────────────────────────────────────────
/**
 * VendorSpotlight
 *
 * Compact home-screen widget showing N featured vendors as circular avatars.
 * Tapping any bubble → VendorDetail. "View all" → DiscoverScreen.
 *
 * Props:
 *   @param {string}   title          Section heading (default: "Featured vendors")
 *   @param {string}   subtitle       Optional sub-caption below title
 *   @param {string}   campus         Filter by campus code (e.g. 'UG'); omit for all
 *   @param {string}   category       Filter by category key
 *   @param {string}   businessType   'product' | 'service' | 'both' (omit for all)
 *   @param {number}   limit          How many vendors to show (default: 5)
 *   @param {string}   sortBy         'createdAt' | 'rating' | 'totalSales' (default 'rating')
 *   @param {string}   order          'asc' | 'desc' (default 'desc')
 *   @param {function} onViewAll      Override navigation (default: → DiscoverScreen)
 */
const VendorSpotlight = ({
  title = 'Featured vendors',
  subtitle,
  campus,
  category,
  businessType,
  limit = MAX_VENDORS,
  sortBy = 'rating',
  order = 'desc',
  onViewAll,
}) => {
  const navigation = useNavigation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const isMountedRef = useRef(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await getVendors({
        campus: campus || undefined,
        category: category || undefined,
        businessType: businessType || undefined,
        page: 1,
        limit,
      });
      const body = res?.data || {};
      const list = body.data || [];
      if (isMountedRef.current) setVendors(list.slice(0, limit));
    } catch (err) {
      console.warn('VendorSpotlight fetch error:', err?.response?.data?.error || err.message);
      if (isMountedRef.current) setErrored(true);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [campus, category, businessType, limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchVendors();
    return () => { isMountedRef.current = false; };
  }, [fetchVendors]);

  const handleVendorPress = useCallback((vendor) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('VendorDetail', { vendorId: vendor._id });
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (onViewAll) onViewAll();
    else navigation.navigate('Discover');
  }, [navigation, onViewAll]);

  //  If the fetch errored OR the marketplace has no vendors yet, don't show
  //  an empty box on the home screen — just hide the whole section.
  if (!loading && (errored || vendors.length === 0)) return null;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity style={styles.viewAllBtn} onPress={handleViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color={C.brand} />
        </TouchableOpacity>
      </View>

      {/* Row of avatars */}
      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {Array.from({ length: limit }).map((_, i) => (
            <SkeletonBubble key={i} delay={i * 80} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {vendors.map((vendor) => (
            <VendorBubble
              key={vendor._id}
              vendor={vendor}
              onPress={() => handleVendorPress(vendor)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: C.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.brandDim,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: C.brand,
  },

  row: {
    paddingHorizontal: 12,
    gap: 14,
  },

  // ── Bubble ──
  bubbleWrap: {
    width: AVATAR_SIZE + 12,
    alignItems: 'center',
  },
  bubbleOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.brandDim,
    padding: 2,
    position: 'relative',
  },
  bubbleImg: {
    width: '100%',
    height: '100%',
    borderRadius: (AVATAR_SIZE - 8) / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleInitial: {
    fontSize: 22,
    fontWeight: '800',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.surface,
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textOff,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: AVATAR_SIZE + 8,
  },

  skelLine: {
    width: AVATAR_SIZE * 0.8,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.skeleton,
    marginTop: 8,
  },
});

export default VendorSpotlight;