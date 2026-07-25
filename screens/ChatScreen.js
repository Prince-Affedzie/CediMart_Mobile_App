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

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  white:        '#FFFFFF',
  black:        '#000000',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  gray50:       '#FAFAFA',
  gray100:      '#F5F5F5',
  gray200:      '#E5E7EB',
};

const BRAND_GREEN = C.brand; // Keep variable name for compatibility, now teal

export default function ChatScreen({ route, navigation }) {
  const { conversation: initialConversation } = route.params;
  const { user } = useAuth();
  const {
    enterConversation, leaveConversation, messages, messagesLoading,
    hasMoreMessages, loadMessages, sendMessage, activeConversation,
    typingUsers, emitTyping, emitStopTyping,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);
  const disclaimerAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isBuyer = initialConversation.buyer?._id === user._id || initialConversation.buyer === user._id;
  const otherParty = isBuyer ? initialConversation.seller : initialConversation.buyer;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <ChatHeader otherParty={otherParty} product={initialConversation.product} />,
    });
    enterConversation(initialConversation);
    return () => leaveConversation();
  }, []);

  const handleDismissDisclaimer = () => {
    Animated.timing(disclaimerAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setDisclaimerVisible(false));
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    emitStopTyping(initialConversation._id);
    clearTimeout(typingTimeoutRef.current);
    setIsSending(true);
    try {
      await sendMessage(initialConversation._id, text);
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    } catch {
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    emitTyping(initialConversation._id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { emitStopTyping(initialConversation._id); }, 1500);
  };

  const handleLoadMore = useCallback(() => {
    if (!messagesLoading && hasMoreMessages) loadMessages(initialConversation._id);
  }, [messagesLoading, hasMoreMessages]);

  const isTyping = Object.keys(typingUsers).length > 0;
  const isInitialLoad = messagesLoading && messages.length === 0;

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender?._id === user._id || item.sender === user._id;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender?._id !== item.sender?._id);
    const isRead = !!item.readAt;
    if (item.type === 'system') return <SystemMessage text={item.text} />;
    if (item.type === 'offer_link') return <OfferCard message={item} isMe={isMe} onPress={() => navigation.navigate('OfferDetails', { offerId: item.offerMeta?.offerId })} />;
    return <MessageBubble message={item} isMe={isMe} showAvatar={showAvatar} otherParty={otherParty} isRead={isRead} />;
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <ProductBanner product={initialConversation.product} onBack={() => navigation.goBack()} otherParty={otherParty} />
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {disclaimerVisible && (
          <Animated.View style={[disclaimerStyles.wrap, { opacity: disclaimerAnim }]}>
            <Ionicons name="shield-checkmark" size={16} color={C.accent} style={{ marginTop: 1 }} />
            <Text style={disclaimerStyles.text}><Text style={disclaimerStyles.bold}>Stay safe.</Text> Keep all payments and deals on CediMart. Transactions taken off-platform are not protected and may result in account suspension.</Text>
            <TouchableOpacity onPress={handleDismissDisclaimer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close" size={16} color="#92400E" /></TouchableOpacity>
          </Animated.View>
        )}
        {isInitialLoad ? (
          <MessageSkeleton />
        ) : (
          <FlatList
            ref={flatListRef} data={messages} keyExtractor={(item) => item._id}
            renderItem={renderMessage} contentContainerStyle={styles.messagesList}
            onEndReached={handleLoadMore} onEndReachedThreshold={0.3}
            ListHeaderComponent={messagesLoading && messages.length > 0 ? <ActivityIndicator color={C.brand} style={{ marginVertical: 12 }} size="small" /> : null}
            ListEmptyComponent={!messagesLoading ? (
              <View style={styles.emptyChat}>
                <View style={styles.emptyIconWrap}><Ionicons name="chatbubble-ellipses-outline" size={48} color={C.brandBorder} /></View>
                <Text style={styles.emptyChatTitle}>Start the conversation</Text>
                <Text style={styles.emptyChatText}>Say hi! Ask about the product or make an offer.</Text>
              </View>
            ) : null}
            onContentSizeChange={() => { if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: false }); }}
            onLayout={() => { if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: false }); }}
          />
        )}
        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
            </View>
            <Text style={styles.typingText}>{otherParty?.firstName || otherParty?.name?.split(' ')[0]} is typing</Text>
          </View>
        )}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputBar}>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={inputText} onChangeText={handleInputChange} placeholder="Type a message…" placeholderTextColor={C.t3} multiline maxLength={500} returnKeyType="default" blurOnSubmit={false} onSubmitEditing={() => { if (inputText.trim() && !isSending) handleSend(); }} />
            </View>
            <TouchableOpacity style={[styles.sendBtn, isSending && styles.sendBtnDisabled]} onPress={handleSend} disabled={isSending} activeOpacity={0.8}>
              {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color={inputText.trim() ? '#FFFFFF' : C.brandBorder} />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────
const SkeletonBubble = ({ isMe, width }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true })])).start(); }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return (
    <View style={[skeletonStyles.row, isMe && skeletonStyles.rowMe]}>
      {!isMe && <View style={skeletonStyles.avatarCircle} />}
      <Animated.View style={[skeletonStyles.bubble, { width, opacity }, isMe ? skeletonStyles.bubbleMe : skeletonStyles.bubbleThem]} />
    </View>
  );
};

