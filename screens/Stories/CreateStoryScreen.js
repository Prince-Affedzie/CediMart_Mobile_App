// src/screens/stories/CreateStoryScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { createStory } from '../../apis/storyApi';
import { uploadApi } from '../../apis/uploadApi';
import { useAuth } from '../../context/AuthContext';
import { useVendor } from '../../context/VendorContext';

const { width, height } = Dimensions.get('window');
const STORY_W = width - 32;
const STORY_H = STORY_W * 1.78; // 9:16 aspect ratio for stories

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#EEF1F4',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandDim: 'rgba(13,148,136,0.08)',
  text: '#0F172A',
  textOff: '#64748B',
  textMuted: '#9AA5B1',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  accent: '#F97316',
};

const STICKERS = [
  { key: 'new-arrival', label: 'New Arrival', icon: 'sparkles-outline', color: '#059669', bg: '#ECFDF5' },
  { key: 'flash-sale', label: 'Flash Sale', icon: 'flash-outline', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'restock', label: 'Restock', icon: 'refresh-outline', color: '#0284C7', bg: '#F0F9FF' },
  { key: 'limited-time', label: 'Limited Time', icon: 'time-outline', color: '#F97316', bg: '#FFF7ED' },
  { key: 'back-in-stock', label: 'Back in Stock', icon: 'checkmark-circle-outline', color: '#7C3AED', bg: '#F5F3FF' },
];

