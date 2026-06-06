// src/screens/main/ProductsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — mirrors schema enums exactly
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',                    label: 'All',                   icon: 'apps',                   emoji: '🛍️',  color: '#E8F5E9', accent: '#2E7D32' },
  { id: 'electronics',            label: 'Electronics',           icon: 'hardware-chip-outline',  emoji: '🔌',  color: '#E3F2FD', accent: '#1565C0' },
  { id: 'phones and tablets',     label: 'Phones & Tablets',      icon: 'phone-portrait-outline', emoji: '📱',  color: '#F3E5F5', accent: '#6A1B9A' },
  { id: 'computers and laptops',  label: 'Computers & Laptops',   icon: 'laptop-outline',         emoji: '💻',  color: '#E8EAF6', accent: '#283593' },
  { id: 'gaming',                 label: 'Gaming',                icon: 'game-controller-outline',emoji: '🎮',  color: '#FCE4EC', accent: '#880E4F' },
  { id: 'fashion',                label: 'Fashion',               icon: 'shirt-outline',          emoji: '👗',  color: '#FFF3E0', accent: '#E65100' },
  { id: 'books-course-materials', label: 'Books & Notes',         icon: 'book-outline',           emoji: '📚',  color: '#FFF9C4', accent: '#F57F17' },
  { id: 'hostel-items',           label: 'Hostel Items',          icon: 'bed-outline',            emoji: '🛏️',  color: '#E8F5E9', accent: '#2E7D32' },
  { id: 'appliances',             label: 'Appliances',            icon: 'flash-outline',          emoji: '🔧',  color: '#EFEBE9', accent: '#4E342E' },
  { id: 'furniture',              label: 'Furniture',             icon: 'home-outline',           emoji: '🪑',  color: '#F1F8E9', accent: '#33691E' },
  { id: 'beauty and grooming',    label: 'Beauty & Grooming',     icon: 'sparkles-outline',       emoji: '💄',  color: '#FCE4EC', accent: '#AD1457' },
  { id: 'sports and fitness',     label: 'Sports & Fitness',      icon: 'bicycle-outline',        emoji: '⚽',  color: '#E8F5E9', accent: '#1B5E20' },
  { id: 'accessories',            label: 'Accessories',           icon: 'watch-outline',          emoji: '👜',  color: '#FFF9C4', accent: '#827717' },
  { id: 'food and drinks',        label: 'Food & Drinks',         icon: 'fast-food-outline',      emoji: '🍱',  color: '#FBE9E7', accent: '#BF360C' },
  { id: 'services',               label: 'Services',              icon: 'construct-outline',      emoji: '🛠️',  color: '#E3F2FD', accent: '#01579B' },
  { id: 'other',                  label: 'Other',                 icon: 'grid-outline',           emoji: '📦',  color: '#F5F5F5', accent: '#616161' },
];

