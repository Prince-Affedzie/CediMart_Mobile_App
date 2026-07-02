// screens/ChatScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Pressable, SafeAreaView, StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const BRAND_GREEN = '#1FAA59';

export default function ChatScreen({ route, navigation }) {
  const { conversation: initialConversation } = route.params;
  const { user } = useAuth();
  const {
    enterConversation,
    leaveConversation,
    messages,
    messagesLoading,
    hasMoreMessages,
    loadMessages,
    sendMessage,
    activeConversation,
    typingUsers,
    emitTyping,
    emitStopTyping,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // Disclaimer: shown once per screen mount, dismissible
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);
  const disclaimerAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isBuyer = initialConversation.buyer?._id === user._id
    || initialConversation.buyer === user._id;
  const otherParty = isBuyer ? initialConversation.seller : initialConversation.buyer;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <ChatHeader otherParty={otherParty} product={initialConversation.product} />,
    });

    enterConversation(initialConversation);
    return () => leaveConversation();
  }, []);

  // ── Dismiss disclaimer with fade ──────────────────────────────────────────

  const handleDismissDisclaimer = () => {
    Animated.timing(disclaimerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDisclaimerVisible(false));
  };

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    emitStopTyping(initialConversation._id);
    clearTimeout(typingTimeoutRef.current);

    setIsSending(true);
    try {
      await sendMessage(initialConversation._id, text);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      // sendMessage already handles showing errors
    } finally {
      setIsSending(false);
    }
  };

  // ── Typing indicator ───────────────────────────────────────────────────────

  const handleInputChange = (text) => {
    setInputText(text);
    emitTyping(initialConversation._id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(initialConversation._id);
    }, 1500);
  };

  // ── Load older messages on scroll to top ──────────────────────────────────

  const handleLoadMore = useCallback(() => {
    if (!messagesLoading && hasMoreMessages) {
      loadMessages(initialConversation._id);
    }
  }, [messagesLoading, hasMoreMessages]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const isTyping = Object.keys(typingUsers).length > 0;

  // Show skeleton on the very first load (no messages yet, still loading)
  const isInitialLoad = messagesLoading && messages.length === 0;

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender?._id === user._id || item.sender === user._id;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender?._id !== item.sender?._id);
    const isRead = !!item.readAt;

    if (item.type === 'system') {
      return <SystemMessage text={item.text} />;
    }

    if (item.type === 'offer_link') {
      return (
        <OfferCard
          message={item}
          isMe={isMe}
          onPress={() =>
            navigation.navigate('OfferDetails', { offerId: item.offerMeta?.offerId })
          }
        />
      );
    }

    return (
      <MessageBubble
        message={item}
        isMe={isMe}
        showAvatar={showAvatar}
        otherParty={otherParty}
        isRead={isRead}
      />
    );
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ProductBanner
        product={initialConversation.product}
        onBack={() => navigation.goBack()}
        otherParty={otherParty}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Safety disclaimer ─────────────────────────────────────────── */}
        {disclaimerVisible && (
          <Animated.View style={[disclaimerStyles.wrap, { opacity: disclaimerAnim }]}>
            <Ionicons name="shield-checkmark" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
            <Text style={disclaimerStyles.text}>
              <Text style={disclaimerStyles.bold}>Stay safe.</Text>
              {' '}Keep all payments and deals on CediMart. Transactions taken off-platform are not protected and may result in account suspension.
            </Text>
            <TouchableOpacity
              onPress={handleDismissDisclaimer}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color="#92400E" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Message list OR skeleton ───────────────────────────────────── */}
        {isInitialLoad ? (
          <MessageSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              messagesLoading && messages.length > 0 ? (
                <ActivityIndicator color={BRAND_GREEN} style={{ marginVertical: 12 }} size="small" />
              ) : null
            }
            ListEmptyComponent={
              !messagesLoading ? (
                <View style={styles.emptyChat}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#C8E6C9" />
                  </View>
                  <Text style={styles.emptyChatTitle}>Start the conversation</Text>
                  <Text style={styles.emptyChatText}>
                    Say hi! Ask about the product or make an offer.
                  </Text>
                </View>
              ) : null
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
            </View>
            <Text style={styles.typingText}>
              {otherParty?.name?.split(' ')[0]} is typing
            </Text>
          </View>
        )}

        {/* Input bar */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputBar}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={handleInputChange}
                placeholder="Type a message…"
                placeholderTextColor="#BDBDBD"
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || isSending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────
// Renders while the first page of messages is being fetched.
// Mimics the rough shape of a real conversation so the screen
// doesn't feel blank or broken on slow connections.

const SkeletonBubble = ({ isMe, width }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <View style={[skeletonStyles.row, isMe && skeletonStyles.rowMe]}>
      {!isMe && <View style={skeletonStyles.avatarCircle} />}
      <Animated.View
        style={[
          skeletonStyles.bubble,
          { width, opacity },
          isMe ? skeletonStyles.bubbleMe : skeletonStyles.bubbleThem,
        ]}
      />
    </View>
  );
};

