// screens/InboxScreen.jsx
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl, ActivityIndicator,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const BRAND_GREEN = '#1FAA59';

// Only re-fetch when the screen focuses if this much time has passed since
// the last successful load. Prevents hammering the API on every tab tap.
const REFRESH_COOLDOWN_MS = 30_000; // 30 seconds

function InboxScreen({ navigation }) {
  const { inbox, inboxLoading, loadInbox } = useChat();
  const { user } = useAuth();
  const lastLoadedAt = useRef(null);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const noticeAnim = useRef(new Animated.Value(1)).current;

  // ── Throttled focus refresh ────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!user?._id) return;
      const now = Date.now();
      const sinceLastLoad = now - (lastLoadedAt.current ?? 0);
      if (sinceLastLoad >= REFRESH_COOLDOWN_MS) {
        loadInbox().then(() => {
          lastLoadedAt.current = Date.now();
        });
      }
    }, [user?._id, loadInbox])
  );

  // Manual pull-to-refresh always goes through regardless of cooldown
  const handleManualRefresh = useCallback(() => {
    loadInbox().then(() => {
      lastLoadedAt.current = Date.now();
    });
  }, [loadInbox]);

  const handleDismissNotice = () => {
    Animated.timing(noticeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setNoticeVisible(false));
  };

  const handleOpen = (conversation) => {
    if (!conversation) return;
    navigation.navigate('ChatScreen', { conversation });
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

  const renderItem = ({ item: conv }) => {
    if (!conv || !user?._id) return null;
    const buyerId = conv.buyer?._id?.toString() || conv.buyer?.toString();
    const userId = user._id?.toString();
    const isBuyer = buyerId === userId;
    const otherParty = isBuyer ? conv.seller : conv.buyer;
    const preview = conv.lastMessage?.text ?? 'No messages yet';
    const time = conv.lastMessage
      ? formatTime(conv.lastMessage.createdAt)
      : formatTime(conv.createdAt);
    const unread = conv.myUnread ?? 0;
    const hasUnread = unread > 0;

    return (
      <TouchableOpacity
        style={[styles.row, hasUnread && styles.rowUnread]}
        onPress={() => handleOpen(conv)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {otherParty?.avatar ? (
            <Image source={{ uri: otherParty.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{getAvatarLetter(otherParty)}</Text>
            </View>
          )}
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
              {getDisplayName(otherParty)}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>{time}</Text>
          </View>

          <View style={styles.productRow}>
            <Ionicons name="pricetag-outline" size={11} color={BRAND_GREEN} />
            <Text style={styles.product} numberOfLines={1}>
              {getProductName(conv.product)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D0D0D0" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user?._id) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header unreadCount={0} />
        <View style={styles.center}>
          <View style={emptyStyles.iconCircle}>
            <Ionicons name="person-outline" size={40} color="#BDBDBD" />
          </View>
          <Text style={emptyStyles.title}>Sign in to view messages</Text>
          <Text style={emptyStyles.subtitle}>
            You need to be logged in to see your conversations.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Initial skeleton load ──────────────────────────────────────────────────
  if (inboxLoading && inbox.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header unreadCount={0} />
        <InboxSkeleton />
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const totalUnread = inbox.reduce((sum, c) => sum + (c.myUnread || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header unreadCount={totalUnread} />

      {/* ── Safety notice ─────────────────────────────────────────────────── */}
      {noticeVisible && (
        <Animated.View style={[noticeStyles.wrap, { opacity: noticeAnim }]}>
          <Ionicons name="shield-checkmark" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
          <Text style={noticeStyles.text}>
            <Text style={noticeStyles.bold}>Transact safely. </Text>
            Never move payments or deals off CediMart. Off-platform transactions are unprotected and may lead to account suspension.
          </Text>
          <TouchableOpacity
            onPress={handleDismissNotice}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color="#92400E" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList
        data={inbox}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          inbox.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={inboxLoading}
            onRefresh={handleManualRefresh}
            tintColor={BRAND_GREEN}
            colors={[BRAND_GREEN]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonRow = ({ delay = 0 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, delay, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View style={[skeletonStyles.row, { opacity }]}>
      {/* Avatar */}
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.lines}>
        {/* Name + time */}
        <View style={skeletonStyles.topRow}>
          <View style={[skeletonStyles.line, { width: '45%', height: 13 }]} />
          <View style={[skeletonStyles.line, { width: '18%', height: 11 }]} />
        </View>
        {/* Product tag */}
        <View style={[skeletonStyles.line, { width: '30%', height: 11, marginBottom: 5 }]} />
        {/* Preview */}
        <View style={[skeletonStyles.line, { width: '70%', height: 12 }]} />
      </View>
    </Animated.View>
  );
};

const InboxSkeleton = () => (
  <View style={skeletonStyles.wrap}>
    {[0, 120, 240, 360, 480, 600].map((delay, i) => (
      <React.Fragment key={i}>
        <SkeletonRow delay={delay} />
        {i < 5 && <View style={styles.divider} />}
      </React.Fragment>
    ))}
  </View>
);

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ unreadCount = 0 }) => (
  <View style={headerStyles.wrap}>
    <View>
      <Text style={headerStyles.title}>Messages</Text>
      <Text style={headerStyles.subtitle}>
        {unreadCount > 0
          ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
          : 'All caught up!'}
      </Text>
    </View>
    <View style={headerStyles.iconWrap}>
      <Ionicons name="chatbubbles-outline" size={22} color={BRAND_GREEN} />
    </View>
  </View>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconCircle}>
      <Ionicons name="chatbubbles-outline" size={40} color={BRAND_GREEN} />
    </View>
    <Text style={emptyStyles.title}>No conversations yet</Text>
    {/*<Text style={emptyStyles.subtitle}>
      When you chat with a seller about a product,{'\n'}
      your conversations will appear here.
    </Text>
    <View style={emptyStyles.tipCard}>
      <Ionicons name="bulb-outline" size={18} color="#F57C00" />
      <Text style={emptyStyles.tipText}>
        Tap <Text style={emptyStyles.tipBold}>"Chat with Seller"</Text> on any product to start negotiating.
      </Text>
    </View>*/}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  listContent: { paddingBottom: 20 },
  listContentEmpty: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  rowUnread: { backgroundColor: '#FAFFFB' },
  avatarWrap: { marginRight: 14, position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F0F0F0' },
  avatarFallback: { backgroundColor: '#E8F5EE', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: BRAND_GREEN },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BRAND_GREEN,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 8 },
  nameUnread: { fontWeight: '700' },
  time: { fontSize: 11, color: '#BDBDBD', fontWeight: '500' },
  timeUnread: { color: BRAND_GREEN, fontWeight: '700' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  product: { fontSize: 12, color: BRAND_GREEN, fontWeight: '500' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 13, color: '#9E9E9E', flex: 1, marginRight: 8 },
  previewUnread: { color: '#424242', fontWeight: '500' },
  badge: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  chevron: { marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 82 },
});

const noticeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
  },
});

const skeletonStyles = StyleSheet.create({
  wrap: { paddingTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E0E0',
    marginRight: 14,
  },
  lines: { flex: 1, gap: 5 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  line: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
});

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#9E9E9E', marginTop: 2, fontWeight: '500' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipText: { fontSize: 13, color: '#5D4037', lineHeight: 19, flex: 1 },
  tipBold: { fontWeight: '700', color: BRAND_GREEN },
});

export default InboxScreen;