// Subcategories grouped by parent category id
const SUBCATEGORIES = {
  'electronics': [
    { id: 'headphones-earbuds', label: 'Headphones & Earbuds' },
    { id: 'speakers',           label: 'Speakers' },
    { id: 'chargers-cables',    label: 'Chargers & Cables' },
    { id: 'power-banks',        label: 'Power Banks' },
    { id: 'smartwatches',       label: 'Smartwatches' },
    { id: 'cameras',            label: 'Cameras' },
    { id: 'other-electronics',  label: 'Other Electronics' },
  ],
  'phones and tablets': [
    { id: 'smartphones',              label: 'Smartphones' },
    { id: 'tablets',                  label: 'Tablets' },
    { id: 'ipads',                    label: 'iPads' },
    { id: 'phone-cases',              label: 'Phone Cases' },
    { id: 'screen-protectors',        label: 'Screen Protectors' },
    { id: 'other-phone-accessories',  label: 'Other Accessories' },
  ],
  'computers and laptops': [
    { id: 'laptops',                    label: 'Laptops' },
    { id: 'desktops',                   label: 'Desktops' },
    { id: 'monitors',                   label: 'Monitors' },
    { id: 'keyboards',                  label: 'Keyboards' },
    { id: 'mouse',                      label: 'Mouse' },
    { id: 'laptop-bags',                label: 'Laptop Bags' },
    { id: 'software',                   label: 'Software' },
    { id: 'other-computer-accessories', label: 'Other' },
  ],
  'gaming': [
    { id: 'consoles',           label: 'Consoles' },
    { id: 'games',              label: 'Games' },
    { id: 'controllers',        label: 'Controllers' },
    { id: 'gaming-accessories', label: 'Accessories' },
  ],
  'fashion': [
    { id: 'men-clothing',    label: "Men's Clothing" },
    { id: 'women-clothing',  label: "Women's Clothing" },
    { id: 'unisex-clothing', label: 'Unisex Clothing' },
    { id: 'shoes',           label: 'Shoes' },
    { id: 'bags',            label: 'Bags' },
    { id: 'watches',         label: 'Watches' },
    { id: 'jewelry',         label: 'Jewelry' },
    { id: 'other-fashion',   label: 'Other Fashion' },
  ],
  'books-course-materials': [
    { id: 'textbooks',      label: 'Textbooks' },
    { id: 'course-notes',   label: 'Course Notes' },
    { id: 'past-questions', label: 'Past Questions' },
    { id: 'stationery',     label: 'Stationery' },
    { id: 'novels',         label: 'Novels' },
    { id: 'other-books',    label: 'Other Books' },
  ],
  'hostel-items': [
    { id: 'bedding',          label: 'Bedding' },
    { id: 'kitchenware',      label: 'Kitchenware' },
    { id: 'cleaning-supplies',label: 'Cleaning Supplies' },
    { id: 'storage',          label: 'Storage' },
    { id: 'lighting',         label: 'Lighting' },
    { id: 'other-hostel',     label: 'Other' },
  ],
  'appliances': [
    { id: 'fans',             label: 'Fans' },
    { id: 'heaters',          label: 'Heaters' },
    { id: 'irons',            label: 'Irons' },
    { id: 'kettles',          label: 'Kettles' },
    { id: 'blenders',         label: 'Blenders' },
    { id: 'microwaves',       label: 'Microwaves' },
    { id: 'other-appliances', label: 'Other' },
  ],
  'furniture': [
    { id: 'chairs',          label: 'Chairs' },
    { id: 'tables-desks',    label: 'Tables & Desks' },
    { id: 'beds-mattresses', label: 'Beds & Mattresses' },
    { id: 'shelves',         label: 'Shelves' },
    { id: 'other-furniture', label: 'Other' },
  ],
  'beauty and grooming': [
    { id: 'skincare',      label: 'Skincare' },
    { id: 'makeup',        label: 'Makeup' },
    { id: 'hair-care',     label: 'Hair Care' },
    { id: 'perfumes',      label: 'Perfumes' },
    { id: 'nail-care',     label: 'Nail Care' },
    { id: 'other-beauty',  label: 'Other' },
  ],
  'sports and fitness': [
    { id: 'sports-equipment', label: 'Sports Equipment' },
    { id: 'gym-gear',          label: 'Gym Gear' },
    { id: 'activewear',        label: 'Activewear' },
    { id: 'other-sports',      label: 'Other' },
  ],
  'accessories': [
    { id: 'phone-accessories',   label: 'Phone Accessories' },
    { id: 'laptop-accessories',  label: 'Laptop Accessories' },
    { id: 'fashion-accessories', label: 'Fashion Accessories' },
    { id: 'other-accessories',   label: 'Other' },
  ],
  'food and drinks': [
    { id: 'snacks',        label: 'Snacks' },
    { id: 'drinks',        label: 'Drinks' },
    { id: 'homemade-meals',label: 'Homemade Meals' },
    { id: 'baked-goods',   label: 'Baked Goods' },
    { id: 'other-food',    label: 'Other Food' },
  ],
  'services': [
    { id: 'tutoring',               label: 'Tutoring' },
    { id: 'graphic-design',         label: 'Graphic Design' },
    { id: 'photography',            label: 'Photography' },
    { id: 'printing-photocopy',     label: 'Printing & Photocopy' },
    { id: 'laundry',                label: 'Laundry' },
    { id: 'barbering-hairdressing', label: 'Barbing & Hairdressing' },
    { id: 'tech-repairs',           label: 'Tech Repairs' },
    { id: 'other-services',         label: 'Other Services' },
  ],
  'other': [
    { id: 'miscellaneous', label: 'Miscellaneous' },
  ],
};

const CONDITION_CONFIG = {
  'new':          { label: 'Brand New',    textColor: '#1B5E20', bg: '#E8F5E9' },
  'like-new':     { label: 'Like New',     textColor: '#1565C0', bg: '#E3F2FD' },
  'excellent':    { label: 'Excellent',    textColor: '#4527A0', bg: '#EDE7F6' },
  'good':         { label: 'Good',         textColor: '#E65100', bg: '#FFF3E0' },
  'fair':         { label: 'Fair',         textColor: '#827717', bg: '#F9FBE7' },
  'slightly-used':{ label: 'Slight Used',  textColor: '#4E342E', bg: '#EFEBE9' },
  'for-parts':    { label: 'For Parts',    textColor: '#B71C1C', bg: '#FFEBEE' },
};

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest First',        icon: 'time-outline' },
  { id: 'oldest',     label: 'Oldest First',         icon: 'hourglass-outline' },
  { id: 'price-asc',  label: 'Price: Low → High',   icon: 'arrow-up-outline' },
  { id: 'price-desc', label: 'Price: High → Low',   icon: 'arrow-down-outline' },
  { id: 'popular',    label: 'Most Popular',         icon: 'trending-up-outline' },
  { id: 'rating',     label: 'Top Rated',            icon: 'star-outline' },
];

