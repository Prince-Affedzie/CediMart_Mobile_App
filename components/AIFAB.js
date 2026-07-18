// src/components/AIFAB.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BRAND_GREEN = '#1FAA59';

const AIFAB = ({ 
  style,
  label = true,
}) => {
  const navigation = useNavigation();
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

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

  // Pulse and glow animations
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
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

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
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

  const handlePress = () => {
    navigation.navigate('CediAi');
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          transform: [{ translateY: slideUpAnim }],
          opacity: fadeInAnim,
        },
      ]}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRingOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />

      {/* Inner glow ring */}
      <Animated.View
        style={[
          styles.glowRingInner,
          {
            transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }],
            opacity: Animated.multiply(glowAnim, 0.7),
          },
        ]}
      />

      {/* Main FAB button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
        >
          <View style={styles.fabContent}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.fabIcon} />
            {label && <Text style={styles.fabText}>Ask CediAI</Text>}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 120,
    height: 72,
  },
  // Outer pulse ring
  glowRingOuter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(31, 170, 89, 0.08)',
  },
  // Inner pulse ring
  glowRingInner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(31, 170, 89, 0.12)',
  },
  // Main button
  fab: {
    height: 46,
    borderRadius: 23,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 46,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fabIcon: {
    marginLeft: 1,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginRight: 1,
  },
});

export default AIFAB;