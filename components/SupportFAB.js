// src/components/SupportFAB.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
  Platform,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHATSAPP_NUMBER = '+233505671577';
const WHATSAPP_MESSAGE = 'Hi CediMart Support! I need help with...';

const SupportFAB = ({ 
  style,
  phoneNumber = WHATSAPP_NUMBER,
  message = WHATSAPP_MESSAGE,
  position = 'bottom-right',
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;

  // Initial entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const toggleExpand = () => {
    if (expanded) {
      // Collapse
      Animated.parallel([
        Animated.timing(optionsAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setExpanded(false));
    } else {
      // Expand
      setExpanded(true);
      Animated.parallel([
        Animated.timing(optionsAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const openWhatsApp = async () => {
    const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

    try {
      await Linking.openURL(url);
      toggleExpand();
    } catch (error) {
      Alert.alert('Error', 'Unable to open WhatsApp. Please try again.');
    }
  };

  const handleCallSupport = () => {
    const formattedNumber = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
    Linking.openURL(formattedNumber).catch(() => {
      Alert.alert('Error', 'Unable to make a call.');
    });
    toggleExpand();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const isRight = position === 'bottom-right';

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        isRight ? { right: 16 } : { left: 16 },
        {
          transform: [{ translateY: slideUpAnim }],
          opacity: fadeInAnim,
        },
      ]}
    >
      {/* Option buttons (shown when expanded) */}
      {expanded && (
        <View style={styles.optionsContainer}>
          {/* WhatsApp Chat Option */}
          <Animated.View
            style={[
              styles.optionWrapper,
              {
                opacity: optionsAnim,
                transform: [
                  { 
                    translateY: optionsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionButton}
              onPress={openWhatsApp}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.optionLabelWrap}>
                <Text style={styles.optionLabel}>WhatsApp</Text>
                <Text style={styles.optionSubLabel}>Chat with us</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Call Option */}
          <Animated.View
            style={[
              styles.optionWrapper,
              {
                opacity: optionsAnim,
                transform: [
                  { 
                    translateY: optionsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    })
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCallSupport}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#6C4CE0' }]}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.optionLabelWrap}>
                <Text style={styles.optionLabel}>Call Us</Text>
                <Text style={styles.optionSubLabel}>Speak to support</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />

      {/* Main FAB */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.fab, expanded && styles.fabExpanded]}
          onPress={toggleExpand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
        >
          {expanded ? (
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <View style={styles.fabContent}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              <Text style={styles.fabText}>Need help?</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  optionsContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 10,
  },
  optionWrapper: {
    // Animated wrapper
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabelWrap: {
    // Text wrapper
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  optionSubLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '500',
    marginTop: 1,
  },
  // Glow ring behind the FAB — now a soft violet halo instead of green
  glowRing: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 76, 224, 0.18)',
  },
  // Main button — deep indigo/violet
  fab: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5B3FD6',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    shadowColor: '#5B3FD6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 140,
  },
  fabExpanded: {
    backgroundColor: '#3B2A99',
    shadowColor: '#3B2A99',
    minWidth: 48,
    width: 48,
    paddingHorizontal: 0,
    borderRadius: 18,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SupportFAB;