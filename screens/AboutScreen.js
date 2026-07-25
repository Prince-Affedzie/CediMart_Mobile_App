// src/screens/main/AboutScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Share, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  white:        '#FFFFFF',
  black:        '#000000',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
};

const AboutScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const appStats = [
    { value: '10,000+', label: 'Student Users', icon: 'people-outline' },
    { value: '8', label: 'Campuses', icon: 'school-outline' },
    { value: '1,000+', label: 'Active Listings', icon: 'cube-outline' },
    { value: '24h', label: 'Delivery Time', icon: 'time-outline' },
  ];

  const features = [
    { id: 1, title: 'Buy & Sell', description: 'Browse thousands of items or list your own in minutes', icon: 'swap-horizontal' },
    { id: 2, title: 'Secure Payments', description: 'Escrow protection ensures safe transactions for everyone', icon: 'shield-checkmark' },
    { id: 3, title: 'Campus Delivery', description: 'We handle pickup and delivery across all campuses', icon: 'bicycle' },
    { id: 4, title: 'Verified Sellers', description: 'All vendors are verified students on your campus', icon: 'ribbon' },
  ];

  const storySections = [
    { id: 'mission', title: 'Our Mission', content: 'To create a trusted marketplace where Ghanaian university students can buy and sell safely within their campus communities. We aim to make student commerce simple, secure, and accessible to everyone.' },
    { id: 'story', title: 'Our Story', content: 'CediMart was born on campus. As students ourselves, we saw how difficult it was to sell unused items and find affordable used goods. From textbooks to electronics, students needed a better way. We built CediMart to connect students across Ghana\'s top universities — starting with UG, KNUST, UCC, and growing to 8 campuses today.' },
    { id: 'impact', title: 'How It Works', content: '• List your items in under 2 minutes\n• Buyers browse and purchase through the app\n• Payment is held securely in escrow\n• Our delivery team handles pickup and drop-off\n• Funds are released to seller after confirmed delivery\n• Everyone stays safe with in-app communication' },
    { id: 'trust', title: 'Trust & Safety', content: 'Every vendor goes through a verification process. All payments are protected by our escrow system — money is only released when the buyer confirms receipt. Our delivery team ensures items are handled properly, and our support team is always available to resolve any issues.' },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'CediMart',
        message: 'Check out CediMart — Ghana\'s campus marketplace! Buy & sell with students on your campus. Download now: https://cedimart.com',
      });
    } catch (error) { Alert.alert('Error', 'Failed to share app'); }
  };

  const handleRateApp = () => {
    Alert.alert('Rate CediMart', 'Love using CediMart? Rate us on the app store!', [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Rate Now', onPress: () => Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID') },
    ]);
  };

  const handleSectionToggle = (sectionId) => setExpandedSection(expandedSection === sectionId ? null : sectionId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={C.brandD} barStyle="light-content" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>About CediMart</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="school" size={40} color={C.brand} />
            </View>
            <Text style={styles.appName}>CediMart</Text>
            <Text style={styles.appTagline}>Ghana's Campus Marketplace</Text>
            <View style={styles.versionBadge}><Text style={styles.versionText}>v1.0.0</Text></View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {appStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Ionicons name={stat.icon} size={24} color={C.brand} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Why CediMart?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIconContainer}><Ionicons name={feature.icon} size={28} color={C.brand} /></View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Story Accordion */}
        <View style={styles.storyContainer}>
          {storySections.map((section) => (
            <View key={section.id} style={styles.storyItem}>
              <TouchableOpacity style={styles.storyHeader} onPress={() => handleSectionToggle(section.id)} activeOpacity={0.7}>
                <Text style={styles.storyTitle}>{section.title}</Text>
                <Ionicons name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
              </TouchableOpacity>
              {expandedSection === section.id && <Text style={styles.storyContent}>{section.content}</Text>}
            </View>
          ))}
        </View>

        {/* Campuses */}
        <View style={styles.campusesContainer}>
          <Text style={styles.sectionTitle}>Our Campuses</Text>
          <View style={styles.campusesGrid}>
            {[
              { code: 'UG', name: 'University of Ghana' }, { code: 'KNUST', name: 'KNUST' },
              { code: 'UCC', name: 'Univ. of Cape Coast' }, { code: 'UEW', name: 'Univ. of Education' },
              { code: 'UPSA', name: 'UPSA' }, { code: 'ASHESI', name: 'Ashesi University' },
              { code: 'GIMPA', name: 'GIMPA' }, { code: 'ATU', name: 'Accra Tech Univ.' },
            ].map((campus) => (
              <View key={campus.code} style={styles.campusCard}>
                <View style={styles.campusIconWrap}><Ionicons name="school-outline" size={20} color={C.brand} /></View>
                <Text style={styles.campusCode}>{campus.code}</Text>
                <Text style={styles.campusName}>{campus.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalContainer}>
          <TouchableOpacity style={styles.legalLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <View style={styles.legalLinkLeft}><Ionicons name="document-text-outline" size={18} color={C.brand} /><Text style={styles.legalLinkText}>Privacy Policy</Text></View>
            <Ionicons name="chevron-forward" size={18} color={C.t3} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink} onPress={() => navigation.navigate('TermsOfService')}>
            <View style={styles.legalLinkLeft}><Ionicons name="shield-outline" size={18} color={C.brand} /><Text style={styles.legalLinkText}>Terms of Service</Text></View>
            <Ionicons name="chevron-forward" size={18} color={C.t3} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.legalLink, { borderBottomWidth: 0 }]} onPress={handleRateApp}>
            <View style={styles.legalLinkLeft}><Ionicons name="star-outline" size={18} color={C.accent} /><Text style={styles.legalLinkText}>Rate the App</Text></View>
            <Ionicons name="chevron-forward" size={18} color={C.t3} />
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <TouchableOpacity style={styles.contactCard} onPress={() => navigation.navigate('Support')} activeOpacity={0.85}>
          <View style={styles.contactIconWrap}><Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" /></View>
          <View style={styles.contactInfo}><Text style={styles.contactTitle}>Need help?</Text><Text style={styles.contactSub}>Contact our support team</Text></View>
          <Ionicons name="arrow-forward" size={20} color={C.brand} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}><Ionicons name="school" size={16} color={C.brandBorder} /><Text style={styles.footerBrandText}>CediMart</Text></View>
          <Text style={styles.footerText}>© 2024-2026 CediMart. All rights reserved.</Text>
          <Text style={styles.footerTagline}>Ghana's trusted campus marketplace</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { backgroundColor: C.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 4 },
  scrollContent: { paddingBottom: 30 },

  heroSection: { height: 220, backgroundColor: C.brand, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroContent: { alignItems: 'center', paddingHorizontal: 20 },
  logoContainer: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  appName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  appTagline: { fontSize: 15, color: '#99F6E4', textAlign: 'center', marginBottom: 12 },
  versionBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  versionText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingVertical: 24, paddingHorizontal: 16, backgroundColor: C.white, marginHorizontal: 16, marginTop: -20, borderRadius: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 5 },
  statItem: { alignItems: 'center', width: '45%', marginBottom: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: C.brand, marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 12, color: C.t2, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.brandD, marginBottom: 14, marginLeft: 4 },

  featuresContainer: { marginTop: 16, marginHorizontal: 16 },
  featuresScroll: { paddingRight: 20 },
  featureCard: { width: 170, backgroundColor: C.white, borderRadius: 16, padding: 16, marginRight: 12, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  featureIconContainer: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: C.t1, marginBottom: 6 },
  featureDescription: { fontSize: 12, color: C.t2, lineHeight: 18 },

  storyContainer: { backgroundColor: C.white, marginTop: 16, marginHorizontal: 16, paddingVertical: 4, paddingHorizontal: 16, borderRadius: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  storyItem: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  storyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  storyTitle: { fontSize: 16, fontWeight: '600', color: C.t1 },
  storyContent: { fontSize: 14, color: '#555', lineHeight: 22, paddingBottom: 16, paddingRight: 8 },

  campusesContainer: { marginTop: 16, marginHorizontal: 16 },
  campusesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  campusCard: { width: '23%', backgroundColor: C.white, borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  campusIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  campusCode: { fontSize: 13, fontWeight: '800', color: C.brand, marginBottom: 2 },
  campusName: { fontSize: 9, color: '#888', textAlign: 'center', lineHeight: 12 },

  legalContainer: { backgroundColor: C.white, marginTop: 16, marginHorizontal: 16, paddingHorizontal: 16, borderRadius: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  legalLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  legalLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legalLinkText: { fontSize: 15, color: C.t1, fontWeight: '500' },

  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, gap: 14, borderWidth: 1.5, borderColor: C.brandBorder, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  contactIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: '700', color: C.brand },
  contactSub: { fontSize: 13, color: '#888', marginTop: 2 },

  footer: { alignItems: 'center', paddingVertical: 28, marginTop: 12, gap: 6 },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerBrandText: { fontSize: 14, fontWeight: '700', color: C.t3 },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center' },
  footerTagline: { fontSize: 11, color: C.t3, marginTop: 2 },
});

export default AboutScreen;