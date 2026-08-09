// src/screens/opportunities/OpportunitiesScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

const OPPORTUNITY_TYPES = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'internship', label: 'Internships', icon: 'briefcase-outline', color: C.info, bg: C.infoBg },
  { key: 'scholarship', label: 'Scholarships', icon: 'school-outline', color: C.success, bg: C.successBg },
  { key: 'competition', label: 'Competitions', icon: 'trophy-outline', color: C.gold, bg: C.goldBg },
  { key: 'hackathon', label: 'Hackathons', icon: 'code-slash-outline', color: C.purple, bg: C.purpleBg },
  { key: 'fellowship', label: 'Fellowships', icon: 'star-outline', color: C.accent, bg: C.accentBg },
  { key: 'job', label: 'Part-time Jobs', icon: 'wallet-outline', color: '#EC4899', bg: '#FDF2F8' },
  { key: 'volunteer', label: 'Volunteer', icon: 'heart-outline', color: C.danger, bg: '#FEF2F2' },
];

// ─── Opportunity Card (Mock) ───────────────────────────────────────────────
const OpportunityCard = ({ item }) => {
  const typeCfg = OPPORTUNITY_TYPES.find(t => t.key === item.type) || OPPORTUNITY_TYPES[0];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Type badge */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardTypeBadge, { backgroundColor: typeCfg.bg }]}>
          <Ionicons name={typeCfg.icon} size={12} color={typeCfg.color} />
          <Text style={[styles.cardTypeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
        </View>
        {item.deadline && (
          <View style={styles.deadlineBadge}>
            <Ionicons name="time-outline" size={10} color={C.danger} />
            <Text style={styles.deadlineText}>{item.deadline}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardOrg}>{item.organization}</Text>

      {item.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      )}

      {/* Tags */}
      <View style={styles.cardTags}>
        {item.isRemote && (
          <View style={styles.tag}>
            <Ionicons name="laptop-outline" size={10} color={C.info} />
            <Text style={styles.tagText}>Remote</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={10} color={C.textOff} />
            <Text style={styles.tagText}>{item.location}</Text>
          </View>
        )}
        {item.compensation && (
          <View style={[styles.tag, { backgroundColor: C.successBg }]}>
            <Text style={[styles.tagText, { color: C.success }]}>{item.compensation}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const OpportunitiesScreen = () => {
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for boilerplate
  const mockOpportunities = [
    {
      id: '1',
      type: 'internship',
      title: 'Software Engineering Intern - Summer 2025',
      organization: 'Google',
      description: 'Join Google for a 12-week internship program. Work on real projects with experienced engineers.',
      location: 'Accra, Ghana',
      isRemote: false,
      compensation: 'Paid',
      deadline: '2d left',
    },
    {
      id: '2',
      type: 'scholarship',
      title: 'Mastercard Foundation Scholars Program',
      organization: 'Mastercard Foundation',
      description: 'Full scholarship covering tuition, accommodation, and living expenses for undergraduate students.',
      isRemote: false,
      compensation: 'Full Ride',
      deadline: '5d left',
    },
    {
      id: '3',
      type: 'hackathon',
      title: 'Campus Innovation Challenge 2025',
      organization: 'CediMart × UG',
      description: 'Build solutions for campus problems. Win prizes up to GH₵ 10,000.',
      location: 'University of Ghana',
      isRemote: false,
      compensation: 'GH₵ 10,000 prize',
      deadline: '1w left',
    },
    {
      id: '4',
      type: 'job',
      title: 'Campus Brand Ambassador',
      organization: 'CediMart',
      description: 'Represent CediMart on your campus. Earn commissions and build your network.',
      isRemote: true,
      compensation: 'Commission-based',
    },
    {
      id: '5',
      type: 'volunteer',
      title: 'Campus Clean-Up Initiative',
      organization: 'Green Campus Club',
      description: 'Join fellow students to keep our campus clean. Certificates provided.',
      location: 'Main Campus',
      isRemote: false,
      deadline: '3d left',
    },
    {
      id: '6',
      type: 'competition',
      title: 'National Student Entrepreneurship Challenge',
      organization: 'Ghana Startup Network',
      description: 'Pitch your business idea to top investors. Win mentorship and seed funding.',
      location: 'Accra International Conference Centre',
      isRemote: false,
      compensation: 'Seed Funding',
      deadline: '2w left',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opportunities</Text>
        <Text style={styles.headerSubtitle}>Discover your next big break</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {OPPORTUNITY_TYPES.map(type => {
          const isActive = activeType === type.key;
          return (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveType(type.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={type.icon}
                size={14}
                color={isActive ? '#fff' : C.textOff}
              />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {mockOpportunities.map(item => (
          <OpportunityCard key={item.id} item={item} />
        ))}

        {/* Empty state placeholder */}
        <View style={styles.placeholderNote}>
          <Ionicons name="construct-outline" size={20} color={C.textMuted} />
          <Text style={styles.placeholderText}>
            This is a boilerplate screen. API integration coming soon.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },

  // Search
  searchContainer: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.surface },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },

  // Filter
  filterScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  filterChipText: { fontSize: 12.5, fontWeight: '600', color: C.textOff },
  filterChipTextActive: { color: '#fff' },

  // List
  listContent: { padding: 12, gap: 10 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardTypeText: { fontSize: 10.5, fontWeight: '700' },
  deadlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF2F2', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  deadlineText: { fontSize: 10, fontWeight: '700', color: C.danger },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 22, marginBottom: 4 },
  cardOrg: { fontSize: 13, color: C.brand, fontWeight: '600', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: C.textOff, lineHeight: 19, marginBottom: 10 },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  tagText: { fontSize: 10.5, fontWeight: '600', color: C.textOff },

  // Placeholder
  placeholderNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 20,
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1,
    borderColor: C.border, borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 12.5, color: C.textMuted, fontWeight: '500' },
});

export default OpportunitiesScreen;