// src/screens/opportunities/OpportunitiesScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  success: '#059669',
  successBg: '#ECFDF5',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  gold: '#F59E0B',
  goldBg: '#FFFBEB',
  danger: '#DC2626',
};

const COMING_SOON_ITEMS = [
  {
    icon: 'briefcase-outline',
    title: 'Internships',
    desc: 'Find placement opportunities at top companies',
    color: C.info,
    bg: C.infoBg,
  },
  {
    icon: 'school-outline',
    title: 'Scholarships',
    desc: 'Discover funding for your education',
    color: C.success,
    bg: C.successBg,
  },
  {
    icon: 'trophy-outline',
    title: 'Competitions',
    desc: 'Showcase your skills and win prizes',
    color: C.gold,
    bg: C.goldBg,
  },
  {
    icon: 'code-slash-outline',
    title: 'Hackathons',
    desc: 'Build, collaborate, and innovate',
    color: C.purple,
    bg: C.purpleBg,
  },
  {
    icon: 'star-outline',
    title: 'Fellowships',
    desc: 'Accelerate your career with top programs',
    color: C.accent,
    bg: C.accentBg,
  },
  {
    icon: 'wallet-outline',
    title: 'Part-time Jobs',
    desc: 'Earn while you learn on campus',
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  {
    icon: 'heart-outline',
    title: 'Volunteer',
    desc: 'Give back and build your network',
    color: C.danger,
    bg: '#FEF2F2',
  },
];

const OpportunitiesScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Ionicons name="rocket-outline" size={40} color={C.brand} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Something Exciting{'\n'}is Coming</Text>
          <Text style={styles.heroSubtitle}>
            We're building a dedicated hub for internships, scholarships, competitions, hackathons, and more — all tailored for your campus.
          </Text>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Launching soon</Text>
          </View>
        </View>

        {/* What to Expect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to expect</Text>
          <View style={styles.featuresGrid}>
            {COMING_SOON_ITEMS.map((item, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stay Updated CTA */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaPattern} />
          <Ionicons name="notifications-outline" size={28} color="#fff" style={styles.ctaIcon} />
          <Text style={styles.ctaTitle}>Be the first to know</Text>
          <Text style={styles.ctaSubtitle}>
            We'll notify you the moment opportunities go live on your campus. Stay tuned!
          </Text>
          <View style={styles.ctaButtonRow}>
            <View style={styles.ctaDot1} />
            <View style={styles.ctaDot2} />
            <View style={styles.ctaDot3} />
          </View>
        </View>

        {/* Footer note */}
        <Text style={styles.footerText}>
          Got ideas for what you'd like to see?{'\n'}We'd love to hear from you!
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
  },
  heroIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.brandDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: C.brand + '30',
  },
  heroIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14.5,
    color: C.textOff,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.brandDim,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.brand + '30',
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.brand,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
    letterSpacing: 0.3,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: (width - 42) / 2,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 11.5,
    color: C.textMuted,
    lineHeight: 16,
  },

  // CTA Card
  ctaCard: {
    backgroundColor: C.brand,
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  ctaPattern: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaIcon: {
    marginBottom: 14,
    opacity: 0.9,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  ctaDot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ctaDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  ctaDot3: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  // Footer
  footerText: {
    textAlign: 'center',
    fontSize: 12.5,
    color: C.textMuted,
    lineHeight: 19,
    paddingHorizontal: 40,
  },
});

export default OpportunitiesScreen;