// src/screens/main/EarningsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// ⚠️ Adjust this import path to wherever getMyReferralStats / withdrawToMomo
// actually live in your project (e.g. '../../apis/rewardsApi').
import { getMyReferralStats, withdrawToMomo } from '../apis/referralApi';

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
  brandD:  '#0F766E',
  brandBg: '#F0FDFA',
  brandBorder: '#99F6E4',
  accent:  '#F97316',
  accentBg:'#FFF7ED',
  success: '#059669',
  successBg: '#ECFDF5',
  danger:  '#DC2626',
  dangerBg:'#FEF2F2',
  info:    '#0284C7',
  infoBg:  '#F0F9FF',
  white:   '#FFFFFF',
};

const NETWORKS = [
  { id: 'MTN',      label: 'MTN' },
  { id: 'Telecel',  label: 'Telecel' },
  { id: 'AirtelTigo', label: 'AirtelTigo' },
];

const REFERRAL_STATUS_CONFIG = {
  generated: { label: 'Link Created', bg: C.elev,     text: C.t2,      icon: 'link-outline' },
  clicked:   { label: 'Clicked',      bg: C.infoBg,    text: C.info,    icon: 'eye-outline' },
  ordered:   { label: 'Order Placed', bg: C.accentBg,  text: '#D97706', icon: 'bag-check-outline' },
  confirmed: { label: 'Confirmed',    bg: C.brandBg,   text: C.brand,   icon: 'checkmark-circle-outline' },
  rewarded:  { label: 'Rewarded',     bg: C.successBg, text: C.success, icon: 'gift-outline' },
  expired:   { label: 'Expired',      bg: C.dangerBg,  text: C.danger,  icon: 'time-outline' },
};

const TRANSACTION_CONFIG = {
  referral_reward: { label: 'Referral Reward', icon: 'gift-outline',        color: C.success },
  signup_bonus:    { label: 'Signup Bonus',     icon: 'sparkles-outline',   color: C.brand },
  withdrawal_momo: { label: 'MoMo Withdrawal',  icon: 'arrow-up-circle-outline', color: C.danger },
  adjustment:      { label: 'Adjustment',       icon: 'construct-outline',  color: C.t2 },
};

const TXN_STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: C.accentBg,  text: '#D97706' },
  completed: { label: 'Completed', bg: C.successBg, text: C.success },
  failed:    { label: 'Failed',    bg: C.dangerBg,  text: C.danger },
};

const fmtGHS = (n) => `GH₵ ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// ─── Stat Chip ───────────────────────────────────────────────────────────────
const StatChip = ({ icon, label, value, color = C.t1 }) => (
  <View style={styles.statChip}>
    <View style={[styles.statChipIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statChipValue}>{value}</Text>
    <Text style={styles.statChipLabel}>{label}</Text>
  </View>
);

// ─── Referral Card ───────────────────────────────────────────────────────────
const ReferralCard = ({ referral }) => {
  const cfg = REFERRAL_STATUS_CONFIG[referral.status] || REFERRAL_STATUS_CONFIG.generated;
  return (
    <View style={styles.referralCard}>
      <View style={styles.referralImgWrap}>
        {referral.product?.image ? (
          <Image source={{ uri: referral.product.image }} style={styles.referralImg} resizeMode="cover" />
        ) : (
          <View style={styles.referralImgPlaceholder}>
            <Ionicons name="cube-outline" size={22} color={C.t3} />
          </View>
        )}
      </View>

      <View style={styles.referralInfo}>
        <Text style={styles.referralName} numberOfLines={1}>
          {referral.product?.name || 'Product no longer available'}
        </Text>
        <Text style={styles.referralCode}>Code: {referral.referralCode}</Text>

        <View style={styles.referralMetaRow}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.text} />
            <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          <View style={styles.referralClicks}>
            <Ionicons name="eye-outline" size={12} color={C.t3} />
            <Text style={styles.referralClicksText}>{referral.clickCount || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.referralReward}>
        <Text style={[styles.referralRewardAmount, referral.rewardAmount > 0 && { color: C.success }]}>
          {referral.rewardAmount > 0 ? `+${fmtGHS(referral.rewardAmount)}` : '—'}
        </Text>
        {referral.commissionPct != null && (
          <Text style={styles.referralCommission}>{referral.commissionPct}% comm.</Text>
        )}
      </View>
    </View>
  );
};

// ─── Transaction Row ──────────────────────────────────────────────────────────
const TransactionRow = ({ txn }) => {
  const cfg = TRANSACTION_CONFIG[txn.type] || { label: txn.type, icon: 'swap-horizontal-outline', color: C.t2 };
  const statusCfg = TXN_STATUS_CONFIG[txn.status] || TXN_STATUS_CONFIG.pending;
  const isCredit = txn.type !== 'withdrawal_momo';

  return (
    <View style={styles.txnRow}>
      <View style={[styles.txnIcon, { backgroundColor: cfg.color + '15' }]}>
        <Ionicons name={cfg.icon} size={17} color={cfg.color} />
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnDesc} numberOfLines={1}>{txn.description || cfg.label}</Text>
        <View style={styles.txnMetaRow}>
          <Text style={styles.txnDate}>{fmtDate(txn.createdAt)}</Text>
          <View style={[styles.txnStatusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.txnStatusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.txnAmount, { color: isCredit ? C.success : C.danger }]}>
        {isCredit ? '+' : '−'}{fmtGHS(txn.amount)}
      </Text>
    </View>
  );
};

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
const WithdrawModal = ({ visible, onClose, availableBalance, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetAndClose = () => {
    setAmount('');
    setMomoPhone('');
    setNetwork('MTN');
    setErrorMsg('');
    onClose();
  };

  const handleWithdraw = async () => {
    setErrorMsg('');
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount < 1) {
      setErrorMsg('Minimum withdrawal is GH₵ 1');
      return;
    }
    if (numAmount > availableBalance) {
      setErrorMsg('Insufficient balance');
      return;
    }
    if (!momoPhone.trim() || momoPhone.trim().length < 9) {
      setErrorMsg('Please enter a valid MoMo number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await withdrawToMomo({
        amount: numAmount,
        momoPhone: momoPhone.trim(),
        network,
      });

      if (res?.success) {
        Alert.alert('Withdrawal Initiated', res.message || `GH₵ ${numAmount} is on its way to ${momoPhone.trim()}.`);
        resetAndClose();
        onSuccess?.();
      } else {
        setErrorMsg(res?.message || 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawHead}>
            <Text style={styles.withdrawTitle}>Withdraw to MoMo</Text>
            <TouchableOpacity style={styles.withdrawCloseBtn} onPress={resetAndClose}>
              <Ionicons name="close" size={20} color={C.t2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.withdrawAvailable}>
            Available: <Text style={{ fontWeight: '800', color: C.brand }}>{fmtGHS(availableBalance)}</Text>
          </Text>

          <Text style={styles.fieldLabel}>Amount (GH₵)</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={C.t3}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(v) => { setAmount(v.replace(/[^0-9.]/g, '')); setErrorMsg(''); }}
            />
            <TouchableOpacity
              style={styles.maxBtn}
              onPress={() => setAmount(String(availableBalance))}
            >
              <Text style={styles.maxBtnText}>Max</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Network</Text>
          <View style={styles.networkRow}>
            {NETWORKS.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.networkPill, network === n.id && styles.networkPillActive]}
                onPress={() => setNetwork(n.id)}
              >
                <Text style={[styles.networkPillText, network === n.id && styles.networkPillTextActive]}>
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>MoMo Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 0244123456"
            placeholderTextColor={C.t3}
            keyboardType="phone-pad"
            maxLength={10}
            value={momoPhone}
            onChangeText={(v) => { setMomoPhone(v.replace(/[^0-9]/g, '')); setErrorMsg(''); }}
          />

          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.withdrawSubmitBtn, submitting && styles.withdrawSubmitBtnDisabled]}
            onPress={handleWithdraw}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.withdrawSubmitBtnText}>Withdraw {amount ? fmtGHS(amount) : ''}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EarningsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [stats, setStats] = useState({ totalShares: 0, totalClicks: 0, totalPurchases: 0, conversionRate: '0.0' });
  const [referrals, setReferrals] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await getMyReferralStats();
      if (res?.success && res?.data) {
        setWallet(res.data.wallet || {});
        setStats(res.data.stats || {});
        setReferrals(res.data.referrals || []);
        setTransactions(res.data.transactions || []);
      } else {
        setError('Could not load your earnings.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load your earnings.');
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
        <Text style={styles.loadingText}>Loading your earnings…</Text>
      </View>
    );
  }

  if (error && referrals.length === 0 && transactions.length === 0) {
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
          <Text style={styles.navTitle}>Earnings & Rewards</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wallet Card ── */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text style={styles.walletBalance}>{fmtGHS(wallet.availableBalance)}</Text>

          <TouchableOpacity
            style={[styles.withdrawBtn, wallet.availableBalance < 1 && styles.withdrawBtnDisabled]}
            onPress={() => setWithdrawOpen(true)}
            disabled={wallet.availableBalance < 1}
          >
            <Ionicons name="arrow-up-circle-outline" size={17} color="#fff" />
            <Text style={styles.withdrawBtnText}>Withdraw to MoMo</Text>
          </TouchableOpacity>

          <View style={styles.walletSubRow}>
            <View style={styles.walletSubItem}>
              <Text style={styles.walletSubLabel}>Pending</Text>
              <Text style={styles.walletSubValue}>{fmtGHS(wallet.pendingBalance)}</Text>
            </View>
            <View style={styles.walletSubDivider} />
            <View style={styles.walletSubItem}>
              <Text style={styles.walletSubLabel}>Total Earned</Text>
              <Text style={styles.walletSubValue}>{fmtGHS(wallet.totalEarned)}</Text>
            </View>
            <View style={styles.walletSubDivider} />
            <View style={styles.walletSubItem}>
              <Text style={styles.walletSubLabel}>Withdrawn</Text>
              <Text style={styles.walletSubValue}>{fmtGHS(wallet.totalWithdrawn)}</Text>
            </View>
          </View>
        </View>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <StatChip icon="share-social-outline" label="Shares" value={stats.totalShares} color={C.brand} />
          <StatChip icon="eye-outline" label="Clicks" value={stats.totalClicks} color={C.info} />
          <StatChip icon="bag-check-outline" label="Purchases" value={stats.totalPurchases} color={C.accent} />
          <StatChip icon="trending-up-outline" label="Conversion" value={`${stats.conversionRate}%`} color={C.success} />
        </View>

        {/* ── Referrals ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="share-social-outline" size={30} color={C.t3} />
              <Text style={styles.emptyText}>Share a product to start earning rewards</Text>
            </View>
          ) : (
            referrals.map((r) => <ReferralCard key={r._id} referral={r} />)
          )}
        </View>

        {/* ── Transactions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={30} color={C.t3} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.txnList}>
              {transactions.map((t) => <TransactionRow key={t._id} txn={t} />)}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <WithdrawModal
        visible={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableBalance={wallet.availableBalance}
        onSuccess={() => fetchStats(true)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: C.bg, paddingBottom:16 },
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

  walletCard: {
    backgroundColor: C.brand, borderRadius: 22, padding: 22,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 6 },
  walletBalance: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 16 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 14, paddingVertical: 13, marginBottom: 18,
  },
  withdrawBtnDisabled: { opacity: 0.5 },
  withdrawBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  walletSubRow: { flexDirection: 'row', alignItems: 'center' },
  walletSubItem: { flex: 1, alignItems: 'center' },
  walletSubDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  walletSubLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  walletSubValue: { fontSize: 14, color: '#fff', fontWeight: '800' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
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

  referralCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  referralImgWrap: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: C.elev, flexShrink: 0 },
  referralImg: { width: '100%', height: '100%' },
  referralImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  referralInfo: { flex: 1, minWidth: 0 },
  referralName: { fontSize: 13.5, fontWeight: '700', color: C.t1, marginBottom: 2 },
  referralCode: { fontSize: 11.5, color: C.t3, fontWeight: '500', marginBottom: 6 },
  referralMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 10.5, fontWeight: '700' },
  referralClicks: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  referralClicksText: { fontSize: 11, color: C.t3, fontWeight: '600' },
  referralReward: { alignItems: 'flex-end', flexShrink: 0 },
  referralRewardAmount: { fontSize: 14, fontWeight: '800', color: C.t3 },
  referralCommission: { fontSize: 10, color: C.t3, marginTop: 2 },

  txnList: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  txnIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  txnInfo: { flex: 1, minWidth: 0 },
  txnDesc: { fontSize: 13, fontWeight: '700', color: C.t1, marginBottom: 4 },
  txnMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txnDate: { fontSize: 11, color: C.t3, fontWeight: '500' },
  txnStatusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  txnStatusText: { fontSize: 9.5, fontWeight: '700' },
  txnAmount: { fontSize: 14, fontWeight: '800', flexShrink: 0 },

  // ── Withdraw Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  withdrawCard: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 32 },
  withdrawHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  withdrawTitle: { fontSize: 17, fontWeight: '800', color: C.t1 },
  withdrawCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center' },
  withdrawAvailable: { fontSize: 13, color: C.t2, marginBottom: 18, marginTop: 4 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.t2, marginBottom: 7, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  amountRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  amountInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 18, fontWeight: '800', color: C.t1, backgroundColor: C.bg,
  },
  maxBtn: { paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.brandBg, justifyContent: 'center', borderWidth: 1, borderColor: C.brandBorder },
  maxBtnText: { color: C.brand, fontWeight: '800', fontSize: 13 },

  networkRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  networkPill: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: C.bg },
  networkPillActive: { backgroundColor: C.brandBg, borderColor: C.brand },
  networkPillText: { fontSize: 12.5, fontWeight: '700', color: C.t2 },
  networkPillTextActive: { color: C.brand },

  textInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontWeight: '600', color: C.t1, backgroundColor: C.bg, marginBottom: 4,
  },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.dangerBg, borderRadius: 10, padding: 10, marginTop: 10 },
  errorBannerText: { fontSize: 12.5, color: C.danger, fontWeight: '600', flex: 1 },

  withdrawSubmitBtn: { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  withdrawSubmitBtnDisabled: { opacity: 0.7 },
  withdrawSubmitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});