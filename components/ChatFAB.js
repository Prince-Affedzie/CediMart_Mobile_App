// src/components/ChatFAB.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { openConversation } from '../apis/chatApi';

// ─── Teal Palette ──────────────────────────────────────────────────────────
const GREEN      = '#0D9488';
const GREEN_GLOW = 'rgba(13, 148, 136, 0.28)';

const ChatFAB = ({ 
  product,           // ✅ Optional - product object (for product-related chats)
  recipientId,       // ✅ Optional - direct user ID to chat with
  isAuthenticated, 
  currentUserId, 
  style,             // ✅ Parent can pass positioning styles here
  onConversationOpened 
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  const shadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 20],
  });
  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();

  const handlePress = async () => {
    if (loading) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to chat',
        'Create a free account or log in to start chatting.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In',  onPress: () => navigation.navigate('Login') },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
        ]
      );
      return;
    }

    // ✅ Get productId from product object
    const productId = product?._id || product?.id || null;

    // ✅ Require at least one: productId or recipientId
    if (!productId && !recipientId) {
      Alert.alert('Error', 'Cannot start chat: missing product or recipient information.');
      return;
    }

    // ✅ Prevent chatting with yourself when recipientId is known
    if (recipientId && currentUserId && recipientId.toString() === currentUserId.toString()) {
      Alert.alert("That's you!", "You can't start a chat with yourself.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Build request body - at least one will be present
      const requestBody = {};
      
      if (productId) {
        requestBody.productId = productId;
      }
      
      if (recipientId) {
        requestBody.recipientId = recipientId;
      }

      const response = await openConversation(requestBody);

      if (response?.data?.success) {
        const conversation = response.data.conversation;
        onConversationOpened?.(conversation);
        navigation.navigate('ChatScreen', { conversation });
      } else {
        throw new Error(response?.data?.error ?? 'Could not start conversation');
      }
    } catch (err) {
      Alert.alert(
        'Could not open chat',
        err?.response?.data?.error ?? err.message ?? 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dynamic button text based on context
  const getButtonLabel = () => {
    if (loading) return 'Opening chat…';
    if (product) return 'Chat with Seller';
    return 'Send Message';
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.glowLayer,
          { shadowRadius, shadowOpacity },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.pill, loading && styles.pillLoading]}
          onPress={handlePress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" />
              <Text style={styles.label}>{getButtonLabel()}</Text>
            </>
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses" size={19} color="#fff" />
              <Text style={styles.label}>{getButtonLabel()}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    // ✅ Parent controls positioning via the `style` prop
    // These are fallback styles
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 999,
  },
  glowLayer: {
    position: 'absolute',
    width: '100%',
    height: 46,
    borderRadius: 26,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    bottom: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 26,
    backgroundColor: GREEN,
    elevation: 5,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pillLoading: {
    backgroundColor: '#0F766E', // Teal dark
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ChatFAB;