const MessageSkeleton = () => (
  <View style={skeletonStyles.wrap}>
    <SkeletonBubble isMe={false} width={200} />
    <SkeletonBubble isMe={false} width={140} />
    <SkeletonBubble isMe={true}  width={160} />
    <SkeletonBubble isMe={false} width={220} />
    <SkeletonBubble isMe={true}  width={100} />
    <SkeletonBubble isMe={true}  width={180} />
    <SkeletonBubble isMe={false} width={130} />
  </View>
);

// ── Sub-components ─────────────────────────────────────────────────────────

const ChatHeader = ({ otherParty, product }) => (
  <View style={headerStyles.wrap}>
    {otherParty?.avatar ? (
      <Image source={{ uri: otherParty.avatar }} style={headerStyles.avatar} />
    ) : (
      <View style={[headerStyles.avatar, headerStyles.avatarFallback]}>
        <Text style={headerStyles.avatarLetter}>
          {otherParty?.name?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
    )}
    <View style={headerStyles.info}>
      <Text style={headerStyles.name} numberOfLines={1}>{otherParty?.name}</Text>
      <Text style={headerStyles.sub} numberOfLines={1}>
        {product?.name || product?.title || 'Product'}
      </Text>
    </View>
  </View>
);

const ProductBanner = ({ product, onBack, otherParty }) => {
  if (!product) return null;
  return (
    <SafeAreaView edges={['top']} style={bannerStyles.safeArea}>
      <View style={bannerStyles.wrap}>
        <TouchableOpacity onPress={onBack} style={bannerStyles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={bannerStyles.image} />
        ) : (
          <View style={[bannerStyles.image, bannerStyles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={18} color="#BDBDBD" />
          </View>
        )}
        <View style={bannerStyles.info}>
          <Text style={bannerStyles.title} numberOfLines={1}>
            {product.name || product.title}
          </Text>
          <Text style={bannerStyles.price}>
            GH₵ {product.price?.toLocaleString()}
          </Text>
        </View>
        {product.negotiable && (
          <View style={bannerStyles.badge}>
            <Text style={bannerStyles.badgeText}>Nego</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const MessageBubble = ({ message, isMe, showAvatar, otherParty, isRead }) => (
  <View style={[bubbleStyles.row, isMe && bubbleStyles.rowMe]}>
    <View style={bubbleStyles.avatarSlot}>
      {showAvatar && !isMe && (
        otherParty?.avatar ? (
          <Image source={{ uri: otherParty.avatar }} style={bubbleStyles.avatar} />
        ) : (
          <View style={[bubbleStyles.avatar, bubbleStyles.avatarFallback]}>
            <Text style={bubbleStyles.avatarLetter}>
              {otherParty?.firstName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )
      )}
    </View>

    <View style={[
      bubbleStyles.bubble,
      isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem,
    ]}>
      <Text style={[bubbleStyles.text, isMe && bubbleStyles.textMe]}>
        {message.text}
      </Text>
      <View style={bubbleStyles.meta}>
        <Text style={[bubbleStyles.time, isMe && bubbleStyles.timeMe]}>
          {formatShortTime(message.createdAt)}
        </Text>
        {isMe && (
          <Ionicons
            name={isRead ? 'checkmark-done' : 'checkmark'}
            size={12}
            color={isRead ? '#B2EBF2' : 'rgba(255,255,255,0.5)'}
            style={{ marginLeft: 2 }}
          />
        )}
        {message._optimistic && (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
        )}
      </View>
    </View>
  </View>
);

const OfferCard = ({ message, isMe, onPress }) => (
  <View style={[bubbleStyles.row, isMe && bubbleStyles.rowMe]}>
    <View style={bubbleStyles.avatarSlot} />
    <Pressable onPress={onPress} style={[offerStyles.card, isMe && offerStyles.cardMe]}>
      <View style={offerStyles.header}>
        <Ionicons name="cash-outline" size={16} color={BRAND_GREEN} />
        <Text style={offerStyles.label}>Offer</Text>
      </View>
      <Text style={offerStyles.price}>
        GH₵ {message.offerMeta?.offerPrice?.toLocaleString()}
      </Text>
      <View style={[
        offerStyles.statusBadge,
        message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAccepted,
        message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclined,
      ]}>
        <Text style={[
          offerStyles.statusText,
          message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAcceptedText,
          message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclinedText,
        ]}>
          {message.offerMeta?.offerStatus?.toUpperCase()}
        </Text>
      </View>
      <Text style={offerStyles.tap}>Tap to view details →</Text>
    </Pressable>
  </View>
);

const SystemMessage = ({ text }) => (
  <View style={systemStyles.wrap}>
    <View style={systemStyles.bubble}>
      <Ionicons name="information-circle-outline" size={14} color="#9E9E9E" />
      <Text style={systemStyles.text}>{text}</Text>
    </View>
  </View>
);

// ── Helpers ────────────────────────────────────────────────────────────────

const formatShortTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
    paddingBottom: 45,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptyChatText: {
    color: '#9E9E9E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BDBDBD',
  },
  typingText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    bottom: 40,
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginRight: 10,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
    minHeight: 42,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#C8E6C9',
    shadowOpacity: 0,
    elevation: 0,
  },
});

// ── Disclaimer styles ──────────────────────────────────────────────────────

const disclaimerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
  },
});

// ── Skeleton styles ────────────────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMe: {
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  bubble: {
    height: 38,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#C8E6C9',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: 4,
  },
});

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  avatarFallback: {
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sub: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },
});

const bannerStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingRight: 12,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    color: BRAND_GREEN,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E8F5EE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    color: BRAND_GREEN,
    fontWeight: '700',
  },
});

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  rowMe: {
    flexDirection: 'row-reverse',
  },
  avatarSlot: {
    width: 32,
    marginHorizontal: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
  },
  avatarFallback: {
    backgroundColor: '#E8F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: BRAND_GREEN,
    borderBottomRightRadius: 4,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 21,
  },
  textMe: {
    color: '#FFFFFF',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 10,
    color: '#BDBDBD',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.65)',
  },
});

const offerStyles = StyleSheet.create({
  card: {
    maxWidth: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardMe: {
    backgroundColor: '#F0FFF4',
    borderColor: BRAND_GREEN,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: BRAND_GREEN,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusAccepted: { backgroundColor: '#E8F5EE' },
  statusDeclined: { backgroundColor: '#FFEBEE' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F57C00',
  },
  statusAcceptedText: { color: BRAND_GREEN },
  statusDeclinedText: { color: '#E53935' },
  tap: {
    fontSize: 12,
    color: BRAND_GREEN,
    fontWeight: '600',
  },
});

const systemStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
});