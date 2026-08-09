// src/screens/feed/CreateFeedPostScreen.js
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
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as tus from 'tus-js-client';
import { createFeedPost } from '../../apis/feedApi';
import { uploadApi } from '../../apis/uploadApi';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');
const PREVIEW_W = width - 32;
const PREVIEW_H = Math.min(PREVIEW_W * 1.25, 460);

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
};

// ─── Post Type Config ──────────────────────────────────────────────────────
const POST_TYPES = [
  { key: 'product_reel', icon: 'pricetag-outline', label: 'Product', desc: 'Showcase a product', color: '#0D9488' },
  { key: 'service_reel', icon: 'construct-outline', label: 'Service', desc: 'Promote a service', color: '#7C3AED' },
  { key: 'lifestyle', icon: 'camera-outline', label: 'Lifestyle', desc: 'Campus life moments', color: '#F97316' },
  { key: 'campus_event', icon: 'calendar-outline', label: 'Event', desc: 'Campus events & programs', color: '#0284C7' },
  { key: 'campus_hack', icon: 'bulb-outline', label: 'Campus Hack', desc: 'Tips & tricks', color: '#F59E0B' },
  { key: 'achievement', icon: 'trophy-outline', label: 'Achievement', desc: 'Student wins', color: '#059669' },
  { key: 'funny_moment', icon: 'happy-outline', label: 'Funny', desc: 'Campus memes & moments', color: '#EC4899' },
];

const CAMPUS_OPTIONS = [
  { value: 'ALL', label: 'All Campuses' },
  { value: 'UG', label: 'University of Ghana' },
  { value: 'KNUST', label: 'KNUST' },
  { value: 'UCC', label: 'UCC' },
  { value: 'UPSA', label: 'UPSA' },
  { value: 'GIMPA', label: 'GIMPA' },
  { value: 'ASHESI', label: 'Ashesi' },
  { value: 'UEW', label: 'UEW' },
  { value: 'ATU', label: 'ATU' },
];

const MAX_TAGS = 10;

const CLIENT_MAX_SIZE = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const IMAGE_COMPRESS = { maxWidth: 1080, quality: 0.7 };

const compressImageAsset = async (asset) => {
  try {
    const actions = [];
    if (!asset.width || asset.width > IMAGE_COMPRESS.maxWidth) {
      actions.push({ resize: { width: IMAGE_COMPRESS.maxWidth } });
    }

    const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: IMAGE_COMPRESS.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const info = await FileSystem.getInfoAsync(result.uri, { size: true });

    return {
      uri: result.uri,
      mimeType: 'image/jpeg',
      size: info.exists ? info.size : null,
    };
  } catch (err) {
    console.warn('Image compression failed, using original:', err.message);
    return null;
  }
};

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

