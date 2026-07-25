// src/screens/main/PrivacyPolicyScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

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

const PrivacyPolicyScreen = ({ navigation }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleEmailPress = () => Linking.openURL('mailto:privacy@cedimart.com');
  const handleWebsitePress = () => Linking.openURL('https://cedimart.com');

  return (
    <SafeAreaView style={styles.container}>
      {/*<Header title="Privacy Policy" showBack onBackPress={() => navigation.goBack()} />*/}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              
              <Text style={styles.appName}>CediMart</Text>
            </View>
            <Text style={styles.lastUpdated}>Last Updated: {currentDate}</Text>
          </View>

          {/* 1. Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to CediMart ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
            </Text>
            <Text style={styles.paragraph}>
              Please read this Privacy Policy carefully. By accessing or using our application, you agree to the collection and use of information in accordance with this policy.
            </Text>
          </View>

          {/* 2. Information We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>

            <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
            <Text style={styles.paragraph}>When you create an account or use our services, we may collect:</Text>
            <View style={styles.bulletList}>
              {['Name and contact details (first name, last name, email address, phone number)', 'Delivery address and location information', 'Payment information (processed securely through our payment partners)', 'Account credentials'].map((text, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{text}</Text></View>
              ))}
            </View>

            <Text style={styles.subsectionTitle}>2.2 Usage Information</Text>
            <Text style={styles.paragraph}>We automatically collect information about your interaction with our application:</Text>
            <View style={styles.bulletList}>
              {['Device information (type, operating system, unique device identifiers)', 'Log data (IP address, browser type, pages visited, access times)', 'App usage patterns and preferences'].map((text, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{text}</Text></View>
              ))}
            </View>

            <Text style={styles.subsectionTitle}>2.3 Order Information</Text>
            <Text style={styles.paragraph}>When you place orders, we collect:</Text>
            <View style={styles.bulletList}>
              {['Order history and preferences', 'Product preferences and favorites', 'Shopping cart information'].map((text, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{text}</Text></View>
              ))}
            </View>
          </View>

          {/* 3. How We Use Your Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>We use the information we collect for various purposes:</Text>
            <View style={styles.bulletList}>
              {[
                { b: 'To provide our services:', t: 'Process orders, manage your account, and deliver products' },
                { b: 'To communicate with you:', t: 'Send order confirmations, delivery updates, and customer support' },
                { b: 'To improve our services:', t: 'Analyze usage patterns and enhance user experience' },
                { b: 'For security:', t: 'Protect against fraud and unauthorized access' },
                { b: 'For personalization:', t: 'Recommend products based on your preferences' },
              ].map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}><Text style={styles.bold}>{item.b}</Text> {item.t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 4. Data Sharing and Disclosure */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Sharing and Disclosure</Text>
            <Text style={styles.paragraph}>We may share your information in the following circumstances:</Text>
            <Text style={styles.subsectionTitle}>4.1 Service Providers</Text>
            <Text style={styles.paragraph}>We share information with third-party vendors who perform services on our behalf:</Text>
            <View style={styles.bulletList}>
              {['Payment processors', 'Delivery and logistics partners', 'Cloud hosting services', 'Analytics providers'].map((text, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{text}</Text></View>
              ))}
            </View>
            <Text style={styles.subsectionTitle}>4.2 Legal Requirements</Text>
            <Text style={styles.paragraph}>We may disclose your information if required by law or in response to valid requests by public authorities.</Text>
            <Text style={styles.subsectionTitle}>4.3 Business Transfers</Text>
            <Text style={styles.paragraph}>In the event of a merger, acquisition, or asset sale, your personal information may be transferred.</Text>
          </View>

          {/* 5-10. (Kept same structure, just color updates) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Data Security</Text>
            <Text style={styles.paragraph}>We implement appropriate technical and organizational security measures to protect your personal information. These include:</Text>
            <View style={styles.bulletList}>
              {['Encryption of sensitive data', 'Secure server infrastructure', 'Regular security assessments', 'Access controls and authentication'].map((text, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{text}</Text></View>
              ))}
            </View>
            <Text style={styles.paragraph}>While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.paragraph}>Depending on your location, you may have the following rights regarding your personal information:</Text>
            <View style={styles.bulletList}>
              {[
                { b: 'Access:', t: 'Request a copy of your personal data' },
                { b: 'Correction:', t: 'Update or correct inaccurate information' },
                { b: 'Deletion:', t: 'Request deletion of your personal data' },
                { b: 'Objection:', t: 'Object to certain data processing activities' },
                { b: 'Portability:', t: 'Request transfer of your data to another service' },
              ].map((item, i) => (
                <View key={i} style={styles.bulletItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}><Text style={styles.bold}>{item.b}</Text> {item.t}</Text></View>
              ))}
            </View>
            <Text style={styles.paragraph}>To exercise these rights, please contact us using the information provided below.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Retention</Text>
            <Text style={styles.paragraph}>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.</Text>
            <Text style={styles.paragraph}>Account information is retained while your account is active. Transaction records are kept for legal and accounting purposes as required by applicable laws.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.paragraph}>Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. International Transfers</Text>
            <Text style={styles.paragraph}>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from those in your country.</Text>
            <Text style={styles.paragraph}>We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.paragraph}>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</Text>
            <Text style={styles.paragraph}>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</Text>
          </View>

          {/* 11. Contact Us */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.paragraph}>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</Text>
            <View style={styles.contactInfo}>
              <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                <Ionicons name="mail-outline" size={20} color={C.brand} />
                <Text style={styles.contactText}>privacy@cedimart.com</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
                <Ionicons name="globe-outline" size={20} color={C.brand} />
                <Text style={styles.contactText}>www.cedimart.com</Text>
              </TouchableOpacity>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={20} color={C.brand} />
                <Text style={styles.contactText}>CediMart Headquarters{'\n'}Accra, Ghana</Text>
              </View>
            </View>
          </View>

          {/* Acceptance */}
          <View style={styles.acceptanceSection}>
            <Text style={styles.acceptanceText}>
              By using CediMart, you acknowledge that you have read and understood this Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: '700', color: C.brand, marginLeft: 10 },
  lastUpdated: { fontSize: 14, color: C.t2, fontStyle: 'italic' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.brandD, marginBottom: 12, lineHeight: 24 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', color: C.brand, marginTop: 15, marginBottom: 8, lineHeight: 22 },
  paragraph: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 12 },
  bulletList: { marginLeft: 10, marginBottom: 12 },
  bulletItem: { flexDirection: 'row', marginBottom: 8 },
  bullet: { fontSize: 16, color: C.brand, marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, color: '#333', lineHeight: 22 },
  bold: { fontWeight: '600', color: C.brandD },
  contactInfo: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 16, marginTop: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  contactText: { flex: 1, fontSize: 15, color: '#333', marginLeft: 12, lineHeight: 22 },
  acceptanceSection: { backgroundColor: C.brandBg, borderRadius: 10, padding: 20, marginTop: 20, borderWidth: 1, borderColor: C.brandBorder },
  acceptanceText: { fontSize: 15, color: C.brand, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});

export default PrivacyPolicyScreen;