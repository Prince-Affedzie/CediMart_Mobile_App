// src/components/RecommendEarnBanner.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  success:   '#059669',
  gold:      '#F59E0B',
  goldBg:    '#FFFBEB',
  goldBorder:'#FDE68A',
  t1:        '#0F172A',
  t2:        '#92400E',
  white:     '#FFFFFF',
};

const REFERRAL_COMMISSION_PCT = 3;

export default function RecommendEarnBanner({ commissionPct = REFERRAL_COMMISSION_PCT, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.banner} 
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Gift icon with gold circle background */}
      <View style={styles.iconCircle}>
        <Ionicons name="gift-outline" size={18} color={C.gold} />
      </View>
      
       <Text style={styles.text} numberOfLines={4}>
        Recommend a product and Earn <Text style={styles.bold}>{commissionPct}%</Text> commission 
        when a friend or family makes a purchase through your recommendation.
      </Text>
      
      {/* Gold arrow badge
      <View style={styles.arrowBadge}>
        <Ionicons name="arrow-forward" size={14} color={C.white} />
      </View> */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.goldBg,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.goldBorder,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: C.t1,
    fontWeight: '500',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '800',
    color: C.gold,
  },
  arrowBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});