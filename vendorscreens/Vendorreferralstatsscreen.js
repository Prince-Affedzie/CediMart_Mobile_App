// src/screens/vendor/VendorReferralStatsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getVendorReferralStats } from '../apis/referralApi';

// ─── Teal + Coral Palette (matches the rest of the app) ────────────────────
const C = {
  bg:      '#F8FAFC',
  surface: '#FFFFFF',
  elev:    '#F1F5F9',
  t1:      '#0F172A',
  t2:      '#475569',
  t3:      '#94A3B8',
  brand:   '#0D9488',
  brandL:  '#14B8A6',
  brandBg: '#F0FDFA',
  brandBorder: '#99F6E4',
  accent:  '#F97316',
  accentBg:'#FFF7ED',
  accentBorder: '#FED7AA',
  success: '#059669',
  successBg: '#ECFDF5',
  danger:  '#DC2626',
  dangerBg:'#FEF2F2',
  info:    '#0284C7',
  infoBg:  '#F0F9FF',
};

const REFERRAL_STATUS_CONFIG = {
  generated: { label: 'Link Created', bg: C.elev,     text: C.t2,      icon: 'link-outline' },
  clicked:   { label: 'Clicked',      bg: C.infoBg,    text: C.info,    icon: 'eye-outline' },
  ordered:   { label: 'Order Placed', bg: C.accentBg,  text: '#D97706', icon: 'bag-check-outline' },
  confirmed: { label: 'Confirmed',    bg: C.brandBg,   text: C.brand,   icon: 'checkmark-circle-outline' },
  rewarded:  { label: 'Rewarded',     bg: C.successBg, text: C.success, icon: 'gift-outline' },
  expired:   { label: 'Expired',      bg: C.dangerBg,  text: C.danger,  icon: 'time-outline' },
};

