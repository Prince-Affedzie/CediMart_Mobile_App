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

const LAST_UPDATED = 'January 15, 2025';
const EFFECTIVE_DATE = 'February 1, 2025';
const CONTACT_EMAIL = 'legal@freshyfoodfactory.com';
const CONTACT_PHONE = '+233 505 671 577';

// ─── Section data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'acceptance',
    icon: 'checkmark-circle-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Acceptance of Terms',
    tag: 'IMPORTANT',
    tagColor: '#2E7D32',
    tagBg: '#E8F5E9',
    content: `By downloading, installing, or using the CediMart mobile application ("App"), you confirm that you have read, understood, and agree to be bound by these Terms of Service ("Terms").

If you do not agree to these Terms, please do not use our App or services. These Terms apply to all users of the App, including visitors, customers, and merchants.

You must be at least 18 years old, or have the consent of a parent or guardian, to use our services.`,
  },
  {
    id: 'services',
    icon: 'storefront-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Our Services',
    content: `CediMart is an online platform that connects customers with fresh food products including vegetables, fruits, staples, herbs, tubers, and other groceries. Through our App, you can:`,
    bullets: [
      { heading: 'Browse Products', text: 'View our catalogue of fresh food items with current pricing, availability, and product details.' },
      { heading: 'Place Orders', text: 'Add items to your cart and place orders for home delivery to your specified address in our delivery zones.' },
      { heading: 'Schedule Deliveries', text: 'Choose your preferred delivery day and time window at checkout.' },
      { heading: 'Track Orders', text: 'Monitor the status of your order from placement through to delivery.' },
      { heading: 'Manage Your Account', text: 'Save delivery addresses, view order history, and manage your profile information.' },
    ],
    note: 'Our services are currently available within select delivery zones in Accra, Ghana. Availability may vary by location.',
  },
  {
    id: 'account',
    icon: 'person-outline',
    iconColor: '#6A1B9A',
    iconBg: '#F3E5F5',
    title: 'Your Account',
    bullets: [
      { heading: 'Registration', text: 'You must provide accurate, current, and complete information when creating your account. You agree to keep this information up to date.' },
      { heading: 'Account Security', text: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.' },
      { heading: 'One Account Per Person', text: 'You may create only one personal account. Creating multiple accounts to exploit promotions is prohibited.' },
      { heading: 'Account Suspension', text: 'We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse our platform.' },
      { heading: 'Account Deletion', text: 'You may request deletion of your account at any time by contacting us. Pending orders must be completed or cancelled before deletion.' },
    ],
  },
  {
    id: 'orders',
    icon: 'receipt-outline',
    iconColor: '#F57F17',
    iconBg: '#FFF8E1',
    title: 'Orders & Payments',
    bullets: [
      { heading: 'Order Confirmation', text: 'An order is confirmed only after successful payment is processed. You will receive an in-app and email confirmation.' },
      { heading: 'Pricing', text: 'All prices are displayed in Ghana Cedis (GH₵) and are inclusive of applicable taxes. Prices may change without prior notice.' },
      { heading: 'Payment Methods', text: 'We accept payments via Paystack, which supports mobile money and card payments. Payment must be made in full at the time of ordering.' },
      { heading: 'Delivery Fee', text: 'A delivery fee of GH₵ 20–80 applies per order, based on your location. This fee is paid separately to the delivery rider upon receipt.' },
      { heading: 'Order Modifications', text: 'Orders cannot be modified after payment has been processed. If you need to make changes, you must cancel and place a new order, subject to our cancellation policy.' },
      { heading: 'Out-of-Stock Items', text: 'In rare cases where an item becomes unavailable after ordering, we will notify you and process a refund for that item within 3–5 business days.' },
    ],
  },
  {
    id: 'delivery',
    icon: 'bicycle-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Delivery Terms',
    bullets: [
      { heading: 'Delivery Zones', text: 'We currently deliver to select areas in Accra, Ghana. You can check if we deliver to your address at checkout.' },
      { heading: 'Delivery Schedule', text: 'You may choose a preferred delivery day and time. While we strive to honour your schedule, delivery times are estimates and not guaranteed.' },
      { heading: 'Missed Delivery', text: 'If you are unavailable at the time of delivery, our rider will attempt to contact you. If delivery cannot be completed, you may be charged a redelivery fee.' },
      { heading: 'Risk of Loss', text: 'Risk of loss and title to ordered items pass to you upon delivery to your specified address.' },
      { heading: 'Delivery Personnel', text: 'Our delivery riders are bound by conduct standards. If you experience unprofessional behaviour, please report it immediately.' },
    ],
  },
  {
    id: 'cancellations',
    icon: 'close-circle-outline',
    iconColor: '#C62828',
    iconBg: '#FFEBEE',
    title: 'Cancellations & Refunds',
    tag: 'KEY POLICY',
    tagColor: '#C62828',
    tagBg: '#FFEBEE',
    bullets: [
      { heading: 'Cancellation Window', text: 'You may cancel an order at no charge before it has been confirmed for processing. Once processing begins, cancellation may not be possible.' },
      { heading: 'Cancellation by CediMart', text: 'We reserve the right to cancel orders due to product unavailability, delivery zone restrictions, suspected fraud, or pricing errors. You will be notified and refunded in full.' },
      { heading: 'Refund Eligibility', text: 'Refunds are issued for: cancelled orders, items not delivered, items significantly different from description, or damaged items reported within 24 hours of delivery.' },
      { heading: 'Refund Process', text: 'Approved refunds are processed within 3–5 business days back to your original payment method. Mobile money refunds may be instant.' },
      { heading: 'No Refunds For', text: 'Change of mind after delivery, items consumed or partially used, or claims made more than 24 hours after delivery.' },
    ],
    note: 'To request a refund, contact us within 24 hours of delivery with your order number and issue description.',
  },
  {
    id: 'conduct',
    icon: 'shield-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'User Conduct',
    content: `You agree not to use the App in any way that:`,
    bullets: [
      { heading: 'Violates Laws', text: 'Is unlawful, fraudulent, deceptive, or violates any applicable Ghanaian laws or regulations.' },
      { heading: 'Harms Others', text: 'Harasses, abuses, threatens, or intimidates other users, delivery riders, or CediMart staff.' },
      { heading: 'Disrupts Services', text: 'Attempts to gain unauthorised access, introduces malware, or interferes with the proper functioning of the App.' },
      { heading: 'Misrepresents Identity', text: 'Impersonates another person or entity, or falsely claims affiliation with any organisation.' },
      { heading: 'Exploits Promotions', text: 'Abuses promotional offers, referral codes, or discount systems through fraudulent means.' },
      { heading: 'Scrapes Data', text: 'Uses automated tools to scrape, crawl, or extract data from the App without our written consent.' },
    ],
  },
  {
    id: 'intellectual',
    icon: 'ribbon-outline',
    iconColor: '#F57F17',
    iconBg: '#FFF8E1',
    title: 'Intellectual Property',
    content: `All content in the App — including logos, product images, text, design, code, and the CediMart brand — is owned by or licensed to CediMart and is protected by applicable intellectual property laws.

You may not reproduce, distribute, modify, create derivative works from, or commercially exploit any content from the App without our prior written permission.

You retain ownership of content you submit (such as reviews or profile photos), but grant CediMart a non-exclusive licence to use such content in connection with our services.`,
  },
  {
    id: 'liability',
    icon: 'alert-circle-outline',
    iconColor: '#C62828',
    iconBg: '#FFEBEE',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by Ghanaian law, CediMart shall not be liable for:`,
    bullets: [
      { heading: 'Indirect Damages', text: 'Any indirect, incidental, special, or consequential damages arising from your use of the App or services.' },
      { heading: 'Service Interruptions', text: 'Loss caused by temporary unavailability of the App due to maintenance, technical issues, or circumstances beyond our control.' },
      { heading: 'Third-Party Actions', text: 'Actions or omissions of delivery riders or payment processors beyond our reasonable control.' },
      { heading: 'Force Majeure', text: 'Delays or failures caused by circumstances beyond our control including natural disasters, civil unrest, or government restrictions.' },
    ],
    note: 'Our total liability to you for any claim shall not exceed the amount you paid for the order giving rise to the claim.',
  },
  {
    id: 'governing',
    icon: 'globe-outline',
    iconColor: '#6A1B9A',
    iconBg: '#F3E5F5',
    title: 'Governing Law & Disputes',
    content: `These Terms are governed by and construed in accordance with the laws of the Republic of Ghana.

Any dispute arising from these Terms or your use of the App shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the competent courts of Ghana.

If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
  {
    id: 'changes',
    icon: 'refresh-outline',
    iconColor: '#2E7D32',
    iconBg: '#E8F5E9',
    title: 'Changes to These Terms',
    content: `We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via in-app notification or email at least 7 days before the changes take effect.

Your continued use of the App after the effective date of changes constitutes your acceptance of the revised Terms. If you do not agree with the changes, you may close your account before the effective date.

The "Last Updated" date at the top of this screen reflects the most recent revision.`,
  },
  {
    id: 'contact',
    icon: 'mail-outline',
    iconColor: '#1565C0',
    iconBg: '#E3F2FD',
    title: 'Contact & Support',
    content: `If you have questions about these Terms, need support, or wish to report a violation, please reach out to us:`,
    isContact: true,
  },
];

// ─── Section component ────────────────────────────────────────────────────────
const TermsSection = ({ section, index }) => {
  const [open, setOpen] = useState(index === 0);
  const rotateAnim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.section, open && styles.sectionOpen]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.sectionLeft}>
          <View style={[styles.sectionNum]}>
            <Text style={styles.sectionNumText}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          <View style={[styles.sectionIconWrap, { backgroundColor: section.iconBg }]}>
            <Ionicons name={section.icon} size={17} color={section.iconColor} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.tag && (
              <View style={[styles.sectionTag, { backgroundColor: section.tagBg }]}>
                <Text style={[styles.sectionTagText, { color: section.tagColor }]}>{section.tag}</Text>
              </View>
            )}
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={17} color="#BDBDBD" />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={styles.sectionBody}>
          {section.content && (
            <Text style={styles.bodyText}>{section.content}</Text>
          )}

          {section.bullets?.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletMarker, { backgroundColor: section.iconColor }]}>
                <Text style={styles.bulletMarkerNum}>{i + 1}</Text>
              </View>
              <View style={styles.bulletBody}>
                <Text style={styles.bulletHeading}>{b.heading}</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            </View>
          ))}

          {section.note && (
            <View style={[styles.noteBox, { borderLeftColor: section.iconColor }]}>
              <Ionicons name="information-circle-outline" size={15} color={section.iconColor} />
              <Text style={[styles.noteText, { color: section.iconColor }]}>{section.note}</Text>
            </View>
          )}

          {section.isContact && (
            <View style={styles.contactBlock}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="mail-outline" size={16} color="#1565C0" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Legal & Terms</Text>
                  <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s/g, '')}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="call-outline" size={16} color="#2E7D32" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Customer Support</Text>
                  <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
              </TouchableOpacity>

              <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="location-outline" size={16} color="#F57F17" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Office</Text>
                  <Text style={styles.contactValue}>Accra, Ghana</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Table of Contents ────────────────────────────────────────────────────────
