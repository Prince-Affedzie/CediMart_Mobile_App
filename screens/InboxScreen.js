// screens/InboxScreen.jsx
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl, TextInput,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#F8FAFC',
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
  border:       '#F1F5F9',
  gray50:       '#FAFAFA',
  gray100:      '#F5F5F5',
  gray200:      '#E5E7EB',
};

const REFRESH_COOLDOWN_MS = 30_000;

// A small on-brand rotation so different contacts get visually distinct
// avatar colors (when they have no photo) instead of every fallback
// avatar looking identical — picked deterministically per person.
const AVATAR_PALETTE = [
  { bg: C.brandBg, fg: C.brand },
  { bg: C.accentBg, fg: C.accent },
  { bg: C.infoBg, fg: C.info },
  { bg: '#F5F3FF', fg: '#7C3AED' },
  { bg: '#FDF2F8', fg: '#EC4899' },
  { bg: '#FFFBEB', fg: '#B45309' },
];

const getAvatarColors = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const getOtherParty = (conv, userId) => {
  const buyerId = conv.buyer?._id?.toString() || conv.buyer?.toString();
  const isBuyer = buyerId === userId;
  return isBuyer ? conv.seller : conv.buyer;
};

const getDisplayName = (party) => {
  if (!party) return 'Unknown User';
  if (party.firstName) return party.lastName ? `${party.firstName} ${party.lastName}` : party.firstName;
  if (party.name) return party.name;
  return 'Unknown User';
};

const getAvatarLetter = (party) => {
  if (!party) return '?';
  if (party.firstName) return party.firstName.charAt(0).toUpperCase();
  if (party.name) return party.name.charAt(0).toUpperCase();
  return '?';
};

const getProductName = (product) => {
  if (!product) return 'Product';
  return product.name || product.title || 'Product';
};

function InboxScreen({ navigation }) {
  const { inbox, inboxLoading, loadInbox } = useChat();
  const { user } = useAuth();
  const lastLoadedAt = useRef(null);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const noticeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!user?._id) return;
      const now = Date.now();
      const sinceLastLoad = now - (lastLoadedAt.current ?? 0);
      if (sinceLastLoad >= REFRESH_COOLDOWN_MS) {
        loadInbox().then(() => { lastLoadedAt.current = Date.now(); });
      }
    }, [user?._id, loadInbox])
  );

  const handleManualRefresh = useCallback(() => {
    loadInbox().then(() => { lastLoadedAt.current = Date.now(); });
  }, [loadInbox]);

  const handleDismissNotice = () => {
    Animated.timing(noticeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setNoticeVisible(false));
  };

  const handleOpen = (conversation) => {
    if (!conversation) return;
    navigation.navigate('ChatScreen', { conversation });
  };

  const userId = user?._id?.toString();

  // Local, instant filter — no need to round-trip to the server for
  // something this small, and it keeps the inbox feeling snappy.
  const filteredInbox = useMemo(() => {
    if (!searchQuery.trim() || !userId) return inbox;
    const q = searchQuery.trim().toLowerCase();
    return inbox.filter((conv) => {
      const otherParty = getOtherParty(conv, userId);
      const name = getDisplayName(otherParty).toLowerCase();
      const productName = getProductName(conv.product).toLowerCase();
      const preview = (conv.lastMessage?.text || '').toLowerCase();
      return name.includes(q) || productName.includes(q) || preview.includes(q);
    });
  }, [inbox, searchQuery, userId]);

  const renderItem = ({ item: conv }) => {
    if (!conv || !userId) return null;
    const otherParty = getOtherParty(conv, userId);
    const preview = conv.lastMessage?.text ?? 'No messages yet';
    const time = conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : formatTime(conv.createdAt);
    const unread = conv.myUnread ?? 0;
    const hasUnread = unread > 0;
    const avatarColors = getAvatarColors(otherParty?._id || getDisplayName(otherParty));

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpen(conv)} activeOpacity={0.75}>
        {hasUnread && <View style={styles.unreadStripe} />}

        <View style={styles.avatarWrap}>
          {otherParty?.avatar ? (
            <Image source={{ uri: otherParty.avatar }} style={[styles.avatar, hasUnread && styles.avatarRingUnread]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColors.bg }, hasUnread && styles.avatarRingUnread]}>
              <Text style={[styles.avatarLetter, { color: avatarColors.fg }]}>{getAvatarLetter(otherParty)}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>{getDisplayName(otherParty)}</Text>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>{time}</Text>
          </View>

          <View style={styles.productTag}>
            <Ionicons name="pricetag" size={9} color={C.brand} />
            <Text style={styles.productTagText} numberOfLines={1}>{getProductName(conv.product)}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>{preview}</Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user?._id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        <Header unreadCount={0} />
        <View style={styles.center}>
          <View style={emptyStyles.iconCircle}><Ionicons name="person-outline" size={40} color={C.t3} /></View>
          <Text style={emptyStyles.title}>Sign in to view messages</Text>
          <Text style={emptyStyles.subtitle}>You need to be logged in to see your conversations.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (inboxLoading && inbox.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        <Header unreadCount={0} />
        <InboxSkeleton />
      </SafeAreaView>
    );
  }

  const totalUnread = inbox.reduce((sum, c) => sum + (c.myUnread || 0), 0);
  const showNoResults = searchQuery.trim().length > 0 && filteredInbox.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <Header unreadCount={totalUnread} />

      {inbox.length > 0 && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={C.t3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations, products..."
            placeholderTextColor={C.t3}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={C.t3} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {noticeVisible && (
        <Animated.View style={[noticeStyles.wrap, { opacity: noticeAnim }]}>
          <Ionicons name="shield-checkmark" size={16} color={C.accent} style={{ marginTop: 1 }} />
          <Text style={noticeStyles.text}><Text style={noticeStyles.bold}>Transact safely. </Text>Never move payments or deals off CediMart. Off-platform transactions are unprotected and may lead to account suspension.</Text>
          <TouchableOpacity onPress={handleDismissNotice} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close" size={16} color="#92400E" /></TouchableOpacity>
        </Animated.View>
      )}

      <FlatList
        data={filteredInbox} keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, filteredInbox.length === 0 && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={inboxLoading} onRefresh={handleManualRefresh} tintColor={C.brand} colors={[C.brand]} />}
        ListEmptyComponent={showNoResults ? <NoResultsState query={searchQuery} /> : <EmptyState navigation={navigation} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow = ({ delay = 0 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 850, delay, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.lines}>
        <View style={skeletonStyles.topRow}>
          <View style={[skeletonStyles.line, { width: '45%', height: 13 }]} />
          <View style={[skeletonStyles.line, { width: '18%', height: 11 }]} />
        </View>
        <View style={[skeletonStyles.line, { width: '30%', height: 11, marginBottom: 6 }]} />
        <View style={[skeletonStyles.line, { width: '70%', height: 12 }]} />
      </View>
    </Animated.View>
  );
};

const InboxSkeleton = () => (
  <View style={skeletonStyles.wrap}>
    {[0, 120, 240, 360, 480].map((delay, i) => <SkeletonRow key={i} delay={delay} />)}
  </View>
);

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ unreadCount = 0 }) => (
  <View style={headerStyles.wrap}>
    <View>
      <Text style={headerStyles.title}>Messages</Text>
      <Text style={headerStyles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}</Text>
    </View>
    <View style={headerStyles.iconWrap}><Ionicons name="chatbubbles-outline" size={22} color={C.brand} /></View>
  </View>
);

