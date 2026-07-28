// src/components/ReferralProgramNotice.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  accent:       '#F97316',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  brand:        '#0D9488',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  surface:      '#FFFFFF',
};

const REFERRAL_COMMISSION_PCT = 3;

const storageKey = (vendorId) => `cm_referral_notice_ack_${vendorId || 'default'}`;

export default function ReferralProgramNotice({ vendorId, commissionPct = REFERRAL_COMMISSION_PCT }) {
  const [checking, setChecking] = useState(true);
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ack = await AsyncStorage.getItem(storageKey(vendorId));
        if (!cancelled) {
          const shouldShow = !ack;
          setVisible(shouldShow);
          if (shouldShow) animateIn();
        }
      } catch (err) {
        if (!cancelled) {
          setVisible(true);
          animateIn();
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vendorId]);

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (callback) callback();
    });
  };

  const handleDismiss = () => animateOut();

  const handleAcknowledge = async () => {
    animateOut(async () => {
      try {
        await AsyncStorage.setItem(storageKey(vendorId), 'true');
      } catch (err) {
        console.warn('[ReferralProgramNotice] Failed to save acknowledgment:', err);
      }
    });
  };

  if (checking || !visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone-outline" size={18} color={C.accent} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Referral Program Policy</Text>
          <Text style={styles.text}>
            Others can recommend your products and earn rewards for referred sales.
            When an order comes through a shared link, a{' '}
            <Text style={styles.textBold}>{commissionPct}% commission</Text> is
            deducted from your listed price to pay the referrer — your other
            orders are unaffected.
          </Text>

          <TouchableOpacity style={styles.ackBtn} onPress={handleAcknowledge} activeOpacity={0.8}>
            <Text style={styles.ackBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={handleDismiss} 
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={C.t3} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 154,
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  body: { flex: 1 },
  title: { fontSize: 13.5, fontWeight: '800', color: C.t1, marginBottom: 4 },
  text: { fontSize: 12.5, color: C.t2, lineHeight: 18 },
  textBold: { fontWeight: '800', color: C.t1 },
  ackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  ackBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});