import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
const { width } = Dimensions.get('window');

// ─── Color Palette ─────────────────────────────────────────────────────────
const Colors = {
  // Foundation
  background: '#F8FAFC',
  surface:    '#FFFFFF',
  elevated:   '#F1F5F9',
  
  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  
  // Borders
  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',
  
  // Brand - Teal (primary interactions)
  brand:         '#0D9488',      // Teal-600 (slightly more vibrant than #008080)
  brandLight:    '#14B8A6',      // Teal-500 (hover states)
  brandDark:     '#0F766E',      // Teal-700 (pressed states)
  brandDim:      'rgba(13,148,136,0.08)',
  brandBg:       '#F0FDFA',      // Teal-50 (backgrounds)
  brandBorder:   '#99F6E4',      // Teal-200 (borders)
  
  // Accent - Coral/Warm Orange (prices, CTAs, urgency)
  accent:        '#F97316',      // Orange-500 (pops against teal)
  accentLight:   '#FB923C',      // Orange-400
  accentDim:     'rgba(249,115,22,0.08)',
  accentBg:      '#FFF7ED',      // Orange-50
  accentBorder:  '#FED7AA',      // Orange-200
  
  // Success - Emerald (verified, in-stock)
  success:       '#059669',      // Emerald-600
  successLight:  '#10B981',      // Emerald-500
  successDim:    'rgba(5,150,105,0.08)',
  successBg:     '#ECFDF5',      // Emerald-50
  successBorder: '#A7F3D0',      // Emerald-200
  
  // Danger - Red (sales, errors, urgent)
  danger:        '#DC2626',      // Red-600
  dangerBg:      '#FEF2F2',      // Red-50
  dangerBorder:  '#FECACA',      // Red-200
  
  // Info - Sky Blue (coupons, notices)
  info:          '#0284C7',      // Sky-600
  infoBg:        '#F0F9FF',      // Sky-50
  infoBorder:    '#BAE6FD',      // Sky-200
  
  // Neutral
  white:         '#FFFFFF',
  black:         '#000000',
  gray50:        '#FAFAFA',
  gray100:       '#F5F5F5',
  gray200:       '#E5E7EB',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 14, fontSize: 15, color: Colors.textMuted },
  
  // ── HEADER ───────────────────────────────────────────────────────────────
  header: { 
    backgroundColor: Colors.surface,
    marginHorizontal: 4, 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 18, 
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 14 
  },
  headerGreeting: { 
    fontSize: 11, 
    color: Colors.textSecondary,
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 3 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: Colors.textPrimary,
    letterSpacing: -0.3 
  },
  locationPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: Colors.elevated,
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    alignSelf: 'flex-start', 
    marginTop: 6 
  },
  locationDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: Colors.success  // Emerald dot — subtle but premium
  },
  locationText: { 
    fontSize: 11, 
    color: Colors.textMuted,
    fontWeight: '500' 
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 8, 
    alignItems: 'center', 
    marginTop: 4 
  },
  headerSignInBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: Colors.border,
  },
  headerSignInText: { 
    fontSize: 13, 
    color: Colors.textPrimary,
    fontWeight: '700' 
  },
  headerSignUpBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: Colors.brand,  // Indigo — primary CTA
  },
  headerSignUpText: { 
    fontSize: 13, 
    color: Colors.white,
    fontWeight: '900' 
  },
  
  // ── SEARCH ───────────────────────────────────────────────────────────────
  searchWrapper: { position: 'relative', zIndex: 200 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: Colors.elevated, 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    paddingVertical: 11 
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 0 },
  searchIconBtn: { 
    width: 64,
    height: 44,
    backgroundColor: Colors.brand,  // Indigo search button
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: Colors.brand,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBackdrop: { position: 'absolute', top: 0, left: -16, right: -16, bottom: -1200, zIndex: 998 },
  searchDropdown: { 
    position: 'absolute', 
    top: 54, 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.surface, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 10, 
    zIndex: 999, 
    overflow: 'hidden' 
  },
  searchSection: { paddingVertical: 6 },
  searchSectionLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: Colors.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    paddingHorizontal: 14, 
    paddingTop: 10, 
    paddingBottom: 4 
  },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    gap: 12 
  },
  searchThumb: { 
    width: 44, 
    height: 44, 
    borderRadius: 10, 
    backgroundColor: Colors.brandBg  // Indigo background
  },
  searchRowName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  searchRowPrice: { fontSize: 12, fontWeight: '700', color: Colors.accent },  // Amber for price
  searchRowCampus: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: Colors.brand,  // Indigo for campus tag
    backgroundColor: Colors.brandBg, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  noResults: { alignItems: 'center', padding: 28 },
  noResultsTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginTop: 10 },
  noResultsSub: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  viewAllRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 14, 
    borderTopWidth: 0.5, 
    borderTopColor: Colors.borderLight 
  },
  viewAllText: { fontSize: 13, fontWeight: '600', color: Colors.brand },  // Indigo link
  
  // ── CAROUSEL ─────────────────────────────────────────────────────────────
  carouselSection: { marginHorizontal: 16, marginTop: 16 },
  carouselWrap: { borderRadius: 20, overflow: 'hidden' },
  slideWrapper: { 
    height: 200, 
    position: 'relative', 
    backgroundColor: Colors.brand  // Indigo instead of green
  },
  slideImage: { width: '100%', height: '100%', position: 'absolute' },
  slideScrim: { ...StyleSheet.absoluteFillObject },
  slideContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  slideTagPill: { 
    alignSelf: 'flex-start', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.3)', 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginBottom: 8 
  },
  slideTagText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  slideTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: Colors.white, 
    lineHeight: 25, 
    marginBottom: 4, 
    textShadowColor: 'rgba(0,0,0,0.35)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 4 
  },
  slideSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginBottom: 12 },
  slideBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    borderWidth: 1.5, 
    borderRadius: 20, 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    gap: 6, 
    backgroundColor: 'rgba(0,0,0,0.22)' 
  },
  slideBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  dotsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 10, 
    backgroundColor: Colors.background, 
    gap: 5 
  },
  dot: { borderRadius: 4, height: 5 },
  dotActive: { width: 18, backgroundColor: Colors.brand },      // Indigo active dot
  dotInactive: { width: 5, backgroundColor: '#C7D2FE' },       // Indigo-200
  
  // ── STATS BANNER ─────────────────────────────────────────────────────────
  statsBanner: { 
    flexDirection: 'row', 
    backgroundColor: Colors.brand,  // Indigo banner (was green)
    marginHorizontal: 16, 
    marginTop: 10, 
    borderRadius: 14, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    justifyContent: 'space-around', 
    alignItems: 'center' 
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.white },
  statLabel: { 
    fontSize: 10, 
    color: '#C7D2FE',  // Indigo-200 for labels on dark bg
    marginTop: 2, 
    fontWeight: '500' 
  },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  // ── SECTIONS ─────────────────────────────────────────────────────────────
  section: { 
    backgroundColor: Colors.surface, 
    marginTop: 10, 
    paddingTop: 18, 
    paddingBottom: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: 16, 
    marginBottom: 14 
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: Colors.brand },  // Indigo link
  urgentDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: Colors.danger,  // Red for urgency
    marginTop: 4 
  },
  
  // ── CAMPUS CARDS ─────────────────────────────────────────────────────────
  campusScrollContent: { paddingHorizontal: 16, gap: 10 },
  campusCard: { 
    width: 140, 
    borderRadius: 16, 
    padding: 13, 
    borderWidth: 1, 
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 7 
  },
  campusIconBadge: { 
    width: 38, 
    height: 38, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.brandBg  // Indigo background for campus icons
  },
  campusIcon: { fontSize: 18 },
  campusName: { fontSize: 13, fontWeight: '700', lineHeight: 17, color: Colors.textPrimary },
  campusCountChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    borderWidth: 1, 
    borderColor: Colors.border,
    borderRadius: 10, 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    alignSelf: 'flex-start',
    backgroundColor: Colors.elevated
  },
  campusCountDot: { 
    width: 5, 
    height: 5, 
    borderRadius: 3, 
    backgroundColor: Colors.success  // Emerald dot for active campus
  },
  campusCountText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  campusNoListings: { fontSize: 10, color: Colors.textMuted },
  
  // ── CATEGORIES ───────────────────────────────────────────────────────────
  categoryScroll: { paddingHorizontal: 16, gap: 10 },
  categoryPill: { alignItems: 'center', width: 68 },
  categoryIconCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6, 
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface
  },
  categoryEmoji: { fontSize: 22 },
  categoryName: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: Colors.textSecondary, 
    textAlign: 'center' 
  },
  
  // ── PRODUCT CARDS ────────────────────────────────────────────────────────
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  productCard: { 
    width: (width - 42) / 2, 
    backgroundColor: Colors.surface, 
    borderRadius: 14, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 5, 
    elevation: 2 
  },
  productImgWrap: { position: 'relative' },
  productImg: { width: '100%', height: 120 },
  productImgPlaceholder: { 
    width: '100%', 
    height: 120, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.elevated
  },
  conditionOverlay: { position: 'absolute', top: 6, left: 6 },
  negotiableTag: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    backgroundColor: Colors.accent,  // Amber tag for negotiable
    borderRadius: 6, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  negotiableTagText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  productBody: { padding: 10 },
  productName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    marginBottom: 4, 
    lineHeight: 17 
  },
  campusPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    backgroundColor: Colors.brandBg,  // Indigo background
    alignSelf: 'flex-start', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  campusPillText: { fontSize: 10, fontWeight: '600', color: Colors.brand },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 14, fontWeight: '800', color: Colors.accent },  // Amber for prices
  viewBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 9, 
    backgroundColor: Colors.brandBg,  // Indigo background
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#C7D2FE'  // Indigo-200 border
  },
  conditionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  conditionBadgeText: { fontSize: 9, fontWeight: '700' },
  
  // ── HORIZONTAL SCROLL / DEAL CARDS ───────────────────────────────────────
  horizontalScroll: { paddingHorizontal: 16, gap: 12 },
  dealCard: { 
    width: 160, 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: Colors.brandBg  // Indigo background for deal cards
  },
  dealImg: { width: '100%', height: '100%', position: 'absolute' },
  dealImgPlaceholder: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  urgentBadge: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    backgroundColor: Colors.danger,  // Red for urgency
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 8 
  },
  urgentBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  dealOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.52)', 
    padding: 12, 
    gap: 5 
  },
  dealName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  dealBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealPrice: { fontSize: 14, fontWeight: '800', color: Colors.accentLight },  // Amber for deal price
  dealNeg: { fontSize: 9, color: '#C7D2FE', fontWeight: '600', marginTop: 1 },
  dealViewBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 9, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // ── SELL BANNER ──────────────────────────────────────────────────────────
  bannerSection: { paddingHorizontal: 16, marginTop: 10 },
  sellBanner: { 
    backgroundColor: Colors.brand,  // Indigo sell banner (was green)
    borderRadius: 20, 
    flexDirection: 'row', 
    overflow: 'hidden', 
    minHeight: 150 
  },
  sellBannerContent: { flex: 1, padding: 18, justifyContent: 'center' },
  sellBannerTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(255,255,255,0.18)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20, 
    marginBottom: 8 
  },
  sellBannerTagText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  sellBannerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: Colors.white, 
    marginBottom: 4, 
    lineHeight: 26 
  },
  sellBannerSub: { 
    fontSize: 12, 
    color: '#C7D2FE',  // Indigo-200 for subtitle
    marginBottom: 14, 
    lineHeight: 17 
  },
  sellBannerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: Colors.white, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  sellBannerBtnText: { fontSize: 13, fontWeight: '700', color: Colors.brand },
  sellBannerIllustration: { width: 100, justifyContent: 'center', alignItems: 'center' },
  
  // ── SAFETY SECTION ───────────────────────────────────────────────────────
  safetySection: { 
    backgroundColor: Colors.surface, 
    marginTop: 10, 
    paddingTop: 18, 
    paddingBottom: 20 
  },
  safetySectionTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: Colors.textPrimary, 
    paddingHorizontal: 16, 
    marginBottom: 12 
  },
  safetyScroll: { paddingHorizontal: 16, gap: 10 },
  safetyCard: { 
    width: 140, 
    backgroundColor: Colors.successBg,  // Emerald background for safety
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#A7F3D0',  // Emerald-200
    gap: 5 
  },
  safetyCardIcon: { fontSize: 22 },
  safetyCardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  safetyCardDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  
  // ─── Product Card - Discount styles ──────────────────────────────────────
  discountBadgeProduct: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.danger,  // Red for discount badges
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 5, zIndex: 3,
  },
  discountBadgeProductText: { 
    color: Colors.white, 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 0.3 
  },
  conditionOverlaySecondary: { position: 'absolute', top: 8, right: 8, zIndex: 3 },
  productPriceStack: { gap: 2 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  productOriginalPrice: { 
    fontSize: 10.5, 
    color: Colors.textMuted, 
    fontWeight: '600', 
    textDecorationLine: 'line-through' 
  },
  productDiscountPill: { 
    backgroundColor: Colors.dangerBg, 
    paddingHorizontal: 5, 
    paddingVertical: 1.5, 
    borderRadius: 3, 
    borderWidth: 1, 
    borderColor: Colors.dangerBorder 
  },
  productDiscountPillText: { fontSize: 8.5, fontWeight: '800', color: Colors.danger },

  // ─── Deal Card - Discount styles ─────────────────────────────────────────
  dealDiscountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.danger,  // Red for discount badges
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 3, zIndex: 3,
  },
  dealDiscountBadgeText: { 
    color: Colors.white, 
    fontSize: 9, 
    fontWeight: '800', 
    letterSpacing: 0.3 
  },
  dealPriceStack: { gap: 1 },
  dealPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dealOriginalPrice: { 
    fontSize: 10, 
    color: Colors.textMuted, 
    fontWeight: '600', 
    textDecorationLine: 'line-through' 
  },
  dealDiscountPill: { 
    backgroundColor: Colors.dangerBg, 
    paddingHorizontal: 5, 
    paddingVertical: 1.5, 
    borderRadius: 3, 
    borderWidth: 1, 
    borderColor: Colors.dangerBorder 
  },
  dealDiscountPillText: { fontSize: 8, fontWeight: '800', color: Colors.danger },
});