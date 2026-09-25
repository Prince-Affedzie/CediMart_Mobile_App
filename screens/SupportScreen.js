// src/screens/main/SupportScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Teal + Coral palette — aligned with the rest of the app ───────────────
const C = {
  brand:       '#0D9488',
  brandL:      '#14B8A6',
  brandD:      '#0F766E',
  brandBg:     '#F0FDFA',
  brandBorder: '#99F6E4',
  accent:      '#F97316',
  accentBg:    '#FFF7ED',
  success:     '#059669',
  successBg:   '#ECFDF5',
  info:        '#0284C7',
  infoBg:      '#F0F9FF',
  danger:      '#DC2626',
  dangerBg:    '#FEF2F2',
  whatsapp:    '#25D366',
  text:        '#0F172A',
  textOff:     '#475569',
  textMuted:   '#94A3B8',
  border:      '#E2E8F0',
  surface:     '#FFFFFF',
  page:        '#F8FAFC',
  grayBg:      '#F1F5F9',
};

const SupportScreen = ({ navigation }) => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('general');

  const supportTopics = [
    { id: 'buying',   label: 'Buying',   icon: 'cart-outline' },
    { id: 'selling',  label: 'Selling',  icon: 'storefront-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
    { id: 'payment',  label: 'Payments', icon: 'card-outline' },
    { id: 'account',  label: 'Account',  icon: 'person-outline' },
    { id: 'general',  label: 'General',  icon: 'help-circle-outline' },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I buy an item on CediMart?',
      answer:
        'Browse listings from any city in Ghana, or search in plain language with CediAi. When you find something you like, tap "Add to Cart" and check out. Your payment is held securely in escrow until you confirm you\'ve received the item.',
      category: 'buying',
    },
    {
      id: 2,
      question: 'How does the escrow payment system work?',
      answer:
        'When you pay for an item, your money is held securely by CediMart — not sent directly to the seller. The funds are released to the seller only after you confirm that you\'ve received the item and it matches the description. This protects you from fraud and ensures sellers deliver what they promise.',
      category: 'payment',
    },
    {
      id: 3,
      question: 'How do I sell my items?',
      answer:
        'Tap "List Item" from your dashboard, upload clear photos, describe your item accurately, set your price, and choose your city and area. Your listing goes live immediately and is visible to buyers across Ghana — both nearby and nationwide.',
      category: 'selling',
    },
    {
      id: 4,
      question: 'How and when do I get paid as a seller?',
      answer:
        'After the buyer confirms delivery, your earnings (minus the platform commission) are released to your registered mobile money or bank account within 24–48 hours. You\'ll receive a notification when the payout is processed.',
      category: 'selling',
    },
    {
      id: 5,
      question: 'How does delivery work?',
      answer:
        'You can offer pickup, local delivery, or nationwide shipping depending on where you are. Buyers see your delivery options before they check out. For local orders, delivery typically takes 24–48 hours. You can track order status in the app.',
      category: 'delivery',
    },
    {
      id: 6,
      question: 'What if an item is not as described?',
      answer:
        'You have 24 hours from delivery to inspect the item. If it\'s significantly different from the description, damaged, or not what you ordered, report it immediately through the app. Our support team will investigate and facilitate a refund if warranted.',
      category: 'buying',
    },
    {
      id: 7,
      question: 'Is there a fee for selling on CediMart?',
      answer:
        'Yes, CediMart charges a small commission on each successful sale to cover platform operations, payment processing, and support. The exact rate is shown before you publish each listing. There are no upfront fees and no listing fees.',
      category: 'selling',
    },
    {
      id: 8,
      question: 'How do I reset my password?',
      answer:
        'On the login screen, tap "Forgot Password" and enter your registered phone number. We\'ll send you a verification code to reset your password securely.',
      category: 'account',
    },
    {
      id: 9,
      question: 'What items are prohibited?',
      answer:
        'We do not allow counterfeit goods, stolen items, weapons, alcohol, drugs, or any items that violate Ghanaian law or our community guidelines. Violations may result in permanent account suspension.',
      category: 'general',
    },
    {
      id: 10,
      question: 'How do I contact a seller?',
      answer:
        'You can message sellers directly through our in-app chat. Ask questions, negotiate, and confirm details — everything stays on CediMart. For your safety, we recommend keeping all communication inside the app rather than sharing personal phone numbers.',
      category: 'buying',
    },
    {
      id: 11,
      question: 'Where is CediMart available?',
      answer:
        'CediMart serves buyers and sellers across Ghana, with active vendors in Accra, Kumasi, Tema, Takoradi, Cape Coast, Tamale, Ho, Koforidua, and Sunyani — plus online-only shops that ship nationwide. More cities are added regularly.',
      category: 'general',
    },
    {
      id: 12,
      question: 'Can I buy from sellers in other cities?',
      answer:
        'Yes. Filter by city to find nearby vendors, or browse nationwide if you don\'t mind shipping. Many vendors offer delivery to your city, and some ship anywhere in Ghana.',
      category: 'buying',
    },
    {
      id: 13,
      question: 'What is video discovery on CediMart?',
      answer:
        'Sellers can post short product videos that show exactly what they\'re selling. You can watch, tap, and buy — all without leaving the app. Videos make it easier to judge condition, colour, and quality before you commit.',
      category: 'buying',
    },
    {
      id: 14,
      question: 'How do I build a following as a vendor?',
      answer:
        'Every vendor gets a public shop page with followers. Buyers can follow you to see new listings first. Post regular updates, respond to chats quickly, and deliver as promised — that\'s how you build a brand people come back to.',
      category: 'selling',
    },
  ];

  const handleCall = (phoneNumber) => {
    Alert.alert('Call Support', `Do you want to call ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
    ]);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:cedimart39@gmail.com?subject=CediMart Support Request');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233505671577?text=Hello%20CediMart%20Support');
  };

  const handleFAQToggle = (id) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const filteredFAQs =
    selectedTopic === 'all' ? faqs : faqs.filter((faq) => faq.category === selectedTopic);

  const channels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      sub: 'Fastest response',
      icon: 'logo-whatsapp',
      color: C.whatsapp,
      bg: '#F0FDF4',
      onPress: handleWhatsApp,
    },
    {
      id: 'call',
      label: 'Call Us',
      sub: '+233 50 567 1577',
      icon: 'call',
      color: C.info,
      bg: C.infoBg,
      onPress: () => handleCall('+233505671577'),
    },
    {
      id: 'email',
      label: 'Email',
      sub: 'Within 2 hours',
      icon: 'mail',
      color: C.danger,
      bg: C.dangerBg,
      onPress: handleEmail,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={C.brandD} barStyle="light-content" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroCircle3} />

          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Ionicons name="headset" size={34} color={C.brand} />
            </View>
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Our team is ready to assist you{'\n'}every step of the way
          </Text>

          <View style={styles.availPill}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Support available · 8AM – 8PM daily</Text>
          </View>
        </View>

        {/* Contact channels */}
        <View style={styles.channelsCard}>
          <Text style={styles.cardLabel}>REACH US VIA</Text>
          <View style={styles.channelsRow}>
            {channels.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.channelBtn, { backgroundColor: ch.bg }]}
                onPress={ch.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.channelIconWrap, { backgroundColor: ch.color }]}>
                  <Ionicons name={ch.icon} size={22} color="#fff" />
                </View>
                <Text style={[styles.channelLabel, { color: ch.color }]}>{ch.label}</Text>
                <Text style={styles.channelSub}>{ch.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vendor support card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="storefront-outline" size={16} color={C.brand} />
            </View>
            <Text style={styles.cardTitle}>Are you a vendor?</Text>
          </View>
          <Text style={styles.vendorInfoText}>
            If you sell on CediMart, check out the Vendor Support Center for
            information about payouts, commissions, delivery, audience building,
            and more.
          </Text>
          <TouchableOpacity
            style={styles.vendorLinkBtn}
            onPress={() => navigation.navigate('VendorSupport')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={14} color={C.brand} />
            <Text style={styles.vendorLinkText}>Go to Vendor Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <View style={styles.faqHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="chatbubble-ellipses" size={16} color={C.brand} />
              </View>
              <Text style={styles.cardTitle}>Frequently Asked</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTopic('all')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScroll}
          >
            <TouchableOpacity
              style={[styles.topicChip, selectedTopic === 'all' && styles.topicChipActive]}
              onPress={() => setSelectedTopic('all')}
            >
              <Text style={[styles.topicChipText, selectedTopic === 'all' && styles.topicChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {supportTopics.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.topicChip, selectedTopic === t.id && styles.topicChipActive]}
                onPress={() => setSelectedTopic(t.id)}
              >
                <Ionicons
                  name={t.icon}
                  size={12}
                  color={selectedTopic === t.id ? '#fff' : C.textMuted}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.topicChipText, selectedTopic === t.id && styles.topicChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.faqList}>
            {filteredFAQs.length === 0 ? (
              <View style={styles.emptyFAQ}>
                <Ionicons name="search-outline" size={40} color={C.border} />
                <Text style={styles.emptyFAQText}>No FAQs for this topic</Text>
                <TouchableOpacity onPress={() => setSelectedTopic('all')}>
                  <Text style={styles.emptyFAQLink}>View all FAQs →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFAQs.map((faq, idx) => (
                <View
                  key={faq.id}
                  style={[styles.faqItem, idx === filteredFAQs.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => handleFAQToggle(faq.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqNumBadge}>
                      <Text style={styles.faqNum}>{String(idx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.faqQ}>{faq.question}</Text>
                    <Ionicons
                      name={activeFAQ === faq.id ? 'remove' : 'add'}
                      size={20}
                      color={activeFAQ === faq.id ? C.brand : C.textMuted}
                    />
                  </TouchableOpacity>
                  {activeFAQ === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Support hours */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="time" size={16} color={C.brand} />
            </View>
            <Text style={styles.cardTitle}>Support Hours</Text>
          </View>
          <View style={styles.hoursTable}>
            {[
              { day: 'Monday – Friday', time: '8:00 AM – 8:00 PM', active: true },
              { day: 'Saturday', time: '9:00 AM – 6:00 PM', active: true },
              { day: 'Sunday', time: '10:00 AM – 4:00 PM', active: false },
            ].map((row, i) => (
              <View
                key={i}
                style={[styles.hoursRow, i < 2 && styles.hoursRowBorder]}
              >
                <View style={styles.hoursDayRow}>
                  <View style={[styles.hoursDot, !row.active && styles.hoursDotOff]} />
                  <Text style={styles.hoursDay}>{row.day}</Text>
                </View>
                <Text style={[styles.hoursTime, !row.active && styles.hoursTimeOff]}>
                  {row.time}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.holidayBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#92400E" />
            <Text style={styles.holidayBannerText}>Limited hours on public holidays</Text>
          </View>
        </View>

        {/* CTA footer */}
        <View style={styles.ctaFooter}>
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSub}>
            Our dedicated support team is standing by to resolve any issue
            quickly and professionally.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={handleWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Chat on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={handleEmail}
              activeOpacity={0.85}
            >
              <Ionicons name="mail-outline" size={16} color={C.brandD} />
              <Text style={styles.ctaSecondaryText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.page },

  topBar: {
    backgroundColor: C.brandD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 36 },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  homeBtn: { padding: 4, width: 36, alignItems: 'flex-end' },
  scrollContent: { paddingBottom: 20 },

  // Hero
  hero: {
    backgroundColor: C.brandD,
    paddingTop: 32,
    paddingBottom: 52,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', top: -60, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', top: 40, left: -50,
  },
  heroCircle3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, right: 30,
  },
  heroIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroIconInner: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    letterSpacing: -0.4, marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.72)',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  availPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, gap: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  availText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Channels card
  channelsCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: -26,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700',
    color: C.textMuted, letterSpacing: 1.2, marginBottom: 14,
  },
  channelsRow: { flexDirection: 'row', gap: 10 },
  channelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  channelIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  channelLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  channelSub: { fontSize: 10, color: C.textMuted, textAlign: 'center' },

  // Generic card
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16, flexWrap: 'wrap',
  },
  cardTitleIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15, fontWeight: '700',
    color: C.text, flex: 1,
  },

  // Vendor card
  vendorInfoText: {
    fontSize: 13, color: C.textOff,
    lineHeight: 20, marginBottom: 14,
  },
  vendorLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: C.brandBg,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.brandBorder,
  },
  vendorLinkText: { fontSize: 13, fontWeight: '700', color: C.brandD },

  // FAQ
  faqHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  seeAll: { fontSize: 13, color: C.brandD, fontWeight: '600' },
  topicsScroll: { paddingBottom: 16, gap: 8 },
  topicChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.grayBg,
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
  },
  topicChipActive: { backgroundColor: C.brandD },
  topicChipText: { fontSize: 12, fontWeight: '600', color: C.textOff },
  topicChipTextActive: { color: '#fff' },
  faqList: {},
  faqItem: { borderBottomWidth: 1, borderBottomColor: C.border },
  faqRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 12,
  },
  faqNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.brandBg,
    justifyContent: 'center', alignItems: 'center',
  },
  faqNum: { fontSize: 10, fontWeight: '800', color: C.brandD },
  faqQ: {
    flex: 1, fontSize: 14, fontWeight: '600',
    color: C.text, lineHeight: 20,
  },
  faqAnswer: { paddingLeft: 40, paddingBottom: 16, paddingRight: 4 },
  faqAnswerText: { fontSize: 13, color: C.textOff, lineHeight: 21 },
  emptyFAQ: { alignItems: 'center', paddingVertical: 32 },
  emptyFAQText: { fontSize: 14, color: C.textMuted, marginTop: 10, marginBottom: 8 },
  emptyFAQLink: { fontSize: 13, color: C.brand, fontWeight: '600' },

  // Hours
  hoursTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  hoursRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  hoursDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  hoursDotOff: { backgroundColor: C.border },
  hoursDay: { fontSize: 14, fontWeight: '500', color: '#374151' },
  hoursTime: { fontSize: 14, fontWeight: '700', color: C.brandD },
  hoursTimeOff: { color: C.textMuted },
  holidayBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12,
    gap: 8, borderWidth: 1, borderColor: '#FDE68A',
  },
  holidayBannerText: {
    fontSize: 12, color: '#92400E',
    fontWeight: '500', flex: 1,
  },

  // CTA footer
  ctaFooter: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.brandD,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
  },
  ctaTitle: {
    fontSize: 20, fontWeight: '800',
    color: '#fff', letterSpacing: -0.3, marginBottom: 8,
  },
  ctaSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.68)',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  ctaButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: C.whatsapp,
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: C.brandD },
});

export default SupportScreen;