// src/screens/FollowersScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getFollowers,followUser } from '../../apis/userApi';


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
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  danger: '#DC2626',
  success: '#059669',
};

// ─── User Row ──────────────────────────────────────────────────────────────
const UserRow = ({ user, isFollowing, onFollow, onPress }) => {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const isMe = currentUser?._id === user._id;

  const handleFollow = async () => {
    if (loading || isMe) return;
    setLoading(true);
    try {
      await followUser(user._id);
      setFollowing(!following);
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setLoading(false);
    }
  };

  const name = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.firstName || user.lastName || 'User';
  const initial = (user.firstName || 'U').charAt(0).toUpperCase();

  return (
    <TouchableOpacity 
      style={styles.userRow} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{name}</Text>
        {user.campus && (
          <View style={styles.campusRow}>
            <Ionicons name="school-outline" size={11} color={C.brand} />
            <Text style={styles.campusText}>{user.campus}</Text>
          </View>
        )}
      </View>

      {/* Follow button */}
      {!isMe && (
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnActive]}
          onPress={handleFollow}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={following ? C.brand : '#fff'} />
          ) : (
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const FollowersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};
  const { user: currentUser } = useAuth();

  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const targetUserId = userId || currentUser?._id;

  const fetchFollowers = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await getFollowers(targetUserId, { page: pageNum, limit: 20 });
      const data = res.data?.data;
      const newFollowers = data?.followers || [];

      if (pageNum === 1) {
        setFollowers(newFollowers);
      } else {
        setFollowers(prev => [...prev, ...newFollowers]);
      }

      setTotal(data?.total || 0);
      setHasMore(data?.hasMore ?? (pageNum * 20 < (data?.total || 0)));
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch followers error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [targetUserId]);

  useEffect(() => { fetchFollowers(1); }, [targetUserId]);

  const handleRefresh = () => fetchFollowers(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchFollowers(page + 1);
  };

  const handleUserPress = (user) => {
    if (user.role === 'vendor') {
      navigation.navigate('VendorDetail', { vendorId: user._id });
    } else {
      // Navigate to user profile (if you have one)
      navigation.navigate('UserProfile', { userId: user._id });
    }
  };

  const renderItem = ({ item }) => (
    <UserRow
      user={item}
      isFollowing={item.isFollowing || false}
      onFollow={() => {}}
      onPress={() => handleUserPress(item)}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Followers</Text>
          {total > 0 && (
            <Text style={styles.headerCount}>{total} {total === 1 ? 'follower' : 'followers'}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="people-outline" size={44} color={C.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No followers yet</Text>
        <Text style={styles.emptySubtitle}>
          {targetUserId === currentUser?._id
            ? 'When someone follows you, they\'ll appear here.'
            : 'This user has no followers yet.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={C.brand} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={followers}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          followers.length === 0 && !loading && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {loading && followers.length === 0 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40 },
  listContentEmpty: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerCount: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // User Row
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.surface, gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.brandDim, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.brand },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: C.text },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  campusText: { fontSize: 12, color: C.brand, fontWeight: '500' },

  // Follow Button
  followBtn: {
    backgroundColor: C.brand,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, minWidth: 90, alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: C.brandDim, borderWidth: 1, borderColor: C.brand,
  },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  followBtnTextActive: { color: C.brand },

  separator: { height: 1, backgroundColor: C.border, marginLeft: 76 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 20 },

  // Loaders
  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.bg, gap: 12,
  },
  loadingText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

export default FollowersScreen;