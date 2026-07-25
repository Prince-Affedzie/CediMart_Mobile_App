// src/screens/main/AIShoppingScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { aiSearch } from '../apis/aiApi';
import ChatFAB from '../components/ChatFAB';

const { width } = Dimensions.get('window');

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  elev:         '#F1F5F9',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  brand:        '#0D9488',   // Teal
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',   // Coral
  accentL:      '#FB923C',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  white:        '#FFFFFF',
  black:        '#000000',
};

const BRAND_GREEN = C.brand; // Keep variable name for compatibility, now teal

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300/F5F5F5/BDBDBD?text=No+Image';

const SUGGESTED_QUESTIONS = [
  { id: '1', text: 'Laptop under GHS 4,000', icon: 'laptop-outline' },
  { id: '2', text: 'Headphones under GHS 300', icon: 'headset-outline' },
  { id: '3', text: 'Dresses for Hall Week', icon: 'shirt-outline' },
  { id: '4', text: 'Ingredients for Jollof', icon: 'restaurant-outline' },
  { id: '5', text: 'Recommend an iPhone', icon: 'phone-portrait-outline' },
  { id: '6', text: 'Find me a mattress', icon: 'bed-outline' },
];

// ─── Animated "typing" dots ──────────────────────────────────────────────────
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();
    pulse(dot1, 0);
    pulse(dot2, 150);
    pulse(dot3, 300);
  }, []);

  const style = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
  });

  return (
    <View style={styles.thinkingDots}>
      <Animated.View style={[styles.dot, style(dot1)]} />
      <Animated.View style={[styles.dot, style(dot2)]} />
      <Animated.View style={[styles.dot, style(dot3)]} />
    </View>
  );
};

