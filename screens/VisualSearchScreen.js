// src/screens/search/VisualSearchScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, TextInput, ActivityIndicator, Platform,
  Animated, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import * as Haptics from 'expo-haptics';
import { aiVisualSearch } from '../apis/aiApi';
import { CONDITION_LABELS } from '../data/General';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 2 - 10) / 2;

// ─── Design Tokens (matches the rest of CediMart) ──────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  brand: '#0D9488',
  brandL: '#14B8A6',
  brandD: '#0F766E',
  brandBg: '#F0FDFA',
  brandBorder: '#99F6E4',
  accent: '#F97316',
  accentBg: '#FFF7ED',
  accentBorder: '#FED7AA',
  purple: '#8E5FD9',
  purpleBg: '#F5F0FC',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  text: '#0F172A',
  textOff: '#475569',
  textMuted: '#94A3B8',
  gray100: '#F5F5F5',
  gray200: '#E5E7EB',
};

// ─── Press-scale wrapper ─────────────────────────────────────────────────
const Pressy = ({ onPress, style, children, scaleTo = 0.96, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => !disabled && Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const onPressOut = () => !disabled && Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

// ─── Condition badge (reads the same CONDITION_LABELS the rest of the app uses) ──
const ConditionBadge = ({ condition }) => {
  const cfg = CONDITION_LABELS?.[condition] || { label: condition, color: '#616161', bg: '#F5F5F5' };
  if (!condition) return null;
  return (
    <View style={[styles.conditionBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.conditionBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Result product card ────────────────────────────────────────────────
const ResultCard = ({ product, onPress }) => (
  <Pressy onPress={() => onPress(product)} style={styles.resultCard} scaleTo={0.97}>
    <View style={styles.resultImgWrap}>
      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.resultImg} resizeMode="cover" />
      ) : (
        <View style={[styles.resultImg, styles.resultImgPlaceholder]}>
          <Ionicons name="image-outline" size={22} color={C.textMuted} />
        </View>
      )}
      <ConditionBadge condition={product.condition} />
    </View>
    <View style={styles.resultBody}>
      <Text style={styles.resultName} numberOfLines={2}>{product.name}</Text>
      {product.campus && (
        <View style={styles.resultCampusPill}>
          <Ionicons name="school-outline" size={9} color={C.brand} />
          <Text style={styles.resultCampusText}>{product.campus}</Text>
        </View>
      )}
      <Text style={styles.resultPrice}>GH₵ {Number(product.price).toFixed(2)}</Text>
    </View>
  </Pressy>
);

// ─── Main Screen ─────────────────────────────────────────────────────────
const VisualSearchScreen = ({ navigation }) => {
  const [image, setImage] = useState(null); // { uri, type, name }
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search results state
  const [detectedItem, setDetectedItem] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [results, setResults] = useState(null); // null = no search run yet
  const [conversationId, setConversationId] = useState(null); // 🔥 lets a follow-up photo refine the same AI conversation

  const pickImage = () => {
    Haptics.selectionAsync().catch(() => {});
    const onPicked = (r) => {
      if (r.didCancel || !r.assets?.length) return;
      const asset = r.assets[0];
      setImage({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `search_${Date.now()}.jpg`,
      });
      setError('');
      // A brand-new photo starts a fresh search, not a refinement of the
      // last one, unless the user explicitly keeps the same conversation
      // going by searching again without clearing first — see handleSearch.
    };
    return onPicked;
  };

  const openCamera = () => launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 1000, maxHeight: 1000 }, pickImage());
  const openLibrary = () => launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 1000, maxHeight: 1000 }, pickImage());

  const clearImage = () => {
    Haptics.selectionAsync().catch(() => {});
    setImage(null);
  };

  const resetSearch = () => {
    setImage(null);
    setNotes('');
    setDetectedItem(null);
    setAiResponse(null);
    setResults(null);
    setConversationId(null);
    setError('');
  };

  const handleSearch = async () => {
    if (!image || loading) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('productImage', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      });
      if (notes.trim()) formData.append('userNotes', notes.trim());
      // 🔥 Reusing conversationId (once we have one) lets the backend treat
      // a follow-up photo as a refinement of the same AI session rather
      // than starting over — it's already wired for this via Redis session
      // history on the server side.
      if (conversationId) formData.append('conversationId', conversationId);

      const res = await aiVisualSearch(formData);
      const data = res?.data;
      if (!data?.success) throw new Error(data?.message || 'Visual search failed');

      setDetectedItem(data.detectedItem || null);
      setAiResponse(data.aiResponse || null);
      setResults(data.results || []);
      setConversationId(data.conversationId || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong analyzing that photo.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product._id || product.id, product });
  };

  const hasSearched = results !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Search by Photo</Text>
          <Text style={styles.headerSub}>Snap or upload an item to find matches</Text>
        </View>
        {hasSearched && (
          <TouchableOpacity onPress={resetSearch} style={styles.resetBtn}>
            <Ionicons name="refresh" size={18} color={C.brand} />
          </TouchableOpacity>
        )}
        {!hasSearched && <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Image picker */}
        <View style={styles.pickerSection}>
          {image ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image.uri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity style={styles.previewRemoveBtn} onPress={clearImage} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </TouchableOpacity>
              <View style={styles.previewChangeBtnRow}>
                <Pressy onPress={openCamera} style={styles.previewChangeBtn} scaleTo={0.94}>
                  <Ionicons name="camera-outline" size={17} color={C.brand} />
                  <Text style={styles.previewChangeBtnText}>Retake</Text>
                </Pressy>
                <Pressy onPress={openLibrary} style={styles.previewChangeBtn} scaleTo={0.94}>
                  <Ionicons name="images-outline" size={17} color={C.brand} />
                  <Text style={styles.previewChangeBtnText}>Choose different</Text>
                </Pressy>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.pickerTilesRow}>
                <Pressy onPress={openCamera} style={styles.pickerTile} scaleTo={0.96}>
                  <View style={styles.pickerTileIconWrap}>
                    <Ionicons name="camera-outline" size={30} color={C.brand} />
                  </View>
                  <Text style={styles.pickerTileText} numberOfLines={1}>Take Photo</Text>
                </Pressy>
                <Pressy onPress={openLibrary} style={styles.pickerTile} scaleTo={0.96}>
                  <View style={styles.pickerTileIconWrap}>
                    <Ionicons name="images-outline" size={30} color={C.brand} />
                  </View>
                  <Text style={styles.pickerTileText} numberOfLines={1}>From Library</Text>
                </Pressy>
              </View>
              <Text style={styles.pickerHint}>Clear photos with good lighting give the best matches.</Text>
            </>
          )}
        </View>

        {/* Optional notes */}
        {image && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Any details to help us? <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.notesInputWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.textMuted} style={{ marginTop: 2 }} />
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. color, brand, size..."
                placeholderTextColor={C.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={200}
              />
            </View>
          </View>
        )}

        {/* Search button */}
        {image && !hasSearched && (
          <Pressy onPress={handleSearch} style={[styles.searchBtn, loading && styles.searchBtnDisabled]} disabled={loading} scaleTo={0.97}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={17} color="#fff" />
                <Text style={styles.searchBtnText}>Find Matches</Text>
              </>
            )}
          </Pressy>
        )}
        {loading && (
          <Text style={styles.loadingHint}>Analyzing your photo — this takes a few seconds...</Text>
        )}

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* AI response */}
        {hasSearched && (aiResponse || detectedItem) && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconWrap}><Ionicons name="sparkles" size={15} color={C.purple} /></View>
              <Text style={styles.aiCardLabel}>CediAi</Text>
            </View>
            {!!detectedItem && (
              <View style={styles.detectedChip}>
                <Ionicons name="eye-outline" size={12} color={C.brand} />
                <Text style={styles.detectedChipText}>Detected: {detectedItem}</Text>
              </View>
            )}
            {!!aiResponse && <Text style={styles.aiResponseText}>{aiResponse}</Text>}
          </View>
        )}

        {/* Results */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {results.length > 0 ? `${results.length} match${results.length !== 1 ? 'es' : ''} found` : 'No matches found'}
              </Text>
              {results.length > 0 && (
                <TouchableOpacity onPress={() => { setImage(null); setDetectedItem(null); setAiResponse(null); setResults(null); }} style={styles.newSearchLink}>
                  <Ionicons name="camera-outline" size={13} color={C.brand} />
                  <Text style={styles.newSearchLinkText}>Refine with another photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {results.length > 0 ? (
              <View style={styles.resultsGrid}>
                {results.map((p) => (
                  <ResultCard key={p._id || p.id} product={p} onPress={handleProductPress} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={32} color={C.brand} />
                </View>
                <Text style={styles.emptyTitle}>Nothing matched that photo</Text>
                <Text style={styles.emptySub}>Try a clearer angle, or search by text instead.</Text>
                <TouchableOpacity style={styles.emptyRetryBtn} onPress={resetSearch}>
                  <Text style={styles.emptyRetryBtnText}>Try another photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.gray100, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 11.5, color: C.textMuted, marginTop: 1 },
  resetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { padding: 16 },

  // Picker
  pickerSection: { marginBottom: 18 },
  pickerTilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: C.brandBorder,
    borderStyle: 'dashed',
    minHeight: 150,
  },
  pickerTileIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.brandBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTileText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  pickerHint: { fontSize: 11.5, color: C.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 16 },

  previewWrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: C.surface, position: 'relative' },
  previewImg: { width: '100%', height: 260 },
  previewRemoveBtn: { position: 'absolute', top: 10, right: 10 },
  previewChangeBtnRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: C.surface,
  },
  previewChangeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.brandBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  previewChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
    textAlign: 'center',
  },

  // Notes
  notesSection: { marginBottom: 16 },
  notesLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  optional: { color: C.textMuted, fontWeight: '500', fontSize: 11.5 },
  notesInputWrap: {
    flexDirection: 'row', gap: 8, backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 14, paddingVertical: 12,
  },
  notesInput: { flex: 1, fontSize: 14, color: C.text, maxHeight: 70, padding: 0 },

  // Search button
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brand, borderRadius: 16, paddingVertical: 16,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  searchBtnDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0 },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loadingHint: { textAlign: 'center', fontSize: 12.5, color: C.textMuted, marginTop: 12 },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.dangerBg,
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  errorText: { flex: 1, fontSize: 12.5, color: C.danger, fontWeight: '500' },

  // AI response card
  aiCard: { backgroundColor: C.purpleBg, borderRadius: 16, padding: 14, marginTop: 18 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiIconWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  aiCardLabel: { fontSize: 12.5, fontWeight: '800', color: C.purple },
  detectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 8,
  },
  detectedChipText: { fontSize: 11.5, fontWeight: '700', color: C.brandD },
  aiResponseText: { fontSize: 13.5, color: C.text, lineHeight: 20 },

  // Results
  resultsSection: { marginTop: 20 },
  resultsHeader: { marginBottom: 12 },
  resultsTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  newSearchLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, alignSelf: 'flex-start' },
  newSearchLinkText: { fontSize: 12, fontWeight: '700', color: C.brand },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  resultCard: {
    width: CARD_WIDTH, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  resultImgWrap: { width: '100%', height: 120, position: 'relative' },
  resultImg: { width: '100%', height: '100%' },
  resultImgPlaceholder: { backgroundColor: C.gray100, justifyContent: 'center', alignItems: 'center' },
  resultBody: { padding: 10 },
  resultName: { fontSize: 12.5, fontWeight: '600', color: C.text, lineHeight: 17, marginBottom: 5 },
  resultCampusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: C.brandBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 5,
  },
  resultCampusText: { fontSize: 9.5, fontWeight: '600', color: C.brand },
  resultPrice: { fontSize: 14, fontWeight: '800', color: C.accent },

  conditionBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  conditionBadgeText: { fontSize: 9, fontWeight: '700' },

  // Empty state (no matches)
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyIconWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 12.5, color: C.textMuted, textAlign: 'center', marginBottom: 16 },
  emptyRetryBtn: { backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  emptyRetryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default VisualSearchScreen;