const TableOfContents = ({ onSelect }) => (
  <View style={styles.tocCard}>
    <View style={styles.tocHead}>
      <Ionicons name="list-outline" size={15} color="#1565C0" />
      <Text style={styles.tocHeadText}>Table of Contents</Text>
    </View>
    {SECTIONS.map((s, i) => (
      <TouchableOpacity key={s.id} style={styles.tocRow} onPress={() => onSelect(i)} activeOpacity={0.7}>
        <View style={[styles.tocNumBadge, { backgroundColor: s.iconBg }]}>
          <Text style={[styles.tocNum, { color: s.iconColor }]}>{String(i + 1).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.tocLabel} numberOfLines={1}>{s.title}</Text>
        <Ionicons name="arrow-forward-outline" size={13} color="#D0D0D0" />
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const sectionRefs = useRef([]);
  const [showToc, setShowToc] = useState(false);

  const scrollToSection = (index) => {
    setShowToc(false);
    setTimeout(() => {
      sectionRefs.current[index]?.measure((x, y, w, h, px, py) => {
        scrollRef.current?.scrollTo({ y: py - 80, animated: true });
      });
    }, 120);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F7" />

      {/* ── Floating nav ── */}
      <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Terms of Service</Text>
          <TouchableOpacity
            style={[styles.navBtn, showToc && styles.navBtnOn]}
            onPress={() => setShowToc(t => !t)}
          >
            <Ionicons name={showToc ? 'close' : 'list-outline'} size={20} color={showToc ? '#1565C0' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── TOC overlay ── */}
      {showToc && (
        <View style={styles.tocOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.tocBackdrop} activeOpacity={1} onPress={() => setShowToc(false)} />
          <View style={styles.tocPanel}>
            <TableOfContents onSelect={scrollToSection} />
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* Background geometric accent */}
          <View style={styles.heroAccentCircle} />
          <View style={styles.heroAccentCircle2} />

          <View style={styles.heroInner}>
            <View style={styles.heroIconRing}>
              <View style={styles.heroIconInner}>
                <Ionicons name="document-text" size={30} color="#fff" />
              </View>
            </View>

            <Text style={styles.heroTitle}>Terms of Service</Text>
            <Text style={styles.heroSubtitle}>CediMart</Text>
            <Text style={styles.heroDesc}>
              Please read these terms carefully before using our app and services. By continuing to use CediMart, you agree to all terms outlined below.
            </Text>

            {/* Date pills */}
            <View style={styles.heroDates}>
              <View style={styles.datePill}>
                <Ionicons name="create-outline" size={12} color="#9E9E9E" />
                <Text style={styles.datePillText}>Updated {LAST_UPDATED}</Text>
              </View>
              <View style={styles.datePillGreen}>
                <Ionicons name="flash" size={12} color="#2E7D32" />
                <Text style={styles.datePillGreenText}>Effective {EFFECTIVE_DATE}</Text>
              </View>
            </View>

            {/* Summary chips */}
            <View style={styles.summaryRow}>
              {[
                { icon: 'location-outline',     label: 'Ghana Only' },
                { icon: 'card-outline',          label: 'Paystack' },
                { icon: 'bicycle-outline',       label: 'Delivery Terms' },
                { icon: 'refresh-circle-outline', label: 'Refund Policy' },
              ].map((chip, i) => (
                <View key={i} style={styles.summaryChip}>
                  <Ionicons name={chip.icon} size={13} color="#1565C0" />
                  <Text style={styles.summaryChipText}>{chip.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Quick summary banner */}
        <View style={styles.tldrBanner}>
          <View style={styles.tldrLeft}>
            <Text style={styles.tldrTitle}>Quick Summary</Text>
            <Text style={styles.tldrSub}>What you need to know at a glance</Text>
          </View>
          <View style={styles.tldrIcon}>
            <Ionicons name="bulb-outline" size={20} color="#F57F17" />
          </View>
        </View>
        <View style={styles.tldrItems}>
          {[
            { icon: 'checkmark-circle', color: '#2E7D32', text: 'Order fresh food for delivery in Accra' },
            { icon: 'card',             color: '#1565C0', text: 'Pay securely via Paystack — no hidden charges' },
            { icon: 'bicycle',          color: '#6A1B9A', text: 'Delivery fee (GH₵ 20–80) paid to rider on delivery' },
            { icon: 'close-circle',     color: '#C62828', text: 'Cancel orders before processing for a full refund' },
            { icon: 'shield-checkmark', color: '#2E7D32', text: 'Your data is protected — we never sell it' },
          ].map((item, i) => (
            <View key={i} style={styles.tldrItem}>
              <Ionicons name={item.icon} size={16} color={item.color} />
              <Text style={styles.tldrItemText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Sections ── */}
        <View style={styles.sectionsWrap}>
          {SECTIONS.map((section, index) => (
            <View key={section.id} ref={el => { sectionRefs.current[index] = el; }}>
              <TermsSection section={section} index={index} />
            </View>
          ))}
        </View>

        {/* ── Agreement footer ── */}
        <View style={styles.agreementCard}>
          <View style={styles.agreementIconWrap}>
            <Ionicons name="checkmark-done-circle" size={28} color="#2E7D32" />
          </View>
          <Text style={styles.agreementTitle}>You've Agreed to These Terms</Text>
          <Text style={styles.agreementText}>
            By using CediMart, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
          </Text>
          <View style={styles.agreementMeta}>
            <Text style={styles.agreementMetaText}>Effective: {EFFECTIVE_DATE}</Text>
            <View style={styles.agreementMetaDot} />
            <Text style={styles.agreementMetaText}>v2.0</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeafRow}>
            <Ionicons name="leaf" size={14} color="#A5D6A7" />
            <Text style={styles.footerBrand}>CediMart</Text>
            <Ionicons name="leaf" size={14} color="#A5D6A7" />
          </View>
          <Text style={styles.footerSub}>Accra, Ghana · © {new Date().getFullYear()}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.footerLink}>
            <Text style={styles.footerLinkText}>View Privacy Policy →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8F7' },
  scrollContent: { paddingBottom: 20 },

  // ── NAV ────────────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  navBtnOn: {
    backgroundColor: '#E3F2FD',
    shadowColor: '#1565C0', shadowOpacity: 0.14,
  },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.1 },

  // ── TOC ─────────────────────────────────────────────────────────────────────
  tocOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
  },
  tocBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  tocPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    right: 16,
    width: width * 0.8,
    maxWidth: 320,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 16,
  },
  tocCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  tocHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: '#EBF3FF',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DDEEFF',
  },
  tocHeadText: { fontSize: 12, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase', letterSpacing: 1.2 },
  tocRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F5F5F5', gap: 10,
  },
  tocNumBadge: {
    width: 28, height: 20, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  tocNum: { fontSize: 10, fontWeight: '800' },
  tocLabel: { flex: 1, fontSize: 13, color: '#424242', fontWeight: '500' },

  // ── HERO ────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#2E7D32',
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
    position: 'relative',
  },
  heroAccentCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroAccentCircle2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroInner: { padding: 24, alignItems: 'center' },
  heroIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroIconInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '900', color: '#fff',
    letterSpacing: -0.4, textAlign: 'center', marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    fontWeight: '600', letterSpacing: 0.5, marginBottom: 14,
  },
  heroDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 20, marginBottom: 18,
    paddingHorizontal: 8,
  },
  heroDates: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  datePillText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  datePillGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  datePillGreenText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
  },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  summaryChipText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // ── TLDR BANNER ──────────────────────────────────────────────────────────────
  tldrBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 0,
    borderRadius: 14, padding: 16,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  tldrLeft: { flex: 1 },
  tldrTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  tldrSub: { fontSize: 12, color: '#9E9E9E', marginTop: 1 },
  tldrIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center', alignItems: 'center',
  },
  tldrItems: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    paddingHorizontal: 16, paddingBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tldrItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F5F5F5',
  },
  tldrItemText: { flex: 1, fontSize: 13, color: '#424242', fontWeight: '500', lineHeight: 18 },

  // ── SECTIONS ────────────────────────────────────────────────────────────────
  sectionsWrap: { paddingHorizontal: 16, gap: 8 },
  section: {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionOpen: { shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionNum: { width: 22 },
  sectionNumText: { fontSize: 11, fontWeight: '800', color: '#D0D0D0' },
  sectionIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  sectionTitleWrap: { flex: 1, gap: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', lineHeight: 19 },
  sectionTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5,
  },
  sectionTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },

  // Body
  sectionBody: {
    paddingHorizontal: 16, paddingBottom: 18, paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0',
  },
  bodyText: { fontSize: 13, color: '#555', lineHeight: 21, marginTop: 10, marginBottom: 8 },

  // Bullets with numbered markers
  bulletRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginTop: 10, gap: 12,
  },
  bulletMarker: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginTop: 1,
  },
  bulletMarkerNum: { fontSize: 10, fontWeight: '900', color: '#fff' },
  bulletBody: { flex: 1 },
  bulletHeading: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  bulletText: { fontSize: 13, color: '#757575', lineHeight: 19 },

  // Note box
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderLeftWidth: 3, backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 6, padding: 10, marginTop: 14,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  // Contact block
  contactBlock: {
    backgroundColor: '#F8FAFF', borderRadius: 12,
    marginTop: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E3F2FD',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEF4FF', gap: 12,
  },
  contactIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },

  // ── AGREEMENT CARD ───────────────────────────────────────────────────────────
  agreementCard: {
    backgroundColor: '#1A237E',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  agreementIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  agreementTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  agreementText: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 19, marginBottom: 14,
  },
  agreementMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agreementMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  agreementMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  footerLeafRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerBrand: { fontSize: 14, fontWeight: '800', color: '#9E9E9E' },
  footerSub: { fontSize: 12, color: '#BDBDBD' },
  footerLink: { marginTop: 4 },
  footerLinkText: { fontSize: 13, color: '#1565C0', fontWeight: '700' },
});

export default TermsOfServiceScreen;