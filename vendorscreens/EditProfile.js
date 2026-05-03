// src/vendorscreens/AccountScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getMyProfileDetails, updateProfile } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const BANNER_HEIGHT = 200;
const AVATAR_SIZE   = 88;
const AVATAR_OFFSET = AVATAR_SIZE / 2; // how far avatar overlaps below banner

// ─────────────────────────────────────────────
// Settings Row
// ─────────────────────────────────────────────
const SettingsRow = ({
  iconName, iconBg, iconColor,
  label, subtitle, badge, badgeStyle,
  onPress, rightElement, isLast = false,
}) => (
  <TouchableOpacity
    style={[styles.settingsRow, isLast && styles.settingsRowLast]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName} size={17} color={iconColor} />
    </View>
    <View style={styles.rowBody}>
      <Text style={styles.rowLabel}>{label}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.rowRight}>
      {badge ? (
        <View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {rightElement || (onPress ? <Ionicons name="chevron-forward" size={16} color="#BDBDBD" /> : null)}
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────
const Section = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

// ─────────────────────────────────────────────
// Editable Field
// ─────────────────────────────────────────────
const Field = ({ label, required, value, onChangeText, placeholder, keyboardType, editable = true }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label}{required ? <Text style={styles.required}> *</Text> : null}
    </Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#BDBDBD"
      keyboardType={keyboardType || 'default'}
      editable={editable}
    />
  </View>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const VendorAccountScreen = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile fields
  const [name, setName]           = useState('');
  const [marketName, setMarketName] = useState('');
  const [contact, setContact]     = useState('');
  const [location, setLocation]   = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Images
  const [existingBanner, setExistingBanner]   = useState('');
  const [existingProfile, setExistingProfile] = useState('');
  const [bannerPreview, setBannerPreview]     = useState('');
  const [profilePreview, setProfilePreview]   = useState('');
  const [newBanner, setNewBanner]   = useState(null);
  const [newProfile, setNewProfile] = useState(null);
  const [removeBanner, setRemoveBanner]   = useState(false);
  const [removeProfile, setRemoveProfile] = useState(false);

  // Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [storeVisible, setStoreVisible] = useState(true);

  // ── Fetch ──────────────────────────────────
  const fetchProfile = async () => {
    try {
      const res = await getMyProfileDetails();
      if (res?.status === 200 || res?.data?.success) {
        const vendor = res.data.data || res.data;
        setName(vendor.name || '');
        setMarketName(vendor.market_name || '');
        setContact(vendor.contact || '');
        setLocation(vendor.location || '');
        setIsVerified(vendor.is_verified || false);
        setExistingBanner(vendor.store_banner || '');
        setExistingProfile(vendor.profile_image || '');
        setBannerPreview(vendor.store_banner || '');
        setProfilePreview(vendor.profile_image || '');
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load profile', text2: 'Check your connection' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchProfile(); }, []);

  // ── Image picking ──────────────────────────
  const pickImage = async (type) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 9] : [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      // ✅ Use mimeType (not type) — same fix as detail/add screens
      const mimeType = asset.mimeType || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const imageObj = {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        type: mimeType,
        name: asset.fileName || `${type}_${Date.now()}.${ext}`,
      };
      if (type === 'banner') {
        setNewBanner(imageObj); setBannerPreview(asset.uri); setRemoveBanner(false);
      } else {
        setNewProfile(imageObj); setProfilePreview(asset.uri); setRemoveProfile(false);
      }
    }
  };

  const removeImage = (type) => {
    if (type === 'banner') {
      if (newBanner) { setNewBanner(null); setBannerPreview(existingBanner); }
      else { setRemoveBanner(true); setBannerPreview(''); }
    } else {
      if (newProfile) { setNewProfile(null); setProfilePreview(existingProfile); }
      else { setRemoveProfile(true); setProfilePreview(''); }
    }
  };

  // ── Save ───────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !contact.trim() || !location.trim()) {
      Alert.alert('Required fields', 'Please fill in Store Name, Contact, and Location.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name',         name.trim());
      formData.append('market_name',  marketName.trim());
      formData.append('contact',      contact.trim());
      formData.append('location',     location.trim());
      if (newBanner)       formData.append('store_banner',          newBanner);
      else if (removeBanner) formData.append('remove_store_banner', 'true');
      if (newProfile)       formData.append('profile_image',          newProfile);
      else if (removeProfile) formData.append('remove_profile_image', 'true');

      const res = await updateProfile(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.status === 200 || res.data?.success) {
        Toast.show({ type: 'success', text1: 'Profile updated', text2: 'Your store info has been saved.' });
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Update failed';
      console.log(err);
      Toast.show({ type: 'error', text1: 'Update failed', text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Logout ─────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
            //navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          } catch {
            Alert.alert('Error', 'Could not log out. Please try again.');
          }
        },
      },
    ]);
  };

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#E8F5E9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 68 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading your account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Sticky header bar (title + save) ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#E8F5E9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
            {submitting
              ? <ActivityIndicator size="small" color="#1B5E20" />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />
          }
        >

          {/* ══════════════════════════════════════════
              PROFILE HERO — Facebook-style layout
              Banner fills full width. Avatar sits
              centred, half-overlapping the banner's
              bottom edge, with a white ring.
              ══════════════════════════════════════════ */}
          <View style={styles.profileHeroBlock}>

            {/* ── BANNER ── */}
            <View style={styles.bannerContainer}>
              {bannerPreview ? (
                <>
                  <Image source={{ uri: bannerPreview }} style={styles.bannerImage} resizeMode="cover" />
                  {/* Subtle gradient scrim so controls are legible */}
                  <View style={styles.bannerScrim} />

                  {/* Overlay controls */}
                  <View style={styles.bannerControls}>
                    <TouchableOpacity style={styles.bannerCtrlBtn} onPress={() => pickImage('banner')}>
                      <Ionicons name="camera-outline" size={15} color="#fff" />
                      <Text style={styles.bannerCtrlText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bannerCtrlBtn, styles.bannerCtrlBtnRed]}
                      onPress={() => {
                        Alert.alert('Remove Banner', 'Remove your store banner?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeImage('banner') },
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={15} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                /* Empty banner — tap to upload */
                <TouchableOpacity
                  style={styles.bannerEmpty}
                  onPress={() => pickImage('banner')}
                  activeOpacity={0.85}
                >
                  <View style={styles.bannerEmptyIconWrap}>
                    <Ionicons name="image-outline" size={26} color="#2E7D32" />
                  </View>
                  <Text style={styles.bannerEmptyTitle}>Add a store banner</Text>
                  <Text style={styles.bannerEmptySub}>16:9 · JPG or PNG</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── AVATAR — overlaps banner bottom ── */}
            {/* Spacer row: left side has name+meta, right side has nothing */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarPosWrap}>
                {/* White ring */}
                <View style={styles.avatarRing}>
                  {profilePreview ? (
                    <Image source={{ uri: profilePreview }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Camera badge */}
                <TouchableOpacity style={styles.avatarCameraBtn} onPress={() => pickImage('profile')}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </TouchableOpacity>

                {/* Remove badge (only when there's an image) */}
                {profilePreview ? (
                  <TouchableOpacity
                    style={styles.avatarRemoveBtn}
                    onPress={() => {
                      Alert.alert('Remove Photo', 'Remove your profile photo?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeImage('profile') },
                      ]);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#D32F2F" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* ── Name / meta / verified chip ── */}
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{name || 'Your Store'}</Text>
              <Text style={styles.profileLocation}>
                {marketName ? `${marketName} · ` : ''}{location || 'Accra'}
              </Text>
              <View style={[styles.verifiedChip, !isVerified && styles.pendingChip]}>
                <View style={[styles.chipDot, !isVerified && styles.chipDotPending]} />
                <Text style={[styles.chipText, !isVerified && styles.chipTextPending]}>
                  {isVerified ? 'Verified vendor' : 'Pending verification'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Body content — same sections as before ── */}
          <View style={styles.body}>

            {/* ── Store Info ── */}
            <Section label="Store info">
              <View style={styles.fieldsContainer}>
                <Field
                  label="Store name" required
                  value={name} onChangeText={setName}
                  placeholder="Enter your store name"
                />
                <Field
                  label="Market location"
                  value={marketName}
                  editable={false}
                  placeholder="Assigned by admin"
                />
                <Field
                  label="Contact number" required
                  value={contact} onChangeText={setContact}
                  placeholder="024 XXX XXXX"
                  keyboardType="phone-pad"
                />
                <Field
                  label="Area / neighbourhood" required
                  value={location} onChangeText={setLocation}
                  placeholder="e.g. Madina, Accra"
                />
              </View>
            </Section>

            {/* ── Preferences ── */}
            <Section label="Preferences">
              <SettingsRow
                iconName="notifications-outline"
                iconBg="#F3E5F5" iconColor="#7B1FA2"
                label="Push notifications"
                subtitle="Order alerts & updates"
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                    thumbColor={notificationsEnabled ? '#2E7D32' : '#BDBDBD'}
                    ios_backgroundColor="#E0E0E0"
                  />
                }
              />
              <SettingsRow
                iconName="eye-outline"
                iconBg="#E8F5E9" iconColor="#2E7D32"
                label="Store visibility"
                subtitle="Show store to customers"
                rightElement={
                  <Switch
                    value={storeVisible}
                    onValueChange={setStoreVisible}
                    trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                    thumbColor={storeVisible ? '#2E7D32' : '#BDBDBD'}
                    ios_backgroundColor="#E0E0E0"
                  />
                }
              />
              <SettingsRow
                iconName="language-outline"
                iconBg="#E3F2FD" iconColor="#1565C0"
                label="Language"
                subtitle="English (EN)"
                badge="Soon"
                badgeStyle={styles.badgeSoon}
                isLast
              />
            </Section>

            {/* ── Support ── */}
            <Section label="Support">
              <SettingsRow
                iconName="help-circle-outline"
                iconBg="#FFF3E0" iconColor="#E65100"
                label="Help & FAQ"
                subtitle="Common questions answered"
                onPress={() => {}}
              />
              <SettingsRow
                iconName="chatbubble-ellipses-outline"
                iconBg="#E8F5E9" iconColor="#2E7D32"
                label="Contact support"
                subtitle="Chat with our team"
                onPress={() => {}}
              />
              <SettingsRow
                iconName="star-outline"
                iconBg="#E3F2FD" iconColor="#1565C0"
                label="Rate the app"
                subtitle="Share your experience"
                onPress={() => {}}
              />
              <SettingsRow
                iconName="document-text-outline"
                iconBg="#F5F5F5" iconColor="#616161"
                label="Privacy policy"
                subtitle="Terms & conditions"
                onPress={() => {}}
                isLast
              />
            </Section>

            {/* ── Danger zone ── */}
            <Section label="Account">
              <SettingsRow
                iconName="trash-outline"
                iconBg="#FFEBEE" iconColor="#D32F2F"
                label="Delete account"
                subtitle="Permanently remove your store"
                badge="Soon"
                badgeStyle={styles.badgeSoon}
              />
              <SettingsRow
                iconName="log-out-outline"
                iconBg="#FFEBEE" iconColor="#D32F2F"
                label="Log out"
                onPress={handleLogout}
                isLast
              />
            </Section>

            <Text style={styles.versionText}>Version 1.0.0 · FreshyFood Factory</Text>
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },

  // ── Header bar ──
  header: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, minWidth: 68, alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },

  // ── Profile hero block ──
  profileHeroBlock: {
    backgroundColor: '#fff',
    marginBottom: 16,
    // No horizontal padding — banner is edge-to-edge
  },

  // ── Banner ──
  bannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: '#C8E6C9', // fallback colour when no image
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  // Subtle dark gradient at bottom so controls are readable
  bannerScrim: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  bannerControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  bannerCtrlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
  },
  bannerCtrlBtnRed: { backgroundColor: 'rgba(198,40,40,0.8)', paddingHorizontal: 10 },
  bannerCtrlText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty banner state
  bannerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A5D6A7',
  },
  bannerEmptyIconWrap: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  bannerEmptyTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  bannerEmptySub:   { fontSize: 12, color: '#9E9E9E' },

  // ── Avatar row ──
  // This row sits directly below the banner.
  // The avatar is positioned so its top half "hides" behind the banner
  // using a negative marginTop equal to AVATAR_OFFSET.
  avatarRow: {
    paddingHorizontal: 20,
    marginTop: -AVATAR_OFFSET,       // pull avatar up to straddle banner edge
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarPosWrap: {
    position: 'relative',
    // We need extra bottom space so the camera badge doesn't get clipped
    marginBottom: 4,
  },

  // White ring wrapping the avatar — same technique FB uses
  avatarRing: {
    width:  AVATAR_SIZE + 6,        // +6 for the white border thickness
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    backgroundColor: '#fff',        // this IS the ring colour
    justifyContent: 'center',
    alignItems: 'center',
    // Slight shadow so it pops against both banner and white card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarImage: {
    width:  AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width:  AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#1B5E20' },

  // Camera edit badge
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  // Remove badge (top-left of avatar)
  avatarRemoveBtn: {
    position: 'absolute',
    top: 0, left: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  // ── Profile name / meta ──
  profileMeta: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 20, fontWeight: '800', color: '#1B2714', letterSpacing: -0.3,
  },
  profileLocation: {
    fontSize: 13, color: '#757575', marginTop: 2, marginBottom: 10,
  },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pendingChip: { backgroundColor: '#FFF3E0' },
  chipDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32' },
  chipDotPending: { backgroundColor: '#E65100' },
  chipText:    { fontSize: 12, fontWeight: '600', color: '#1B5E20' },
  chipTextPending: { color: '#E65100' },

  // ── Body ──
  body: { paddingHorizontal: 16 },
  scrollContent: { paddingTop: 0 }, // hero block already fills top

  // ── Section ──
  section:      { marginBottom: 22 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 8, paddingLeft: 4,
  },
  sectionCard:  { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },

  // ── Settings Row ──
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  settingsRowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowBody:     { flex: 1 },
  rowLabel:    { fontSize: 14, fontWeight: '600', color: '#1B2714' },
  rowSubtitle: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  rowRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },

  badge:       { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
  badgeSoon:   { backgroundColor: '#F3E5F5' },

  // ── Fields ──
  fieldsContainer: { padding: 16, gap: 16 },
  fieldGroup:      {},
  fieldLabel:      { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 7 },
  required:        { color: '#D32F2F' },
  fieldInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1B2714',
  },
  fieldInputDisabled: { backgroundColor: '#F5F5F5', color: '#9E9E9E' },

  // ── Loading ──
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2EE' },
  loadingText:      { marginTop: 14, fontSize: 15, color: '#757575' },

  // ── Footer ──
  versionText: { textAlign: 'center', fontSize: 12, color: '#BDBDBD', marginBottom: 8 },
});

export default VendorAccountScreen;