const CAMPUS_OPTIONS = [
  { id: '',       label: 'All Campuses' },
  { id: 'UG',     label: 'University of Ghana' },
  { id: 'KNUST',  label: 'KNUST' },
  { id: 'UCC',    label: 'Univ. of Cape Coast' },
  { id: 'ASHESI', label: 'Ashesi University' },
  { id: 'GIMPA',  label: 'GIMPA' },
  { id: 'UEW',    label: 'Univ. of Education' },
  { id: 'UPSA',   label: 'UPSA' },
  { id: 'ATU',    label: 'Accra Technical Univ.' },
  { id: 'OTHER',  label: 'Other Campus' },
];

// Hero banner images keyed by category id
const HERO_IMAGES = {
  all:                    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694282/campus_ecommerce_flyer_1_jqpppo.jpg',
  electronics:            'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  'phones and tablets':   'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  'computers and laptops':'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  gaming:                 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800',
  fashion:                'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
  'books-course-materials':'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780695851/books_flyer_ljnqis.jpg',
  'hostel-items':         'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  appliances:             'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690124/appliances_bkv5s1.jpg',
  furniture:              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  'beauty and grooming':  'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690851/beauty_m4uwn1.jpg',
  'sports and fitness':   'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690851/sports_and_fitness_g3ozaa.webp',
  accessories:            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  'food and drinks':      'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690853/food_and_drinks_knhmgb.jpg',
  services:               'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
  other:                  'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694282/campus_ecommerce_flyer_1_jqpppo.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Animated toast notification
const CartToast = ({ visible, productName }) => {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        <View style={styles.toastIcon}>
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
        <Text style={styles.toastText} numberOfLines={1}>
          <Text style={styles.toastBold}>{productName}</Text> saved to cart
        </Text>
      </View>
    </Animated.View>
  );
};

