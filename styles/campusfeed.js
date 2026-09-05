// src/styles/campusfeed.js
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const C = {
  brand: '#14B8A6',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  faint: 'rgba(255,255,255,0.55)',
  red: '#FF3B5C',
  overlayTop: 'rgba(0,0,0,0.45)',
  overlayBottom: 'rgba(0,0,0,0.75)',
  chipBg: 'rgba(255,255,255,0.16)',
  chipActive: 'rgba(255,255,255,0.95)',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Page
  page: { width: SCREEN_W, backgroundColor: '#000' },

  // Background
  textOnlyPattern: { ...StyleSheet.absoluteFillObject },
  decorIcon1: { position: 'absolute', right: -40, bottom: -40 },
  decorIcon2: { position: 'absolute', left: -20, top: '20%' },

  // Image background — full photo shown via "contain" over a blurred backdrop
  imageBackdropScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  imageForeground: { ...StyleSheet.absoluteFillObject },

  // Video
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playBtnLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingLeft: 3,
  },
  bigHeart: {
    position: 'absolute', top: '42%', left: '50%',
    marginLeft: -50, marginTop: -50,
  },

  // Top gradient
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  topRow: { position: 'absolute', top: Platform.OS === 'ios' ? 130 : 118, left: 14 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(2, 2, 2, 0.35)', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  typePillText: { color: C.white, fontSize: 10.5, fontWeight: '700' },
  typePillTextOnly: { backgroundColor: 'rgba(0,0,0,0.15)' },

  // Bottom gradient
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 },

  // Content area
  bottomContent: {
    position: 'absolute', bottom: 88, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    paddingHorizontal: 14,
  },
  bottomContentTextOnly: { paddingBottom: 30 },
  bottomLeft: { flex: 1, paddingRight: 12 },
  authorLine: { color: C.white, fontSize: 14, fontWeight: '800' },
  metaDot: { color: C.dim, fontSize: 12, fontWeight: '500' },
  title: { color: C.white, fontSize: 14.5, fontWeight: '600', marginTop: 6, lineHeight: 20 },
  titleTextOnly: { fontSize: 18, lineHeight: 26, fontWeight: '800' },
  description: { color: C.dim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  descriptionTextOnly: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)' },
  readMore: { color: C.brand, fontSize: 12.5, fontWeight: '600', marginTop: 4 },

  // Product chip
  productChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  productChipTextOnly: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productChipImg: { width: 32, height: 32, borderRadius: 8 },
  productChipImgPlaceholder: { backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  productChipName: { color: C.white, fontSize: 12.5, fontWeight: '600', flexShrink: 1 },
  productChipPrice: { color: C.brand, fontSize: 12.5, fontWeight: '800' },

  // Action rail
  rail: { alignItems: 'center', gap: 8, paddingBottom: 4, marginBottom: 50 },
  railAvatarWrap: { alignItems: 'center', marginBottom: 8 },
  railAvatar: {
    width: 54, height: 54, borderRadius: 26, borderWidth: 2, borderColor: C.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  railAvatarImg: { width: '100%', height: '100%' },
  railAvatarText: { color: C.white, fontSize: 17, fontWeight: '800' },
  railAvatarPlus: {
    position: 'absolute', bottom: -8, alignSelf: 'center',
    width: 22, height: 22, borderRadius: 10, backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000',
  },
  railBtn: { alignItems: 'center', gap: 3 },
  railLabel: { color: C.white, fontSize: 11, fontWeight: '700' },
  railAvatarPlusFollowing: {
    backgroundColor: '#059669', // Green when following
  },

  // Floating header
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4,
  },
  headerTitle: { color: C.white, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter
  filterContent: { paddingHorizontal: 12, gap: 6, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 16, backgroundColor: C.chipBg },
  filterChipActive: { backgroundColor: C.chipActive },
  filterChipText: { fontSize: 12.5, fontWeight: '700', color: C.white },
  filterChipTextActive: { color: '#0F172A' },

  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 6 },
  emptySubtitle: { fontSize: 13.5, color: C.dim, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  createFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25,
  },
  createFirstBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  // Loaders
  initialLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', gap: 12,
  },
  loadingText: { fontSize: 14, color: C.dim, fontWeight: '500' },

  // FAB - No fixed bottom position (set dynamically in component)
  fab: {
    position: 'absolute',
    right: 16,
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: C.white,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8,
  },
});