const MessageSkeleton = () => (
  <View style={skeletonStyles.wrap}>
    <SkeletonBubble isMe={false} width={200} />
    <SkeletonBubble isMe={false} width={140} />
    <SkeletonBubble isMe={true} width={160} />
    <SkeletonBubble isMe={false} width={220} />
    <SkeletonBubble isMe={true} width={100} />
    <SkeletonBubble isMe={true} width={180} />
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
        <Text style={headerStyles.avatarLetter}>{(otherParty?.firstName || otherParty?.name)?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
    )}
    <View style={headerStyles.info}>
      <Text style={headerStyles.name} numberOfLines={1}>{otherParty?.firstName || otherParty?.name}</Text>
      <Text style={headerStyles.sub} numberOfLines={1}>{product?.name || product?.title || 'Product'}</Text>
    </View>
  </View>
);

const ProductBanner = ({ product, onBack, otherParty }) => {
  if (!product) return null;
  return (
    <SafeAreaView edges={['top']} style={bannerStyles.safeArea}>
      <View style={bannerStyles.wrap}>
        <TouchableOpacity onPress={onBack} style={bannerStyles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.t1} />
        </TouchableOpacity>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={bannerStyles.image} />
        ) : (
          <View style={[bannerStyles.image, bannerStyles.imagePlaceholder]}><Ionicons name="image-outline" size={18} color={C.t3} /></View>
        )}
        <View style={bannerStyles.info}>
          <Text style={bannerStyles.title} numberOfLines={1}>{product.name || product.title}</Text>
          <Text style={bannerStyles.price}>GH₵ {product.price?.toLocaleString()}</Text>
        </View>
        {product.negotiable && (
          <View style={bannerStyles.badge}><Text style={bannerStyles.badgeText}>Nego</Text></View>
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
            <Text style={bubbleStyles.avatarLetter}>{(otherParty?.firstName || otherParty?.name)?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )
      )}
    </View>
    <View style={[bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem]}>
      <Text style={[bubbleStyles.text, isMe && bubbleStyles.textMe]}>{message.text}</Text>
      <View style={bubbleStyles.meta}>
        <Text style={[bubbleStyles.time, isMe && bubbleStyles.timeMe]}>{formatShortTime(message.createdAt)}</Text>
        {isMe && <Ionicons name={isRead ? 'checkmark-done' : 'checkmark'} size={12} color={isRead ? '#99F6E4' : 'rgba(255,255,255,0.5)'} style={{ marginLeft: 2 }} />}
        {message._optimistic && <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />}
      </View>
    </View>
  </View>
);

const OfferCard = ({ message, isMe, onPress }) => (
  <View style={[bubbleStyles.row, isMe && bubbleStyles.rowMe]}>
    <View style={bubbleStyles.avatarSlot} />
    <Pressable onPress={onPress} style={[offerStyles.card, isMe && offerStyles.cardMe]}>
      <View style={offerStyles.header}>
        <Ionicons name="cash-outline" size={16} color={C.brand} />
        <Text style={offerStyles.label}>Offer</Text>
      </View>
      <Text style={offerStyles.price}>GH₵ {message.offerMeta?.offerPrice?.toLocaleString()}</Text>
      <View style={[offerStyles.statusBadge, message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAccepted, message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclined]}>
        <Text style={[offerStyles.statusText, message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAcceptedText, message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclinedText]}>{message.offerMeta?.offerStatus?.toUpperCase()}</Text>
      </View>
      <Text style={offerStyles.tap}>Tap to view details →</Text>
    </Pressable>
  </View>
);

