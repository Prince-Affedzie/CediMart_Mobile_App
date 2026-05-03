// src/screens/main/AccountScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { navigationRef } from '../navigation/AppNavigator';

const AccountScreen = ({ navigation }) => {
  const { user, logoutUser, updateUser, deleteAccount, isAuthenticated } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { favoriteItems } = useCart();

  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await logoutUser();
            //navigationRef.current?.navigate('Auth', { screen: 'Login' });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => setDeleteModalVisible(true);

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await deleteAccount();
      if (response.status === 200) {
        Alert.alert('Account Deleted', "Your account has been permanently deleted. We're sorry to see you go!", [
          { text: 'OK', onPress: () => setDeleteModalVisible(false) },
        ]);
      } else {
        Alert.alert('Deletion Failed', response.error || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field, value) => {
    setEditField(field);
    setEditValue(value || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) { Alert.alert('Error', 'Please enter a value'); return; }
    try {
      setLoading(true);
      await updateUser({ ...user, [editField]: editValue });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();
  };

  const getFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  // ─────────────────────────────────────────────
  // HELPER RENDERERS
  // ─────────────────────────────────────────────
  const renderStatCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderMenuItem = (title, icon, onPress, danger = false, showChevron = true) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
          <Ionicons name={icon} size={20} color={danger ? '#F44336' : '#2E7D32'} />
        </View>
        <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{title}</Text>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />}
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────
  // NOT LOGGED IN
  // ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
        {/* Minimal header for logged-out state */}
        <View style={styles.simpleHeader}>
          <Text style={styles.simpleHeaderTitle}>Account</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <View style={styles.guestAvatarCircle}>
            <Ionicons name="person-outline" size={48} color="#A5D6A7" />
          </View>
          <Text style={styles.notLoggedInTitle}>Welcome!</Text>
          <Text style={styles.notLoggedInText}>
            Please login to access your account and manage your profile
          </Text>
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

  // ─────────────────────────────────────────────
  // MAIN SCREEN
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <View style={styles.heroHeader}>

        {/* Top row: back + settings */}
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroScreenLabel}>My Account</Text>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate('Support')}
          >
            <Ionicons name="help-circle-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar + identity */}
        <View style={styles.heroIdentity}>
          <View style={styles.heroAvatarWrap}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{getInitials()}</Text>
            </View>
            {/* Online dot */}
            <View style={styles.heroOnlineDot} />
          </View>

          <View style={styles.heroUserInfo}>
            <Text style={styles.heroName}>{getFullName()}</Text>
            <Text style={styles.heroEmail} numberOfLines={1}>{user?.email || 'No email'}</Text>
            {user?.phone ? (
              <Text style={styles.heroPhone}>{user.phone}</Text>
            ) : null}
          </View>

          {/* Role badge */}
          <View style={styles.heroRoleBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#A5D6A7" />
            <Text style={styles.heroRoleText}>
              {user?.role === 'admin' ? 'Admin' : 'Customer'}
            </Text>
          </View>
        </View>

        {/* Quick-action pills */}
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroActionPill}
            onPress={() => handleEditField('firstName', user?.firstName)}
          >
            <Ionicons name="create-outline" size={15} color="#fff" />
            <Text style={styles.heroActionText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroActionPill}
            onPress={() => navigation.navigate('Orders')}
          >
            <Ionicons name="receipt-outline" size={15} color="#fff" />
            <Text style={styles.heroActionText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionPill, styles.heroActionPillLogout]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={15} color="#FFCDD2" />
            <Text style={[styles.heroActionText, { color: '#FFCDD2' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
       {/* ── end hero header ── */}

        {/* ── STATS ── */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Cart Items', cartItems.length, 'cart-outline', '#FF9800', () => navigation.navigate('Cart'))}
            {renderStatCard('Favorites', favoriteItems?.length || 0, 'heart-outline', '#F44336', () => navigation.navigate('Favorites'))}
            {renderStatCard('Orders', user?.orders?.length || 0, 'receipt-outline', '#1565C0', () => navigation.navigate('Orders'))}
            {renderStatCard('Member Since', user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024', 'calendar-outline', '#7B1FA2')}
          </View>
        </View>

        {/* ── PERSONAL INFORMATION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            {[
              { label: 'First Name', field: 'firstName' },
              { label: 'Last Name', field: 'lastName' },
              { label: 'Email', field: 'email' },
              { label: 'Phone', field: 'phone' },
            ].map(({ label, field }, i, arr) => (
              <React.Fragment key={field}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue} numberOfLines={1}>{user?.[field] || 'Not set'}</Text>
                    <TouchableOpacity style={styles.editIcon} onPress={() => handleEditField(field, user?.[field])}>
                      <Ionicons name="create-outline" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── DELIVERY ADDRESS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.infoCard}>
            {[
              { label: 'Address', field: 'address' },
              { label: 'City', field: 'city' },
              { label: 'Nearest Landmark', field: 'nearestLandmark' },
            ].map(({ label, field }, i, arr) => (
              <React.Fragment key={field}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue} numberOfLines={2}>{user?.[field] || 'Not set'}</Text>
                    <TouchableOpacity style={styles.editIcon} onPress={() => handleEditField(field, user?.[field])}>
                      <Ionicons name="create-outline" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── PREFERENCES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <View style={styles.prefIconWrap}>
                  <Ionicons name="notifications-outline" size={18} color="#2E7D32" />
                </View>
                <Text style={styles.preferenceText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={notificationsEnabled ? '#4CAF50' : '#F5F5F5'}
              />
            </View>
          </View>
        </View>

        {/* ── ACCOUNT MENU ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('Order History', 'receipt-outline', () => navigation.navigate('Orders'))}
            {renderMenuItem('Help & Support', 'help-circle-outline', () => navigation.navigate('Support'))}
            {renderMenuItem('About App', 'information-circle-outline', () => navigation.navigate('About'))}
            {renderMenuItem('Terms & Privacy', 'shield-checkmark-outline', () => navigation.navigate('PrivacyPolicy'))}
          </View>
        </View>

        {/* ── DANGER ZONE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            {renderMenuItem('Delete Account', 'trash-outline', handleDeleteAccount, true)}
            {renderMenuItem('Logout', 'log-out-outline', handleLogout, true, false)}
          </View>
        </View>

        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={18} color="#F57F17" />
          <Text style={styles.warningText}>
            Deleting your account is permanent and cannot be undone.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── EDIT MODAL ── */}
      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter your ${editField}`}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DELETE MODAL ── */}
      <Modal animationType="fade" transparent visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <View style={styles.deleteIconCircle}>
              <Ionicons name="trash-outline" size={36} color="#F44336" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalSubtitle}>This action is permanent and cannot be undone.</Text>
            <Text style={styles.deleteModalWarning}>
              All your data including personal information, order history, and favorites will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)} disabled={loading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={confirmDeleteAccount} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 30 },

  // ── NOT LOGGED IN ──
  simpleHeader: {
    backgroundColor: '#1B5E20', paddingHorizontal: 20,
    paddingVertical: 16, alignItems: 'center',
  },
  simpleHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  notLoggedInContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  guestAvatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  notLoggedInTitle: { fontSize: 24, fontWeight: '700', color: '#1B5E20', marginBottom: 10 },
  notLoggedInText: { fontSize: 15, color: '#757575', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  loginButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', width: '100%', paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupButton: {
    width: '100%', paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: '#2E7D32', alignItems: 'center',
  },
  signupButtonText: { color: '#2E7D32', fontSize: 16, fontWeight: '700' },

  // ══ HERO HEADER ══
  heroHeader: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // Top row
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10, paddingBottom: 18,
  },
  heroIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroScreenLabel: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // Avatar + identity row
  heroIdentity: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20,
  },
  heroAvatarWrap: { position: 'relative', marginRight: 14 },
  heroAvatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
  },
  heroAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#69F0AE',
    borderWidth: 2, borderColor: '#1B5E20',
  },
  heroUserInfo: { flex: 1 },
  heroName: { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 2 },
  heroPhone: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroRoleText: { fontSize: 11, color: '#A5D6A7', fontWeight: '700' },

  // Quick-action pills
  heroActions: { flexDirection: 'row', gap: 8 },
  heroActionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  heroActionPillLogout: {
    backgroundColor: 'rgba(244,67,54,0.18)',
    borderColor: 'rgba(244,67,54,0.3)',
  },
  heroActionText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // ── STATS ──
  statsSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%', backgroundColor: '#fff',
    padding: 16, borderRadius: 14, marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statTitle: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', fontWeight: '500' },

  // ── SECTIONS ──
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 10 },

  // ── INFO CARD ──
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  infoLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '600', flex: 1 },
  infoValueContainer: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  infoValue: { fontSize: 14, color: '#212121', textAlign: 'right', flex: 1 },
  editIcon: { marginLeft: 10, padding: 4, backgroundColor: '#F1F8E9', borderRadius: 6 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 16 },

  // ── PREFERENCES ──
  preferencesCard: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  preferenceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  preferenceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  preferenceText: { fontSize: 14, color: '#212121', fontWeight: '500' },

  // ── MENU CARD ──
  menuCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  dangerCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#FFEBEE',
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuIconDanger: { backgroundColor: '#FFEBEE' },
  menuItemText: { fontSize: 14, color: '#212121', fontWeight: '500' },
  menuItemDanger: { color: '#F44336' },

  // ── WARNING ──
  warningBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8E1', marginHorizontal: 16, marginTop: 4,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFE082', gap: 8,
  },
  warningText: { fontSize: 12, color: '#E65100', flex: 1, lineHeight: 17 },

  // ── MODALS ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20,
  },
  deleteModalContent: { alignItems: 'center', paddingBottom: 36 },
  deleteIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 16, textAlign: 'center' },
  deleteModalTitle: { fontSize: 20, fontWeight: '800', color: '#D32F2F', marginBottom: 8 },
  deleteModalSubtitle: { fontSize: 15, color: '#424242', textAlign: 'center', marginBottom: 10, lineHeight: 22 },
  deleteModalWarning: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 20, color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton: { backgroundColor: '#2E7D32' },
  deleteButton: { backgroundColor: '#D32F2F' },
  cancelButtonText: { color: '#616161', fontSize: 15, fontWeight: '600' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
});

export default AccountScreen;