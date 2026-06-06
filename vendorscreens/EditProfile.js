// src/vendorscreens/AccountScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { getMyProfileDetails, updateProfile } from '../apis/vendorApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const BANNER_HEIGHT = 180;
const AVATAR_SIZE = 90;
const AVATAR_OFFSET = AVATAR_SIZE / 2;

const CAMPUS_LABELS = {
  UG: 'University of Ghana',
  KNUST: 'KNUST',
  UCC: 'University of Cape Coast',
  UEW: 'University of Education, Winneba',
  UPSA: 'UPSA',
  GIMPA: 'GIMPA',
  ASHESI: 'Ashesi University',
  ATU: 'Accra Technical University',
  OTHER: 'Other',
};

const CATEGORY_LABELS = {
  'electronics': 'Electronics',
  'phones and tablets': 'Phones & Tablets',
  'computers and laptops': 'Computers & Laptops',
  'gaming': 'Gaming',
  'fashion': 'Fashion',
  'books-course-materials': 'Books & Course Materials',
  'hostel-items': 'Hostel Items',
  'appliances': 'Appliances',
  'furniture': 'Furniture',
  'beauty and grooming': 'Beauty & Grooming',
  'sports and fitness': 'Sports & Fitness',
  'accessories': 'Accessories',
  'food and drinks': 'Food & Drinks',
  'services': 'Services',
  'other': 'Other',
};

