// src/screens/main/AccountScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal, TextInput,
  Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { navigationRef } from '../navigation/AppNavigator';

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
  successBorder:'#A7F3D0',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  white:        '#FFFFFF',
  black:        '#000000',
};

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
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try { setLoading(true); await logoutUser(); }
        catch (error) { Alert.alert('Error', 'Failed to logout. Please try again.'); }
        finally { setLoading(false); }
      }},
    ]);
  };

  const handleDeleteAccount = () => setDeleteModalVisible(true);

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await deleteAccount();
      if (response.status === 200) {
        Alert.alert('Account Deleted', "Your account has been permanently deleted. We're sorry to see you go!", [{ text: 'OK', onPress: () => setDeleteModalVisible(false) }]);
      } else { Alert.alert('Deletion Failed', response.error || 'Failed to delete account. Please try again.'); }
    } catch (error) { Alert.alert('Error', 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleEditField = (field, value) => { setEditField(field); setEditValue(value || ''); setEditModalVisible(true); };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) { Alert.alert('Error', 'Please enter a value'); return; }
    try { setLoading(true); await updateUser({ ...user, [editField]: editValue }); setEditModalVisible(false); Alert.alert('Success', 'Profile updated successfully'); }
    catch (error) { Alert.alert('Error', 'Failed to update profile. Please try again.'); }
    finally { setLoading(false); }
  };

  const getInitials = () => { if (!user) return '?'; return `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase(); };
  const getFullName = () => { if (!user) return ''; return `${user.firstName || ''} ${user.lastName || ''}`.trim(); };

  const renderStatCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '18' }]}>
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
          <Ionicons name={icon} size={20} color={danger ? C.danger : C.brand} />
        </View>
        <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{title}</Text>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={18} color={C.t3} />}
    </TouchableOpacity>
  );

  // ── NOT LOGGED IN ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
        <View style={styles.simpleHeader}>
          <Text style={styles.simpleHeaderTitle}>Account</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <View style={styles.guestAvatarCircle}>
            <Ionicons name="person-outline" size={48} color={C.brandBorder} />
          </View>
          <Text style={styles.notLoggedInTitle}>Welcome!</Text>
          <Text style={styles.notLoggedInText}>Please login to access your account and manage your profile</Text>
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

        <View style={styles.heroHeader}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.heroScreenLabel}>My Account</Text>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Support')}>
              <Ionicons name="help-circle-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroIdentity}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{getInitials()}</Text>
              </View>
              <View style={styles.heroOnlineDot} />
            </View>
            <View style={styles.heroUserInfo}>
              <Text style={styles.heroName}>{getFullName()}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>{user?.email || 'No email'}</Text>
              {user?.phone ? <Text style={styles.heroPhone}>{user.phone}</Text> : null}
            </View>
            <View style={styles.heroRoleBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#99F6E4" />
              <Text style={styles.heroRoleText}>{user?.role === 'admin' ? 'Admin' : 'Customer'}</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionPill} onPress={() => handleEditField('firstName', user?.firstName)}>
              <Ionicons name="create-outline" size={15} color="#fff" />
              <Text style={styles.heroActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionPill} onPress={() => navigation.navigate('Orders')}>
              <Ionicons name="receipt-outline" size={15} color="#fff" />
              <Text style={styles.heroActionText}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.heroActionPill, styles.heroActionPillLogout]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color={C.dangerBorder} />
              <Text style={[styles.heroActionText, { color: C.dangerBorder }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Cart Items', cartItems.length, 'cart-outline', C.accent, () => navigation.navigate('Cart'))}
            {renderStatCard('Favorites', favoriteItems?.length || 0, 'heart-outline', C.danger, () => navigation.navigate('Favorites'))}
            {renderStatCard('Orders', user?.orders?.length || 0, 'receipt-outline', C.info, () => navigation.navigate('Orders'))}
            {renderStatCard('Member Since', user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024', 'calendar-outline', '#7E22CE')}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            {[{ label: 'First Name', field: 'firstName' }, { label: 'Last Name', field: 'lastName' }, { label: 'Email', field: 'email' }, { label: 'Phone', field: 'phone' }].map(({ label, field }, i, arr) => (
              <React.Fragment key={field}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue} numberOfLines={1}>{user?.[field] || 'Not set'}</Text>
                    <TouchableOpacity style={styles.editIcon} onPress={() => handleEditField(field, user?.[field])}>
                      <Ionicons name="create-outline" size={16} color={C.brand} />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.infoCard}>
            {[{ label: 'Address', field: 'address' }, { label: 'City', field: 'city' }, { label: 'Nearest Landmark', field: 'nearestLandmark' }].map(({ label, field }, i, arr) => (
              <React.Fragment key={field}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue} numberOfLines={2}>{user?.[field] || 'Not set'}</Text>
                    <TouchableOpacity style={styles.editIcon} onPress={() => handleEditField(field, user?.[field])}>
                      <Ionicons name="create-outline" size={16} color={C.brand} />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <View style={styles.prefIconWrap}>
                  <Ionicons name="notifications-outline" size={18} color={C.brand} />
                </View>
                <Text style={styles.preferenceText}>Push Notifications</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#E0E0E0', true: C.brandBorder }} thumbColor={notificationsEnabled ? C.brand : '#F5F5F5'} />
            </View>
          </View>
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('Order History', 'receipt-outline', () => navigation.navigate('Orders'))}
            {renderMenuItem('Help & Support', 'help-circle-outline', () => navigation.navigate('Support'))}
            {renderMenuItem('About App', 'information-circle-outline', () => navigation.navigate('About'))}
            {renderMenuItem('Terms & Privacy', 'shield-checkmark-outline', () => navigation.navigate('PrivacyPolicy'))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            {renderMenuItem('Delete Account', 'trash-outline', handleDeleteAccount, true)}
            {renderMenuItem('Logout', 'log-out-outline', handleLogout, true, false)}
          </View>
        </View>

        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={18} color={C.accent} />
          <Text style={styles.warningText}>Deleting your account is permanent and cannot be undone.</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}</Text>
            <TextInput style={styles.modalInput} value={editValue} onChangeText={setEditValue} placeholder={`Enter your ${editField}`} autoCapitalize="none" autoCorrect={false} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
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
            <Text style={styles.deleteModalSubtitle}>This action is permanent and cannot be undone.</Text>
            <Text style={styles.deleteModalWarning}>All your data including personal information, order history, and favorites will be permanently deleted.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)} disabled={loading}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={confirmDeleteAccount} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      )}
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

  // Hero header
  heroHeader: { backgroundColor: C.brand, paddingHorizontal: 16, paddingBottom: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 18 },
  heroIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroScreenLabel: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroAvatarWrap: { position: 'relative', marginRight: 14 },
  heroAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.brandL, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  heroAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#5EEAD4', borderWidth: 2, borderColor: C.brandD },
  heroUserInfo: { flex: 1 },
  heroName: { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 2 },
  heroPhone: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroRoleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroRoleText: { fontSize: 11, color: '#99F6E4', fontWeight: '700' },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroActionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  heroActionPillLogout: { backgroundColor: C.dangerBg.replace(')', ',0.18)').replace('rgb', 'rgba'), borderColor: 'rgba(220,38,38,0.3)' }, // approximation
  heroActionText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Stats
  statsSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: C.surface, padding: 16, borderRadius: 14, marginBottom: 10, alignItems: 'center', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  statIconContainer: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.t1, marginBottom: 2 },
  statTitle: { fontSize: 11, color: C.t3, textAlign: 'center', fontWeight: '500' },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.brand, marginBottom: 10 },

  // Info card
  infoCard: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel: { fontSize: 13, color: C.t3, fontWeight: '600', flex: 1 },
  infoValueContainer: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  infoValue: { fontSize: 14, color: C.t1, textAlign: 'right', flex: 1 },
  editIcon: { marginLeft: 10, padding: 4, backgroundColor: C.brandBg, borderRadius: 6 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 16 },

  // Preferences
  preferencesCard: { backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  preferenceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  preferenceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  preferenceText: { fontSize: 14, color: C.t1, fontWeight: '500' },

  // Menu
  menuCard: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  dangerCard: { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: C.dangerBorder },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIconDanger: { backgroundColor: C.dangerBg },
  menuItemText: { fontSize: 14, color: C.t1, fontWeight: '500' },
  menuItemDanger: { color: C.danger },

  // Warning
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentBg, marginHorizontal: 16, marginTop: 4, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.accentBorder, gap: 8 },
  warningText: { fontSize: 12, color: '#D97706', flex: 1, lineHeight: 17 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  deleteModalContent: { alignItems: 'center', paddingBottom: 36 },
  deleteIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.t1, marginBottom: 16, textAlign: 'center' },
  deleteModalTitle: { fontSize: 20, fontWeight: '800', color: C.danger, marginBottom: 8 },
  deleteModalSubtitle: { fontSize: 15, color: C.t2, textAlign: 'center', marginBottom: 10, lineHeight: 22 },
  deleteModalWarning: { fontSize: 13, color: C.t3, textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  modalInput: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 20, color: C.t1, backgroundColor: '#FAFAFA' },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton: { backgroundColor: C.brand },
  deleteButton: { backgroundColor: C.danger },
  cancelButtonText: { color: '#616161', fontSize: 15, fontWeight: '600' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
});



export default AccountScreen;