// src/screens/main/AccountScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal, TextInput,
  Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { feedApi } from '../apis/feedApi';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  elev:         '#F1F5F9',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentL:      '#FB923C',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  purple:       '#7C3AED',
  purpleBg:     '#F5F3FF',
  gold:         '#F59E0B',
  goldBg:       '#FFFBEB',
  white:        '#FFFFFF',
};

const AccountScreen = ({ navigation }) => {
  const { user, logoutUser, updateUser, deleteAccount, isAuthenticated } = useAuth();
  const { cartItems,cartCount } = useCart();


  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // User stats
  const [myPostsCount, setMyPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyStats();
    }
  }, [isAuthenticated]);

  const fetchMyStats = async () => {
    try {
      const res = await feedApi.getMyFeedPosts({ limit: 1 });
      setMyPostsCount(res.data?.data?.pagination?.total || 0);
    } catch (err) {
      // Silently fail — stats are non-critical
    }
    // Fetch follower/following counts from user data
    setFollowersCount(user?.followersCount || user?.followers?.length || 0);
    setFollowingCount(user?.followingCount || user?.following?.length || 0);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try { setLoading(true); await logoutUser(); }
        catch { Alert.alert('Error', 'Failed to logout.'); }
        finally { setLoading(false); }
      }},
    ]);
  };

  const handleDeleteAccount = () => setDeleteModalVisible(true);
  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
    } catch { Alert.alert('Error', 'Something went wrong.'); }
    finally { setLoading(false); setDeleteModalVisible(false); }
  };

  const handleEditField = (field, value) => { setEditField(field); setEditValue(value || ''); setEditModalVisible(true); };
  const handleSaveEdit = async () => {
    if (!editValue.trim()) { Alert.alert('Error', 'Please enter a value'); return; }
    try { setLoading(true); await updateUser({ ...user, [editField]: editValue }); setEditModalVisible(false); Alert.alert('Success', 'Profile updated'); }
    catch { Alert.alert('Error', 'Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();
  };
  const getFullName = () => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const renderStatCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderMenuItem = (title, icon, onPress, iconColor = C.brand, showChevron = true) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={16} color={C.t3} />}
    </TouchableOpacity>
  );

  const renderSectionTitle = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  // ── NOT LOGGED IN ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
        <View style={styles.notLoggedInContainer}>
          <View style={styles.guestAvatarCircle}>
            <Ionicons name="person-outline" size={48} color={C.brandBorder} />
          </View>
          <Text style={styles.notLoggedInTitle}>Welcome!</Text>
          <Text style={styles.notLoggedInText}>Login to connect with your campus community, share moments, and discover great deals.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero Header ── */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroScreenLabel}>My Profile</Text>
          </View>
          <View style={styles.heroIdentity}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.heroAvatarImg} />
                ) : (
                  <Text style={styles.heroAvatarText}>{getInitials()}</Text>
                )}
              </View>
            </View>
            <View style={styles.heroUserInfo}>
              <Text style={styles.heroName}>{getFullName()}</Text>
              <Text style={styles.heroHandle}>@{user?.username || getFullName().replace(/\s+/g, '').toLowerCase()}</Text>
              <View style={styles.heroRoleBadge}>
                <Ionicons name="school-outline" size={10} color={C.brandBorder} />
                <Text style={styles.heroRoleText}>{user?.campus || 'Campus Student'}</Text>
              </View>
            </View>
          </View>

          {/* Community Stats Row */}
          <View style={styles.communityStatsRow}>
            <View style={styles.communityStat}>
              <Text style={styles.communityStatValue}>{myPostsCount}</Text>
              <Text style={styles.communityStatLabel}>Posts</Text>
            </View>
            <View style={styles.communityStatDivider} />
            <View style={styles.communityStat}>
              <Text style={styles.communityStatValue}>{followersCount}</Text>
              <Text style={styles.communityStatLabel}>Followers</Text>
            </View>
            <View style={styles.communityStatDivider} />
            <View style={styles.communityStat}>
              <Text style={styles.communityStatValue}>{followingCount}</Text>
              <Text style={styles.communityStatLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionPill} onPress={() => handleEditField('firstName', user?.firstName)}>
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.heroActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionPill} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.heroActionText, { color: 'rgba(255,255,255,0.7)' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Activity Stats ── */}
        <View style={styles.section}>
          {renderSectionTitle('My Activity')}
          <View style={styles.statsGrid}>
            {renderStatCard('My Posts', myPostsCount, 'newspaper-outline', C.purple, () => navigation.navigate('MyFeedPosts'))}
            {renderStatCard('Saved', user?.savedPostsCount || 0, 'bookmark-outline', C.gold, () => navigation.navigate('SavedPosts'))}
            {renderStatCard('Cart', cartItems.length, 'cart-outline', C.accent, () => navigation.navigate('Cart'))}
            {renderStatCard('Orders', user?.orders?.length || 0, 'receipt-outline', C.info, () => navigation.navigate('Orders'))}
          </View>
        </View>

        {/* ── Community Hub ── */}
        <View style={styles.section}>
          {renderSectionTitle('Community')}
          <View style={styles.menuCard}>
            {/*{renderMenuItem('My Feed Posts', 'newspaper-outline', () => navigation.navigate('MyFeedPosts'), C.purple)}
             {renderMenuItem('My Followers', 'people-outline', () => navigation.navigate('Followers'), C.success)}
            */}
            {renderMenuItem('Saved Posts', 'bookmark-outline', () => navigation.navigate('SavedPosts'), C.gold)}
            {renderMenuItem('Brands I Follow', 'people-outline', () => navigation.navigate('Following'), C.info)}
            
          </View>
        </View>

        {/* ── Shopping ── */}
        <View style={styles.section}>
          {renderSectionTitle('Shopping')}
          <View style={styles.menuCard}>
            {renderMenuItem('My Cart', 'cart-outline', () => navigation.navigate('Cart'), C.accent)}
            {renderMenuItem('Order History', 'receipt-outline', () => navigation.navigate('Orders'), C.info)}
            {renderMenuItem('Earning & Rewards', 'gift-outline', () => navigation.navigate('Earnings'), C.success)}
            {renderMenuItem('Favorites', 'heart-outline', () => navigation.navigate('Favorites'), C.danger)}
          </View>
        </View>

        {/* ── Settings & Support ── */}
        <View style={styles.section}>
          {renderSectionTitle('Settings & Support')}
          <View style={styles.menuCard}>
            {renderMenuItem('Help & Support', 'help-circle-outline', () => navigation.navigate('Support'))}
            {renderMenuItem('About CediMart', 'information-circle-outline', () => navigation.navigate('About'))}
            {renderMenuItem('Privacy & Terms', 'shield-checkmark-outline', () => navigation.navigate('PrivacyPolicy'))}
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.section}>
          {renderSectionTitle('Account')}
          <View style={[styles.menuCard, { borderColor: C.danger + '30' }]}>
            {renderMenuItem('Logout', 'log-out-outline', handleLogout, C.accent)}
            {renderMenuItem('Delete Account', 'trash-outline', handleDeleteAccount, C.danger)}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}</Text>
            <TextInput style={styles.modalInput} value={editValue} onChangeText={setEditValue} placeholder={`Enter your ${editField}`} autoCapitalize="none" autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal animationType="fade" transparent visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <View style={styles.deleteIconCircle}><Ionicons name="trash-outline" size={36} color={C.danger} /></View>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalSubtitle}>This action is permanent and cannot be undone. All your data will be permanently deleted.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={confirmDeleteAccount} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={C.brand} /></View>}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 30 },

  // Not logged in
  simpleHeader: { backgroundColor: C.brandD, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  simpleHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  notLoggedInContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  guestAvatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  notLoggedInTitle: { fontSize: 24, fontWeight: '700', color: C.brand, marginBottom: 10 },
  notLoggedInText: { fontSize: 15, color: C.t2, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brand, width: '100%', paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupButton: { width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.brand, alignItems: 'center' },
  signupButtonText: { color: C.brand, fontSize: 16, fontWeight: '700' },

  // Hero
  heroHeader: { backgroundColor: C.brand, marginHorizontal: 12, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroScreenLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroAvatarWrap: { marginRight: 14 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.brandL, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroUserInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroHandle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  heroRoleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  heroRoleText: { fontSize: 11, color: '#99F6E4', fontWeight: '700' },

  // Community stats row
  communityStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 14 },
  communityStat: { alignItems: 'center', flex: 1 },
  communityStatValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  communityStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  communityStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },

  heroActions: { flexDirection: 'row', gap: 8 },
  heroActionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroActionText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: C.surface, padding: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.t1, marginBottom: 2 },
  statTitle: { fontSize: 11, color: C.t3, fontWeight: '500' },

  // Menu
  menuCard: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  menuItemText: { fontSize: 13.5, color: C.t1, fontWeight: '500' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  deleteModalContent: { alignItems: 'center', paddingBottom: 36 },
  deleteIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 16, textAlign: 'center' },
  deleteModalTitle: { fontSize: 20, fontWeight: '800', color: C.danger, marginBottom: 8 },
  deleteModalSubtitle: { fontSize: 14, color: C.t2, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalInput: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 20, color: C.t1, backgroundColor: '#FAFAFA' },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton: { backgroundColor: C.brand },
  deleteButton: { backgroundColor: C.danger },
  cancelButtonText: { color: '#616161', fontSize: 14, fontWeight: '600' },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deleteButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
});

export default AccountScreen;