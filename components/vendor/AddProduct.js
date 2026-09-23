import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {styles} from '../../styles/addproduct'
const { width, height } = Dimensions.get('window');


// ─── Teal + Coral Palette (matches UpdateProductScreen) ────────────────────
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
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  white:        '#FFFFFF',
  black:        '#000000',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
};


export const formatDisplayName = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');

// ─── DropdownSelector ───────────────────────────────────────────────────────


export const DropdownSelector = ({
  label, placeholder, items, selectedValue, onSelect, required, renderItem, style, disabled, error, badge,
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim    = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    if (disabled) return;
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 1, tension: 68, friction: 13, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleSelect = (key) => { onSelect(key); closeSheet(); };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const selectedItem = items.find(
    (item) => (typeof item === 'string' ? item : item.key) === selectedValue,
  );

  const triggerLabel = selectedItem
    ? typeof selectedItem === 'string'
      ? selectedItem
      : (selectedItem.label || formatDisplayName(selectedItem.key))
    : placeholder;

  return (
    <View style={style}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={[styles.dropdownLabel, { marginBottom: 0 }]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {badge}
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          visible && styles.dropdownButtonFocused,
          disabled && styles.dropdownButtonDisabled,
          error && styles.dropdownButtonError,
        ]}
        activeOpacity={0.8}
        onPress={openSheet}
        disabled={disabled}
      >
        <Text style={[styles.dropdownButtonText, !selectedValue && styles.dropdownPlaceholder, disabled && styles.dropdownButtonTextDisabled]} numberOfLines={1}>
          {triggerLabel}
        </Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={disabled ? C.t3 : visible ? C.brand : error ? C.danger : C.t3} />
      </TouchableOpacity>
      {!!error && <FieldError>{error}</FieldError>}

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
        <Animated.View style={[bsStyles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[bsStyles.sheet, { transform: [{ translateY }] }]}>
          <View style={bsStyles.handle} />
          <View style={bsStyles.sheetHeader}>
            <Text style={bsStyles.sheetTitle}>{label || placeholder}</Text>
            <TouchableOpacity style={bsStyles.closeBtn} onPress={closeSheet}>
              <Ionicons name="close" size={18} color={C.t2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.key)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => {
              const key = typeof item === 'string' ? item : item.key;
              const isSelected = selectedValue === key;
              return (
                <TouchableOpacity
                  style={[bsStyles.item, isSelected && bsStyles.itemActive]}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.75}
                >
                  {renderItem ? (
                    renderItem({ item, isSelected })
                  ) : (
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {item.icon && (
                          <Ionicons 
                            name={item.icon} 
                            size={22} 
                            color={isSelected ? C.brand : C.t2}
                            style={{ width: 32, textAlign: 'center' }}
                          />
                        )}
                        <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>
                          {item.label || formatDisplayName(item.key)}
                        </Text>
                      </View>
                      {item.hint && (
                        <Text style={bsStyles.itemHint}>{item.hint}</Text>
                      )}
                    </View>
                  )}
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.brand} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </View>
  );
};

// ─── ComboLocationPicker ────────────────────────────────────────────────────
export const ComboLocationPicker = ({
  label, placeholder, items, selectedValue, onSelect, customPlaceholder,
  style, error, icon = 'location-outline', helperText,
}) => {
  const [visible, setVisible] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setCustomMode(false);
    setCustomText('');
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 1, tension: 68, friction: 13, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleSelect = (key) => {
    onSelect(key);
    closeSheet();
  };

  const handleCustomSubmit = () => {
    const trimmed = customText.trim();
    if (trimmed) onSelect(trimmed);
    closeSheet();
  };

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  //  Find a matching item for the current value — if the value isn't one of
  //  the standard items, that means it's a user-typed custom value.
  const selectedItem = items.find(
    (item) => (typeof item === 'string' ? item : item.key) === selectedValue,
  );
  const isCustomValue = !!selectedValue && !selectedItem;

  const triggerLabel = selectedItem
    ? typeof selectedItem === 'string'
      ? selectedItem
      : (selectedItem.label || formatDisplayName(selectedItem.key))
    : selectedValue || placeholder;

  return (
    <View style={style}>
      {label && (
        <Text style={styles.dropdownLabel}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          visible && styles.dropdownButtonFocused,
          error && styles.dropdownButtonError,
        ]}
        activeOpacity={0.8}
        onPress={openSheet}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons
            name={isCustomValue ? 'create-outline' : icon}
            size={16}
            color={error ? C.danger : selectedValue ? C.brand : C.t3}
          />
          <Text
            style={[
              styles.dropdownButtonText,
              !selectedValue && styles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {triggerLabel}
          </Text>
          {isCustomValue && (
            <View style={styles.customTag}>
              <Text style={styles.customTagText}>custom</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={visible ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={error ? C.danger : visible ? C.brand : C.t3}
        />
      </TouchableOpacity>
      {!!error && <FieldError>{error}</FieldError>}
      {!!helperText && <HelperText>{helperText}</HelperText>}

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
        <Animated.View style={[bsStyles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[bsStyles.sheet, { transform: [{ translateY }] }]}>
          <View style={bsStyles.handle} />
          <View style={bsStyles.sheetHeader}>
            <Text style={bsStyles.sheetTitle}>{customMode ? 'Type your own' : (label || placeholder)}</Text>
            <TouchableOpacity style={bsStyles.closeBtn} onPress={closeSheet}>
              <Ionicons name="close" size={18} color={C.t2} />
            </TouchableOpacity>
          </View>

          {customMode ? (
            <View style={{ paddingTop: 12 }}>
              <View style={styles.customInputWrap}>
                <Ionicons name="create-outline" size={18} color={C.brand} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.customInput}
                  placeholder={customPlaceholder || 'Type here...'}
                  placeholderTextColor="#C5C5C5"
                  value={customText}
                  onChangeText={setCustomText}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCustomSubmit}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.customCancelBtn}
                  onPress={() => setCustomMode(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customCancelBtnText}>Back to list</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customSubmitBtn, !customText.trim() && styles.customSubmitBtnDisabled]}
                  onPress={handleCustomSubmit}
                  disabled={!customText.trim()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.customSubmitBtnText}>Use this</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => (typeof item === 'string' ? item : item.key)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.customRow}
                  onPress={() => setCustomMode(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.customRowIcon}>
                    <Ionicons name="create-outline" size={18} color={C.brand} />
                  </View>
                  <Text style={styles.customRowText}>
                    {customPlaceholder || 'Type your own'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={C.t3} />
                </TouchableOpacity>
              }
              renderItem={({ item }) => {
                const key = typeof item === 'string' ? item : item.key;
                const isSelected = selectedValue === key;
                return (
                  <TouchableOpacity
                    style={[bsStyles.item, isSelected && bsStyles.itemActive]}
                    onPress={() => handleSelect(key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[bsStyles.itemText, isSelected && bsStyles.itemTextActive]}>
                      {typeof item === 'string' ? item : (item.label || formatDisplayName(item.key))}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.brand} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Animated.View>
      </Modal>
    </View>
  );
};


const bsStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: height * 0.62, paddingHorizontal: 16, paddingTop: 10,
    shadowColor: C.black, shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1, shadowRadius: 18, elevation: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.t1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  itemActive: { backgroundColor: C.brandBg, borderBottomColor: 'transparent' },
  itemEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  itemText: { fontSize: 15, color: C.t2, fontWeight: '500', flex: 1 },
  itemTextActive: { color: C.brand, fontWeight: '700' },
  itemHint: { fontSize: 11.5, color: C.t3, marginTop: 2, marginLeft: 44 },
});