const fmtGHS = (n) => `GH₵ ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// ─── Funnel Stat Chip ────────────────────────────────────────────────────────
const StatChip = ({ icon, label, value, color = C.t1 }) => (
  <View style={styles.statChip}>
    <View style={[styles.statChipIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statChipValue}>{value}</Text>
    <Text style={styles.statChipLabel}>{label}</Text>
  </View>
);

// ─── Referral Activity Row ────────────────────────────────────────────────────
const ReferralRow = ({ referral }) => {
  const cfg = REFERRAL_STATUS_CONFIG[referral.status] || REFERRAL_STATUS_CONFIG.generated;
  return (
    <View style={styles.refRow}>
      <View style={styles.refRowMain}>
        <Text style={styles.refProductName} numberOfLines={1}>
          {referral.productName || 'Product removed'}
        </Text>
        <View style={styles.refMetaRow}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.text} />
            <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          <View style={styles.refClicks}>
            <Ionicons name="eye-outline" size={12} color={C.t3} />
            <Text style={styles.refClicksText}>{referral.clickCount || 0}</Text>
          </View>
          {referral.commissionPct != null && (
            <Text style={styles.refCommission}>{referral.commissionPct}% commission</Text>
          )}
        </View>
        <Text style={styles.refDate}>{fmtDate(referral.createdAt)}</Text>
      </View>

      <View style={styles.refReward}>
        <Text style={[styles.refRewardAmount, referral.rewardAmount > 0 && { color: C.danger }]}>
          {referral.rewardAmount > 0 ? `−${fmtGHS(referral.rewardAmount)}` : '—'}
        </Text>
        <Text style={styles.refRewardLabel}>commission</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VendorReferralStatsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    totalShares: 0,
    totalClicks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    commissionPaid: 0,
    conversionRate: '0.0',
  });
  const [referrals, setReferrals] = useState([]);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await getVendorReferralStats();
      if (res.status === 200 || res?.success) {
        setSummary(res.data.summary || {});
        setReferrals(res.data.referrals || []);
      } else {
        setError('Could not load your referral stats.');
      }
    } catch (err) {
        console.log(err)
      setError(err?.response?.data?.message || 'Could not load your referral stats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading referral performance…</Text>
      </View>
    );
  }

  if (error && referrals.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={C.danger} />
        <Text style={styles.errorTitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStats()}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView edges={['top']} style={styles.navSafe}>
        <View style={styles.navRow}>
          {navigation && (
            <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={C.t1} />
            </TouchableOpacity>
          )}
          <Text style={styles.navTitle}>Referral Performance</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Revenue / Commission hero cards ── */}
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { backgroundColor: C.brand }]}>
            <Ionicons name="trending-up-outline" size={18} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroValue}>{fmtGHS(summary.totalRevenue)}</Text>
            <Text style={styles.heroLabel}>Revenue Driven</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: C.accent }]}>
            <Ionicons name="gift-outline" size={18} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroValue}>{fmtGHS(summary.commissionPaid)}</Text>
            <Text style={styles.heroLabel}>Commission Paid</Text>
          </View>
        </View>
        <Text style={styles.heroFootnote}>
          Revenue Driven counts sales that started from a shared link; Commission Paid is what's already been rewarded to referrers.
        </Text>

        {/* ── Funnel stats ── */}
        <View style={styles.statsGrid}>
          <StatChip icon="share-social-outline" label="Shares" value={summary.totalShares} color={C.brand} />
          <StatChip icon="eye-outline" label="Clicks" value={summary.totalClicks} color={C.info} />
          <StatChip icon="bag-check-outline" label="Purchases" value={summary.totalPurchases} color={C.accent} />
          <StatChip icon="funnel-outline" label="Conversion" value={`${summary.conversionRate}%`} color={C.success} />
        </View>

        {/* ── Referral activity ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Activity</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="share-social-outline" size={30} color={C.t3} />
              <Text style={styles.emptyText}>No one has shared your products yet.</Text>
            </View>
          ) : (
            <View style={styles.refList}>
              {referrals.map((r, i) => <ReferralRow key={`${r.productName}-${r.createdAt}-${i}`} referral={r} />)}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: C.bg,paddingBottom:15},
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: C.bg, gap: 14 },
  loadingText: { fontSize: 14, color: C.t3, fontWeight: '500' },
  errorTitle: { fontSize: 15, color: C.t2, fontWeight: '600', textAlign: 'center' },
  retryBtn: { backgroundColor: C.brand, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 4 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  navSafe: { backgroundColor: C.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EBEBEB' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  navBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800', color: C.t1 },

  scrollContent: { padding: 20, paddingBottom: 8 },

  heroRow: { flexDirection: 'row', gap: 12 },
  heroCard: {
    flex: 1, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  heroValue: { fontSize: 21, fontWeight: '900', color: '#fff', marginTop: 10, letterSpacing: -0.3 },
  heroLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 3 },
  heroFootnote: { fontSize: 11, color: C.t3, marginTop: 10, lineHeight: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  statChip: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  statChipIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statChipValue: { fontSize: 20, fontWeight: '800', color: C.t1, marginBottom: 2 },
  statChipLabel: { fontSize: 11.5, color: C.t3, fontWeight: '600' },

  section: { marginTop: 26 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.t1, marginBottom: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 13, color: C.t3, textAlign: 'center' },

  refList: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  refRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  refRowMain: { flex: 1, minWidth: 0 },
  refProductName: { fontSize: 13.5, fontWeight: '700', color: C.t1, marginBottom: 6 },
  refMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 10.5, fontWeight: '700' },
  refClicks: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  refClicksText: { fontSize: 11, color: C.t3, fontWeight: '600' },
  refCommission: { fontSize: 11, color: C.t3, fontWeight: '600' },
  refDate: { fontSize: 10.5, color: C.t3 },
  refReward: { alignItems: 'flex-end', flexShrink: 0 },
  refRewardAmount: { fontSize: 13.5, fontWeight: '800', color: C.t3 },
  refRewardLabel: { fontSize: 9.5, color: C.t3, marginTop: 2 },
});