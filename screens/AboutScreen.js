// src/screens/main/AboutScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const appStats = [
    { value: '5000+', label: 'Happy Customers', icon: 'people-outline' },
    { value: '100+', label: 'Local Farms', icon: 'leaf-outline' },
    { value: '50+', label: 'Fresh Products', icon: 'basket-outline' },
    { value: '24h', label: 'Delivery Time', icon: 'time-outline' },
  ];

  const features = [
    {
      id: 1,
      title: 'Farm Fresh Produce',
      description: 'Direct from local farms within 24 hours of harvest',
      icon: 'leaf',
    },
    {
      id: 2,
      title: 'Flexible Delivery',
      description: 'Choose your preferred delivery time',
      icon: 'bicycle',
    },
    {
      id: 3,
      title: 'Quality Guarantee',
      description: 'Freshness guaranteed on every order',
      icon: 'star',
    },
  ];

  const storySections = [
    {
      id: 'mission',
      title: 'Our Mission',
      content: 'To bridge the gap between local farmers and urban consumers by providing fresh, high-quality produce directly from farm to table. We aim to support local agriculture while ensuring our customers get the freshest products at fair prices.',
    },
    {
      id: 'story',
      title: 'Our Story',
      content: 'Founded in 2023, CediMart connects local farmers directly to your table. We noticed farmers struggled to get fair prices while consumers paid premium for produce that had lost freshness through multiple middlemen. We built a direct connection to solve both problems.',
    },
    {
      id: 'impact',
      title: 'Our Impact',
      content: '• Supporting 100+ local farming families\n• Reducing food waste by 40%\n• Creating 50+ direct jobs\n• Serving 5000+ happy households',
    },
  ];

  const appInfo = {
    version: '1.5.2',
    build: '2024.12.1',
    releaseDate: 'December 2024',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'CediMart',
        message: 'Check out CediMart - Fresh produce delivered to your doorstep! Download now: https://freshyfood.com/download',
        url: 'https://freshyfood.com',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Our App',
      'Would you like to rate CediMart on the app store?',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Rate Now', 
          onPress: () => Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID')
        }
      ]
    );
  };

  const handleSectionToggle = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      
      {/* Green Header - Matching other screens */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>About Us</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Ionicons name="home-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section - Simplified */}
        <View style={styles.heroSection}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.appName}>CediMart</Text>
            <Text style={styles.appTagline}>
              Fresh from farm to your table
            </Text>
            
          </View>
        </View>

        {/* Stats Section - Simplified */}
        <View style={styles.statsContainer}>
          {appStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Ionicons name={stat.icon} size={24} color="#2E7D32" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Story Sections - Clean accordion */}
        <View style={styles.storyContainer}>
          {storySections.map((section) => (
            <View key={section.id} style={styles.storyItem}>
              <TouchableOpacity
                style={styles.storyHeader}
                onPress={() => handleSectionToggle(section.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.storyTitle}>{section.title}</Text>
                <Ionicons 
                  name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {expandedSection === section.id && (
                <Text style={styles.storyContent}>{section.content}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Features - Horizontal scroll for cleaner look */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>What Makes Us Special</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresScroll}
          >
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={32} color="#4CAF50" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Partners - Simplified 
        <View style={styles.partnersContainer}>
          <Text style={styles.sectionTitle}>Our Partners</Text>
          <View style={styles.partnersRow}>
            <View style={styles.partnerItem}>
              <Ionicons name="business" size={28} color="#666" />
              <Text style={styles.partnerName}>Ministry of Food & Agriculture</Text>
            </View>
            <View style={styles.partnerItem}>
              <Ionicons name="leaf" size={28} color="#666" />
              <Text style={styles.partnerName}>Ghana Farmers Association</Text>
            </View>
          </View>
        </View>*/}

        {/* Legal Links - Clean list */}
        <View style={styles.legalContainer}>
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
          
          {/*<TouchableOpacity 
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://freshyfood.com/licenses')}
          >
            <Text style={styles.legalLinkText}>Licenses</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>*/}
        </View>

        {/* Rate App Button 
        <TouchableOpacity style={styles.rateButton} onPress={handleRateApp}>
          <Ionicons name="star" size={20} color="#FFC107" />
          <Text style={styles.rateButtonText}>Rate Our App</Text>
        </TouchableOpacity>*/}

        {/* Footer - Simplified */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2023-2026 CediMart. All rights reserved.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://freshyfoodfactory.com')}>
            <Text style={styles.websiteLink}>www.freshyfoodfactory.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  // ── TOP BAR (Green header like other screens) ──
  topBar: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { 
    padding: 4,
  },
  topBarTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
    position: 'relative',
  },
  
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Hero Section
  heroSection: {
    height: 220,
    backgroundColor: '#2E7D32',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 15,
    color: '#E8F5E8',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Stats Section - Clean grid without cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  
  // Story Section - Clean accordion
  storyContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  storyContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    paddingBottom: 16,
    paddingRight: 20,
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 16,
    marginLeft: 4,
  },
  
  // Features - Horizontal scroll cards
  featuresContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  featuresScroll: {
    paddingRight: 20,
  },
  featureCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  
  // Partners - Simplified
  partnersContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  partnerItem: {
    alignItems: 'center',
    flex: 1,
  },
  partnerName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Legal Links - Clean list
  legalContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legalLinkText: {
    fontSize: 15,
    color: '#212121',
  },
  
  // Rate Button
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFC107',
    gap: 8,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  
  // Footer - Simplified
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  websiteLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default AboutScreen;