// src/components/AIProductGeneratorFAB.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AI_PURPLE = '#8E5FD9';

const AIProductGeneratorFAB = ({ 
  onPress, 
  loading = false, 
  disabled = false,
  hasBeenUsed = false,
  style,
  iconOnly = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Tooltip animation
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipSlide = useRef(new Animated.Value(10)).current;

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

  // Show tooltip when disabled (no image uploaded)
  useEffect(() => {
    if (disabled) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(tooltipOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(tooltipSlide, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      // Hide tooltip when enabled
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipSlide, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [disabled]);

  // Pulse and glow animations (only when enabled)
  useEffect(() => {
    if (disabled) {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
      return;
    }

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
  }, [disabled]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleDisabledPress = () => {
    // Briefly pulse the button to give feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View 
      style={[
        styles.wrapper, 
        style,
        {
          transform: [{ translateY: slideUpAnim }],
          opacity: fadeInAnim,
        },
      ]}
    >
      {/* Tooltip when disabled */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            opacity: tooltipOpacity,
            transform: [{ translateY: tooltipSlide }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.tooltipText}>📸 Upload a photo to use the AI Assistant to generate product details</Text>
        <View style={styles.tooltipArrow} />
      </Animated.View>

      {/* Outer glow rings - only when enabled */}
      <Animated.View
        style={[
          styles.glowRingOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: disabled ? 0 : glowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRingInner,
          {
            transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }],
            opacity: disabled ? 0 : Animated.multiply(glowAnim, 0.7),
          },
        ]}
      />

      {/* Main FAB button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.fab,
            disabled && styles.fabDisabled,
            loading && styles.fabLoading,
            iconOnly && styles.fabIconOnly,
          ]}
          onPress={disabled ? handleDisabledPress : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.fabContent}>
              <Ionicons 
                name="sparkles" 
                size={iconOnly ? 22 : 16} 
                color={disabled ? '#A0A0A0' : '#FFFFFF'} 
              />
              {!iconOnly && (
                <Text style={[styles.fabText, disabled && styles.fabTextDisabled]}>
                  {disabled 
                    ? 'Add photo for AI help' 
                    : hasBeenUsed 
                      ? 'Regenerate details' 
                      : 'Auto-fill with AI'
                  }
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',      
    justifyContent: 'center',
    position: 'relative',
    minWidth: 44,
    minHeight: 44,
  },
  // Tooltip
  tooltip: {
    position: 'absolute',
    bottom: 54,                    // Position above the FAB
    right: 0,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 16,
    width: 12,
    height: 12,
    backgroundColor: '#333',
    transform: [{ rotate: '45deg' }],
  },
  // Glow rings
  glowRingOuter: {
    position: 'absolute',
    top: -13,
    right: -13,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(142, 95, 217, 0.08)',
  },
  glowRingInner: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(142, 95, 217, 0.12)',
  },
  // FAB Button
  fab: {
    height: 44,
    borderRadius: 22,
    backgroundColor: AI_PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    shadowColor: AI_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fabDisabled: {
    backgroundColor: '#F0F0F0',      
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  fabLoading: {
    backgroundColor: '#A78BFA',
  },
  fabIconOnly: {
    width: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 0,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fabTextDisabled: {
    color: '#999',
  },
});

export default AIProductGeneratorFAB;