// ─── Bottom Sheet Component (with scrollable content) ──────────────────────
const BottomSheet = ({ visible, onClose, title, children }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.sheetClose}>
            <Ionicons name="close" size={20} color={C.textOff} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const CreateFeedPostScreen = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const previewScrollRef = useRef(null);
  const { user } = useAuth();

  const [postType, setPostType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campus, setCampus] = useState('ALL');
  const [media, setMedia] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [linkedProductId, setLinkedProductId] = useState('');
  const [linkedProductName, setLinkedProductName] = useState('');

  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showCampusSheet, setShowCampusSheet] = useState(false);

  const selectedType = POST_TYPES.find((t) => t.key === postType);

  // ─── Media Picker ──────────────────────────────────────────────────────────
  const pickMedia = async () => {
    if (compressing) return;
    if (media.length >= 5) {
      Alert.alert('Limit reached', 'Up to 5 files.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - media.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const rawMedia = result.assets.map((asset, i) => {
        let mimeType = asset.mimeType;
        if (!mimeType) {
          const ext = asset.uri?.split('.').pop()?.toLowerCase()?.split('?')[0];
          const map = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
            mp4: 'video/mp4', mov: 'video/quicktime',
          };
          mimeType = map[ext] || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
        }
        const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' };
        return {
          uri: asset.uri,
          width: asset.width,
          type: mimeType,
          name: asset.fileName || `media_${Date.now()}_${i}.${extMap[mimeType] || 'jpg'}`,
          mimeType,
          size: asset.fileSize || null,
        };
      });

      setCompressing(true);
      try {
        const processed = await Promise.all(
          rawMedia.map(async (item) => {
            if (item.mimeType?.startsWith('video/')) return item;
            const compressed = await compressImageAsset(item);
            if (!compressed) return item;
            return {
              ...item,
              uri: compressed.uri,
              mimeType: compressed.mimeType,
              type: compressed.mimeType,
              name: item.name?.replace(/\.[a-zA-Z0-9]+$/, '.jpg') || item.name,
              size: compressed.size,
            };
          })
        );
        setMedia((prev) => [...prev, ...processed].slice(0, 5));
      } finally {
        setCompressing(false);
      }
    }
  };

  const removeMedia = (index) => {
    setMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (previewIndex >= next.length) setPreviewIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  // ─── Tags ─────────────────────────────────────────────────────────────────
  const commitTag = (raw) => {
    const clean = raw.trim().replace(/^#+/, '').toLowerCase();
    setTagInput('');
    if (!clean) return;
    if (tags.includes(clean)) return;
    if (tags.length >= MAX_TAGS) {
      Alert.alert('Limit reached', `You can add up to ${MAX_TAGS} tags.`);
      return;
    }
    setTags((prev) => [...prev, clean]);
  };

  const handleTagInputChange = (text) => {
    if (text.endsWith(',') || (text.endsWith(' ') && text.trim().length > 0)) {
      commitTag(text.slice(0, -1));
    } else {
      setTagInput(text);
    }
  };

  const removeTag = (index) => setTags((prev) => prev.filter((_, i) => i !== index));

  const handleLinkProduct = () => {
    if (user?.role !== 'vendor') {
      Alert.alert(
        'Vendor Feature',
        'You need a vendor account to link products. Would you like to become a vendor?'
      );
      return;
    }

    navigation.navigate('SelectProduct', {
      onSelect: (product) => {
        setLinkedProductId(product._id);
        setLinkedProductName(product.name);
      },
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!postType) newErrors.postType = 'Please select a category';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (title.trim().length > 200) newErrors.title = 'Title must be 200 characters or less';
    if (description.length > 1000) newErrors.description = 'Description must be 1000 characters or less';
    if (!description.trim() && media.length === 0 && !linkedProductId)
      newErrors.content = 'Add a description, media, or link a product';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Upload a single file ───────────────────────────────────────────────
  const uploadOneFile = async (file, index) => {
    const isVideo = (file.mimeType || file.type)?.startsWith('video/');

    if (isVideo) {
      return uploadVideoToBunny(file, index);
    }

    const limit = CLIENT_MAX_SIZE.image;
    if (file.size && file.size > limit) {
      const mb = (limit / (1024 * 1024)).toFixed(1);
      throw new Error(`${file.name} is over the ${mb}MB limit`);
    }

    const { data: signedData } = await withRetry(() =>
      uploadApi.getSignedUrl(file.name, file.mimeType || file.type, 'feed')
    );
    if (!signedData?.success) throw new Error(`Couldn't get an upload slot for ${file.name}`);

    await withRetry(() =>
      uploadApi.uploadToSupabase(
        signedData.data.signedUrl,
        { uri: file.uri, type: file.mimeType || file.type },
        (progress) => {
          const clamped = Math.min(1, Math.max(0, progress));
          setUploadProgress((prev) => ({ ...prev, [index]: clamped }));
        }
      )
    );

    const { data: confirmData } = await withRetry(() => uploadApi.confirmUpload(signedData.data.path));

    if (!confirmData?.success) {
      throw new Error(confirmData?.message || `${file.name} failed to process`);
    }

    return {
      type: 'image',
      url: confirmData.data.url,
      thumbnailUrl: confirmData.data.thumbnailUrl || null,
    };
  };

  const uploadVideoToBunny = async (file, index) => {
    if (file.size && file.size > CLIENT_MAX_SIZE.video) {
      const mb = (CLIENT_MAX_SIZE.video / (1024 * 1024)).toFixed(1);
      throw new Error(`${file.name} is over the ${mb}MB limit`);
    }

    const { data: initData } = await withRetry(() => uploadApi.initVideoUpload(file.name));
    if (!initData?.success) throw new Error(`Couldn't start video upload for ${file.name}`);

    const { videoId, libraryId, signature, expirationTime, tusEndpoint } = initData.data;

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(
        { uri: file.uri, name: file.name, type: file.mimeType || file.type },
        {
          endpoint: tusEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expirationTime),
            VideoId: videoId,
            LibraryId: String(libraryId),
          },
          metadata: {
            filetype: file.mimeType || file.type,
            title: file.name,
          },
          onError: (err) => reject(new Error(err.message || `${file.name} failed to upload`)),
          onProgress: (bytesUploaded, bytesTotal) => {
            const raw = bytesTotal > 0 ? bytesUploaded / bytesTotal : 0;
            const clamped = Math.min(1, Math.max(0, raw));
            setUploadProgress((prev) => ({ ...prev, [index]: clamped }));
          },
          onSuccess: () => {
            resolve({ type: 'video', bunnyVideoId: videoId });
          },
        }
      );
      upload.start();
    });
  };

  const handleSubmit = async () => {
    if (tagInput.trim()) commitTag(tagInput);

    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);
    setUploadProgress({});

    try {
      const results = await Promise.allSettled(media.map((file, i) => uploadOneFile(file, i)));

      const uploadedMedia = [];
      const failedFiles = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') uploadedMedia.push(r.value);
        else failedFiles.push({ name: media[i].name, error: r.reason?.message || 'Upload failed' });
      });

      if (failedFiles.length > 0) {
        const proceed = await new Promise((resolve) => {
          if (uploadedMedia.length === 0) {
            Alert.alert(
              'Upload failed',
              failedFiles.map((f) => `• ${f.name}: ${f.error}`).join('\n'),
              [{ text: 'OK', onPress: () => resolve(false) }]
            );
          } else {
            Alert.alert(
              'Some files failed',
              `${failedFiles.length} of ${media.length} file(s) couldn't be uploaded:\n` +
                failedFiles.map((f) => `• ${f.name}`).join('\n') +
                `\n\nPost with the other ${uploadedMedia.length}?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Post anyway', onPress: () => resolve(true) },
              ]
            );
          }
        });

        if (!proceed) {
          setLoading(false);
          setUploadProgress({});
          return;
        }
      }

      const postData = {
        type: postType,
        title: title.trim(),
        campus,
        description: description.trim() || undefined,
        linkedProduct: linkedProductId || undefined,
        tags,
        media: uploadedMedia,
      };

      const response = await createFeedPost(postData);

      if (response.data?.success) {
        Alert.alert(
          'Posted! 🎉',
          response.data?.message || 'Your post is now live.',
          [
            { text: 'View Feed', onPress: () => navigation.navigate('CampusFeed') },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to create post');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const campusLabel = CAMPUS_OPTIONS.find((c) => c.value === campus)?.label || 'Select';
  const canPost = !!title.trim() && !!postType && !loading && !compressing;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canPost}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Media */}
          <View style={styles.mediaSection}>
            {media.length === 0 ? (
              <TouchableOpacity style={styles.mediaEmpty} onPress={pickMedia} activeOpacity={0.85}>
                <View style={styles.mediaEmptyIconWrap}>
                  <Ionicons name="image-outline" size={30} color={C.brand} />
                  <View style={styles.mediaEmptyIconBadge}>
                    <Ionicons name="videocam" size={13} color="#fff" />
                  </View>
                </View>
                <Text style={styles.mediaEmptyTitle}>Add video or photos</Text>
                <Text style={styles.mediaEmptySubtitle}>Up to 5 files</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.mediaPreviewWrap}>
                  <ScrollView
                    ref={previewScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / PREVIEW_W))}
                    scrollEventThrottle={16}
                  >
                    {media.map((file, i) => (
                      <View key={i} style={styles.mediaPreviewSlide}>
                        <Image source={{ uri: file.uri }} style={styles.mediaPreviewImg} />
                        <TouchableOpacity style={styles.mediaPreviewRemove} onPress={() => removeMedia(i)}>
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  {media.length > 1 && (
                    <View style={styles.mediaCounter}>
                      <Text style={styles.mediaCounterText}>{previewIndex + 1}/{media.length}</Text>
                    </View>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaThumbRow}
                  contentContainerStyle={styles.mediaThumbRowContent}
                >
                  {media.map((file, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setPreviewIndex(i);
                        previewScrollRef.current?.scrollTo({ x: i * PREVIEW_W, animated: true });
                      }}
                      style={[styles.mediaThumb, i === previewIndex && styles.mediaThumbActive]}
                    >
                      <Image source={{ uri: file.uri }} style={styles.mediaThumbImg} />
                    </TouchableOpacity>
                  ))}
                  {media.length < 5 && (
                    <TouchableOpacity style={styles.mediaThumbAdd} onPress={pickMedia}>
                      <Ionicons name="add" size={22} color={C.textMuted} />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>

          {/* Title & Description */}
          <View style={styles.section}>
            <TextInput
              style={[styles.titleInput, errors.title && styles.inputError]}
              placeholder="Give your post a catchy title..."
              placeholderTextColor={C.textMuted}
              value={title}
              onChangeText={(v) => { setTitle(v); setErrors((prev) => ({ ...prev, title: null })); }}
              maxLength={200}
              multiline
            />
            <View style={styles.charRow}>
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : <Text style={styles.charCount}>{title.length}/200</Text>}
            </View>
            <TextInput
              style={[styles.descInput, errors.description && styles.inputError]}
              placeholder="Write a caption..."
              placeholderTextColor={C.textMuted}
              value={description}
              onChangeText={(v) => { setDescription(v); setErrors((prev) => ({ ...prev, description: null, content: null })); }}
              maxLength={1000}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.charRow}>
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Tags</Text>
            <View style={styles.tagInputRow}>
              {tags.map((tag, i) => (
                <View key={`${tag}-${i}`} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
                    <Ionicons name="close" size={12} color={C.brand} />
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.tagInput}
                placeholder={tags.length ? 'Add another...' : 'e.g. giveaway, hostel, secondhand'}
                placeholderTextColor={C.textMuted}
                value={tagInput}
                onChangeText={handleTagInputChange}
                onSubmitEditing={() => commitTag(tagInput)}
                returnKeyType="done"
                maxLength={24}
                blurOnSubmit={false}
              />
            </View>
            <Text style={styles.tagHint}>Separate with a comma or space · up to {MAX_TAGS}</Text>
          </View>

          {/* Post Settings */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Post Settings</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingsRow} onPress={() => setShowCategorySheet(true)} activeOpacity={0.65}>
                <View style={styles.settingsRowLeft}>
                  <View style={[styles.settingsIconBadge, { backgroundColor: (selectedType?.color || C.brand) + '18' }]}>
                    <Ionicons name="grid-outline" size={17} color={selectedType?.color || C.brand} />
                  </View>
                  <View>
                    <Text style={styles.settingsRowLabel}>Category</Text>
                    <Text style={styles.settingsRowSubtext}>Helps people find this post</Text>
                  </View>
                </View>
                <View style={styles.settingsRowRight}>
                  <Text style={[styles.settingsRowValue, selectedType && { color: selectedType.color }]} numberOfLines={1}>
                    {selectedType ? selectedType.label : 'Select'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={() => setShowCampusSheet(true)} activeOpacity={0.65}>
                <View style={styles.settingsRowLeft}>
                  <View style={[styles.settingsIconBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="school-outline" size={17} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.settingsRowLabel}>Campus</Text>
                    <Text style={styles.settingsRowSubtext}>Where this post appears</Text>
                  </View>
                </View>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsRowValue} numberOfLines={1}>{campusLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={linkedProductId ? () => { setLinkedProductId(''); setLinkedProductName(''); } : handleLinkProduct}
                activeOpacity={0.65}
              >
                <View style={styles.settingsRowLeft}>
                  <View style={[styles.settingsIconBadge, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="pricetag-outline" size={17} color="#F97316" />
                  </View>
                  <View>
                    <Text style={styles.settingsRowLabel}>Link a product</Text>
                    <Text style={styles.settingsRowSubtext}>Optional</Text>
                  </View>
                </View>
                <View style={styles.settingsRowRight}>
                  {linkedProductId ? (
                    <>
                      <Text style={[styles.settingsRowValue, { color: C.brand, fontWeight: '600' }]} numberOfLines={1}>{linkedProductName}</Text>
                      <Ionicons name="close-circle" size={17} color={C.textMuted} />
                    </>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {errors.postType && <Text style={[styles.errorText, { marginHorizontal: 16, marginTop: 8 }]}>{errors.postType}</Text>}
          {errors.content && (
            <View style={styles.contentError}><Ionicons name="alert-circle" size={14} color={C.danger} /><Text style={styles.errorText}>{errors.content}</Text></View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Bottom Sheet */}
      <BottomSheet visible={showCategorySheet} onClose={() => setShowCategorySheet(false)} title="Choose Category">
        <View style={styles.sheetBody}>
          {POST_TYPES.map((type) => {
            const isSelected = postType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[styles.sheetOption, isSelected && styles.sheetOptionActive]}
                onPress={() => { setPostType(type.key); setErrors((prev) => ({ ...prev, postType: null })); setShowCategorySheet(false); }}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: isSelected ? type.color : '#F1F5F9' }]}>
                  <Ionicons name={type.icon} size={20} color={isSelected ? '#fff' : type.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionLabel, isSelected && { color: type.color }]}>{type.label}</Text>
                  <Text style={styles.sheetOptionDesc}>{type.desc}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={type.color} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Campus Bottom Sheet */}
      <BottomSheet visible={showCampusSheet} onClose={() => setShowCampusSheet(false)} title="Select Campus">
        <View style={styles.sheetBody}>
          {CAMPUS_OPTIONS.map((opt) => {
            const isSelected = campus === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sheetOption, isSelected && styles.sheetOptionActive]}
                onPress={() => { setCampus(opt.value); setShowCampusSheet(false); }}
              >
                <Text style={[styles.sheetOptionLabel, { flex: 1 }, isSelected && { color: C.brand }]}>{opt.label}</Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.brand} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Full-screen processing overlay — covers compression + upload phases */}
      <Modal transparent visible={compressing || loading} animationType="fade" statusBarTranslucent>
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={C.brand} />
            <Text style={styles.processingTitle}>
              {compressing ? 'Optimizing photos...' : 'Sharing your post...'}
            </Text>

            {!compressing && loading && media.length > 0 && (
              <View style={styles.processingList}>
                {media.map((file, i) => {
                  const raw = uploadProgress[i];
                  if (raw === undefined) return null;
                  const pct = Math.min(100, Math.max(0, Math.round(raw * 100)));
                  return (
                    <View key={i} style={styles.processingRow}>
                      <Text style={styles.processingFileName} numberOfLines={1}>{file.name}</Text>
                      <View style={styles.processingBarTrack}>
                        <View style={[styles.processingBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.processingPercent}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>
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

  mediaSection: { marginTop: 12 },
  mediaEmpty: { marginHorizontal: 16, height: PREVIEW_H * 0.6, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center', gap: 6 },
  mediaEmptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.brandDim, justifyContent: 'center', alignItems: 'center', marginBottom: 4, position: 'relative' },
  mediaEmptyIconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.surface,
  },
  mediaEmptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  mediaEmptySubtitle: { fontSize: 12.5, color: C.textMuted },
  mediaPreviewWrap: { marginHorizontal: 16, height: PREVIEW_H, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  mediaPreviewSlide: { width: PREVIEW_W, height: PREVIEW_H },
  mediaPreviewImg: { width: '100%', height: '100%' },
  mediaPreviewRemove: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  mediaCounter: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  mediaCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  mediaThumbRow: { marginTop: 12, paddingHorizontal: 16 },
  mediaThumbRowContent: { gap: 8 },
  mediaThumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  mediaThumbActive: { borderColor: C.brand },
  mediaThumbImg: { width: '100%', height: '100%' },
  mediaThumbAdd: { width: 56, height: 56, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },

  titleInput: { fontSize: 17, fontWeight: '700', color: C.text, paddingVertical: 4, minHeight: 30 },
  descInput: { fontSize: 14.5, color: C.text, lineHeight: 21, marginTop: 10, minHeight: 60 },
  inputError: { color: C.danger },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { fontSize: 11, color: C.textMuted },

  tagInputRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 10, minHeight: 48,
  },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.brandDim, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6,
  },
  tagChipText: { fontSize: 12.5, fontWeight: '600', color: C.brand },
  tagInput: { flexGrow: 1, minWidth: 120, fontSize: 13.5, color: C.text, paddingVertical: 4 },
  tagHint: { fontSize: 11, color: C.textMuted, marginTop: 6 },

  settingsCard: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  settingsIconBadge: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  settingsRowLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  settingsRowSubtext: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  settingsRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '42%' },
  settingsRowValue: { fontSize: 13, color: C.textOff, fontWeight: '600', flexShrink: 1 },
  settingsDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: height * 0.65,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  sheetOptionActive: { backgroundColor: C.brandDim },
  sheetOptionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sheetOptionLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  sheetOptionDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  processingOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  processingCard: {
    width: '100%', maxWidth: 340, backgroundColor: C.surface,
    borderRadius: 20, paddingVertical: 28, paddingHorizontal: 22,
    alignItems: 'center', gap: 14,
  },
  processingTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  processingList: { width: '100%', gap: 12, marginTop: 4 },
  processingRow: { width: '100%' },
  processingFileName: { fontSize: 11.5, color: C.textOff, fontWeight: '500', marginBottom: 5 },
  processingBarTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  processingBarFill: { height: '100%', backgroundColor: C.brand, borderRadius: 3 },
  processingPercent: { fontSize: 10.5, color: C.textMuted, fontWeight: '600', marginTop: 3, textAlign: 'right' },

  errorText: { fontSize: 12, color: C.danger, marginTop: 4, fontWeight: '500' },
  contentError: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.dangerBg, borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginHorizontal: 16, marginTop: 20 },
});

export default CreateFeedPostScreen;