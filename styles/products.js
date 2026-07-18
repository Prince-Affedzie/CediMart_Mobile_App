import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Image,
  StatusBar,
  RefreshControl,
  Animated,
  FlatList,
} from 'react-native';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F4F6F4' },
  scrollContent: { paddingBottom: 20 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap: { height: 240, overflow: 'hidden', backgroundColor: 'rgba(10,20,60,0.50)', position: 'relative' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroScrimTop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroScrimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 110,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroNav: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 10,
  },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitleWrap: { flex: 1, alignItems: 'center' },
  heroEmoji: { fontSize: 22, marginBottom: 2 },
  heroTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroCount: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2, fontWeight: '500' },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#D32F2F', borderRadius: 9,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', paddingHorizontal: 2 },

  // Hero search
  heroSearchWrap: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 },
  heroSearchInactive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 8,
  },
  heroSearchPlaceholder: { flex: 1, fontSize: 14, color: '#BDBDBD' },
  heroSearchMic: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center',
  },
  heroSearchActive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 2, borderColor: '#4CAF50',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 8, overflow: 'hidden',
  },
  heroSearchInput: { flex: 1, fontSize: 14, color: '#1B2714', paddingVertical: 13, paddingHorizontal: 10 },
  heroSearchGoBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 13 },
  heroSearchGoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Live dropdown
  liveDropdown: {
    position: 'absolute', top: 60, left: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 12, zIndex: 999,
    overflow: 'hidden',
  },
  liveRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, gap: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5',
  },
  liveThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F5E9' },
  liveRowName: { fontSize: 13, fontWeight: '600', color: '#1B2714' },
  liveRowPrice: { fontSize: 12, fontWeight: '700', color: '#1B5E20' },
  liveRowCampus: {
    fontSize: 10, fontWeight: '600', color: '#2E7D32',
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  liveViewAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13,
    borderTopWidth: 0.5, borderTopColor: '#F0F0F0',
  },
  liveViewAllText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  // ── Category strip ──────────────────────────────────────────────────────────
  catStrip: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  catStripInner: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: 'transparent',
  },
  catTabActive: { borderColor: 'transparent' },
  catTabEmoji: { fontSize: 14 },
  catTabText: { fontSize: 12, fontWeight: '600', color: '#1B2714' },
  catTabTextActive: { color: '#fff' },

  // ── Subcategory strip ───────────────────────────────────────────────────────
  subCatStrip: {
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  subCatStripInner: { paddingHorizontal: 14, paddingVertical: 8, gap: 7, flexDirection: 'row' },
  subCatPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
  },
  subCatPillActive: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  subCatPillText: { fontSize: 11, fontWeight: '600', color: '#1B2714' },
  subCatPillTextActive: { color: '#2E7D32' },

  // ── Toolbar ─────────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  toolbarCount: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  toolbarCountBold: { fontWeight: '800', color: '#1B2714' },
  searchActiveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    maxWidth: 100,
  },
  searchActiveTagText: { fontSize: 11, color: '#1565C0', fontWeight: '600' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  toolbarChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F8E9', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#C8E6C9', maxWidth: 90,
  },
  toolbarChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  toolbarChipText: { fontSize: 11, color: '#2E7D32', fontWeight: '700', flex: 1 },
  toolbarChipTextActive: { color: '#fff' },
  toolbarIconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9', position: 'relative',
  },
  toolbarIconBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#FF5252', borderRadius: 8,
    width: 14, height: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  filterBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  viewGroup: {
    flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 3, gap: 2,
  },
  viewBtn: { padding: 5, borderRadius: 7 },
  viewBtnOn: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },

  // Active filter chips row
  activeFiltersRow: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    paddingVertical: 6, marginBottom: 4,
  },
  activeFiltersContent: { paddingHorizontal: 14, gap: 7, flexDirection: 'row' },
  activeFChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  activeFChipText: { fontSize: 11, color: '#1565C0', fontWeight: '600' },

  // ── Condition & negotiable badges ───────────────────────────────────────────
  condBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start' },
  condBadgeText: { fontSize: 9, fontWeight: '700' },
  negTag: { backgroundColor: '#1B5E20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  negTagText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Grid card ───────────────────────────────────────────────────────────────
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, paddingTop: 4 },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 2,
  },
  gridImgWrap: { height: 148, position: 'relative', backgroundColor: '#F5F5F5' },
  gridImg: { width: '100%', height: '100%' },
  gridImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  oosOverlayText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  gridCondPos: { position: 'absolute', top: 7, left: 7 },
  gridNegPos: { position: 'absolute', top: 7, right: 7 },
  gridBody: { padding: 11, paddingTop: 9 },
  gridName: { fontSize: 13, fontWeight: '700', color: '#1B2714', lineHeight: 18, marginBottom: 5 },
  gridMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, flexWrap: 'wrap' },
  campusMicroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#E8F5E9', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  campusMicroText: { fontSize: 9, fontWeight: '700', color: '#2E7D32' },
  subCatMicro: { fontSize: 9, color: '#9E9E9E', fontWeight: '500', flex: 1 },
  gridFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridPrice: { fontSize: 15, fontWeight: '800', color: '#1B5E20' },
  gridAddBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 5, elevation: 4,
  },
  gridAddBtnDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0 },
  gridQtyPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8E9', borderRadius: 20,
    paddingHorizontal: 3, paddingVertical: 3,
    borderWidth: 1.5, borderColor: '#C8E6C9', gap: 2,
  },
  gridQtyBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  gridQtyNum: { fontSize: 13, fontWeight: '800', color: '#2E7D32', minWidth: 22, textAlign: 'center' },

  // ── List card ───────────────────────────────────────────────────────────────
  listWrap: { paddingHorizontal: 12, gap: 10, paddingTop: 4 },
  listCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  listImgWrap: { width: 110, height: 120, position: 'relative', backgroundColor: '#F5F5F5' },
  listImg: { width: '100%', height: '100%' },
  listImgPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  listOosOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  listOosText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  listContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  listTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  listName: { fontSize: 14, fontWeight: '700', color: '#1B2714', flex: 1, lineHeight: 19 },
  listCatChip: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  listCatText: { fontSize: 16 },
  listMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 },
  listSubCat: { fontSize: 10, color: '#9E9E9E', fontWeight: '500', marginBottom: 6, textTransform: 'capitalize' },
  listBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listPrice: { fontSize: 16, fontWeight: '800', color: '#1B5E20' },
  listQtyPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F8E9', borderRadius: 20,
    paddingHorizontal: 4, paddingVertical: 3,
    borderWidth: 1.5, borderColor: '#C8E6C9', gap: 4,
  },
  listQtyBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  listQtyNum: { fontSize: 14, fontWeight: '800', color: '#2E7D32', minWidth: 26, textAlign: 'center' },
  listCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#4CAF50', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  listCartBtnOos: { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  listCartBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  categorySwitchOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(255,255,255,0.6)',
  justifyContent: 'flex-start',
  alignItems: 'center',
  paddingTop: 40,
},
categorySwitchCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#fff',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 20,
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},
categorySwitchText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#2E7D32',
},

  // ── Bottom sheets ───────────────────────────────────────────────────────────
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.46)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1B5E20', marginBottom: 14 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12,
    marginBottom: 5, gap: 12,
  },
  sheetRowActive: { backgroundColor: '#F1F8E9' },
  sheetRowIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  sheetRowIconActive: { backgroundColor: '#4CAF50' },
  sheetRowText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  sheetRowTextActive: { color: '#2E7D32', fontWeight: '700' },
  sheetSubHeading: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 10, marginTop: 14 },

  // Filter sheet specifics
  filterChipRow: { gap: 8, paddingBottom: 4, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 14,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  filterChipText: { fontSize: 12, color: '#616161', fontWeight: '600' },
  filterChipTextActive: { color: '#2E7D32' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  priceInputWrap: { flex: 1 },
  priceInputLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', marginBottom: 5 },
  priceInput: {
    backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#1B2714',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  priceDash: { width: 16, height: 2, backgroundColor: '#BDBDBD', marginTop: 18 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: '#F0F0F0', marginTop: 12,
  },
  toggleRowLabel: { fontSize: 14, fontWeight: '700', color: '#1B2714' },
  toggleRowSub: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  toggleSwitch: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#E0E0E0', justifyContent: 'center', padding: 3,
  },
  toggleSwitchOn: { backgroundColor: '#4CAF50' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },
  applyBtn: {
    backgroundColor: '#2E7D32', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clearFiltersBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  clearFiltersBtnText: { color: '#9E9E9E', fontSize: 13, fontWeight: '600' },

  // ── States ──────────────────────────────────────────────────────────────────
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 14, fontSize: 14, color: '#9E9E9E' },
  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4CAF50', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 12, gap: 8,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  resetBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 40, marginTop: 20, paddingVertical: 14,
    borderRadius: 14, backgroundColor: '#F1F8E9',
    borderWidth: 1.5, borderColor: '#C8E6C9', gap: 8,
  },
  loadMoreText: { color: '#2E7D32', fontSize: 14, fontWeight: '700' },

  // ── Toast ───────────────────────────────────────────────────────────────────
  toastContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    alignItems: 'center', paddingTop: 54, pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1B5E20', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 30, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 8,
    maxWidth: width - 60,
  },
  toastIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center',
  },
  toastText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 },
  toastBold: { fontWeight: '700', color: '#fff' },
  discountBadgeGrid: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: '#C62828',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  zIndex: 3,
},
discountBadgeGridText: {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.3,
},
gridPriceStack: {
  gap: 2,
},
gridPriceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
gridOriginalPrice: {
  fontSize: 11,
  color: '#9E9E9E',
  fontWeight: '600',
  textDecorationLine: 'line-through',
},
gridDiscountPill: {
  backgroundColor: '#FFEBEE',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#FFCDD2',
},
gridDiscountPillText: {
  fontSize: 9,
  fontWeight: '800',
  color: '#C62828',
},

// ─── Discount styles for List Card ────────────────────────────────────────
discountBadgeList: {
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: '#C62828',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  zIndex: 3,
},
discountBadgeListText: {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.3,
},
listPriceStack: {
  gap: 2,
},
listPriceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
listOriginalPrice: {
  fontSize: 12,
  color: '#9E9E9E',
  fontWeight: '600',
  textDecorationLine: 'line-through',
},
listDiscountPill: {
  backgroundColor: '#FFEBEE',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#FFCDD2',
},
listDiscountPillText: {
  fontSize: 10,
  fontWeight: '800',
  color: '#C62828',
},
});