const SettingsRow = ({
  iconName, iconBg, iconColor,
  label, value, onPress, isLast = false,
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
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
    {onPress && <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />}
  </TouchableOpacity>
);

const Section = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Field = ({ label, value, onChangeText, placeholder, keyboardType, editable = true, multiline }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldInputDisabled, multiline && styles.fieldInputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#BDBDBD"
      keyboardType={keyboardType || 'default'}
      editable={editable}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const VendorAccountScreen = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [hostel, setHostel] = useState('');
  const [categories, setCategories] = useState([]);
  const [bio, setBio] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const [existingBanner, setExistingBanner] = useState('');
  const [existingProfile, setExistingProfile] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [newBanner, setNewBanner] = useState(null);
  const [newProfile, setNewProfile] = useState(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [removeProfile, setRemoveProfile] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProfile = async () => {
    try {
      const res = await getMyProfileDetails();
      if (res?.status === 200 || res?.data?.success) {
        const vendor = res.data.data || res.data;
        setName(vendor.name || '');
        setStoreName(vendor.storeName || '');
        setPhone(vendor.phone || '');
        setCampus(vendor.campus || '');
        setCampusArea(vendor.location?.campusArea || '');
        setHostel(vendor.location?.hostel || '');
        setCategories(vendor.categories || []);
        setBio(vendor.bio || '');
        setIsVerified(vendor.isVerified || false);
        setProductCount(vendor.products?.length || vendor.productCount || 0);
        setRating(vendor.rating || 0);
        setTotalSales(vendor.totalSales || 0);
        setExistingBanner(vendor.storeBanner || '');
        setExistingProfile(vendor.profileImage || '');
        setBannerPreview(vendor.storeBanner || '');
        setProfilePreview(vendor.profileImage || '');
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load profile' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchProfile(); }, []);

  const pickImage = (type) => {
    Alert.alert(type === 'banner' ? 'Store Banner' : 'Profile Photo', 'Choose a source', [
      {
        text: '📷  Camera',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.85, maxWidth: type === 'banner' ? 1200 : 800, maxHeight: type === 'banner' ? 600 : 800 },
            (response) => {
              if (!response.didCancel && response.assets?.length > 0) {
                const asset = response.assets[0];
                const imgObj = {
                  uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                  type: asset.type || 'image/jpeg',
                  name: asset.fileName || `${type}_${Date.now()}.jpg`,
                };
                if (type === 'banner') { setNewBanner(imgObj); setBannerPreview(asset.uri); setRemoveBanner(false); }
                else { setNewProfile(imgObj); setProfilePreview(asset.uri); setRemoveProfile(false); }
              }
            }
          );
        },
      },
      {
        text: '🖼️  Photo Library',
        onPress: () => {
          launchImageLibrary(
            { mediaType: 'photo', quality: 0.85, maxWidth: type === 'banner' ? 1200 : 800, maxHeight: type === 'banner' ? 600 : 800 },
            (response) => {
              if (!response.didCancel && response.assets?.length > 0) {
                const asset = response.assets[0];
                const imgObj = {
                  uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                  type: asset.type || 'image/jpeg',
                  name: asset.fileName || `${type}_${Date.now()}.jpg`,
                };
                if (type === 'banner') { setNewBanner(imgObj); setBannerPreview(asset.uri); setRemoveBanner(false); }
                else { setNewProfile(imgObj); setProfilePreview(asset.uri); setRemoveProfile(false); }
              }
            }
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (type) => {
    Alert.alert('Remove Image', `Remove your ${type === 'banner' ? 'store banner' : 'profile photo'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          if (type === 'banner') {
            if (newBanner) { setNewBanner(null); setBannerPreview(existingBanner); }
            else { setRemoveBanner(true); setBannerPreview(''); }
          } else {
            if (newProfile) { setNewProfile(null); setProfilePreview(existingProfile); }
            else { setRemoveProfile(true); setProfilePreview(''); }
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Store name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (storeName.trim()) formData.append('storeName', storeName.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (campus) formData.append('campus', campus);
      if (campusArea.trim()) formData.append('campusArea', campusArea.trim());
      if (hostel.trim()) formData.append('hostel', hostel.trim());
      if (bio.trim()) formData.append('bio', bio.trim());

      if (newBanner) formData.append('storeBanner', newBanner);
      else if (removeBanner) formData.append('removeStoreBanner', 'true');

      if (newProfile) formData.append('profileImage', newProfile);
      else if (removeProfile) formData.append('removeProfileImage', 'true');

      const res = await updateProfile(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 200 || res.data?.success) {
        Toast.show({ type: 'success', text1: 'Profile updated' });
        setIsEditing(false);
        setNewBanner(null);
        setNewProfile(null);
        setRemoveBanner(false);
        setRemoveProfile(false);
        fetchProfile();
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Update failed';
      Toast.show({ type: 'error', text1: 'Update failed', text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setBannerPreview(existingBanner);
    setProfilePreview(existingProfile);
    setNewBanner(null);
    setNewProfile(null);
    setRemoveBanner(false);
    setRemoveProfile(false);
    fetchProfile();
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => {
          try { await logoutUser(); }
          catch { Alert.alert('Error', 'Could not log out.'); }
        },
      },
    ]);
  };

  // Navigation handlers for SettingsRows
  const handleHelpFAQ = () => navigation.navigate('VendorSupport');
  const handleContactSupport = () => navigation.navigate('VendorSupport');
  const handlePrivacyPolicy = () => {
   navigation.navigate('PrivacyPolicy')
  };
  const handleTermsOfService = () => {
    Linking.openURL('https://cedimart.com/terms').catch(() =>
      Alert.alert('Error', 'Could not open terms of service.')
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          {isEditing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#1B5E20" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" colors={['#2E7D32']} />}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Profile Hero */}
            <View style={styles.profileHeroBlock}>
              <View style={styles.bannerContainer}>
                {bannerPreview ? (
                  <>
                    <Image source={{ uri: bannerPreview }} style={styles.bannerImage} resizeMode="cover" />
                    {isEditing && (
                      <View style={styles.bannerControls}>
                        <TouchableOpacity style={styles.bannerCtrlBtn} onPress={() => pickImage('banner')}>
                          <Ionicons name="camera-outline" size={14} color="#fff" />
                          <Text style={styles.bannerCtrlText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.bannerCtrlBtn, styles.bannerCtrlBtnRed]} onPress={() => removeImage('banner')}>
                          <Ionicons name="trash-outline" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.bannerEmpty}
                    onPress={() => isEditing && pickImage('banner')}
                    activeOpacity={isEditing ? 0.85 : 1}
                    disabled={!isEditing}
                  >
                    <View style={styles.bannerEmptyIconWrap}>
                      <Ionicons name="image-outline" size={26} color="#2E7D32" />
                    </View>
                    {isEditing && <Text style={styles.bannerEmptyText}>Add store banner</Text>}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.avatarRow}>
                <View style={styles.avatarPosWrap}>
                  <View style={styles.avatarRing}>
                    {profilePreview ? (
                      <Image source={{ uri: profilePreview }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                  </View>
                  {isEditing && (
                    <TouchableOpacity style={styles.avatarCameraBtn} onPress={() => pickImage('profile')}>
                      <Ionicons name="camera" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{name || 'Your Store'}</Text>
                {storeName ? <Text style={styles.profileStoreName}>{storeName}</Text> : null}
                <Text style={styles.profileLocation}>
                  {campus ? CAMPUS_LABELS[campus] || campus : ''}
                  {campusArea ? ` · ${campusArea}` : ''}
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{productCount}</Text>
                    <Text style={styles.statLabel}>Listings</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalSales}</Text>
                    <Text style={styles.statLabel}>Sales</Text>
                  </View>
                </View>
                <View style={[styles.verifiedChip, !isVerified && styles.pendingChip]}>
                  <View style={[styles.chipDot, !isVerified && styles.chipDotPending]} />
                  <Text style={[styles.chipText, !isVerified && styles.chipTextPending]}>
                    {isVerified ? 'Verified vendor' : 'Pending verification'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.body}>
              <Section label="Store Info">
                <View style={styles.fieldsContainer}>
                  <Field label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" editable={isEditing} />
                  <Field label="Store Name" value={storeName} onChangeText={setStoreName} placeholder="e.g. Kwame's Electronics" editable={isEditing} />
                  <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="02X XXX XXXX" keyboardType="phone-pad" editable={isEditing} />
                  <Field label="Campus" value={campus ? CAMPUS_LABELS[campus] || campus : ''} editable={false} placeholder="Not set" />
                  <Field label="Campus Area" value={campusArea} onChangeText={setCampusArea} placeholder="e.g. Main Campus" editable={isEditing} />
                  <Field label="Hostel / Hall" value={hostel} onChangeText={setHostel} placeholder="e.g. Mensah Sarbah Hall" editable={isEditing} />
                </View>
              </Section>

              <Section label="Categories">
                <View style={styles.categoriesContainer}>
                  {categories.length > 0 ? (
                    <View style={styles.categoriesGrid}>
                      {categories.map(cat => (
                        <View key={cat} style={styles.categoryChip}>
                          <Text style={styles.categoryChipText}>{CATEGORY_LABELS[cat] || cat}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>No categories set</Text>
                  )}
                </View>
              </Section>

              <Section label="About">
                <View style={styles.fieldsContainer}>
                  <Field label="Bio" value={bio} onChangeText={setBio} placeholder="Tell buyers about yourself..." editable={isEditing} multiline />
                </View>
              </Section>

              {/* Support — now with onPress handlers */}
              <Section label="Support">
                <SettingsRow
                  iconName="help-circle-outline"
                  iconBg="#FFF3E0" iconColor="#E65100"
                  label="Help & FAQ"
                  value="Common questions answered"
                  onPress={handleHelpFAQ}
                />
                <SettingsRow
                  iconName="chatbubble-ellipses-outline"
                  iconBg="#E8F5E9" iconColor="#2E7D32"
                  label="Contact support"
                  value="Chat with our team"
                  onPress={handleContactSupport}
                />
                <SettingsRow
                  iconName="document-text-outline"
                  iconBg="#F5F5F5" iconColor="#616161"
                  label="Privacy policy"
                  value="Terms & conditions"
                  onPress={handlePrivacyPolicy}
                />
                {/*<SettingsRow
                  iconName="shield-outline"
                  iconBg="#E3F2FD" iconColor="#1565C0"
                  label="Terms of Service"
                  value="Read our terms"
                  onPress={handleTermsOfService}
                  isLast
                />*/}
              </Section>

              {/* Account */}
              <Section label="Account">
                <SettingsRow
                  iconName="log-out-outline"
                  iconBg="#FFEBEE" iconColor="#D32F2F"
                  label="Log out"
                  onPress={handleLogout}
                  isLast
                />
              </Section>

              <Text style={styles.versionText}>CediMart Vendor · v1.0.0</Text>
              <View style={{ height: 60 }} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EE' },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  saveBtn: {
    backgroundColor: '#2E7D32', paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 20, minWidth: 68, alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2EE' },
  profileHeroBlock: { backgroundColor: '#fff', marginBottom: 16 },
  bannerContainer: {
    width: '100%', height: BANNER_HEIGHT,
    backgroundColor: '#C8E6C9', position: 'relative', overflow: 'hidden',
  },
  bannerImage: { width: '100%', height: '100%', position: 'absolute' },
  bannerControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 8 },
  bannerCtrlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  bannerCtrlBtnRed: { backgroundColor: 'rgba(198,40,40,0.8)', paddingHorizontal: 10 },
  bannerCtrlText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bannerEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6,
    borderBottomWidth: 1.5, borderStyle: 'dashed', borderColor: '#A5D6A7',
  },
  bannerEmptyIconWrap: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  bannerEmptyText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  avatarRow: { paddingHorizontal: 20, marginTop: -AVATAR_OFFSET, flexDirection: 'row', alignItems: 'flex-end' },
  avatarPosWrap: { position: 'relative', marginBottom: 4 },
  avatarRing: {
    width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#C8E6C9', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#1B5E20' },
  avatarCameraBtn: {
    position: 'absolute', bottom: 4, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  profileMeta: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, alignItems: 'flex-start' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1B2714', letterSpacing: -0.3 },
  profileStoreName: { fontSize: 14, color: '#757575', fontWeight: '500', marginTop: 2 },
  profileLocation: { fontSize: 13, color: '#757575', marginTop: 2, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAF8', borderRadius: 12, padding: 14,
    marginBottom: 12, width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  statLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E8E8E8' },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pendingChip: { backgroundColor: '#FFF3E0' },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32' },
  chipDotPending: { backgroundColor: '#E65100' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1B5E20' },
  chipTextPending: { color: '#E65100' },
  body: { paddingHorizontal: 16 },
  section: { marginBottom: 22 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
  },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  settingsRowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1B2714' },
  rowValue: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  fieldsContainer: { padding: 16, gap: 14 },
  fieldGroup: {},
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#424242', marginBottom: 7 },
  fieldInput: {
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1B2714',
  },
  fieldInputDisabled: { backgroundColor: '#F5F5F5', color: '#9E9E9E' },
  fieldInputMultiline: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  categoriesContainer: { padding: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8E6C9',
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  noDataText: { fontSize: 13, color: '#BDBDBD', fontStyle: 'italic' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#BDBDBD', marginTop: 8 },
});

export default VendorAccountScreen;