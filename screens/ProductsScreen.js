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
import {styles} from '../styles/products'

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
  all:                    'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780782982/flyer13_1_fyp0xj.png',
  electronics:            'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  'phones and tablets':   'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  'computers and laptops':'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780694855/computers_flyer_ceekpj.jpg',
  gaming:                 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800',
  fashion:                'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781101245/fashion_banner_ibwmaz.png',
  'books-course-materials':'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780695851/books_flyer_ljnqis.jpg',
  'hostel-items':         'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  appliances:             'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690124/appliances_bkv5s1.jpg',
  furniture:              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  'beauty and grooming':  'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690851/beauty_m4uwn1.jpg',
  'sports and fitness':   'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780690851/sports_and_fitness_g3ozaa.webp',
  accessories:            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  'food and drinks':      'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781891792/food_nad_provisions_1_m6fvfn.png',
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

  // ─── Discount calculations ──────────────────────────────────────────────
  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale && 
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());
  
  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount 
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;
  const savingsAmount = hasActiveDiscount && originalPrice ? originalPrice - currentPrice : 0;

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

        {/* Discount badge - shows first if active */}
        {hasActiveDiscount && !outOfStock && (
          <View style={styles.discountBadgeGrid}>
            <Text style={styles.discountBadgeGridText}>-{discountPercentage}%</Text>
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
          {/* Price section */}
          {hasActiveDiscount ? (
            <View style={styles.gridPriceStack}>
              <View style={styles.gridPriceRow}>
                <Text style={styles.gridPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.gridDiscountPill}>
                  <Text style={styles.gridDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.gridOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.gridPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
          )}

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

  // ─── Discount calculations ──────────────────────────────────────────────
  const discountInfo = item.discountInfo;
  const hasActiveDiscount = discountInfo?.isOnSale && 
    (!discountInfo.discountStartDate || new Date(discountInfo.discountStartDate) <= Date.now()) &&
    (!discountInfo.discountEndDate || new Date(discountInfo.discountEndDate) >= Date.now());
  
  const currentPrice = Number(item.price);
  const originalPrice = discountInfo?.originalPrice;
  const discountPercentage = hasActiveDiscount 
    ? (discountInfo?.discountPercentage ?? (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0))
    : 0;

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
        
        {/* Discount badge on image */}
        {hasActiveDiscount && !outOfStock && (
          <View style={styles.discountBadgeList}>
            <Text style={styles.discountBadgeListText}>-{discountPercentage}% OFF</Text>
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
          {/* Price section with discount */}
          {hasActiveDiscount ? (
            <View style={styles.listPriceStack}>
              <View style={styles.listPriceRow}>
                <Text style={styles.listPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
                <View style={styles.listDiscountPill}>
                  <Text style={styles.listDiscountPillText}>-{discountPercentage}%</Text>
                </View>
              </View>
              {originalPrice && (
                <Text style={styles.listOriginalPrice}>
                  GH₵ {originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.listPrice}>GH₵ {currentPrice.toFixed(2)}</Text>
          )}

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



export default ProductsScreen;