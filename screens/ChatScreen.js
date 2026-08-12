// screens/ChatScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Pressable, SafeAreaView, StatusBar,
  Animated, Alert, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ReportSheet from '../components/ReportSheet';
import * as Haptics from 'expo-haptics';

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

export default function ChatScreen({ route, navigation }) {
  const { conversation: initialConversation } = route.params;
  const { user } = useAuth();
  const {
    enterConversation, leaveConversation, messages, messagesLoading,
    hasMoreMessages, loadMessages, sendMessage, activeConversation,
    typingUsers, emitTyping, emitStopTyping,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportedMessages, setReportedMessages] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);
  const disclaimerAnim = useRef(new Animated.Value(1)).current;
  const [hintVisible, setHintVisible] = useState(true);
  const hintAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
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

  const handleDismissHint = () => {
    Animated.timing(hintAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setHintVisible(false));
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    setReplyingTo(null);
    emitStopTyping(initialConversation._id);
    clearTimeout(typingTimeoutRef.current);
    setIsSending(true);
    try {
      await sendMessage(initialConversation._id, text, replyingTo?._id);
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

  const handleLongPressMessage = (message) => {
    setSelectedMessage(message);
  };

  const handleReplyMessage = (message) => {
    setSelectedMessage(null);
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleReportMessage = (message) => {
    setSelectedMessage(message);
    setShowReport(true);
  };

  const handleCopySelected = () => {
    if (!selectedMessage) return;
    Clipboard.setString(selectedMessage.text);
    setSelectedMessage(null);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handleCloseReport = () => {
    if (selectedMessage) {
      setReportedMessages(prev => new Set([...prev, selectedMessage._id]));
    }
    setShowReport(false);
    setSelectedMessage(null);
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender?._id === user._id || item.sender === user._id;
    const prevMsg = messages[index - 1];
    const nextMsg = messages[index + 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender?._id !== item.sender?._id);
    const isLastInGroup = !nextMsg || nextMsg.sender?._id !== item.sender?._id || nextMsg.type !== item.type;
    const isFirstInGroup = !prevMsg || prevMsg.sender?._id !== item.sender?._id || prevMsg.type !== item.type;
    const isRead = !!item.readAt;

    if (item.type === 'system') return <SystemMessage text={item.text} />;
    if (item.type === 'offer_link') return <OfferCard message={item} isMe={isMe} onPress={() => navigation.navigate('OfferDetails', { offerId: item.offerMeta?.offerId })} />;

    return (
      <MessageBubble 
        message={item} 
        isMe={isMe} 
        showAvatar={showAvatar} 
        otherParty={otherParty}
        currentUserId={user._id}
        isRead={isRead}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        isSelected={selectedMessage?._id === item._id}
        isSelectionMode={!!selectedMessage}
        onLongPress={handleLongPressMessage}
        onReply={handleReplyMessage}
        onReport={handleReportMessage}
        isReported={reportedMessages.has(item._id)}
      />
    );
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {selectedMessage ? (
        <SelectionHeader
          onClose={() => setSelectedMessage(null)}
          onReply={() => handleReplyMessage(selectedMessage)}
          onCopy={handleCopySelected}
          onReport={() => handleReportMessage(selectedMessage)}
        />
      ) : (
        <ProductBanner product={initialConversation.product} onBack={() => navigation.goBack()} otherParty={otherParty} />
      )}
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        
        {hintVisible && messages.length > 0 && (
          <Animated.View style={[hintStyles.wrap, { opacity: hintAnim }]}>
            <Ionicons name="hand-left-outline" size={16} color={C.brand} style={{ marginTop: 1 }} />
            <Text style={hintStyles.text}><Text style={hintStyles.bold}>Tip: </Text>Long-press any message to reply, copy, or report it.</Text>
            <TouchableOpacity onPress={handleDismissHint} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="close" size={16} color={C.brandD} /></TouchableOpacity>
          </Animated.View>
        )}
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
              <View style={[styles.typingDot]} />
              <View style={[styles.typingDot, styles.typingDotDelay1]} />
              <View style={[styles.typingDot, styles.typingDotDelay2]} />
            </View>
            <Text style={styles.typingText}>{otherParty?.firstName || otherParty?.name?.split(' ')[0]} is typing</Text>
          </View>
        )}

        {/* Reply indicator */}
        {replyingTo && (
          <View style={replyStyles.container}>
            <View style={replyStyles.bar} />
            <View style={replyStyles.content}>
              <Text style={replyStyles.name} numberOfLines={1}>
                Replying to {replyingTo.sender?.firstName || 'message'}
              </Text>
              <Text style={replyStyles.preview} numberOfLines={1}>
                {replyingTo.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={replyStyles.closeBtn}>
              <Ionicons name="close" size={16} color={C.t2} />
            </TouchableOpacity>
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputBar}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={handleInputChange}
                placeholder={replyingTo ? 'Type a reply...' : 'Type a message…'}
                placeholderTextColor={C.t3}
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit={false}
                onSubmitEditing={() => { if (inputText.trim() && !isSending) handleSend(); }}
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]} 
              onPress={handleSend} 
              disabled={!inputText.trim() || isSending} 
              activeOpacity={0.8}
            >
              {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <ReportSheet
        visible={showReport}
        onClose={handleCloseReport}
        contentType="ChatMessage"  
        contentId={selectedMessage?._id}
      />
    </View>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────
const SkeletonBubble = ({ isMe, width }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => { 
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }), 
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
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
        <Text style={headerStyles.avatarLetter}>
          {(otherParty?.firstName || otherParty?.name)?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
    )}
    <View style={headerStyles.info}>
      <Text style={headerStyles.name} numberOfLines={1}>
        {otherParty?.firstName || otherParty?.name || 'Chat'}
      </Text>
      <Text style={headerStyles.sub} numberOfLines={1}>
        {product?.name || product?.title || 'Direct Message'}
      </Text>
    </View>
  </View>
);

// ✅ UPDATED ProductBanner - Always shows with or without product
const ProductBanner = ({ product, onBack, otherParty }) => {
  const hasProduct = product && (product.name || product.title);
  
  // Generate avatar initials from otherParty's firstName
  const getInitials = () => {
    if (otherParty?.firstName) {
      return otherParty.firstName.charAt(0).toUpperCase();
    }
    if (otherParty?.name) {
      return otherParty.name.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <SafeAreaView edges={['top']} style={bannerStyles.safeArea}>
      <View style={bannerStyles.wrap}>
        <TouchableOpacity onPress={onBack} style={bannerStyles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.t1} />
        </TouchableOpacity>
        
        {/* Show product image if available, otherwise show other party's avatar */}
        {hasProduct && product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={[bannerStyles.image, { borderRadius: 10 }]} />
        ) : (
          <View style={[bannerStyles.image, bannerStyles.avatarFallback]}>
            <Text style={bannerStyles.avatarLetter}>{getInitials()}</Text>
          </View>
        )}
        
        <View style={bannerStyles.info}>
          {/* Always show other party's firstName as the main title */}
          <Text style={bannerStyles.title} numberOfLines={1}>
            {otherParty?.firstName || otherParty?.name || 'Chat'}
          </Text>
          
          {/* Show product name as subtitle when product exists */}
          {hasProduct ? (
            <Text style={bannerStyles.subtitle} numberOfLines={1}>
              {product.name || product.title}
            </Text>
          ) : (
            <Text style={bannerStyles.subtitle} numberOfLines={1}>
              Direct Message
            </Text>
          )}
        </View>
        
        {/* Show price only when product exists */}
        {hasProduct && product.price && (
          <View style={bannerStyles.priceTag}>
            <Text style={bannerStyles.priceText}>GH₵ {product.price?.toLocaleString()}</Text>
          </View>
        )}
        
        {/* Show negotiable badge only when product exists */}
        {hasProduct && product.negotiable && (
          <View style={bannerStyles.badge}>
            <Text style={bannerStyles.badgeText}>Nego</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ── WhatsApp-style selection header, shown when a message is long-pressed ──
const SelectionHeader = ({ onClose, onReply, onCopy, onReport }) => (
  <SafeAreaView edges={['top']} style={selectionStyles.safeArea}>
    <View style={selectionStyles.wrap}>
      <TouchableOpacity onPress={onClose} style={selectionStyles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={24} color={C.t1} />
      </TouchableOpacity>
      <Text style={selectionStyles.title}>1 selected</Text>
      <View style={selectionStyles.actions}>
        <TouchableOpacity onPress={onReply} style={selectionStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-undo-outline" size={22} color={C.t1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCopy} style={selectionStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="copy-outline" size={21} color={C.t1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReport} style={selectionStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="flag-outline" size={21} color={C.danger} />
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

// MessageBubble component
const MessageBubble = ({ message, isMe, showAvatar, otherParty, currentUserId, isRead, isFirstInGroup, isLastInGroup, isSelected, isSelectionMode, onLongPress, onReply, onReport, isReported }) => {
  const replyData = message.replyPreview;
  const hasReply = replyData && (replyData.text || replyData.message);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(message);
  };

  // While in selection mode, tapping any bubble re-targets (or clears) the selection,
  // mirroring WhatsApp's tap-to-toggle behaviour.
  const handlePress = () => {
    if (isSelectionMode) {
      onLongPress?.(isSelected ? null : message);
    }
  };

  const getReplySenderName = () => {
    if (!replyData) return 'User';
    if (replyData.senderId === currentUserId) return 'You';
    if (replyData.senderId === otherParty?._id) {
      return otherParty?.firstName || otherParty?.name || 'User';
    }
    return 'User';
  };

  return (
    <View style={[
      bubbleStyles.messageContainer,
      isFirstInGroup && bubbleStyles.firstInGroup,
      isLastInGroup && bubbleStyles.lastInGroup,
      isSelected && bubbleStyles.selectedRow
    ]}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={100}
        onPress={handlePress}
      >
        <View style={[
          bubbleStyles.mainRow,
          isMe ? bubbleStyles.mainRowMe : bubbleStyles.mainRowThem
        ]}>
          {!isMe && (
            <View style={bubbleStyles.avatarWrapper}>
              {showAvatar && (
                otherParty?.avatar ? (
                  <Image source={{ uri: otherParty.avatar }} style={bubbleStyles.avatar} />
                ) : (
                  <View style={[bubbleStyles.avatar, bubbleStyles.avatarFallback]}>
                    <Text style={bubbleStyles.avatarLetter}>
                      {(otherParty?.firstName || otherParty?.name)?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          <View style={[
            bubbleStyles.bubbleWrapper,
            isMe ? bubbleStyles.bubbleWrapperMe : bubbleStyles.bubbleWrapperThem
          ]}>
            <View style={[
              bubbleStyles.bubble,
              isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem,
              isFirstInGroup && (isMe ? bubbleStyles.bubbleMeFirst : bubbleStyles.bubbleThemFirst),
              isLastInGroup && (isMe ? bubbleStyles.bubbleMeLast : bubbleStyles.bubbleThemLast)
            ]}>
              {hasReply && (
                <View style={bubbleStyles.replyWrapper}>
                  <View style={[
                    bubbleStyles.replyContainer,
                    isMe ? bubbleStyles.replyContainerMe : bubbleStyles.replyContainerThem
                  ]}>
                    <View style={[
                      bubbleStyles.replyBar,
                      isMe && bubbleStyles.replyBarMe
                    ]} />
                    <View style={bubbleStyles.replyContent}>
                      <Text style={[
                        bubbleStyles.replyName,
                        isMe && bubbleStyles.replyNameMe
                      ]} numberOfLines={1}>
                        {getReplySenderName()}
                      </Text>
                      <Text style={[
                        bubbleStyles.replyText,
                        isMe && bubbleStyles.replyTextMe
                      ]} numberOfLines={1}>
                        {replyData.text || replyData.message || 'Message'}
                      </Text>
                    </View>
                    {replyData.image && (
                      <Image 
                        source={{ uri: replyData.image }} 
                        style={bubbleStyles.replyImage} 
                      />
                    )}
                  </View>
                  <View style={[
                    bubbleStyles.replyDivider,
                    isMe && bubbleStyles.replyDividerMe
                  ]} />
                </View>
              )}
              
              <View style={bubbleStyles.messageContent}>
                <Text style={[
                  bubbleStyles.text, 
                  isMe ? bubbleStyles.textMe : bubbleStyles.textThem
                ]}>
                  {message.text}
                </Text>
              </View>
              
              <View style={bubbleStyles.meta}>
                <Text style={[
                  bubbleStyles.time, 
                  isMe ? bubbleStyles.timeMe : bubbleStyles.timeThem
                ]}>
                  {formatShortTime(message.createdAt)}
                </Text>
                {isMe && (
                  <Ionicons 
                    name={isRead ? 'checkmark-done' : 'checkmark'} 
                    size={14} 
                    color={isRead ? C.brandL : 'rgba(255,255,255,0.5)'} 
                    style={{ marginLeft: 3 }} 
                  />
                )}
                {message._optimistic && (
                  <ActivityIndicator 
                    size="small" 
                    color="rgba(255,255,255,0.5)" 
                    style={{ marginLeft: 4 }} 
                  />
                )}
                {isReported && (
                  <View style={bubbleStyles.reportedTag}>
                    <Ionicons name="flag" size={8} color={C.danger} />
                    <Text style={bubbleStyles.reportedText}>Reported</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {isMe && <View style={bubbleStyles.spacer} />}
        </View>
      </Pressable>
    </View>
  );
};

const OfferCard = ({ message, isMe, onPress }) => (
  <View style={[
    bubbleStyles.mainRow,
    isMe ? bubbleStyles.mainRowMe : bubbleStyles.mainRowThem
  ]}>
    <View style={bubbleStyles.bubbleWrapper}>
      <Pressable onPress={onPress} style={[offerStyles.card, isMe && offerStyles.cardMe]}>
        <View style={offerStyles.header}>
          <Ionicons name="cash-outline" size={16} color={C.brand} />
          <Text style={offerStyles.label}>Offer</Text>
        </View>
        <Text style={offerStyles.price}>GH₵ {message.offerMeta?.offerPrice?.toLocaleString()}</Text>
        <View style={[
          offerStyles.statusBadge, 
          message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAccepted, 
          message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclined
        ]}>
          <Text style={[
            offerStyles.statusText, 
            message.offerMeta?.offerStatus === 'accepted' && offerStyles.statusAcceptedText, 
            message.offerMeta?.offerStatus === 'declined' && offerStyles.statusDeclinedText
          ]}>
            {message.offerMeta?.offerStatus?.toUpperCase()}
          </Text>
        </View>
        <Text style={offerStyles.tap}>Tap to view details →</Text>
      </Pressable>
    </View>
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
  flex: { flex: 1, backgroundColor: C.gray50 },
  messagesList: { 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    flexGrow: 1,
    paddingBottom: 36
  },
  emptyChat: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 40 
  },
  emptyIconWrap: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: C.brandBg, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  emptyChatTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: C.t1, 
    marginBottom: 6 
  },
  emptyChatText: { 
    color: C.t3, 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 20 
  },
  typingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 8,
    paddingTop: 4,
    gap: 8 
  },
  typingDots: { 
    flexDirection: 'row', 
    gap: 4 
  },
  typingDot: { 
    width: 7, 
    height: 7, 
    borderRadius: 3.5, 
    backgroundColor: C.t3,
    opacity: 0.6
  },
  typingDotDelay1: { opacity: 0.4 },
  typingDotDelay2: { opacity: 0.2 },
  typingText: { 
    color: C.t3, 
    fontSize: 13, 
    fontStyle: 'italic' 
  },
  inputSafeArea: { 
    backgroundColor: C.white, 
    borderTopWidth: 1, 
    borderTopColor: C.gray200 
  },
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: C.white,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    bottom:40
  },
  inputWrapper: { 
    flex: 1, 
    backgroundColor: C.gray100, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: C.gray200, 
    marginRight: 10 
  },
  input: { 
    paddingHorizontal: 16, 
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, 
    fontSize: 15, 
    color: C.t1, 
    maxHeight: 100, 
    minHeight: 42,
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: C.brand, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: C.brand, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 4 
  },
  sendBtnDisabled: { 
    backgroundColor: C.brandBorder, 
    shadowOpacity: 0, 
    elevation: 0 
  },
});

const replyStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    bottom:28
  },
  bar: {
    width: 3,
    height: 36,
    backgroundColor: C.brand,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: C.brand,
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    color: C.t2,
  },
  closeBtn: {
    padding: 4,
  },
});

const disclaimerStyles = StyleSheet.create({
  wrap: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 8, 
    marginHorizontal: 12, 
    marginTop: 8, 
    marginBottom: 2, 
    backgroundColor: C.accentBg, 
    borderWidth: 1, 
    borderColor: C.accentBorder, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  text: { 
    flex: 1, 
    fontSize: 12, 
    color: '#78350F', 
    lineHeight: 17 
  },
  bold: { 
    fontWeight: '700' 
  },
});

const hintStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: C.brandBg,
    borderWidth: 1,
    borderColor: C.brandBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: C.brandD,
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
  },
});

const skeletonStyles = StyleSheet.create({
  wrap: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 16, 
    gap: 12 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    gap: 8 
  },
  rowMe: { 
    flexDirection: 'row-reverse' 
  },
  avatarCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#E8E8E8' 
  },
  bubble: { 
    height: 40, 
    borderRadius: 18 
  },
  bubbleMe: { 
    backgroundColor: C.brandBorder, 
    borderBottomRightRadius: 4 
  },
  bubbleThem: { 
    backgroundColor: '#E8E8E8', 
    borderBottomLeftRadius: 4 
  },
});

const headerStyles = StyleSheet.create({
  wrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    maxWidth: '80%' 
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 10, 
    backgroundColor: '#F0F0F0' 
  },
  avatarFallback: { 
    backgroundColor: C.brandBg, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarLetter: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: C.brand 
  },
  info: { 
    flex: 1 
  },
  name: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: C.t1 
  },
  sub: { 
    fontSize: 11, 
    color: C.t3, 
    marginTop: 1 
  },
});

// ✅ Updated banner styles
const bannerStyles = StyleSheet.create({
  safeArea: { 
    backgroundColor: C.white, 
    borderBottomWidth: 1, 
    borderBottomColor: C.gray200 
  },
  wrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.white, 
    paddingHorizontal: 4, 
    paddingRight: 12, 
    paddingVertical: 10 
  },
  backBtn: { 
    padding: 8, 
    marginRight: 4 
  },
  image: { 
    width: 44, 
    height: 44, 
    borderRadius: 22,
    marginRight: 10, 
    backgroundColor: C.gray100 
  },
  avatarFallback: { 
    backgroundColor: C.brandBg, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 22,
  },
  avatarLetter: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: C.brand 
  },
  info: { 
    flex: 1,
    justifyContent: 'center',
  },
  title: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: C.t1, 
    marginBottom: 1,
  },
  subtitle: { 
    fontSize: 12, 
    color: C.t3,
  },
  priceTag: {
    backgroundColor: C.accentBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  priceText: { 
    fontSize: 11, 
    color: C.accent, 
    fontWeight: '700' 
  },
  badge: { 
    backgroundColor: C.accentBg, 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    marginLeft: 8 
  },
  badgeText: { 
    fontSize: 10, 
    color: C.accent, 
    fontWeight: '700' 
  },
});

const selectionStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  closeBtn: {
    padding: 8,
    marginRight: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.t1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingRight: 8,
  },
  actionBtn: {
    padding: 4,
  },
});

const bubbleStyles = StyleSheet.create({
  messageContainer: {
    marginBottom: 2,
    width: '100%',
  },
  firstInGroup: {
    marginTop: 8,
  },
  lastInGroup: {
    marginBottom: 8,
  },
  selectedRow: {
    backgroundColor: C.brandBg,
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  mainRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 4,
  },
  mainRowMe: {
    justifyContent: 'flex-end',
  },
  mainRowThem: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    width: 36,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#F0F0F0' 
  },
  avatarFallback: { 
    backgroundColor: C.brandBg, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarLetter: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.brand 
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubbleWrapperMe: {
    alignItems: 'flex-end',
  },
  bubbleWrapperThem: {
    alignItems: 'flex-start',
  },
  spacer: {
    width: 36,
    marginLeft: 4,
  },
  bubble: { 
    borderRadius: 18, 
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  bubbleMe: { 
    backgroundColor: C.brand, 
    borderBottomRightRadius: 4,
    shadowColor: C.brand, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 2, 
    elevation: 2 
  },
  bubbleMeFirst: {
    borderTopRightRadius: 18,
  },
  bubbleMeLast: {
    borderBottomRightRadius: 18,
  },
  bubbleThem: { 
    backgroundColor: C.white, 
    borderBottomLeftRadius: 4,
    shadowColor: C.black, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  bubbleThemFirst: {
    borderTopLeftRadius: 18,
  },
  bubbleThemLast: {
    borderBottomLeftRadius: 18,
  },
  replyWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minWidth:194,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  replyContainerMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyContainerThem: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  replyBar: {
    width: 3,
    height: 32,
    backgroundColor: '#FFD700',
    borderRadius: 1.5,
    marginRight: 10,
  },
  replyBarMe: {
    backgroundColor: '#FFD700',
  },
  replyContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  replyName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E6A800',
    marginBottom: 2,
    flexShrink: 1,
  },
  replyNameMe: {
    color: '#FFD700',
  },
  replyText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    fontWeight: '400',
    flexShrink: 1,
  },
  replyTextMe: {
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    fontWeight: '400',
  },
  replyImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginLeft: 8,
  },
  replyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 12,
    marginBottom: 0,
  },
  replyDividerMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  messageContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: { 
    fontSize: 15, 
    lineHeight: 21 
  },
  textMe: { 
    color: '#FFFFFF' 
  },
  textThem: {
    color: C.t1,
  },
  meta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14,
    paddingBottom: 8,
    justifyContent: 'flex-end' 
  },
  time: { 
    fontSize: 11, 
  },
  timeMe: { 
    color: 'rgba(255,255,255,0.65)' 
  },
  timeThem: {
    color: C.t3,
  },
  reportedTag: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3,
    marginLeft: 6, 
    backgroundColor: C.dangerBg,
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6,
  },
  reportedText: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: C.danger 
  },
});

const offerStyles = StyleSheet.create({
  card: { 
    maxWidth: '75%', 
    backgroundColor: C.white, 
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#E8E8E8', 
    shadowColor: C.black, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  cardMe: { 
    backgroundColor: C.brandBg, 
    borderColor: C.brand 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 6 
  },
  label: { 
    fontSize: 12, 
    color: C.brand, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  price: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: C.t1, 
    marginBottom: 8 
  },
  statusBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: C.accentBg, 
    borderRadius: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginBottom: 8 
  },
  statusAccepted: { 
    backgroundColor: C.successBg 
  },
  statusDeclined: { 
    backgroundColor: C.dangerBg 
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.accent 
  },
  statusAcceptedText: { 
    color: C.success 
  },
  statusDeclinedText: { 
    color: C.danger 
  },
  tap: { 
    fontSize: 12, 
    color: C.brand, 
    fontWeight: '600' 
  },
});

const systemStyles = StyleSheet.create({
  wrap: { 
    alignItems: 'center', 
    marginVertical: 10, 
    paddingHorizontal: 20 
  },
  bubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#EEEEEE', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 6 
  },
  text: { 
    fontSize: 12, 
    color: C.t2, 
    fontWeight: '500' 
  },
});