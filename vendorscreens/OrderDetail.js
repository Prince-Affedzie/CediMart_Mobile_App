// src/vendorscreens/VendorOrderDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  pending: { bg: '#FFF3E0', text: '#E65100', icon: 'time-outline' },
  confirmed: { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline' },
  preparing: { bg: '#E3F2FD', text: '#1565C0', icon: 'restaurant-outline' },
  ready: { bg: '#F3E5F5', text: '#6A1B9A', icon: 'cube-outline' },
  delivered: { bg: '#E0F2F1', text: '#00695C', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle-outline' },
};

const VendorOrderDetailScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const statusStyle = STATUS_COLORS[order?.vendorStatus] || STATUS_COLORS.pending;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getAddressString = (addr) => {
    if (!addr) return '';
    const parts = [addr.address, addr.nearestLandmark, addr.city, addr.region]
      .filter(Boolean);
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order number & date */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}>
              <Ionicons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.statusTextLarge, { color: statusStyle.text }]}>
                {order.vendorStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoCard}>
            <Ionicons name="person-circle-outline" size={40} color="#2E7D32" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>
                {order.customer?.firstName} {order.customer?.lastName}
              </Text>
              {order.customer?.phone && (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={14} color="#757575" />
                  <Text style={styles.phoneText}>{order.customer.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={22} color="#2E7D32" style={{ marginRight: 10 }} />
            <Text style={styles.addressDetailText}>
              {getAddressString(order.shippingAddress)}
            </Text>
          </View>
          {order.shippingAddress?.phone && (
            <View style={styles.addressPhoneRow}>
              <Ionicons name="call-outline" size={14} color="#757575" style={{ marginRight: 4 }} />
              <Text style={styles.addressPhoneText}>{order.shippingAddress.phone}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Items ({order.items?.length || 0})
          </Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <View key={item._id || index} style={styles.itemCard}>
                {/* Product image placeholder */}
                <View style={styles.itemImageContainer}>
                  {item.product?.image ? (
                    <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="image-outline" size={24} color="#BDBDBD" />
                    </View>
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product?.name || 'Product name'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.quantity} × GH₵ {item.price?.toFixed(2)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    GH₵ {(item.quantity * item.price).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items available.</Text>
          )}
        </View>

        {/* Delivery Schedule */}
        {/* Delivery Schedule */}
{order.deliverySchedule && (order.deliverySchedule.preferredDay || order.deliverySchedule.preferredTime) && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Delivery Schedule</Text>
    <View style={styles.infoCard}>
      <Ionicons name="calendar-outline" size={20} color="#2E7D32" style={{ marginRight: 10 }} />
      <View>
        {order.deliverySchedule.preferredDay && (
          <Text style={styles.scheduleLine}>
            <Text style={styles.scheduleLabel}>Day: </Text>
            {order.deliverySchedule.preferredDay.charAt(0).toUpperCase() + order.deliverySchedule.preferredDay.slice(1)}
          </Text>
        )}
        {order.deliverySchedule.preferredTime && (
          <Text style={styles.scheduleLine}>
            <Text style={styles.scheduleLabel}>Time: </Text>
            {order.deliverySchedule.preferredTime.charAt(0).toUpperCase() + order.deliverySchedule.preferredTime.slice(1)}
          </Text>
        )}
      </View>
    </View>
  </View>
)}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 },

  // Order summary card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: { fontSize: 18, fontWeight: '800', color: '#212121', letterSpacing: 0.5 },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusTextLarge: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  dateText: { fontSize: 13, color: '#757575' },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 10, marginLeft: 4 },

  // Info card (white rounded box)
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  customerName: { fontSize: 16, fontWeight: '600', color: '#212121' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  phoneText: { fontSize: 14, color: '#757575' },

  addressDetailText: { flex: 1, fontSize: 14, color: '#424242', lineHeight: 20 },
  addressPhoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingLeft: 32 },
  addressPhoneText: { fontSize: 14, color: '#757575' },

  // Item list
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#757575', marginBottom: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1B5E20' },
  noItemsText: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', paddingVertical: 20 },

  deliveryText: { fontSize: 14, color: '#212121', fontWeight: '500' },
  scheduleLine: {
  fontSize: 14,
  color: '#424242',
  marginBottom: 2,
},
scheduleLabel: {
  fontWeight: '600',
  color: '#212121',
},
});

export default VendorOrderDetailScreen;