const SystemMessage = ({ text }) => (
  <View style={systemStyles.wrap}>
    <View style={systemStyles.bubble}>
      <Ionicons name="information-circle-outline" size={14} color={C.t3} />
      <Text style={systemStyles.text}>{text}</Text>
    </View>
  </View>
);

const formatShortTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.gray100 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1, paddingBottom: 45 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyChatTitle: { fontSize: 17, fontWeight: '700', color: C.t1, marginBottom: 6 },
  emptyChatText: { color: C.t3, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.t3 },
  typingText: { color: C.t3, fontSize: 12, fontStyle: 'italic' },
  inputSafeArea: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.white, bottom: 40 },
  inputWrapper: { flex: 1, backgroundColor: C.gray100, borderRadius: 24, borderWidth: 1, borderColor: '#E8E8E8', marginRight: 10 },
  input: { paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 15, color: C.t1, maxHeight: 100, minHeight: 42 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center', shadowColor: C.brand, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  sendBtnDisabled: { backgroundColor: C.brandBorder, shadowOpacity: 0, elevation: 0 },
});

const disclaimerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 12, marginTop: 8, marginBottom: 2, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  text: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 17 },
  bold: { fontWeight: '700' },
});

const skeletonStyles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 12, paddingVertical: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowMe: { flexDirection: 'row-reverse' },
  avatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0' },
  bubble: { height: 38, borderRadius: 18 },
  bubbleMe: { backgroundColor: C.brandBorder, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#E0E0E0', borderBottomLeftRadius: 4 },
});

const headerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', maxWidth: '80%' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#F0F0F0' },
  avatarFallback: { backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 14, fontWeight: '700', color: C.brand },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: C.t1 },
  sub: { fontSize: 11, color: C.t3, marginTop: 1 },
});

const bannerStyles = StyleSheet.create({
  safeArea: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 4, paddingRight: 12, paddingVertical: 10 },
  backBtn: { padding: 8, marginRight: 4 },
  image: { width: 44, height: 44, borderRadius: 10, marginRight: 10, backgroundColor: C.gray100 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: C.gray100 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 2 },
  price: { fontSize: 13, color: C.accent, fontWeight: '700' },
  badge: { backgroundColor: C.accentBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 10, color: C.accent, fontWeight: '700' },
});

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  rowMe: { flexDirection: 'row-reverse' },
  avatarSlot: { width: 32, marginHorizontal: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0' },
  avatarFallback: { backgroundColor: C.brandBg, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 11, fontWeight: '700', color: C.brand },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: C.brand, borderBottomRightRadius: 4, shadowColor: C.brand, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  bubbleThem: { backgroundColor: C.white, borderBottomLeftRadius: 4, shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  text: { fontSize: 15, color: C.t1, lineHeight: 21 },
  textMe: { color: '#FFFFFF' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  time: { fontSize: 10, color: C.t3 },
  timeMe: { color: 'rgba(255,255,255,0.65)' },
});

const offerStyles = StyleSheet.create({
  card: { maxWidth: '75%', backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8E8E8', shadowColor: C.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardMe: { backgroundColor: C.brandBg, borderColor: C.brand },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, color: C.brand, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 22, fontWeight: '700', color: C.t1, marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: C.accentBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  statusAccepted: { backgroundColor: C.successBg },
  statusDeclined: { backgroundColor: C.dangerBg },
  statusText: { fontSize: 11, fontWeight: '700', color: C.accent },
  statusAcceptedText: { color: C.success },
  statusDeclinedText: { color: C.danger },
  tap: { fontSize: 12, color: C.brand, fontWeight: '600' },
});

const systemStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 20 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEEEEE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  text: { fontSize: 12, color: C.t2, fontWeight: '500' },
});