// ─── Product Card ────────────────────────────────────────────────────────────
const ProductCard = ({ product, onPress, onChatSeller }) => {
  const imageUri = product.images?.[0];
  const conditionColors = {
    'new':           { bg: C.successBg, text: C.success },
    'like-new':      { bg: '#EFF6FF',   text: '#2563EB' },
    'excellent':     { bg: C.brandBg,   text: C.brand },
    'good':          { bg: C.accentBg,  text: '#D97706' },
    'fair':          { bg: '#FFF7ED',   text: '#EA580C' },
    'slightly-used': { bg: '#F5F5F4',   text: '#57534E' },
    'for-parts':     { bg: C.dangerBg,  text: C.danger },
  };
  const condition = conditionColors[product.condition] || conditionColors['good'];

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(product)} activeOpacity={0.9}>
      <View style={styles.productImageWrap}>
        <Image source={{ uri: imageUri || PLACEHOLDER_IMAGE }} style={styles.productImage} resizeMode="contain" />
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.condition && (
            <View style={[styles.conditionBadge, { backgroundColor: condition.bg }]}>
              <Text style={[styles.conditionText, { color: condition.text }]}>
                {product.condition.replace(/-/g, ' ')}
              </Text>
            </View>
          )}
        </View>

        {product.rating > 0 && (
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons key={i} name={i < Math.floor(product.rating) ? 'star' : 'star-outline'} size={12} color={C.accent} />
            ))}
            <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>GH₵ {product.price?.toLocaleString()}</Text>
          {product.campus && <Text style={styles.campus}>{product.campus}</Text>}
        </View>

        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onPress(product)} activeOpacity={0.85}>
            <Text style={styles.viewBtnText}>View Product</Text>
            <Ionicons name="arrow-forward" size={14} color={C.brand} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const AIShoppingScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const isNearBottomRef = useRef(true);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleProductPress = useCallback((product) => {
    navigation.navigate('ProductDetail', { productId: product._id, product });
  }, [navigation]);

  const handleChatSeller = useCallback((product) => {
    navigation.navigate('Chat', { vendorId: product.vendor, productId: product._id, product });
  }, [navigation]);

  const scrollToBottom = (animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
    isNearBottomRef.current = true;
    setShowJumpToBottom(false);
  };

  const handleScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setShowJumpToBottom(false);
  };

  const handleSend = async (text) => {
    const searchQuery = text || query.trim();
    if (!searchQuery || loading) return;

    setQuery('');
    setShowSuggestions(false);
    setLoading(true);

    const userMessage = { id: Date.now().toString(), type: 'user', text: searchQuery };
    setConversation(prev => [...prev, userMessage]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await aiSearch(searchQuery, conversationId);
      if (response?.data?.conversationId) setConversationId(response.data.conversationId);

      if (response?.data?.success) {
        const { aiResponse, results } = response.data;
        const aiMessage = { id: (Date.now() + 1).toString(), type: 'ai', text: aiResponse, products: results || [] };
        setConversation(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = { id: (Date.now() + 1).toString(), type: 'ai', text: "I'm sorry, I couldn't find any products matching your search. Try different keywords or browse categories.", products: [] };
        setConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = { id: (Date.now() + 1).toString(), type: 'ai', text: "Oops! Something went wrong. Please check your connection and try again.", products: [] };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (isNearBottomRef.current) scrollToBottom(true);
        else setShowJumpToBottom(true);
      }, 150);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setQuery(question);
    handleSend(question);
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userMessageWrap}>
          <View style={styles.userMessage}>
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.aiMessageWrap}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.aiMessageContent}>
          <View style={styles.aiMessage}>
            <Text style={styles.aiMessageText}>{item.text}</Text>
          </View>
          {item.products?.length > 0 && (
            <View style={styles.productsContainer}>
              <Text style={styles.productsLabel}>
                Found {item.products.length} product{item.products.length !== 1 ? 's' : ''}
              </Text>
              {item.products.map((product) => (
                <ProductCard key={product._id} product={product} onPress={handleProductPress} onChatSeller={handleChatSeller} />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Animated.View style={[styles.welcomeWrap, { opacity: fadeAnim }]}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="sparkles" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeTitle}>Ask CediAI</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI shopping assistant — find the best deals on campus instantly.
        </Text>
      </Animated.View>

      {showSuggestions && conversation.length === 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Try asking</Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTED_QUESTIONS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestionChip} onPress={() => handleSuggestedQuestion(item.text)} activeOpacity={0.7}>
                <View style={styles.suggestionIconWrap}>
                  <Ionicons name={item.icon} size={16} color={C.brand} />
                </View>
                <Text style={styles.suggestionText} numberOfLines={2}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingWrap}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <TypingDots />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.t1} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Shopping Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by CediAI</Text>
        </View>
        <TouchableOpacity style={styles.newChatBtn} onPress={() => { setConversation([]); setConversationId(null); setShowSuggestions(true); setQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add-circle-outline" size={22} color={C.brand} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          ref={flatListRef} data={conversation} renderItem={renderMessage}
          keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent}
          ListHeaderComponent={conversation.length === 0 ? renderHeader : null}
          ListFooterComponent={renderFooter} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={100}
        />

        {showJumpToBottom && (
          <TouchableOpacity style={styles.jumpToBottomPill} onPress={() => scrollToBottom(true)} activeOpacity={0.85}>
            <Ionicons name="arrow-down" size={13} color="#FFFFFF" />
            <Text style={styles.jumpToBottomText}>New results</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.inputBar, inputFocused && styles.inputBarFocused]}>
          <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
            <TextInput
              ref={inputRef} style={styles.input} value={query}
              onChangeText={setQuery} placeholder="Ask CediAI... e.g. 'laptop under GHS 4000'"
              placeholderTextColor={C.t3} multiline maxLength={500} returnKeyType="send"
              onSubmitEditing={() => handleSend()} onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)} blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity style={styles.sendBtnWrap} onPress={() => handleSend()} disabled={!query.trim() || loading} activeOpacity={0.8}>
            <View style={[styles.sendBtn, { backgroundColor: query.trim() && !loading ? C.brand : '#E0E0E0' }]}>
              <Ionicons name="send" size={17} color={query.trim() && !loading ? '#FFFFFF' : C.t3} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: C.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.elev, justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.t1, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, color: C.brand, fontWeight: '700', marginTop: 1, letterSpacing: 0.2 },
  newChatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 46, flexGrow: 1 },

  welcomeWrap: { alignItems: 'center', paddingVertical: 36 },
  welcomeIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  welcomeTitle: { fontSize: 25, fontWeight: '800', color: C.t1, marginBottom: 8, letterSpacing: -0.4 },
  welcomeSubtitle: { fontSize: 14, color: C.t2, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  suggestionsSection: { marginTop: 8 },
  suggestionsTitle: {
    fontSize: 12, fontWeight: '700', color: C.t3,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionChip: {
    width: (width - 32 - 10) / 2,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: C.surface, paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 1, borderColor: '#EDEDED',
    shadowColor: C.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  suggestionIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center',
  },
  suggestionText: { fontSize: 12.5, color: C.t1, fontWeight: '600', flex: 1, lineHeight: 16 },

  userMessageWrap: { alignItems: 'flex-end', marginBottom: 16 },
  userMessage: {
    backgroundColor: C.brand, borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12, maxWidth: '80%',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  userMessageText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },

  aiMessageWrap: { flexDirection: 'row', marginBottom: 16 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
    marginRight: 10, marginTop: 2,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  aiMessageContent: { flex: 1 },
  aiMessage: {
    backgroundColor: C.surface, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  aiMessageText: { color: C.t1, fontSize: 15, lineHeight: 22 },

  productsContainer: { marginTop: 12 },
  productsLabel: {
    fontSize: 12, fontWeight: '700', color: C.t2,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4,
  },
  productCard: {
    backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: C.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 3,
  },
  productImageWrap: {
    width: '100%', height: 190, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', padding: 10,
  },
  productImage: { width: '100%', height: '100%' },
  productInfo: { padding: 14 },
  productHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 8, marginBottom: 8,
  },
  productName: { fontSize: 15, fontWeight: '700', color: C.t1, flex: 1, lineHeight: 20 },
  conditionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  conditionText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  ratingText: { fontSize: 11, color: C.t2, fontWeight: '600', marginLeft: 4 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  price: { fontSize: 18, fontWeight: '800', color: C.accent },
  campus: {
    fontSize: 11, color: C.t2, fontWeight: '600',
    backgroundColor: C.elev, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  cardActionsRow: { flexDirection: 'row', gap: 8 },
  chatSellerBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EDEDED',
  },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.brandBg, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: C.brandBorder,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: C.brand },

  loadingWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
  thinkingDots: {
    flexDirection: 'row', gap: 5,
    backgroundColor: C.surface, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brand },

  jumpToBottomPill: {
    position: 'absolute', bottom: 76, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  jumpToBottomText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: C.surface, borderTopWidth: 1,
    borderTopColor: '#F0F0F0', bottom: 30,
  },
  inputBarFocused: { borderTopColor: C.brandBorder },
  inputWrapper: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22,
    borderWidth: 1.5, borderColor: '#E8E8E8', marginRight: 10,
  },
  inputWrapperFocused: { borderColor: C.brand, backgroundColor: C.surface },
  input: {
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15, color: C.t1, maxHeight: 80, minHeight: 44,
  },
  sendBtnWrap: {
    borderRadius: 22,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 6, elevation: 4,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});

export default AIShoppingScreen;