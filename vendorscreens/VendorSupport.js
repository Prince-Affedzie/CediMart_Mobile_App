// src/vendorscreens/VendorSupportScreen.js
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const VendorSupportScreen = ({ navigation }) => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const supportTopics = [
    { id: 'selling', label: 'Selling', icon: 'storefront-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
    { id: 'payments', label: 'Payments', icon: 'card-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I list a product for sale?',
      answer: 'Tap the "Add Product" button on your dashboard, upload photos, fill in the product details (name, category, condition, price), select your campus, and publish. Your listing will be visible to students on your campus immediately.',
      category: 'selling',
    },
    {
      id: 2,
      question: 'How does the escrow payment system work?',
      answer: 'When a customer places an order, the payment is held securely by Cedimart in escrow. The funds are only released to you after the order has been confirmed as delivered — either by our delivery team or directly from you to the customer. This protects both you and the buyer.',
      category: 'payments',
    },
    {
      id: 3,
      question: 'When do I receive my money after a sale?',
      answer: 'Your earnings are released to your registered mobile money account or bank account within 24-48 hours after the order is confirmed as delivered. You\'ll receive a notification when the funds have been transferred.',
      category: 'payments',
    },
    {
      id: 4,
      question: 'Are there any fees or commissions?',
      answer: 'Yes, Cedimart charges a small commission on each successful sale to cover platform operations, payment processing, and delivery logistics. The exact commission rate is shown before you publish each listing and is deducted from the sale amount before your payout.',
      category: 'payments',
    },
    {
      id: 5,
      question: 'How does delivery work?',
      answer: 'Cedimart handles all deliveries. Once an order is placed, our delivery team will pick up the item from you (or you can drop it off at our campus collection point) and deliver it to the customer. You\'ll be notified at each stage — pickup, in transit, and delivered.',
      category: 'delivery',
    },
    {
      id: 6,
      question: 'What if a customer wants to return an item?',
      answer: 'If a customer reports an issue within 24 hours of delivery, our support team will review the case. If the item is not as described or damaged, we facilitate a return and refund. We always contact you first to resolve the matter fairly.',
      category: 'selling',
    },
    {
      id: 7,
      question: 'How do I update my store profile?',
      answer: 'Go to your Account screen from the dashboard. You can update your store name, profile photo, store banner, campus area, phone number, and bio. Tap the edit icon to make changes, then save.',
      category: 'account',
    },
    {
      id: 8,
      question: 'Why is my store showing as "Pending Verification"?',
      answer: 'All new vendor accounts go through a verification process to ensure trust and safety on the platform. This usually takes 24-48 hours. Once verified, you\'ll receive a notification and your store will show as "Verified" — which increases buyer confidence.',
      category: 'account',
    },
    {
      id: 9,
      question: 'Can I sell on multiple campuses?',
      answer: 'Currently, your store is linked to one primary campus. However, students from other campuses can still discover your products through search. We recommend setting your campus to where you\'re physically located for easier delivery logistics.',
      category: 'selling',
    },
    {
      id: 10,
      question: 'How do I handle a dispute with a buyer?',
      answer: 'If there\'s a disagreement with a buyer, contact our support team immediately via WhatsApp or phone. We\'ll mediate the situation fairly, reviewing product descriptions, photos, and communication history to reach a resolution.',
      category: 'general',
    },
    {
      id: 11,
      question: 'What products are prohibited from sale?',
      answer: 'We do not allow the sale of counterfeit goods, stolen items, weapons, alcohol, drugs, or any items that violate university policies or Ghanaian law. Violations may result in account suspension.',
      category: 'general',
    },
    {
      id: 12,
      question: 'How do I boost my product visibility?',
      answer: 'Use clear, well-lit photos, write detailed descriptions, set competitive prices, and select relevant categories and tags like "Featured" or "Student Favorite". Products with better ratings and more views naturally rank higher.',
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
    Linking.openURL('mailto:vendors@cedimart.com?subject=Cedimart Vendor Support');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233505671577?text=Hello%20Cedimart%20Vendor%20Support');
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
      color: '#25D366',
      bg: '#F0FDF4',
      onPress: handleWhatsApp,
    },
    {
      id: 'call',
      label: 'Call Us',
      sub: '+233 50 567 1577',
      icon: 'call',
      color: '#1565C0',
      bg: '#EFF6FF',
      onPress: () => handleCall('+233505671577'),
    },
    {
      id: 'email',
      label: 'Email',
      sub: 'Within 2 hours',
      icon: 'mail',
      color: '#C62828',
      bg: '#FEF2F2',
      onPress: handleEmail,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Vendor Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Ionicons name="storefront" size={34} color="#2E7D32" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Vendor Help Center</Text>
          <Text style={styles.heroSub}>
            Everything you need to know{'\n'}about selling on Cedimart
          </Text>

          <View style={styles.availPill}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Vendor support · 8AM – 8PM daily</Text>
          </View>
        </View>

        {/* ── HOW IT WORKS ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HOW CEDIMART WORKS FOR YOU</Text>
          <View style={styles.stepsContainer}>
            {[
              { icon: 'camera-outline', title: 'List Your Items', desc: 'Upload photos, set your price, and publish to your campus' },
              { icon: 'cart-outline', title: 'We Handle Orders', desc: 'Customers buy through the app, payment is held securely in escrow' },
              { icon: 'bicycle-outline', title: 'We Deliver', desc: 'Our team picks up and delivers to the customer' },
              { icon: 'wallet-outline', title: 'You Get Paid', desc: 'Funds released to you after confirmed delivery' },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={[styles.stepIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name={step.icon} size={20} color="#2E7D32" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Escrow notice */}
          <View style={styles.escrowBanner}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#166534" />
            <View style={{ flex: 1 }}>
              <Text style={styles.escrowTitle}>Secure Escrow Payments</Text>
              <Text style={styles.escrowText}>
                All payments are held securely until the buyer confirms delivery. Your money is always protected.
              </Text>
            </View>
          </View>
        </View>

        {/* ── FEES & COMMISSION ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="calculator-outline" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Commission & Fees</Text>
          </View>

          <View style={styles.feeTable}>
            <View style={styles.feeRow}>
              <View style={styles.feeInfo}>
                <Ionicons name="pricetag-outline" size={16} color="#2E7D32" />
                <Text style={styles.feeLabel}>Platform Commission</Text>
              </View>
              <Text style={styles.feeValue}>10% per sale</Text>
            </View>
            <View style={styles.feeRow}>
              <View style={styles.feeInfo}>
                <Ionicons name="card-outline" size={16} color="#2E7D32" />
                <Text style={styles.feeLabel}>Payment Processing</Text>
              </View>
              <Text style={styles.feeValue}>Included</Text>
            </View>
            <View style={styles.feeRow}>
              <View style={styles.feeInfo}>
                <Ionicons name="bicycle-outline" size={16} color="#2E7D32" />
                <Text style={styles.feeLabel}>Delivery Logistics</Text>
              </View>
              <Text style={styles.feeValue}>Included</Text>
            </View>
          </View>

          <View style={styles.feeExample}>
            <Text style={styles.feeExampleTitle}>Example Payout</Text>
            <View style={styles.feeExampleRow}>
              <Text style={styles.feeExampleLabel}>Product sold for</Text>
              <Text style={styles.feeExampleValue}>GH₵ 100.00</Text>
            </View>
            <View style={styles.feeExampleRow}>
              <Text style={styles.feeExampleLabel}>Commission (10%)</Text>
              <Text style={[styles.feeExampleValue, { color: '#E53935' }]}>- GH₵ 10.00</Text>
            </View>
            <View style={styles.feeExampleDivider} />
            <View style={styles.feeExampleRow}>
              <Text style={[styles.feeExampleLabel, { fontWeight: '800' }]}>You receive</Text>
              <Text style={[styles.feeExampleValue, { color: '#2E7D32', fontWeight: '800' }]}>GH₵ 90.00</Text>
            </View>
          </View>
        </View>

        {/* ── CONTACT CHANNELS ── */}
        <View style={styles.channelsCard}>
          <Text style={styles.cardLabel}>REACH VENDOR SUPPORT</Text>
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

        {/* ── FAQ ── */}
        <View style={styles.card}>
          <View style={styles.faqHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#2E7D32" />
              </View>
              <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
            </View>
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
                  color={selectedTopic === t.id ? '#fff' : '#6B7280'}
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
                <Ionicons name="search-outline" size={40} color="#D1D5DB" />
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
                      color={activeFAQ === faq.id ? '#2E7D32' : '#9CA3AF'}
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

        {/* ── CTA FOOTER ── */}
        <View style={styles.ctaFooter}>
          <View style={styles.ctaIconRow}>
            <View style={styles.ctaIcon}>
              <Ionicons name="headset" size={22} color="#2E7D32" />
            </View>
          </View>
          <Text style={styles.ctaTitle}>Need urgent help?</Text>
          <Text style={styles.ctaSub}>
            Our vendor support team is ready to assist with any issues — from orders and payments to account questions.
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
              onPress={() => handleCall('+233505671577')}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={16} color="#2E7D32" />
              <Text style={styles.ctaSecondaryText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F4' },

  topBar: {
    backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 36 },
  topBarTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: 0.3,
  },

  scrollContent: { paddingBottom: 20 },

  // Hero
  hero: {
    backgroundColor: '#1B5E20',
    borderTopLeftRadius:12,
    borderTopRightRadius:12,
    marginHorizontal: 8,
    marginBottom:8,
    paddingTop: 32, paddingBottom: 52,
    alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', top: -50, right: -50,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', top: 50, left: -40,
  },
  heroIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
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
    borderRadius: 20, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  availText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 14,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055, shadowRadius: 12, elevation: 3,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 1.2, marginBottom: 16,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardTitleIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  // How it works steps
  stepsContainer: { gap: 4, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  stepDesc: { fontSize: 11, color: '#6B7280', lineHeight: 15 },

  // Escrow banner
  escrowBanner: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'flex-start',
  },
  escrowTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 3 },
  escrowText: { fontSize: 11, color: '#166534', lineHeight: 17 },

  // Fees
  feeTable: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 14,
  },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  feeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  feeValue: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  feeExample: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  feeExampleTitle: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  feeExampleRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3,
  },
  feeExampleLabel: { fontSize: 12, color: '#92400E' },
  feeExampleValue: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  feeExampleDivider: {
    height: 1, backgroundColor: '#FDE68A', marginVertical: 6,
  },

  // Channels
  channelsCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: -26,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09, shadowRadius: 20, elevation: 8, marginBottom: 14,
  },
  channelsRow: { flexDirection: 'row', gap: 10 },
  channelBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  channelIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  channelLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  channelSub: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  // FAQ
  faqHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  topicsScroll: { paddingBottom: 16, gap: 8 },
  topicChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
  },
  topicChipActive: { backgroundColor: '#2E7D32' },
  topicChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  topicChipTextActive: { color: '#fff' },
  faqList: {},
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  faqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  faqNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  faqNum: { fontSize: 10, fontWeight: '800', color: '#166534' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  faqAnswer: { paddingLeft: 40, paddingBottom: 16, paddingRight: 4 },
  faqAnswerText: { fontSize: 13, color: '#6B7280', lineHeight: 21 },
  emptyFAQ: { alignItems: 'center', paddingVertical: 32 },
  emptyFAQText: { fontSize: 14, color: '#9CA3AF', marginTop: 10, marginBottom: 8 },
  emptyFAQLink: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // CTA Footer
  ctaFooter: {
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 22, overflow: 'hidden',
    backgroundColor: '#1B5E20', padding: 28,
    alignItems: 'center', position: 'relative',
  },
  ctaIconRow: { marginBottom: 14 },
  ctaIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff',
    letterSpacing: -0.3, marginBottom: 8,
  },
  ctaSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.68)',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  ctaButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});

export default VendorSupportScreen;