// ── Empty states ──────────────────────────────────────────────────────────────
const EmptyState = ({ navigation }) => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconCircle}><Ionicons name="chatbubbles-outline" size={40} color={C.brand} /></View>
    <Text style={emptyStyles.title}>No conversations yet</Text>
    <Text style={emptyStyles.subtitle}>When you message a vendor or start negotiating on a product, it'll show up here.</Text>
    {/* Adjust the route name below if 'Discover' isn't what your browse/marketplace screen is called */}
    <TouchableOpacity style={emptyStyles.cta} onPress={() => navigation.navigate('Discover')} activeOpacity={0.85}>
      <Ionicons name="storefront-outline" size={16} color="#fff" />
      <Text style={emptyStyles.ctaText}>Explore vendors</Text>
    </TouchableOpacity>
  </View>
);

const NoResultsState = ({ query }) => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconCircle}><Ionicons name="search-outline" size={36} color={C.t3} /></View>
    <Text style={emptyStyles.title}>No matches</Text>
    <Text style={emptyStyles.subtitle}>Nothing found for "{query}". Try a different name or product.</Text>
  </View>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  listContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 24 },
  listContentEmpty: { flex: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 13,
    paddingHorizontal: 13,
    height: 44,
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.t1, height: '100%' },

  // Card-style conversation row
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.brand,
  },
  avatarWrap: { marginRight: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  avatarRingUnread: { borderWidth: 2, borderColor: C.brand },
  avatarLetter: { fontSize: 19, fontWeight: '700' },

  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 14.5, fontWeight: '600', color: C.t1, flex: 1, marginRight: 8 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 11, color: C.t3, fontWeight: '500' },
  timeUnread: { color: C.brand, fontWeight: '700' },

  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: C.brandBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
    maxWidth: '90%',
  },
  productTagText: { fontSize: 10.5, color: C.brandD, fontWeight: '600' },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 13, color: C.t3, flex: 1, marginRight: 8 },
  previewUnread: { color: C.t2, fontWeight: '500' },
  badge: { backgroundColor: C.brand, borderRadius: 12, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' },
});

const noticeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 14, marginTop: 10, marginBottom: 4, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  text: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 17 },
  bold: { fontWeight: '700' },
});

const skeletonStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E0E0E0', marginRight: 12 },
  lines: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  line: { backgroundColor: '#E0E0E0', borderRadius: 6 },
});

const headerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.bg },
  title: { fontSize: 24, fontWeight: '900', color: C.t1, letterSpacing: -0.4 },
  subtitle: { fontSize: 12.5, color: C.t3, marginTop: 2, fontWeight: '500' },
  iconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
});

const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.t2, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.brand, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default InboxScreen;