// src/screens/main/NotificationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator, RefreshControl,
  Animated, Platform, Modal, TextInput, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { getNotifications, markNotificationAsRead, deleteNotification, deleteBulkNotifications } from '../apis/notificationApi';
import { useFocusEffect } from '@react-navigation/native';

// ─── Teal + Coral Palette ──────────────────────────────────────────────────
const C = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  elev:         '#F1F5F9',
  t1:           '#0F172A',
  t2:           '#475569',
  t3:           '#94A3B8',
  brand:        '#0D9488',
  brandL:       '#14B8A6',
  brandD:       '#0F766E',
  brandBg:      '#F0FDFA',
  brandBorder:  '#99F6E4',
  accent:       '#F97316',
  accentL:      '#FB923C',
  accentBg:     '#FFF7ED',
  accentBorder: '#FED7AA',
  success:      '#059669',
  successBg:    '#ECFDF5',
  successBorder:'#A7F3D0',
  danger:       '#DC2626',
  dangerBg:     '#FEF2F2',
  dangerBorder: '#FECACA',
  info:         '#0284C7',
  infoBg:       '#F0F9FF',
  infoBorder:   '#BAE6FD',
  purple:       '#7E22CE',
  purpleBg:     '#F3E8FF',
  white:        '#FFFFFF',
  black:        '#000000',
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      return () => { Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(); };
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      if (response.status === 200) {
        const notificationsData = response.data.data || response.data || [];
        setNotifications(notificationsData);
        applyFiltersAndSearch(notificationsData);
      } else { Alert.alert('Error', 'Failed to load notifications'); }
    } catch (error) { console.error('Error loading notifications:', error); Alert.alert('Error', 'Failed to load notifications'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const applyFiltersAndSearch = (data) => {
    let filtered = [...data];
    if (filter === 'unread') filtered = filtered.filter(n => !n.isRead);
    else if (filter === 'read') filtered = filtered.filter(n => n.isRead);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.title?.toLowerCase().includes(query) || n.message?.toLowerCase().includes(query) || n.type?.toLowerCase().includes(query));
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredNotifications(filtered);
  };

  useEffect(() => { applyFiltersAndSearch(notifications); }, [filter, searchQuery, notifications]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadNotifications(); }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markNotificationAsRead([notificationId]);
      if (response.status === 200) {
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      }
    } catch (error) { console.error('Error marking as read:', error); Alert.alert('Error', 'Failed to mark notification as read'); }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length === 0) { Alert.alert('Info', 'All notifications are already read'); return; }
    try {
      const response = await markNotificationAsRead(unreadIds);
      if (response.status === 200) {
        setNotifications(prev => prev.map(n => unreadIds.includes(n._id) ? { ...n, isRead: true } : n));
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) { console.error('Error marking all as read:', error); Alert.alert('Error', 'Failed to mark all notifications as read'); }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await deleteNotification(notificationId);
      if (response.status === 200) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        Alert.alert('Success', 'Notification deleted');
      } else { Alert.alert('Error', 'Failed to delete notification'); }
    } catch (error) { console.error('Error deleting notification:', error); Alert.alert('Error', 'Failed to delete notification'); }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) { Alert.alert('Info', 'Please select notifications to delete'); return; }
    setBulkDeleteLoading(true);
    try {
      const response = await deleteBulkNotifications(selectedNotifications);
      if (response.status === 200) {
        setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n._id)));
        setSelectedNotifications([]); setSelectMode(false);
        Alert.alert('Success', `${selectedNotifications.length} notifications deleted`);
      } else { Alert.alert('Error', 'Failed to delete notifications'); }
    } catch (error) { console.error('Error bulk deleting:', error); Alert.alert('Error', 'Failed to delete notifications'); }
    finally { setBulkDeleteLoading(false); }
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => prev.includes(notificationId) ? prev.filter(id => id !== notificationId) : [...prev, notificationId]);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) setSelectedNotifications([]);
    else setSelectedNotifications(filteredNotifications.map(n => n._id));
  };

  const handleNotificationPress = async (item) => {
    if (!item.isRead) await handleMarkAsRead(item._id);
    setSelectedNotification(item); setDetailModalVisible(true);
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':     return { icon: 'cart-outline', color: C.success, bgColor: C.successBg };
      case 'delivery':  return { icon: 'bicycle-outline', color: C.info, bgColor: C.infoBg };
      case 'promotion': return { icon: 'pricetag-outline', color: C.accent, bgColor: C.accentBg };
      case 'system':    return { icon: 'notifications-outline', color: C.purple, bgColor: C.purpleBg };
      case 'warning':   return { icon: 'warning-outline', color: C.danger, bgColor: C.dangerBg };
      default:          return { icon: 'notifications-outline', color: C.t2, bgColor: C.elev };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderRightActions = (progress, dragX, notificationId) => {
    const trans = dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <View style={styles.swipeActions}>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity style={[styles.swipeButton, styles.deleteButton]} onPress={() => { setNotificationToDelete(notificationId); setDeleteModalVisible(true); }}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderNotificationItem = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);
    const isSelected = selectedNotifications.includes(item._id);
    const NotificationContent = () => (
      <TouchableOpacity style={[styles.notificationCard, !item.isRead && styles.unreadNotification, isSelected && styles.selectedNotification]}
        onPress={() => { if (selectMode) toggleSelectNotification(item._id); else handleNotificationPress(item); }}
        onLongPress={() => setSelectMode(true)} activeOpacity={0.7}>
        <View style={styles.notificationContent}>
          {selectMode && (
            <TouchableOpacity style={[styles.checkbox, isSelected && styles.checkboxSelected]} onPress={() => toggleSelectNotification(item._id)}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
          )}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons name={iconConfig.icon} size={24} color={iconConfig.color} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.notificationTime}>{formatDate(item.createdAt || item.date)}</Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
            {!item.isRead && !selectMode && <View style={styles.unreadIndicator} />}
          </View>
          {!selectMode && <Ionicons name="chevron-forward" size={20} color={C.t3} />}
        </View>
      </TouchableOpacity>
    );
    if (selectMode) return <NotificationContent />;
    return (
      <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)} overshootRight={false}>
        <NotificationContent />
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <View style={styles.emptyStateIcon}><Ionicons name="notifications-off-outline" size={80} color="#E0E0E0" /></View>
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>You're all caught up! Check back later for updates.</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color={C.brand} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={C.brandD} barStyle="light-content" />
      
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {selectMode ? (
            <>
              <TouchableOpacity style={styles.headerIconBtn} onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>{selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => { setSelectMode(false); setSelectedNotifications([]); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setFilter('all')}><Ionicons name="filter-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleMarkAllAsRead}><Ionicons name="checkmark-done-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setSelectMode(true)}><Ionicons name="checkmark-circle-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}><Ionicons name="home-outline" size={22} color="#fff" /></TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {!selectMode && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Search notifications..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#999" />
          {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color="#999" /></TouchableOpacity> : null}
        </View>
      )}

      {!selectMode && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
              { id: 'read', label: 'Read', count: notifications.filter(n => n.isRead).length },
            ].map(f => (
              <TouchableOpacity key={f.id} style={[styles.filterTab, filter === f.id && styles.filterTabActive]} onPress={() => setFilter(f.id)}>
                <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
                <View style={[styles.filterBadge, filter === f.id && styles.filterBadgeActive]}><Text style={styles.filterBadgeText}>{f.count}</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectMode && selectedNotifications.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}><Text style={styles.selectionCount}>{selectedNotifications.length} selected</Text></View>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={[styles.selectionButton, styles.markReadButton]} onPress={() => { markNotificationAsRead(selectedNotifications); setNotifications(prev => prev.map(n => selectedNotifications.includes(n._id) ? { ...n, isRead: true } : n)); setSelectedNotifications([]); }}>
              <Ionicons name="checkmark" size={18} color={C.brand} />
              <Text style={[styles.selectionButtonText, { color: C.brand }]}>Mark Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selectionButton, styles.deleteSelectedButton]} onPress={() => { if (selectedNotifications.length === 1) { setNotificationToDelete(selectedNotifications[0]); setDeleteModalVisible(true); } else { Alert.alert('Delete Notifications', `Delete ${selectedNotifications.length} notifications?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: handleBulkDelete }]); } }} disabled={bulkDeleteLoading}>
              {bulkDeleteLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Ionicons name="trash-outline" size={18} color="#FFFFFF" /><Text style={[styles.selectionButtonText, { color: '#FFFFFF' }]}>Delete</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.brand} /><Text style={styles.loadingText}>Loading notifications...</Text></View>
        ) : filteredNotifications.length === 0 ? renderEmptyState() : (
          <FlatList data={filteredNotifications} renderItem={renderNotificationItem} keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} colors={[C.brand]} />} />
        )}
      </Animated.View>

      {/* Delete Modal */}
      <Modal animationType="fade" transparent visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={40} color={C.accent} />
              <Text style={styles.modalTitle}>Delete Notification</Text>
              <Text style={styles.modalMessage}>Are you sure you want to delete this notification?</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}><Text style={[styles.modalButtonText, { color: '#666' }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => { handleDeleteNotification(notificationToDelete); setDeleteModalVisible(false); }}><Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal animationType="slide" transparent visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalHeader}>
              <TouchableOpacity style={styles.detailModalCloseBtn} onPress={() => setDetailModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
              <Text style={styles.detailModalTitle}>Notification Details</Text>
              <View style={{ width: 40 }} />
            </View>
            {selectedNotification && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailModalContent}>
                  <View style={styles.detailIconSection}>
                    <View style={[styles.detailIconContainer, { backgroundColor: getNotificationIcon(selectedNotification.type).bgColor }]}>
                      <Ionicons name={getNotificationIcon(selectedNotification.type).icon} size={48} color={getNotificationIcon(selectedNotification.type).color} />
                    </View>
                    <View style={styles.detailTypeContainer}>
                      <Text style={styles.detailType}>{selectedNotification.type?.charAt(0).toUpperCase() + selectedNotification.type?.slice(1) || 'Notification'}</Text>
                      <View style={[styles.detailStatusBadge, selectedNotification.isRead ? styles.readBadge : styles.unreadBadge]}>
                        <Text style={[styles.detailStatusText, selectedNotification.isRead ? styles.readStatusText : styles.unreadStatusText]}>{selectedNotification.isRead ? 'Read' : 'Unread'}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.detailTitle}>{selectedNotification.title}</Text>
                  <View style={styles.detailDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailDate}>{formatFullDate(selectedNotification.createdAt || selectedNotification.date)}</Text>
                  </View>
                  <View style={styles.detailMessageContainer}>
                    <Text style={styles.detailMessageLabel}>Message</Text>
                    <Text style={styles.detailMessage}>{selectedNotification.message}</Text>
                  </View>
                  {selectedNotification.data && (
                    <View style={styles.detailDataContainer}>
                      <Text style={styles.detailDataLabel}>Additional Information</Text>
                      <View style={styles.detailDataContent}>
                        {Object.entries(selectedNotification.data).map(([key, value]) => (
                          <View key={key} style={styles.detailDataRow}><Text style={styles.detailDataKey}>{key}:</Text><Text style={styles.detailDataValue}>{String(value)}</Text></View>
                        ))}
                      </View>
                    </View>
                  )}
                  {selectedNotification.link && (
                    <TouchableOpacity style={styles.detailActionButton} onPress={() => { setDetailModalVisible(false); navigation.navigate(selectedNotification.link.screen, selectedNotification.link.params); }}>
                      <Text style={styles.detailActionButtonText}>View {selectedNotification.link.screen}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: { backgroundColor: C.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopRightRadius: 12, borderTopLeftRadius: 12 },
  backBtn: { padding: 4 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 4, position: 'relative' },
  selectAllText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', ...Platform.select({ ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 2 } }) },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: C.t1, padding: 0 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginRight: 12, borderRadius: 20, backgroundColor: C.elev, borderWidth: 1, borderColor: 'transparent' },
  filterTabActive: { backgroundColor: C.brand, borderColor: C.brand },
  filterText: { fontSize: 14, fontWeight: '600', color: C.t2 },
  filterTextActive: { color: '#FFFFFF' },
  filterBadge: { marginLeft: 8, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, minWidth: 24, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 12, fontWeight: '700', color: C.t2 },
  selectionBar: { backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectionInfo: { flex: 1 },
  selectionCount: { fontSize: 14, fontWeight: '600', color: C.t1 },
  selectionActions: { flexDirection: 'row' },
  selectionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  markReadButton: { backgroundColor: C.brandBg, borderWidth: 1, borderColor: C.brand },
  deleteSelectedButton: { backgroundColor: C.danger },
  selectionButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: C.t2 },
  listContent: { padding: 16, paddingBottom: 32 },
  notificationCard: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', ...Platform.select({ ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 2 } }) },
  unreadNotification: { borderLeftWidth: 4, borderLeftColor: C.brand, backgroundColor: C.elev },
  selectedNotification: { backgroundColor: C.brandBg, borderColor: C.brand },
  notificationContent: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.t3, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: C.brand, borderColor: C.brand },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1, marginRight: 12 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: C.t1, flex: 1 },
  notificationTime: { fontSize: 12, color: C.t3, marginLeft: 8 },
  notificationMessage: { fontSize: 14, color: C.t2, lineHeight: 20 },
  unreadIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand, position: 'absolute', right: 0, top: 4 },
  swipeActions: { flexDirection: 'row', width: 100, marginBottom: 12 },
  swipeAction: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  swipeButton: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  deleteButton: { backgroundColor: C.danger, borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateIcon: { marginBottom: 24 },
  emptyStateTitle: { fontSize: 24, fontWeight: '700', color: C.t1, marginBottom: 8, textAlign: 'center' },
  emptyStateText: { fontSize: 16, color: C.t2, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brandBg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  refreshButtonText: { color: C.brand, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: C.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, ...Platform.select({ ios: { shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 8 } }) },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.t1, marginTop: 16, marginBottom: 8 },
  modalMessage: { fontSize: 16, color: C.t2, textAlign: 'center', lineHeight: 22 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: C.elev },
  confirmButton: { backgroundColor: C.danger },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  detailModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  detailModalContainer: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '60%', maxHeight: '90%', ...Platform.select({ ios: { shadowColor: C.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 8 } }) },
  detailModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailModalCloseBtn: { padding: 4 },
  detailModalTitle: { fontSize: 18, fontWeight: '700', color: C.t1 },
  detailModalContent: { padding: 20 },
  detailIconSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailTypeContainer: { flex: 1 },
  detailType: { fontSize: 18, fontWeight: '600', color: C.t1, marginBottom: 8 },
  detailStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  readBadge: { backgroundColor: C.successBg },
  unreadBadge: { backgroundColor: C.accentBg },
  detailStatusText: { fontSize: 12, fontWeight: '600' },
  readStatusText: { color: C.success },
  unreadStatusText: { color: C.accent },
  detailTitle: { fontSize: 24, fontWeight: '700', color: C.t1, marginBottom: 12 },
  detailDateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: C.elev, padding: 12, borderRadius: 12 },
  detailDate: { fontSize: 14, color: C.t2, marginLeft: 8, flex: 1 },
  detailMessageContainer: { marginBottom: 20 },
  detailMessageLabel: { fontSize: 16, fontWeight: '600', color: C.t1, marginBottom: 8 },
  detailMessage: { fontSize: 16, color: C.t2, lineHeight: 24, backgroundColor: C.elev, padding: 16, borderRadius: 12 },
  detailDataContainer: { marginBottom: 20 },
  detailDataLabel: { fontSize: 16, fontWeight: '600', color: C.t1, marginBottom: 8 },
  detailDataContent: { backgroundColor: C.elev, padding: 16, borderRadius: 12 },
  detailDataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailDataKey: { fontSize: 14, color: C.t2, fontWeight: '500' },
  detailDataValue: { fontSize: 14, color: C.t1, fontWeight: '600' },
  detailActionButton: { backgroundColor: C.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 20, marginBottom: 30 },
  detailActionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: 8 },
});

export default NotificationScreen;