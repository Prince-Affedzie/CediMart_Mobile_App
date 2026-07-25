// src/components/common/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ title, showBack = false, onBackPress, rightComponent }) => {
  return (
    <View style={styles.container}>
      {/* Left section — back button with fixed width for balance */}
      <View style={styles.sideSection}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0D9488" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center — title, absolutely positioned for perfect centering */}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {/* Right section — same fixed width as left for balance */}
      <View style={styles.sideSection}>
        {rightComponent}
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sideSection: {
    width: 44,           // Fixed width for balance on both sides
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',  // Center the title text
  },
});

export default Header;