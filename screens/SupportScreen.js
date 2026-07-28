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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SupportScreen = ({ navigation }) => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const supportTopics = [
    { id: 'buying', label: 'Buying', icon: 'cart-outline' },
    { id: 'selling', label: 'Selling', icon: 'storefront-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
    { id: 'payment', label: 'Payments', icon: 'card-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I buy an item on CediMart?',
      answer: 'Browse listings on your campus or search across all campuses. When you find something you like, tap "Add to Cart" and proceed to checkout. Your payment is held securely in escrow until you confirm you\'ve received the item.',
      category: 'buying',
    },
    {
      id: 2,
      question: 'How does the escrow payment system work?',
      answer: 'When you pay for an item, your money is held securely by CediMart — not sent directly to the seller. The funds are only released to the seller after you confirm that you\'ve received the item and it matches the description. This protects you from fraud and ensures sellers deliver what they promise.',
      category: 'payment',
    },
    {
      id: 3,
      question: 'How do I sell my items?',
      answer: 'Tap "List Item" from your dashboard, upload clear photos, describe your item accurately, set your price, and choose your campus. Your listing goes live immediately and is visible to students on your campus and beyond.',
      category: 'selling',
    },
    {
      id: 4,
      question: 'How and when do I get paid as a seller?',
      answer: 'After the buyer confirms delivery, your earnings (minus the platform commission) are released to your registered mobile money or bank account within 24-48 hours. You\'ll receive a notification when the payout is processed.',
      category: 'selling',
    },
    {
      id: 5,
      question: 'How does delivery work?',
      answer: 'CediMart handles all deliveries. After an order is placed, our delivery team picks up the item from the seller and delivers it to you. Standard delivery takes 24-48 hours. You can track your order status in the app.',
      category: 'delivery',
    },
    {
      id: 6,
      question: 'What if an item is not as described?',
      answer: 'You have 24 hours from delivery to inspect the item. If it\'s significantly different from the description, damaged, or not what you ordered, report it immediately through the app. Our support team will investigate and facilitate a refund if warranted.',
      category: 'buying',
    },
    {
      id: 7,
      question: 'Is there a fee for selling on CediMart?',
      answer: 'Yes, CediMart charges a small commission on each successful sale to cover platform operations, payment processing, and delivery logistics. The exact rate is shown before you publish each listing. There are no upfront or listing fees.',
      category: 'selling',
    },
    {
      id: 8,
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password" and enter your registered phone number. We\'ll send you a verification code to reset your password securely.',
      category: 'account',
    },
    {
      id: 9,
      question: 'What items are prohibited?',
      answer: 'We do not allow counterfeit goods, stolen items, weapons, alcohol, drugs, or any items violating university policies or Ghanaian law. Violations may result in permanent account suspension.',
      category: 'general',
    },
    {
      id: 10,
      question: 'How do I contact a seller?',
      answer: 'You can message sellers directly through our in-app chat feature. For your safety, we recommend keeping all communication within the app rather than sharing personal phone numbers.',
      category: 'buying',
    },
    {
      id: 11,
      question: 'Which campuses are supported?',
      answer: 'CediMart is available at University of Ghana (UG), KNUST, UCC, UEW, UPSA, Ashesi, GIMPA, and ATU. We\'re expanding to more campuses soon!',
      category: 'general',
    },
    {
      id: 12,
      question: 'Can I buy from sellers on other campuses?',
      answer: 'Yes! You can browse and purchase items from any of our partner campuses. Our delivery team handles cross-campus deliveries so you can shop from a wider selection.',
      category: 'buying',
    },
  ];

  const handleCall = (phoneNumber) => {
    Alert.alert('Call Support', `Do you want to call ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
    ]);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@cedimart.com?subject=CediMart Support Request');
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
      <StatusBar backgroundColor="#0F766E" barStyle="light-content" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroCircle3} />

          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Ionicons name="headset" size={34} color="#2E7D32" />
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

        {/* Contact Channels */}
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

        {/* For Sellers Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="storefront-outline" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Are you a vendor?</Text>
          </View>
          <Text style={styles.vendorInfoText}>
            If you're selling on CediMart, check out our dedicated Vendor Support Center for information about payouts, commissions, delivery, and more.
          </Text>
          <TouchableOpacity
            style={styles.vendorLinkBtn}
            onPress={() => navigation.navigate('VendorSupport')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={14} color="#2E7D32" />
            <Text style={styles.vendorLinkText}>Go to Vendor Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <View style={styles.faqHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#2E7D32" />
              </View>
              <Text style={styles.cardTitle}>Frequently Asked</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTopic('all')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
            <TouchableOpacity
              style={[styles.topicChip, selectedTopic === 'all' && styles.topicChipActive]}
              onPress={() => setSelectedTopic('all')}
            >
              <Text style={[styles.topicChipText, selectedTopic === 'all' && styles.topicChipTextActive]}>All</Text>
            </TouchableOpacity>
            {supportTopics.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.topicChip, selectedTopic === t.id && styles.topicChipActive]}
                onPress={() => setSelectedTopic(t.id)}
              >
                <Ionicons name={t.icon} size={12} color={selectedTopic === t.id ? '#fff' : '#6B7280'} style={{ marginRight: 5 }} />
                <Text style={[styles.topicChipText, selectedTopic === t.id && styles.topicChipTextActive]}>{t.label}</Text>
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
                <View key={faq.id} style={[styles.faqItem, idx === filteredFAQs.length - 1 && { borderBottomWidth: 0 }]}>
                  <TouchableOpacity style={styles.faqRow} onPress={() => handleFAQToggle(faq.id)} activeOpacity={0.7}>
                    <View style={styles.faqNumBadge}>
                      <Text style={styles.faqNum}>{String(idx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.faqQ}>{faq.question}</Text>
                    <Ionicons name={activeFAQ === faq.id ? 'remove' : 'add'} size={20} color={activeFAQ === faq.id ? '#2E7D32' : '#9CA3AF'} />
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

        {/* Business Hours */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleIcon}>
              <Ionicons name="time" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Support Hours</Text>
          </View>
          <View style={styles.hoursTable}>
            {[
              { day: 'Monday – Friday', time: '8:00 AM – 8:00 PM', active: true },
              { day: 'Saturday', time: '9:00 AM – 6:00 PM', active: true },
              { day: 'Sunday', time: '10:00 AM – 4:00 PM', active: false },
            ].map((row, i) => (
              <View key={i} style={[styles.hoursRow, i < 2 && styles.hoursRowBorder]}>
                <View style={styles.hoursDayRow}>
                  <View style={[styles.hoursDot, !row.active && styles.hoursDotOff]} />
                  <Text style={styles.hoursDay}>{row.day}</Text>
                </View>
                <Text style={[styles.hoursTime, !row.active && styles.hoursTimeOff]}>{row.time}</Text>
              </View>
            ))}
          </View>
          <View style={styles.holidayBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#92400E" />
            <Text style={styles.holidayBannerText}>Limited hours on public holidays</Text>
          </View>
        </View>

        {/* CTA Footer */}
        <View style={styles.ctaFooter}>
         
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSub}>
            Our dedicated support team is standing by to resolve any issue quickly and professionally.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={handleWhatsApp} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Chat on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondary} onPress={handleEmail} activeOpacity={0.85}>
              <Ionicons name="mail-outline" size={16} color="#2E7D32" />
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
  container: { flex: 1, backgroundColor: '#F4F6F4' },
  topBar: { backgroundColor: '#0F766E', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { padding: 4, width: 36 },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  homeBtn: { padding: 4, width: 36, alignItems: 'flex-end' },
  scrollContent: { paddingBottom: 20 },

  hero: { backgroundColor: '#0F766E', paddingTop: 32, paddingBottom: 52, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', top: -60, right: -60 },
  heroCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', top: 40, left: -50 },
  heroCircle3: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, right: 30 },
  heroIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  heroIconInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 10 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  availPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  availText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  channelsCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -26, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 20, elevation: 8, marginBottom: 14 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.2, marginBottom: 14 },
  channelsRow: { flexDirection: 'row', gap: 10 },
  channelBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  channelIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  channelLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  channelSub: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 14, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.055, shadowRadius: 12, elevation: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  cardTitleIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },

  vendorInfoText: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 14 },
  vendorLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  vendorLinkText: { fontSize: 13, fontWeight: '700', color: '#0F766E' },

  faqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { fontSize: 13, color: '#0F766E', fontWeight: '600' },
  topicsScroll: { paddingBottom: 16, gap: 8 },
  topicChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  topicChipActive: { backgroundColor: '#0F766E' },
  topicChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  topicChipTextActive: { color: '#fff' },
  faqList: {},
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  faqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  faqNumBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  faqNum: { fontSize: 10, fontWeight: '800', color: '#166534' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  faqAnswer: { paddingLeft: 40, paddingBottom: 16, paddingRight: 4 },
  faqAnswerText: { fontSize: 13, color: '#6B7280', lineHeight: 21 },
  emptyFAQ: { alignItems: 'center', paddingVertical: 32 },
  emptyFAQText: { fontSize: 14, color: '#9CA3AF', marginTop: 10, marginBottom: 8 },
  emptyFAQLink: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  hoursTable: { backgroundColor: '#F9FAFB', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  hoursRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  hoursDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  hoursDotOff: { backgroundColor: '#D1D5DB' },
  hoursDay: { fontSize: 14, fontWeight: '500', color: '#374151' },
  hoursTime: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  hoursTimeOff: { color: '#9CA3AF' },
  holidayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#FDE68A' },
  holidayBannerText: { fontSize: 12, color: '#92400E', fontWeight: '500', flex: 1 },

  ctaFooter: { marginHorizontal: 16, marginBottom: 8, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0F766E', padding: 28, alignItems: 'center', position: 'relative' },
  ctaIconRow: { marginBottom: 14 },
  ctaIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 8 },
  ctaSub: { fontSize: 13, color: 'rgba(255,255,255,0.68)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  ctaButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  ctaPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 14, gap: 8 },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 14, borderRadius: 14, gap: 8 },
  ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
});

export default SupportScreen;