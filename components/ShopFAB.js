// src/components/ShopFAB.js
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ShopFAB = ({ onPress, visible = true, bottomOffset = 0, label = 'Browse Products' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: 28 + insets.bottom + bottomOffset,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        <Text style={styles.text} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    elevation: 10,
  },
  fab: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ShopFAB;