const CLIENT_MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withRetry = async (fn, attempts = 2) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(800 * (i + 1));
    }
  }
  throw lastErr;
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const CreateStoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile } = useVendor();

  const [media, setMedia] = useState(null); // Single media item
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [caption, setCaption] = useState('');
  const [sticker, setSticker] = useState(null);
  const [linkedProductId, setLinkedProductId] = useState('');
  const [linkedProductName, setLinkedProductName] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [showStickerSheet, setShowStickerSheet] = useState(false);

  // ─── Pick Media (Photo or Video) ────────────────────────────────────────
  const pickMedia = async () => {
    Alert.alert(
      'Add Story',
      'Choose media type',
      [
        { text: '📷 Photo', onPress: () => pickImage() },
        { text: '🎬 Video', onPress: () => pickVideo() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `story_${Date.now()}.jpg`,
      });
      setMediaType('image');
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow video access to add videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 30, // 30 seconds max for stories
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      let mimeType = asset.mimeType;
      if (!mimeType) {
        const ext = asset.uri?.split('.').pop()?.toLowerCase()?.split('?')[0];
        const map = { mp4: 'video/mp4', mov: 'video/quicktime' };
        mimeType = map[ext] || 'video/mp4';
      }
      setMedia({
        uri: asset.uri,
        type: mimeType,
        name: asset.fileName || `story_${Date.now()}.mp4`,
        size: asset.fileSize || null,
      });
      setMediaType('video');
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaType('');
    setUploadProgress(0);
  };

  // ─── Link Product ────────────────────────────────────────────────────────
  const handleLinkProduct = () => {
    if (user?.role !== 'vendor') {
      Alert.alert('Vendor Feature', 'You need a vendor account to link products.');
      return;
    }

    navigation.navigate('SelectProduct', {
      onSelect: (product) => {
        setLinkedProductId(product._id);
        setLinkedProductName(product.name);
      },
    });
  };

  // ─── Validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!media) newErrors.media = 'Please add a photo or video';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Upload Video to Bunny Stream ──────────────────────────────────────
  const uploadVideoToBunny = async (file) => {
    if (file.size && file.size > CLIENT_MAX_VIDEO_SIZE) {
      const mb = (CLIENT_MAX_VIDEO_SIZE / (1024 * 1024)).toFixed(1);
      throw new Error(`Video is over the ${mb}MB limit`);
    }

    const { data: initData } = await withRetry(() => uploadApi.initVideoUpload(file.name));
    if (!initData?.success) throw new Error(`Couldn't start video upload`);

    const { videoId, libraryId, signature, expirationTime, tusEndpoint } = initData.data;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const raw = event.loaded / event.total;
          const clamped = Math.min(1, Math.max(0, raw));
          setUploadProgress(clamped);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ bunnyVideoId: videoId });
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      xhr.open('POST', tusEndpoint, true);
      xhr.setRequestHeader('AuthorizationSignature', signature);
      xhr.setRequestHeader('AuthorizationExpire', String(expirationTime));
      xhr.setRequestHeader('VideoId', videoId);
      xhr.setRequestHeader('LibraryId', String(libraryId));
      xhr.setRequestHeader('Upload-Length', String(file.size || 0));
      xhr.setRequestHeader('Tus-Resumable', '1.0.0');
      xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');

      fetch(file.uri)
        .then(res => res.blob())
        .then(blob => xhr.send(blob))
        .catch(err => reject(err));
    });
  };

  // ─── Submit Story ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (mediaType === 'video') {
        // Upload video to Bunny Stream first
        const { bunnyVideoId } = await uploadVideoToBunny(media);
        formData.append('mediaType', 'video');
        formData.append('bunnyVideoId', bunnyVideoId);
      } else {
        // Image - append file directly
        formData.append('mediaType', 'image');
        formData.append('media', {
          uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
          type: media.type,
          name: media.name,
        });
      }

      if (caption.trim()) formData.append('caption', caption.trim());
      if (sticker) formData.append('sticker', sticker);
      if (linkedProductId) formData.append('linkedProduct', linkedProductId);

      const response = await createStory(formData);

      if (response.data?.success) {
        Alert.alert(
          'Story Posted! 🎉',
          'Your story is now live for 24 hours.',
          [
            { text: 'View Feed', onPress: () => navigation.navigate('CampusFeed') },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to create story');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const canPost = !!media && !loading;

  // ─── NOT A VENDOR ─────────────────────────────────────────────────────────
  if (user?.role !== 'vendor') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Story</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.authContainer}>
          <View style={styles.authIconWrap}>
            <View style={styles.authIcon}>
              <Ionicons name="camera-outline" size={44} color={C.brand} />
            </View>
          </View>
          <Text style={styles.authTitle}>Vendor Stories</Text>
          <Text style={styles.authSubtitle}>
            Only vendors can post stories. Create a vendor account to share updates about your business.
          </Text>
          <TouchableOpacity
            style={styles.authLoginBtn}
            onPress={() => navigation.navigate('VendorSignUp')}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.authLoginBtnText}>Become a Vendor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Story</Text>
          <TouchableOpacity
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canPost}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Share</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Media Preview */}
          <View style={styles.mediaSection}>
            {!media ? (
              <TouchableOpacity style={styles.mediaEmpty} onPress={pickMedia} activeOpacity={0.85}>
                <View style={styles.mediaEmptyIconWrap}>
                  <Ionicons name="camera" size={32} color={C.brand} />
                </View>
                <Text style={styles.mediaEmptyTitle}>Add Photo or Video</Text>
                <Text style={styles.mediaEmptySubtitle}>Stories disappear after 24 hours</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.mediaPreviewWrap}>
                <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
                
                {/* Sticker overlay */}
                {sticker && (
                  <View style={styles.stickerOverlay}>
                    <View style={styles.stickerBadge}>
                      <Ionicons 
                        name={STICKERS.find(s => s.key === sticker)?.icon} 
                        size={14} 
                        color="#fff" 
                      />
                      <Text style={styles.stickerText}>
                        {STICKERS.find(s => s.key === sticker)?.label}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Video badge */}
                {mediaType === 'video' && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
                  </View>
                )}

                {/* Remove button */}
                <TouchableOpacity style={styles.mediaRemove} onPress={removeMedia} disabled={loading}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>

                {/* Change button */}
                <TouchableOpacity style={styles.mediaChange} onPress={pickMedia} disabled={loading}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={styles.mediaChangeText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            {errors.media && <Text style={styles.errorText}>{errors.media}</Text>}
          </View>

          {/* Caption */}
          <View style={styles.section}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption... (optional)"
              placeholderTextColor={C.textMuted}
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
              multiline
            />
            <View style={styles.charRow}>
              <Text style={styles.charCount}>{caption.length}/200</Text>
            </View>
          </View>

          {/* Stickers */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Add Sticker (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
              {STICKERS.map((s) => {
                const isSelected = sticker === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.stickerChip,
                      isSelected && { backgroundColor: s.color, borderColor: s.color },
                    ]}
                    onPress={() => setSticker(isSelected ? null : s.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={s.icon} size={14} color={isSelected ? '#fff' : s.color} />
                    <Text style={[styles.stickerChipText, isSelected && { color: '#fff' }]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Link Product */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Link Product (optional)</Text>
            <TouchableOpacity
              style={styles.productLinkRow}
              onPress={linkedProductId ? () => { setLinkedProductId(''); setLinkedProductName(''); } : handleLinkProduct}
              activeOpacity={0.8}
            >
              <View style={styles.productLinkLeft}>
                <View style={styles.productLinkIcon}>
                  <Ionicons name="pricetag-outline" size={18} color={C.accent} />
                </View>
                <View>
                  <Text style={styles.productLinkLabel}>
                    {linkedProductId ? linkedProductName : 'Tap to link a product'}
                  </Text>
                  <Text style={styles.productLinkSubtext}>Buyers can tap to view this product</Text>
                </View>
              </View>
              {linkedProductId ? (
                <Ionicons name="close-circle" size={20} color={C.textMuted} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={14} color={C.info} />
            <Text style={styles.infoText}>
              Your story will be visible to your followers for 24 hours.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upload Progress Overlay */}
      {loading && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingBackdrop} />
          <View style={styles.processingContent}>
            <View style={styles.circularProgressWrap}>
              <View style={styles.circularProgressBg} />
              <View style={styles.circularProgress}>
                <Text style={styles.circularProgressText}>
                  {mediaType === 'video' ? Math.round(uploadProgress * 100) : '...'}%
                </Text>
              </View>
            </View>
            <Text style={styles.processingTitle}>
              {mediaType === 'video' ? 'Uploading video...' : 'Posting story...'}
            </Text>
            <Text style={styles.processingHint}>Please wait</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerBackBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  postBtn: { backgroundColor: C.brand, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 68, alignItems: 'center' },
  postBtnDisabled: { backgroundColor: C.textMuted },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 22 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textOff, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },

  // Media
  mediaSection: { marginTop: 12, paddingHorizontal: 16 },
  mediaEmpty: { height: STORY_H * 0.6, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center', gap: 6 },
  mediaEmptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.brandDim, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  mediaEmptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  mediaEmptySubtitle: { fontSize: 12.5, color: C.textMuted },
  mediaPreviewWrap: { height: STORY_H, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  mediaPreview: { width: '100%', height: '100%' },
  
  stickerOverlay: { position: 'absolute', top: 16, left: 16 },
  stickerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  stickerText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  
  videoBadge: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  mediaRemove: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  mediaChange: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16,
  },
  mediaChangeText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  // Caption
  captionInput: { fontSize: 15, color: C.text, lineHeight: 21, paddingVertical: 10, minHeight: 60, borderBottomWidth: 1, borderBottomColor: C.border },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { fontSize: 11, color: C.textMuted },

  // Stickers
  stickerRow: { gap: 8 },
  stickerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
  },
  stickerChipText: { fontSize: 12.5, fontWeight: '600', color: C.textOff },

  // Product link
  productLinkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 14,
  },
  productLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  productLinkIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  productLinkLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  productLinkSubtext: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12,
    marginHorizontal: 16, marginTop: 24,
  },
  infoText: { fontSize: 12.5, color: '#0284C7', fontWeight: '500', flex: 1 },

  // Error
  errorText: { fontSize: 12, color: C.danger, marginTop: 4, fontWeight: '500' },

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  processingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  circularProgressWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  circularProgressBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  circularProgress: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(13,148,136,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.brand,
  },
  circularProgressText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  processingHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    fontWeight: '500',
  },

  // Auth (non-vendor)
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: C.bg, paddingBottom: 28 },
  authIconWrap: { marginBottom: 20 },
  authIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.brandDim, justifyContent: 'center', alignItems: 'center' },
  authTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 14, color: C.textOff, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  authLoginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brand, width: '100%', paddingVertical: 15, borderRadius: 14 },
  authLoginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CreateStoryScreen;