// Condition pill badge
const ConditionBadge = ({ condition }) => {
  const cfg = CONDITION_CONFIG[condition];
  if (!cfg) return null;
  return (
    <View style={[styles.condBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.condBadgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  );
};

// Negotiable tag
const NegotiableTag = () => (
  <View style={styles.negTag}>
    <Text style={styles.negTagText}>Nego</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// GRID CARD
// ─────────────────────────────────────────────────────────────────────────────
const GridCard = ({ item, onPress, onAddToCart, onQtyChange, qtyInCart, isAdding, isUpdating }) => {
  const productId = item._id;
  const imageUri = item.images?.[0];
  const catCfg = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const outOfStock = (item.countInStock ?? 0) <= 0;
  const isLoading = isAdding || isUpdating;

  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
      disabled={isLoading}
    >
      {/* Image */}
      <View style={styles.gridImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.gridImg} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImgPlaceholder, { backgroundColor: catCfg.color }]}>
            <Text style={{ fontSize: 32 }}>{catCfg.emoji}</Text>
          </View>
        )}

        {outOfStock && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosOverlayText}>Unavailable</Text>
          </View>
        )}

        {/* Top-left: condition */}
        {item.condition && !outOfStock && (
          <View style={styles.gridCondPos}>
            <ConditionBadge condition={item.condition} />
          </View>
        )}

        {/* Top-right: negotiable */}
        {item.negotiable && !outOfStock && (
          <View style={styles.gridNegPos}>
            <NegotiableTag />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.gridBody}>
        <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>

        {/* Campus + subcategory row */}
        <View style={styles.gridMetaRow}>
          {item.campus && (
            <View style={styles.campusMicroPill}>
              <Ionicons name="school-outline" size={8} color="#2E7D32" />
              <Text style={styles.campusMicroText}>{item.campus}</Text>
            </View>
          )}
          {item.subcategory && (
            <Text style={styles.subCatMicro} numberOfLines={1}>
              {item.subcategory.replace(/-/g, ' ')}
            </Text>
          )}
        </View>

        <View style={styles.gridFooter}>
          <Text style={styles.gridPrice}>GH₵ {item.price?.toFixed(2)}</Text>

          {qtyInCart === 0 ? (
            <TouchableOpacity
              style={[styles.gridAddBtn, outOfStock && styles.gridAddBtnDisabled]}
              onPress={() => onAddToCart(item)}
              disabled={isLoading || outOfStock}
              activeOpacity={0.8}
            >
              {isAdding
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="add" size={18} color="#fff" />}
            </TouchableOpacity>
          ) : (
            <View style={styles.gridQtyPill}>
              <TouchableOpacity
                style={styles.gridQtyBtn}
                onPress={() => onQtyChange(item, 'decrease')}
                disabled={isLoading}
              >
                <Ionicons name="remove" size={12} color="#2E7D32" />
              </TouchableOpacity>
              {isUpdating
                ? <ActivityIndicator size="small" color="#4CAF50" style={{ width: 22 }} />
                : <Text style={styles.gridQtyNum}>{qtyInCart}</Text>}
              <TouchableOpacity
                style={styles.gridQtyBtn}
                onPress={() => onQtyChange(item, 'increase')}
                disabled={isLoading || qtyInCart >= (item.countInStock ?? 0)}
              >
                <Ionicons name="add" size={12} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST CARD
// ─────────────────────────────────────────────────────────────────────────────
const ListCard = ({ item, onPress, onAddToCart, onQtyChange, qtyInCart, isAdding, isUpdating }) => {
  const imageUri = item.images?.[0];
  const catCfg = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];
  const outOfStock = (item.countInStock ?? 0) <= 0;
  const isLoading = isAdding || isUpdating;

  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      disabled={isLoading}
    >
      {/* Image */}
      <View style={styles.listImgWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.listImg} resizeMode="cover" />
        ) : (
          <View style={[styles.listImgPlaceholder, { backgroundColor: catCfg.color }]}>
            <Text style={{ fontSize: 28 }}>{catCfg.emoji}</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.listOosOverlay}>
            <Text style={styles.listOosText}>N/A</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.listContent}>
        {/* Top row: name + category chip */}
        <View style={styles.listTopRow}>
          <Text style={styles.listName} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.listCatChip, { backgroundColor: catCfg.color }]}>
            <Text style={[styles.listCatText, { color: catCfg.accent }]}>{catCfg.emoji}</Text>
          </View>
        </View>

        {/* Meta row: campus, subcategory, condition, negotiable */}
        <View style={styles.listMetaRow}>
          {item.campus && (
            <View style={styles.campusMicroPill}>
              <Ionicons name="school-outline" size={8} color="#2E7D32" />
              <Text style={styles.campusMicroText}>{item.campus}</Text>
            </View>
          )}
          {item.condition && <ConditionBadge condition={item.condition} />}
          {item.negotiable && <NegotiableTag />}
        </View>

        {item.subcategory && (
          <Text style={styles.listSubCat} numberOfLines={1}>
            {item.subcategory.replace(/-/g, ' ')}
          </Text>
        )}

        {/* Bottom row: price + cart control */}
        <View style={styles.listBottomRow}>
          <Text style={styles.listPrice}>GH₵ {item.price?.toFixed(2)}</Text>

          {qtyInCart === 0 ? (
            <TouchableOpacity
              style={[styles.listCartBtn, outOfStock && styles.listCartBtnOos]}
              onPress={() => onAddToCart(item)}
              disabled={isLoading || outOfStock}
              activeOpacity={0.8}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={outOfStock ? 'close-circle-outline' : 'bag-add-outline'} size={13} color="#fff" />
                  <Text style={styles.listCartBtnText}>{outOfStock ? 'Unavailable' : 'Add to Cart'}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.listQtyPill}>
              <TouchableOpacity
                style={styles.listQtyBtn}
                onPress={() => onQtyChange(item, 'decrease')}
                disabled={isLoading}
              >
                <Ionicons name="remove" size={13} color="#2E7D32" />
              </TouchableOpacity>
              {isUpdating
                ? <ActivityIndicator size="small" color="#4CAF50" style={{ width: 28 }} />
                : <Text style={styles.listQtyNum}>{qtyInCart}</Text>}
              <TouchableOpacity
                style={styles.listQtyBtn}
                onPress={() => onQtyChange(item, 'increase')}
                disabled={isLoading || qtyInCart >= (item.countInStock ?? 0)}
              >
                <Ionicons name="add" size={13} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM SHEET  (reusable)
// ─────────────────────────────────────────────────────────────────────────────
const BottomSheet = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>{title}</Text>
      {children}
      <View style={{ height: 24 }} />
    </View>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const ProductsScreen = ({ navigation, route }) => {
  const { addToCart, updateQuantity, removeFromCart, cartCount, cartItems } = useCart();
  const { isAuthenticated } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pagination, setPagination]       = useState({});

  // Filters
  const [selectedCategory, setSelectedCategory]   = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedCampus, setSelectedCampus]       = useState('');
  const [selectedSort, setSelectedSort]           = useState('newest');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [negotiableOnly, setNegotiableOnly]       = useState(false);
  const [minPrice, setMinPrice]                   = useState('');
  const [maxPrice, setMaxPrice]                   = useState('');
  const [currentPage, setCurrentPage]             = useState(1);

  // Search
  const [searchQuery, setSearchQuery]         = useState('');
  const [showSearch, setShowSearch]           = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [liveSearching, setLiveSearching]     = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  // UI
  const [viewMode, setViewMode]             = useState('grid');
  const [sortSheetVisible, setSortSheetVisible]     = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [campusSheetVisible, setCampusSheetVisible] = useState(false);
  const [addingProductId, setAddingProductId]   = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [toastVisible, setToastVisible]         = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  const searchInputRef  = useRef(null);
  const fetchIdRef      = useRef(0);
  const isMountedRef    = useRef(true);
  const toastTimeoutRef = useRef(null);
  const heroScaleAnim   = useRef(new Animated.Value(1.06)).current;

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    Animated.spring(heroScaleAnim, { toValue: 1, tension: 55, friction: 11, useNativeDriver: true }).start();

    // Accept initial params from navigation
    if (route.params?.category)    setSelectedCategory(route.params.category);
    if (route.params?.campus)      setSelectedCampus(route.params.campus);
    if (route.params?.search)      setSearchQuery(route.params.search);
    if (route.params?.sort)        setSelectedSort(route.params.sort);

    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ── Search auto-focus ──────────────────────────────────────────────────────
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  // ── Live search debounce ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) performLiveSearch();
      else {
        setLiveSearchResults([]);
        setShowLiveDropdown(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Reload on filter changes ───────────────────────────────────────────────
  useEffect(() => {
    // Reset subcategory when category changes
    setSelectedSubcategory('');
    loadProducts({ page: 1 });
  }, [selectedCategory]);

  useEffect(() => {
    if (!loading) loadProducts({ page: 1 });
  }, [selectedSubcategory, selectedCampus, selectedSort, selectedCondition, negotiableOnly, minPrice, maxPrice]);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const buildParams = (overrides = {}) => {
    const base = {
      category:    selectedCategory !== 'all' ? selectedCategory : undefined,
      subcategory: selectedSubcategory || undefined,
      campus:      selectedCampus || undefined,
      sort:        selectedSort,
      condition:   selectedCondition || undefined,
      negotiable:  negotiableOnly || undefined,
      minPrice:    minPrice || undefined,
      maxPrice:    maxPrice || undefined,
      search:      searchQuery.trim() || undefined,
      limit:       20,
    };
    return { ...base, ...overrides };
  };

  const loadProducts = useCallback(async ({ page = 1, append = false } = {}) => {
    fetchIdRef.current += 1;
    const myId = fetchIdRef.current;

    if (!append) setLoading(true);

    try {
      const params = buildParams({ page });
      const res = await productService.getProducts(params);

      if (myId !== fetchIdRef.current || !isMountedRef.current) return;

      if (res?.success) {
        setProducts(append ? (prev) => [...prev, ...(res.data || [])] : (res.data || []));
        setTotalProducts(res.total || 0);
        setPagination(res.pagination || {});
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Load products error:', err);
    } finally {
      if (myId !== fetchIdRef.current || !isMountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedSubcategory, selectedCampus, selectedSort, selectedCondition, negotiableOnly, minPrice, maxPrice, searchQuery]);

  const performLiveSearch = async () => {
    setLiveSearching(true);
    try {
      const res = await productService.getProducts({
        search: searchQuery.trim(),
        limit: 6,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        campus: selectedCampus || undefined,
      });
      if (isMountedRef.current) {
        setLiveSearchResults(res?.data || []);
        setShowLiveDropdown(true);
      }
    } catch { /* silent */ }
    finally { setLiveSearching(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts({ page: 1 });
  }, [loadProducts]);

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      loadProducts({ page: currentPage + 1, append: true });
    }
  };

  const handleSearchSubmit = () => {
    setShowLiveDropdown(false);
    loadProducts({ page: 1 });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLiveSearchResults([]);
    setShowLiveDropdown(false);
    loadProducts({ page: 1 });
  };

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const getQtyInCart = (productId) => {
    const item = cartItems?.find(i => i.product?._id === productId || i.productId === productId);
    return item?.quantity ?? 0;
  };

  const showToast = (name) => {
    setAddedProductName(name);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2200);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to save items.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if ((product.countInStock ?? 0) <= 0) {
      Alert.alert('Unavailable', `${product.name} is no longer available.`);
      return;
    }
    try {
      setAddingProductId(product._id);
      await addToCart(product._id, 1);
      showToast(product.name);
    } catch {
      Alert.alert('Error', 'Could not add item. Please try again.');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleQtyChange = async (product, action) => {
    const productId = product._id;
    const qty = getQtyInCart(productId);
    try {
      if (action === 'increase') {
        if (qty >= (product.countInStock ?? 0)) {
          Alert.alert('Stock Limit', `Only ${product.countInStock} unit(s) available.`);
          return;
        }
        setUpdatingProductId(productId);
        await addToCart(productId, 1);
      } else if (action === 'decrease' && qty > 1) {
        setUpdatingProductId(productId);
        await updateQuantity(productId, qty - 1);
      } else if (action === 'decrease' && qty === 1) {
        Alert.alert('Remove Item?', `Remove ${product.name} from cart?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove', style: 'destructive',
            onPress: async () => {
              setUpdatingProductId(productId);
              await removeFromCart(productId);
              setUpdatingProductId(null);
            },
          },
        ]);
        return;
      }
    } catch {
      Alert.alert('Error', 'Could not update cart.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const activeCatConfig   = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
  const subcatsForCat     = SUBCATEGORIES[selectedCategory] || [];
  const heroImage         = HERO_IMAGES[selectedCategory] || HERO_IMAGES.all;
  const activeSortLabel   = SORT_OPTIONS.find(s => s.id === selectedSort)?.label || 'Sort';
  const activeCampusLabel = CAMPUS_OPTIONS.find(c => c.id === selectedCampus)?.label || 'Campus';

  // Active filter count for badge
  const activeFilterCount = [
    selectedCampus, selectedCondition, negotiableOnly, minPrice, maxPrice,
  ].filter(Boolean).length;

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="search-outline" size={38} color="#A5D6A7" />
      </View>
      <Text style={styles.emptyTitle}>No listings found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : selectedCategory !== 'all'
            ? `Nothing in ${activeCatConfig.label} yet`
            : 'Try adjusting your filters'}
      </Text>
      <TouchableOpacity
        style={styles.resetBtn}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setSelectedSubcategory('');
          setSelectedCampus('');
          setSelectedSort('newest');
          setSelectedCondition('');
          setNegotiableOnly(false);
          setMinPrice('');
          setMaxPrice('');
          loadProducts({ page: 1 });
        }}
      >
        <Ionicons name="refresh-outline" size={15} color="#fff" />
        <Text style={styles.resetBtnText}>Clear All Filters</Text>
      </TouchableOpacity>
    </View>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      {/* Toast */}
      <CartToast visible={toastVisible} productName={addedProductName} />

      {/* ── SORT SHEET ── */}
      <BottomSheet visible={sortSheetVisible} onClose={() => setSortSheetVisible(false)} title="Sort Listings">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {SORT_OPTIONS.map(opt => {
            const isActive = selectedSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                onPress={() => { setSelectedSort(opt.id); setSortSheetVisible(false); }}
              >
                <View style={[styles.sheetRowIcon, isActive && styles.sheetRowIconActive]}>
                  <Ionicons name={opt.icon} size={16} color={isActive ? '#fff' : '#757575'} />
                </View>
                <Text style={[styles.sheetRowText, isActive && styles.sheetRowTextActive]}>{opt.label}</Text>
                {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* ── CAMPUS SHEET ── */}
      <BottomSheet visible={campusSheetVisible} onClose={() => setCampusSheetVisible(false)} title="Filter by Campus">
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {CAMPUS_OPTIONS.map(opt => {
            const isActive = selectedCampus === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sheetRow, isActive && styles.sheetRowActive]}
                onPress={() => { setSelectedCampus(opt.id); setCampusSheetVisible(false); }}
              >
                <View style={[styles.sheetRowIcon, isActive && styles.sheetRowIconActive]}>
                  <Ionicons name="school-outline" size={16} color={isActive ? '#fff' : '#757575'} />
                </View>
                <Text style={[styles.sheetRowText, isActive && styles.sheetRowTextActive]}>{opt.label}</Text>
                {isActive && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* ── ADVANCED FILTER SHEET ── */}
      <BottomSheet visible={filterSheetVisible} onClose={() => setFilterSheetVisible(false)} title="Advanced Filters">
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>

          {/* Condition */}
          <Text style={styles.sheetSubHeading}>Condition</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
            {[{ id: '', label: 'Any' }, ...Object.entries(CONDITION_CONFIG).map(([k, v]) => ({ id: k, label: v.label }))].map(opt => {
              const isActive = selectedCondition === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedCondition(opt.id)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Price range */}
          <Text style={styles.sheetSubHeading}>Price Range (GH₵)</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Min</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={styles.priceDash} />
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Max</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Any"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          {/* Negotiable toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setNegotiableOnly(v => !v)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.toggleRowLabel}>Negotiable Only</Text>
              <Text style={styles.toggleRowSub}>Show listings open to price discussion</Text>
            </View>
            <View style={[styles.toggleSwitch, negotiableOnly && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, negotiableOnly && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {/* Apply button */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => { setFilterSheetVisible(false); loadProducts({ page: 1 }); }}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>

          {/* Clear filters */}
          {(selectedCondition || negotiableOnly || minPrice || maxPrice) ? (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                setSelectedCondition('');
                setNegotiableOnly(false);
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              <Text style={styles.clearFiltersBtnText}>Clear Advanced Filters</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </BottomSheet>

      {/* ── MAIN SCROLL ─────────────────────────────────────────────────────── */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" colors={['#4CAF50']} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollEndDrag={() => { if (pagination.hasNextPage) handleLoadMore(); }}
      >

        {/* ════════════════════════════════
            HERO BANNER
            ════════════════════════════════ */}
        <View style={styles.heroWrap}>
          <Animated.Image
            source={{ uri: heroImage }}
            style={[styles.heroImg, { transform: [{ scale: heroScaleAnim }] }]}
            resizeMode="cover"
          />
          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />

          {/* Nav */}
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroEmoji}>{activeCatConfig.emoji}</Text>
              <Text style={styles.heroTitle}>
                {activeCatConfig.id === 'all' ? 'All Listings' : activeCatConfig.label}
              </Text>
              {!loading && (
                <Text style={styles.heroCount}>{totalProducts.toLocaleString()} item{totalProducts !== 1 ? 's' : ''}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name={cartCount > 0 ? 'cart' : 'cart-outline'} size={22} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.heroSearchWrap}>
            {showSearch ? (
              <View style={styles.heroSearchActive}>
                <Ionicons name="search-outline" size={17} color="#4CAF50" style={{ marginLeft: 13 }} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.heroSearchInput}
                  placeholder="Search listings…"
                  placeholderTextColor="#9E9E9E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                  autoFocus
                />
                <TouchableOpacity style={styles.heroSearchGoBtn} onPress={handleSearchSubmit}>
                  <Text style={styles.heroSearchGoBtnText}>Go</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => { setShowSearch(false); clearSearch(); }}>
                  <Ionicons name="close-circle" size={17} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.heroSearchInactive} onPress={() => setShowSearch(true)} activeOpacity={0.85}>
                <Ionicons name="search-outline" size={17} color="#9E9E9E" style={{ marginRight: 8 }} />
                <Text style={styles.heroSearchPlaceholder}>
                  {searchQuery || 'Search listings, brands…'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color="#BDBDBD" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.heroSearchMic}>
                    <Ionicons name="mic-outline" size={15} color="#4CAF50" />
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Live search dropdown */}
            {showLiveDropdown && (
              <View style={styles.liveDropdown}>
                {liveSearching ? (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                  </View>
                ) : liveSearchResults.length > 0 ? (
                  <>
                    {liveSearchResults.map(p => {
                      const catCfg = CATEGORIES.find(c => c.id === p.category) || CATEGORIES[CATEGORIES.length - 1];
                      return (
                        <TouchableOpacity
                          key={p._id}
                          style={styles.liveRow}
                          onPress={() => {
                            setShowLiveDropdown(false);
                            navigation.navigate('ProductDetail', { productId: p._id, product: p });
                          }}
                        >
                          {p.images?.[0] ? (
                            <Image source={{ uri: p.images[0] }} style={styles.liveThumb} />
                          ) : (
                            <View style={[styles.liveThumb, { backgroundColor: catCfg.color, justifyContent: 'center', alignItems: 'center' }]}>
                              <Text style={{ fontSize: 16 }}>{catCfg.emoji}</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.liveRowName} numberOfLines={1}>{p.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={styles.liveRowPrice}>GH₵ {p.price?.toFixed(2)}</Text>
                              {p.campus && <Text style={styles.liveRowCampus}>{p.campus}</Text>}
                            </View>
                          </View>
                          {p.condition && <ConditionBadge condition={p.condition} />}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity style={styles.liveViewAll} onPress={handleSearchSubmit}>
                      <Text style={styles.liveViewAllText}>See all results for "{searchQuery}"</Text>
                      <Ionicons name="arrow-forward" size={13} color="#2E7D32" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Ionicons name="search-outline" size={28} color="#C8E6C9" />
                    <Text style={{ fontSize: 13, color: '#9E9E9E', marginTop: 8 }}>No results found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ════════════════════════════════
            CATEGORY TABS
            ════════════════════════════════ */}
        <View style={styles.catStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catStripInner}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTab, isActive && styles.catTabActive, isActive && { backgroundColor: cat.accent }]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.75}
                  disabled={loading}
                >
                  <Text style={styles.catTabEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ════════════════════════════════
            SUBCATEGORY ROW (if category has subs)
            ════════════════════════════════ */}
        {subcatsForCat.length > 0 && (
          <View style={styles.subCatStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatStripInner}>
              <TouchableOpacity
                style={[styles.subCatPill, selectedSubcategory === '' && styles.subCatPillActive]}
                onPress={() => setSelectedSubcategory('')}
              >
                <Text style={[styles.subCatPillText, selectedSubcategory === '' && styles.subCatPillTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {subcatsForCat.map(sub => {
                const isActive = selectedSubcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subCatPill, isActive && styles.subCatPillActive]}
                    onPress={() => setSelectedSubcategory(isActive ? '' : sub.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.subCatPillText, isActive && styles.subCatPillTextActive]}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ════════════════════════════════
            TOOLBAR
            ════════════════════════════════ */}
        <View style={styles.toolbar}>
          {/* Left: count + active search tag */}
          <View style={styles.toolbarLeft}>
            {loading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.toolbarCount}>
                <Text style={styles.toolbarCountBold}>{totalProducts}</Text> listings
              </Text>
            )}
            {searchQuery ? (
              <View style={styles.searchActiveTag}>
                <Text style={styles.searchActiveTagText} numberOfLines={1}>"{searchQuery}"</Text>
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close" size={11} color="#1565C0" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Right: campus, sort, filter, view */}
          <View style={styles.toolbarRight}>
            {/* Campus */}
            <TouchableOpacity
              style={[styles.toolbarChip, selectedCampus && styles.toolbarChipActive]}
              onPress={() => setCampusSheetVisible(true)}
            >
              <Ionicons name="school-outline" size={13} color={selectedCampus ? '#fff' : '#2E7D32'} />
              <Text style={[styles.toolbarChipText, selectedCampus && styles.toolbarChipTextActive]} numberOfLines={1}>
                {selectedCampus || 'Campus'}
              </Text>
              <Ionicons name="chevron-down" size={11} color={selectedCampus ? '#fff' : '#2E7D32'} />
            </TouchableOpacity>

            {/* Sort */}
            <TouchableOpacity style={styles.toolbarChip} onPress={() => setSortSheetVisible(true)}>
              <Ionicons name="swap-vertical-outline" size={13} color="#2E7D32" />
              <Text style={styles.toolbarChipText} numberOfLines={1}>
                {activeSortLabel.split(':')[0].split('→')[0].trim()}
              </Text>
              <Ionicons name="chevron-down" size={11} color="#2E7D32" />
            </TouchableOpacity>

            {/* Advanced filter */}
            <TouchableOpacity
              style={[styles.toolbarIconBtn, activeFilterCount > 0 && styles.toolbarIconBtnActive]}
              onPress={() => setFilterSheetVisible(true)}
            >
              <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? '#fff' : '#2E7D32'} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* View mode */}
            <View style={styles.viewGroup}>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnOn]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={15} color={viewMode === 'grid' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnOn]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={15} color={viewMode === 'list' ? '#2E7D32' : '#BDBDBD'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Active campus chip */}
        {(selectedCampus || selectedCondition || negotiableOnly || minPrice || maxPrice) && (
          <View style={styles.activeFiltersRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContent}>
              {selectedCampus && (
                <View style={styles.activeFChip}>
                  <Text style={styles.activeFChipText}>{selectedCampus}</Text>
                  <TouchableOpacity onPress={() => setSelectedCampus('')}>
                    <Ionicons name="close" size={11} color="#1565C0" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedCondition && (
                <View style={styles.activeFChip}>
                  <Text style={styles.activeFChipText}>{CONDITION_CONFIG[selectedCondition]?.label}</Text>
                  <TouchableOpacity onPress={() => setSelectedCondition('')}>
                    <Ionicons name="close" size={11} color="#1565C0" />
                  </TouchableOpacity>
                </View>
              )}
              {negotiableOnly && (
                <View style={styles.activeFChip}>
                  <Text style={styles.activeFChipText}>Negotiable</Text>
                  <TouchableOpacity onPress={() => setNegotiableOnly(false)}>
                    <Ionicons name="close" size={11} color="#1565C0" />
                  </TouchableOpacity>
                </View>
              )}
              {(minPrice || maxPrice) && (
                <View style={styles.activeFChip}>
                  <Text style={styles.activeFChipText}>
                    GH₵{minPrice || '0'} – {maxPrice || '∞'}
                  </Text>
                  <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); }}>
                    <Ionicons name="close" size={11} color="#1565C0" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ════════════════════════════════
            PRODUCTS
            ════════════════════════════════ */}
        {loading && products.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Finding listings…</Text>
          </View>
        ) : products.length === 0 ? (
          renderEmptyState()
        ) : viewMode === 'grid' ? (
          <View style={styles.gridWrap}>
            {products.map(item => (
              <GridCard
                key={item._id}
                item={item}
                onPress={p => navigation.navigate('ProductDetail', { productId: p._id, product: p })}
                onAddToCart={handleAddToCart}
                onQtyChange={handleQtyChange}
                qtyInCart={getQtyInCart(item._id)}
                isAdding={addingProductId === item._id}
                isUpdating={updatingProductId === item._id}
              />
            ))}
          </View>
        ) : (
          <View style={styles.listWrap}>
            {products.map(item => (
              <ListCard
                key={item._id}
                item={item}
                onPress={p => navigation.navigate('ProductDetail', { productId: p._id, product: p })}
                onAddToCart={handleAddToCart}
                onQtyChange={handleQtyChange}
                qtyInCart={getQtyInCart(item._id)}
                isAdding={addingProductId === item._id}
                isUpdating={updatingProductId === item._id}
              />
            ))}
          </View>
        )}

        {/* Load more */}
        {!loading && pagination.hasNextPage && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
            <Ionicons name="chevron-down-circle-outline" size={17} color="#4CAF50" />
            <Text style={styles.loadMoreText}>Load More Listings</Text>
          </TouchableOpacity>
        )}

        {/* Loading more indicator */}
        {loading && products.length > 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="small" color="#4CAF50" />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F4F6F4' },
  scrollContent: { paddingBottom: 20 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap: { height: 240, overflow: 'hidden', backgroundColor: '#1B5E20', position: 'relative' },
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
});

export default ProductsScreen;