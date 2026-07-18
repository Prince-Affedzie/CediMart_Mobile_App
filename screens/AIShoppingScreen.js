// src/screens/main/AIShoppingScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { aiSearch } from '../apis/aiApi';
import ChatFAB from '../components/ChatFAB';


const { width } = Dimensions.get('window');
const BRAND_GREEN = '#1FAA59';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300/F5F5F5/BDBDBD?text=No+Image';

const SUGGESTED_QUESTIONS = [
  { id: '1', text: 'Laptop under GHS 4,000', icon: 'laptop-outline' },
  { id: '2', text: 'Headphones under GHS 300', icon: 'headset-outline' },
  { id: '3', text: 'Dresses for Hall Week', icon: 'shirt-outline' },
  { id: '4', text: 'Ingredients for Jollof', icon: 'restaurant-outline' },
  { id: '5', text: 'Recommend an iPhone', icon: 'phone-portrait-outline' },
  { id: '6', text: 'Find me a mattress', icon: 'bed-outline' },
];

// ─── Animated "typing" dots — actually animated via the Animated API,     ───
// ─── since CSS animationDelay does nothing in React Native.               ───
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

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onPress, onChatSeller }) => {
  const imageUri = product.images?.[0];
  const conditionColors = {
    'new': { bg: '#E8F5E9', text: '#2E7D32' },
    'like-new': { bg: '#E3F2FD', text: '#1565C0' },
    'excellent': { bg: '#EDE7F6', text: '#4527A0' },
    'good': { bg: '#FFF8E1', text: '#F57F17' },
    'fair': { bg: '#FFF3E0', text: '#E65100' },
    'slightly-used': { bg: '#EFEBE9', text: '#4E342E' },
    'for-parts': { bg: '#FFEBEE', text: '#C62828' },
  };
  const condition = conditionColors[product.condition] || conditionColors['good'];

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
      {/* Fixed: was resizeMode="cover" with a hard height, which crops
          whatever doesn't fit the box. "contain" + a letterbox background
          shows the whole image instead. */}
      <View style={styles.productImageWrap}>
        <Image
          source={{ uri: imageUri || PLACEHOLDER_IMAGE }}
          style={styles.productImage}
          resizeMode="contain"
        />
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
              <Ionicons
                key={i}
                name={i < Math.floor(product.rating) ? 'star' : 'star-outline'}
                size={12}
                color="#F9A825"
              />
            ))}
            <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>GH₵ {product.price?.toLocaleString()}</Text>
          {product.campus && (
            <Text style={styles.campus}>{product.campus}</Text>
          )}
        </View>

        <View style={styles.cardActionsRow}>
          
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => onPress(product)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewBtnText}>View Product</Text>
            <Ionicons name="arrow-forward" size={14} color={BRAND_GREEN} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
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
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  // Only updates whether we're near the bottom — never forces a scroll
  // itself, so it never fights a manual scroll gesture in either direction.
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

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: searchQuery,
    };

    setConversation(prev => [...prev, userMessage]);
    // Sending your own message should always jump you to it, regardless
    // of where you'd scrolled to — this is expected chat behavior.
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await aiSearch(searchQuery, conversationId);
       if (response?.data?.conversationId) {
       setConversationId(response.data.conversationId);
       };

      if (response?.data?.success) {
        const { aiResponse, results } = response.data;

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: aiResponse,
          products: results || [],
        };

        setConversation(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: "I'm sorry, I couldn't find any products matching your search. Try different keywords or browse categories.",
          products: [],
        };
        setConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "Oops! Something went wrong. Please check your connection and try again.",
        products: [],
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Only auto-scroll for the AI's reply if the user was already near
      // the bottom — if they'd scrolled up to read older messages, don't
      // yank them back down; just let them know something new arrived.
      setTimeout(() => {
        if (isNearBottomRef.current) {
          scrollToBottom(true);
        } else {
          setShowJumpToBottom(true);
        }
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
                <ProductCard
                  key={product._id}
                  product={product}
                  onPress={handleProductPress}
                  onChatSeller={handleChatSeller}
                />
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
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionChip}
                onPress={() => handleSuggestedQuestion(item.text)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIconWrap}>
                  <Ionicons name={item.icon} size={16} color={BRAND_GREEN} />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header — kept OUTSIDE the KeyboardAvoidingView, so its height
          doesn't need to be factored into keyboardVerticalOffset below. */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Shopping Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by CediAI</Text>
        </View>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            setConversation([]);
            setConversationId(null); 
            setShowSuggestions(true);
            setQuery('');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add-circle-outline" size={22} color={BRAND_GREEN} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        // The real bug: 'undefined' on Android means NO keyboard handling
        // at all, which is exactly why the keyboard was covering the input.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={conversation}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={conversation.length === 0 ? renderHeader : null}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={100}
        />

        {/* Appears only when a new AI reply arrives while the user has
            scrolled up to read older messages — tap to catch up. */}
        {showJumpToBottom && (
          <TouchableOpacity
            style={styles.jumpToBottomPill}
            onPress={() => scrollToBottom(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-down" size={13} color="#FFFFFF" />
            <Text style={styles.jumpToBottomText}>New results</Text>
          </TouchableOpacity>
        )}

        {/* Input bar — no nested SafeAreaView here; KeyboardAvoidingView
            already handles the lift, and a nested safe-area edge was adding
            an extra, inconsistent gap on iOS. */}
        <View style={[styles.inputBar, inputFocused && styles.inputBarFocused]}>
          <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Ask CediAI... e.g. 'laptop under GHS 4000'"
              placeholderTextColor="#BDBDBD"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            style={styles.sendBtnWrap}
            onPress={() => handleSend()}
            disabled={!query.trim() || loading}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.sendBtn,
                { backgroundColor: query.trim() && !loading ? BRAND_GREEN : '#E0E0E0' },
              ]}
            >
              <Ionicons
                name="send"
                size={17}
                color={query.trim() && !loading ? '#FFFFFF' : '#BDBDBD'}
              />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA',  },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: BRAND_GREEN,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 46,
    flexGrow: 1,
  },

  welcomeWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  suggestionsSection: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    width: (width - 32 - 10) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  suggestionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 12.5,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },

  userMessageWrap: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },

  aiMessageWrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  aiMessageContent: {
    flex: 1,
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  aiMessageText: {
    color: '#1A1A1A',
    fontSize: 15,
    lineHeight: 22,
  },

  productsContainer: {
    marginTop: 12,
  },
  productsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  // Wrapper letterboxes the full, uncropped image against a neutral
  // background — this is what actually fixes "can't see the full image".
  productImageWrap: {
    width: '100%',
    height: 190,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 14,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 20,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_GREEN,
  },
  campus: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatSellerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F5EE',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_GREEN,
  },

  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 4,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BRAND_GREEN,
  },

  jumpToBottomPill: {
    position: 'absolute',
    bottom: 76,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  jumpToBottomText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    bottom:30,
  },
  inputBarFocused: {
    borderTopColor: '#DCEEE2',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    marginRight: 10,
  },
  inputWrapperFocused: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#FFFFFF',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 80,
    minHeight: 44,
  },
  sendBtnWrap: {
    borderRadius: 22,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIShoppingScreen;