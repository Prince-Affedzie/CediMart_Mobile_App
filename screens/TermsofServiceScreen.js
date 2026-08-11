// src/screens/TermsOfServiceScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const LAST_UPDATED = 'June 1, 2026';
const EFFECTIVE_DATE = 'June 15, 2026';
const CONTACT_EMAIL = 'legal@cedimart.com';
const CONTACT_PHONE = '+233 505 671 577';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandD: '#0F766E',
  brandDim: 'rgba(13,148,136,0.08)',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  info: '#0284C7',
  infoBg: '#F0F9FF',
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
};

const SECTIONS = [
  {
    id: 'acceptance',
    icon: 'checkmark-circle-outline',
    iconColor: C.brand,
    iconBg: C.brandDim,
    title: 'Acceptance of Terms',
    content: `By downloading, installing, or using the CediMart mobile application, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please do not use our App.

You must be at least 18 years old, or have the consent of a parent or guardian, to use our services.`,
  },
  {
    id: 'conduct',
    icon: 'shield-outline',
    iconColor: C.danger,
    iconBg: C.dangerBg,
    title: 'User Conduct & Content Policy',
    tag: 'IMPORTANT',
    tagColor: C.danger,
    tagBg: C.dangerBg,
    content: `CediMart is a platform powered by user-generated content. All users must adhere to strict conduct guidelines to maintain a safe, respectful community.`,
    bullets: [
      { heading: 'Zero Tolerance for Abuse', text: 'Harassment, bullying, hate speech, threats, or any form of abuse toward other users is strictly prohibited and will result in immediate account suspension or permanent ban.' },
      { heading: 'No Harassment', text: 'Repeated unwanted contact, intimidation, stalking, or any behavior that makes another user feel unsafe is grounds for immediate action against your account.' },
      { heading: 'No Hate Speech', text: 'Content that attacks, demeans, or incites violence against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or any protected characteristic is forbidden.' },
      { heading: 'No Sexual Content', text: 'Sexually explicit material, nudity, or content sexualizing individuals without consent is strictly prohibited.' },
      { heading: 'No Violence or Threats', text: 'Content depicting graphic violence or threatening physical harm to others will be removed and reported to authorities where applicable.' },
      { heading: 'No Misinformation', text: 'Deliberately false or misleading content that could cause harm is not allowed on our platform.' },
      { heading: 'No Scams or Fraud', text: 'Attempting to deceive users for financial gain, including fake listings, phishing, or impersonation, will result in permanent removal.' },
    ],
    note: 'We reserve the right to remove any content and suspend any account that violates these policies. Serious violations may be reported to law enforcement or university authorities.',
  },
  {
    id: 'reporting',
    icon: 'flag-outline',
    iconColor: C.accent,
    iconBg: C.accentBg,
    title: 'Reporting Violations',
    content: `We encourage all users to report content or behavior that violates our policies.`,
    bullets: [
      { heading: 'How to Report', text: 'Use the in-app report feature (flag icon) on any post, comment, or message. You can also report users directly from their profile or chat.' },
      { heading: 'What Happens Next', text: 'Our moderation team reviews all reports within 24 hours. We take action based on the severity of the violation — from content removal to account suspension.' },
      { heading: 'No Retaliation', text: 'We protect users who report violations in good faith. Retaliation against someone for reporting is itself a violation of these terms.' },
      { heading: 'Appeals', text: 'If you believe your content or account was actioned in error, you may appeal by contacting our support team.' },
    ],
  },
  {
    id: 'account',
    icon: 'person-outline',
    iconColor: C.info,
    iconBg: C.infoBg,
    title: 'Your Account',
    bullets: [
      { heading: 'Registration', text: 'You must provide accurate and complete information when creating your account.' },
      { heading: 'Account Security', text: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.' },
      { heading: 'One Account Per Person', text: 'You may create only one account. Creating multiple accounts to manipulate ratings, prices, or evade restrictions is prohibited.' },
      { heading: 'Account Suspension', text: 'We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful behavior.' },
    ],
  },
  {
    id: 'buying',
    icon: 'cart-outline',
    iconColor: C.accent,
    iconBg: C.accentBg,
    title: 'Buying on CediMart',
    bullets: [
      { heading: 'Escrow Protection', text: 'Your payment is held securely and NOT released to the seller until you confirm delivery and satisfaction.' },
      { heading: 'Inspection Period', text: 'You have 24 hours from delivery to inspect the item and report any issues.' },
      { heading: 'Dispute Resolution', text: 'If an item is significantly different from its description, damaged, or not delivered, file a dispute. Our team will investigate.' },
      { heading: 'Meeting Safety', text: 'For in-person exchanges, always meet in public campus areas during daylight hours.' },
    ],
  },
  {
    id: 'selling',
    icon: 'storefront-outline',
    iconColor: C.brand,
    iconBg: C.brandDim,
    title: 'Selling on CediMart',
    bullets: [
      { heading: 'Listing Requirements', text: 'All listings must include accurate descriptions, clear photos, correct condition, and fair pricing.' },
      { heading: 'Prohibited Items', text: 'Counterfeit goods, stolen items, weapons, alcohol, drugs, and items violating university policies or Ghanaian law are strictly prohibited.' },
      { heading: 'Commission Fees', text: 'CediMart charges a 7% platform fee on each successful sale. If the sale came through a referral link, an additional 3% referrer reward applies.' },
      { heading: 'Payouts', text: 'Earnings are released to your mobile money or bank account within 24-48 hours after the buyer confirms delivery.' },
    ],
  },
  {
    id: 'intellectual',
    icon: 'ribbon-outline',
    iconColor: C.warning,
    iconBg: C.warningBg,
    title: 'Intellectual Property',
    content: `All content in the App — including logos, design, code, and the CediMart brand — is owned by or licensed to CediMart. You retain ownership of content you submit but grant CediMart a non-exclusive licence to display it in connection with our services.`,
  },
  {
    id: 'liability',
    icon: 'alert-circle-outline',
    iconColor: C.danger,
    iconBg: C.dangerBg,
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, CediMart shall not be liable for indirect, incidental, or consequential damages arising from your use of the App. Our total liability for any claim shall not exceed the commission earned by CediMart on the transaction giving rise to the claim.`,
  },
  {
    id: 'governing',
    icon: 'globe-outline',
    iconColor: C.info,
    iconBg: C.infoBg,
    title: 'Governing Law & Disputes',
    content: `These Terms are governed by the laws of the Republic of Ghana. Any dispute shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the competent courts of Ghana.`,
  },
  {
    id: 'changes',
    icon: 'refresh-outline',
    iconColor: C.success,
    iconBg: C.successBg,
    title: 'Changes to These Terms',
    content: `We may modify these Terms at any time. Material changes will be notified via in-app notification or email at least 7 days before taking effect. Continued use after the effective date constitutes acceptance of the revised Terms.`,
  },
  {
    id: 'contact',
    icon: 'mail-outline',
    iconColor: C.brand,
    iconBg: C.brandDim,
    title: 'Contact & Support',
    content: `If you have questions about these Terms, need support, or wish to report a violation, please reach out:`,
    isContact: true,
  },
];

const TermsSection = ({ section, index }) => {
  const [open, setOpen] = useState(index === 0);
  const rotateAnim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    setOpen(o => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.section, open && styles.sectionOpen]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.sectionLeft}>
          <View style={[styles.sectionIconWrap, { backgroundColor: section.iconBg }]}>
            <Ionicons name={section.icon} size={17} color={section.iconColor} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.tag && (
                <View style={[styles.sectionTag, { backgroundColor: section.tagBg }]}>
                  <Text style={[styles.sectionTagText, { color: section.tagColor }]}>{section.tag}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={17} color={C.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={styles.sectionBody}>
          {section.content && <Text style={styles.bodyText}>{section.content}</Text>}

          {section.bullets?.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: section.iconColor }]} />
              <View style={styles.bulletBody}>
                <Text style={styles.bulletHeading}>{b.heading}</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            </View>
          ))}

          {section.note && (
            <View style={styles.noteBox}>
              <Ionicons name="alert-circle" size={14} color={C.danger} style={{ marginTop: 1 }} />
              <Text style={styles.noteText}>{section.note}</Text>
            </View>
          )}

          {section.isContact && (
            <View style={styles.contactBlock}>
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} activeOpacity={0.8}>
                <View style={[styles.contactIconWrap, { backgroundColor: C.infoBg }]}>
                  <Ionicons name="mail-outline" size={16} color={C.info} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Legal & Terms</Text>
                  <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s/g, '')}`)} activeOpacity={0.8}>
                <View style={[styles.contactIconWrap, { backgroundColor: C.successBg }]}>
                  <Ionicons name="call-outline" size={16} color={C.success} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Customer Support</Text>
                  <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Terms of Service</Text>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Terms of Service</Text>
          <Text style={styles.pageSubtitle}>
            Please read these terms carefully. By using CediMart, you agree to all terms below.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Updated {LAST_UPDATED}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>Effective {EFFECTIVE_DATE}</Text>
          </View>
        </View>

        {/* Abuse Warning Banner */}
        <View style={styles.abuseWarning}>
          <View style={styles.abuseWarningIcon}>
            <Ionicons name="warning-outline" size={24} color={C.danger} />
          </View>
          <View style={styles.abuseWarningContent}>
            <Text style={styles.abuseWarningTitle}>Zero Tolerance for Abuse & Harassment</Text>
            <Text style={styles.abuseWarningText}>
              CediMart is a community built on respect. Abuse, harassment, hate speech, threats, or any form of harmful behavior will result in immediate action — including permanent account removal and reporting to university authorities where applicable.
            </Text>
          </View>
        </View>

        {/* Quick Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Community Standards</Text>
          <View style={styles.summaryItems}>
            {[
              { icon: 'shield-checkmark', text: 'Zero tolerance for abuse, harassment, and hate speech' },
              { icon: 'flag', text: 'Report violations — we respond within 24 hours' },
              { icon: 'people', text: 'Respect all campus community members at all times' },
              { icon: 'alert-circle', text: 'Violations may result in permanent account suspension' },
            ].map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Ionicons name={item.icon} size={14} color={C.danger} />
                <Text style={styles.summaryItemText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sections */}
        <View style={styles.sectionsWrap}>
          {SECTIONS.map((section, index) => (
            <View key={section.id}>
              <TermsSection section={section} index={index} />
            </View>
          ))}
        </View>

        {/* Agreement Footer */}
        <View style={styles.agreementCard}>
          <Ionicons name="checkmark-circle" size={28} color={C.success} style={{ marginBottom: 10 }} />
          <Text style={styles.agreementTitle}>You've Agreed to These Terms</Text>
          <Text style={styles.agreementText}>
            By using CediMart, you acknowledge that you have read, understood, and agree to these Terms of Service.
          </Text>
          <Text style={styles.agreementMeta}>Effective: {EFFECTIVE_DATE} · v3.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 20 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  navTitle: { fontSize: 17, fontWeight: '800', color: C.text },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13.5, color: C.textOff, marginTop: 4, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metaText: { fontSize: 11.5, color: C.textMuted, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textMuted },

  // Abuse Warning
  abuseWarning: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.dangerBg, marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FECACA',
  },
  abuseWarningIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  abuseWarningContent: { flex: 1 },
  abuseWarningTitle: { fontSize: 13, fontWeight: '800', color: C.danger, marginBottom: 4 },
  abuseWarningText: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },

  // Summary
  summaryCard: { backgroundColor: C.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 12 },
  summaryItems: { gap: 10 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryItemText: { flex: 1, fontSize: 13, color: C.textOff, fontWeight: '500', lineHeight: 18 },

  // Sections
  sectionsWrap: { paddingHorizontal: 16, gap: 8, marginTop: 16 },
  section: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sectionOpen: { borderColor: C.brand + '40' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sectionTitleWrap: { flex: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  sectionTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  sectionTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.border },
  bodyText: { fontSize: 13.5, color: C.textOff, lineHeight: 21, marginTop: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  bulletBody: { flex: 1 },
  bulletHeading: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  bulletText: { fontSize: 13, color: C.textOff, lineHeight: 19 },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.dangerBg, borderRadius: 10, padding: 12, marginTop: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  noteText: { flex: 1, fontSize: 12, color: '#7F1D1D', lineHeight: 17, fontWeight: '600' },
  contactBlock: { backgroundColor: C.brandDim, borderRadius: 12, marginTop: 12, overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  contactIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  // Agreement
  agreementCard: { backgroundColor: C.brand, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  agreementTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6, textAlign: 'center' },
  agreementText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 19, marginBottom: 10 },
  agreementMeta: { fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
});

export default TermsOfServiceScreen;