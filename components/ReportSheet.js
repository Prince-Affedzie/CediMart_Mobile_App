// src/components/ReportSheet.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView, ScrollView, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportApi } from '../apis/reportApi';

const C = {
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#EEF1F4',
  brand: '#0D9488',
  brandDim: 'rgba(13,148,136,0.08)',
  text: '#0F172A',
  textOff: '#64748B',
  textMuted: '#9AA5B1',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
};

const REASONS = [
  { key: 'spam', label: 'Spam', desc: 'Repetitive, misleading, or unwanted content' },
  { key: 'harassment', label: 'Harassment or bullying', desc: 'Targeting or abusing someone' },
  { key: 'hate_speech', label: 'Hate speech', desc: 'Attacks based on identity or group' },
  { key: 'violence', label: 'Violence', desc: 'Threats or graphic violent content' },
  { key: 'sexual_content', label: 'Sexual content', desc: 'Nudity or sexually explicit material' },
  { key: 'scam_fraud', label: 'Scam or fraud', desc: 'Attempting to deceive for money or info' },
  { key: 'misinformation', label: 'Misinformation', desc: 'False or misleading claims' },
  { key: 'self_harm', label: 'Self-harm', desc: 'Content promoting self-harm or suicide' },
  { key: 'other', label: 'Something else', desc: 'Doesn\u2019t fit the categories above' },
];

/**
 * Drop-in report flow for any content type.
 *
 * <ReportSheet
 *   visible={showReport}
 *   onClose={() => setShowReport(false)}
 *   contentType="FeedPost"   // must match backend CONTENT_TYPES
 *   contentId={post._id}
 * />
 */
const ReportSheet = ({ visible, onClose, contentType, contentId }) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelectedReason(null);
    setDescription('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      const res = await reportApi.submitReport({
        contentType,
        contentId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      if (res.data?.success) {
        reset();
        onClose();
        Alert.alert('Report submitted', res.data?.message || 'Thanks — our team will review it.');
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit report');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Something went wrong';
      Alert.alert(err?.response?.status === 409 ? 'Already reported' : 'Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
   
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{selectedReason ? 'Add details' : 'Report this'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={submitting}>
              <Ionicons name="close" size={20} color={C.textOff} />
            </TouchableOpacity>
          </View>

          {!selectedReason ? (
            <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={styles.reasonRow}
                  onPress={() => setSelectedReason(r.key)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasonLabel}>{r.label}</Text>
                    <Text style={styles.reasonDesc}>{r.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView style={styles.detailSection} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.selectedReasonChip} onPress={() => setSelectedReason(null)}>
                <Ionicons name="chevron-back" size={14} color={C.brand} />
                <Text style={styles.selectedReasonText}>
                  {REASONS.find((r) => r.key === selectedReason)?.label}
                </Text>
              </TouchableOpacity>

              <Text style={styles.detailLabel}>Anything else we should know? (optional)</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="Add more context..."
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/500</Text>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit report</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
 
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    maxHeight: '80%',
    bottom:16
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },

  reasonList: { marginTop: 4 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.surfaceAlt,
  },
  reasonLabel: { fontSize: 14.5, fontWeight: '600', color: C.text },
  reasonDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  detailSection: { marginTop: 4 },
  selectedReasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: C.brandDim, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 16,
  },
  selectedReasonText: { fontSize: 12.5, fontWeight: '700', color: C.brand },
  detailLabel: { fontSize: 12.5, fontWeight: '600', color: C.textOff, marginBottom: 8 },
  detailInput: {
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 12, minHeight: 90, fontSize: 14, color: C.text,
  },
  charCount: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },
  submitBtn: { backgroundColor: C.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
});

export default ReportSheet;