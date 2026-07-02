// src/components/ChatFAB.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { openConversation } from '../apis/chatApi';

const GREEN      = '#1FAA59';
const GREEN_GLOW = 'rgba(31, 170, 89, 0.28)';

const ChatFAB = ({ product, isAuthenticated, currentUserId, style, onConversationOpened }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Press feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Soft breathing glow on the shadow — calm, not noisy
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

  // Interpolate shadow radius and opacity from the glow value
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
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();

  const handlePress = async () => {
    if (loading) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to chat',
        'Create a free account or log in to message this seller.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In',  onPress: () => navigation.navigate('Login') },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
        ]
      );
      return;
    }

    // Prevent owner from chatting about their own listing
    const sellerId = product?.vendor?._id;
    if (sellerId && currentUserId && sellerId.toString() === currentUserId.toString()) {
      Alert.alert("That's your listing", "You can't start a chat about your own product.");
      return;
    }

    setLoading(true);
    try {
      const productId = product?._id ?? product?.id;
      if (!productId) throw new Error('Missing product ID');

      const response = await openConversation({ productId });

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

  return (
    <View style={[styles.wrap, style]}>
      {/*
        The animated shadow lives on a dedicated sibling view.
        This lets Animated drive non-native shadow props (shadowRadius, shadowOpacity)
        without touching the button's layout or transform.
      */}
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
              <Text style={styles.label}>Opening chat…</Text>
            </>
          ) : (
            <>
              <Ionicons name="chatbubble-ellipses" size={19} color="#fff" />
              <Text style={styles.label}>Chat with Seller</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow layer sits behind the button, absolutely centred
  glowLayer: {
    position: 'absolute',
    width: '88%',
    height: 46,
    borderRadius: 26,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    bottom:46,
    // shadowRadius and shadowOpacity come from Animated above
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
    bottom:46,
    // Static Android elevation
    elevation: 5,
  },

  pillLoading: {
    backgroundColor: '#178A47',
  },

  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ChatFAB;