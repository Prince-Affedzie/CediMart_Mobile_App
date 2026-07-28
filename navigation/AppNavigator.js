// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Customer screens ──
import HomeScreen from '../screens/HomeScreen';
import GuestHomeScreen from '../screens/GuestHomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import OrderScreen from '../screens/CheckOutScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CategoryScreen from '../screens/CategoryScreen';
import AccountScreen from '../screens/AccountScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationScreen from '../screens/NotificationsScreen';
import ForgotPasswordScreen from '../screens/ForgetPasswordScreen';
import TermsOfServiceScreen from '../screens/TermsofServiceScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { checkIfFirstLaunch } from '../hooks/checkIfFirstLaunch';
import PaymentScreen from '../screens/PaymentScreen';
import MarketDetailScreen from '../screens/MarketDetailScreen';
import VendorDetailScreen from '../screens/VendorDetailScreen';
import MarketsScreen from '../screens/MarketsScreen';
import GuestProductDetailScreen from '../screens/GuestProductDetail'
import GuestMarketDetailScreen from '../screens/GuestMarketDetail';
import CampusProductsScreen from '../screens/CampusProductsScreen'
import TagProductsScreen from '../screens/TagProductsScreen'
import ChatScreen from '../screens/ChatScreen'
import InboxScreen from '../screens/InboxScreen'
import AIShoppingScreen from '../screens/AIShoppingScreen'
import EarningsScreen from '../screens/EarningsScreen'

// ── Vendor screens ──
import VendorSignUpScreen from '../vendorscreens/VendorSignUp'
import VendorLoginScreen from '../vendorscreens/VendorLogin';
import VendorDashboardScreen from '../vendorscreens/vendordashboard';
import MyProductsScreen from '../vendorscreens/VendorProducts';
import AddProductScreen from '../vendorscreens/AddProduct';  
import VendorAccountScreen from '../vendorscreens/EditProfile';
import VendorProductDetailScreen from '../vendorscreens/ProductDetail'; 
import VendorOrdersScreen from '../vendorscreens/VendorOrders'
import VendorOrderDetailScreen from '../vendorscreens/OrderDetail'
import UpdateProductScreen from '../vendorscreens/EditProduct'
import VendorSupportScreen from '../vendorscreens/VendorSupport'
import VendorReferralStatsScreen from '../vendorscreens/Vendorreferralstatsscreen'

import * as Linking from 'expo-linking';
import { DEEP_LINK_PREFIXES, DEEP_LINK_CONFIG } from '../config/deepLinks';

const linking = {
  prefixes: DEEP_LINK_PREFIXES,
  config: DEEP_LINK_CONFIG,
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return url;
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => { listener(url); });
    return () => { subscription?.remove(); };
  },
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

// ─── Tab Bar Color Constants ────────────────────────────────────────────────
const TAB_ACTIVE_COLOR   = '#0D9488';  // Teal
const TAB_INACTIVE_COLOR = '#94A3B8';  // Slate-400
const TAB_BADGE_COLOR    = '#DC2626';  // Red for badges
const TAB_BAR_BORDER     = '#E2E8F0';  // Light slate border

// ───────────────────────────────────────────────────
// CUSTOMER AUTH FLOW
// ───────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFFFFF' } }}>
      <AuthStack.Screen name="GuestHome" component={GuestHomeScreen} />
      <AuthStack.Screen name="GuestProductDetail" component={GuestProductDetailScreen} />
      <AuthStack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <AuthStack.Screen name="GuestMarketDetail" component={GuestMarketDetailScreen} />
      <AuthStack.Screen name="Category" component={CategoryScreen} options={{ animation: 'slide_from_right' }} />
      <AuthStack.Screen name="Campus" component={CampusProductsScreen} options={{ animation: 'slide_from_right' }} />
      <AuthStack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="TagProducts" component={TagProductsScreen} options={{ animation: 'slide_from_right' }} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="VendorLogin" component={VendorLoginScreen} />
      <AuthStack.Screen name="VendorSignUp" component={VendorSignUpScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <AuthStack.Screen name="CediAi" component={AIShoppingScreen} />
    </AuthStack.Navigator>
  );
}

// ───────────────────────────────────────────────────
// VENDOR TAB NAVIGATOR
// ───────────────────────────────────────────────────
function VendorTabNavigator() {
  const { bottom } = useSafeAreaInsets();
  const { totalUnread } = useChat();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':   iconName = focused ? 'grid' : 'grid-outline'; break;
            case 'MyProducts':  iconName = focused ? 'cube' : 'cube-outline'; break;
            case 'Orders':      iconName = focused ? 'clipboard' : 'clipboard-outline'; break;
            case 'Settings':    iconName = focused ? 'person-circle' : 'person-circle-outline'; break;
            case 'Inbox':       iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: TAB_ACTIVE_COLOR,
        tabBarInactiveTintColor: TAB_INACTIVE_COLOR,
        tabBarStyle: {
          paddingBottom: 5 + bottom,
          paddingTop: 5,
          height: 60 + bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: TAB_BAR_BORDER,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard"  component={VendorDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="Orders"     component={VendorOrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Inbox"      component={InboxScreen} options={{ title: 'Inbox', tabBarBadge: totalUnread > 0 ? totalUnread : null, tabBarBadgeStyle: { backgroundColor: TAB_BADGE_COLOR, fontSize: 12, minWidth: 20, height: 20 } }} />
      <Tab.Screen name="Settings"   component={VendorAccountScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ───────────────────────────────────────────────────
// CUSTOMER TAB NAVIGATOR
// ───────────────────────────────────────────────────
function MainTabNavigator() {
  const { bottom } = useSafeAreaInsets();
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':     iconName = focused ? 'home' : 'home-outline'; break;
            case 'Products': iconName = focused ? 'basket' : 'basket-outline'; break;
            case 'Cart':     iconName = focused ? 'cart' : 'cart-outline'; break;
            case 'CediAi':   iconName = focused ? 'sparkles' : 'sparkles-outline'; break;
            case 'Profile':  iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: TAB_ACTIVE_COLOR,
        tabBarInactiveTintColor: TAB_INACTIVE_COLOR,
        tabBarStyle: {
          paddingBottom: 5 + bottom,
          paddingTop: 5,
          height: 60 + bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: TAB_BAR_BORDER,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="CediAi"   component={AIShoppingScreen} options={{ title: 'CediAi' }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: TAB_BADGE_COLOR, fontSize: 12, minWidth: 20, height: 20 },
        }}
      />
      <Tab.Screen name="Profile"  component={AccountScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ───────────────────────────────────────────────────
// MAIN STACK – role‑based routing
// ───────────────────────────────────────────────────
function MainStackNavigator() {
  const { user, role, loading } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          {user.role === 'vendor' ? (
            <>
              <Stack.Screen name="VendorMainTabs" component={VendorTabNavigator} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ProductDetail" component={VendorProductDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="UpdateProduct" component={UpdateProductScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Notification" component={NotificationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VendorSupport" component={VendorSupportScreen} options={{ headerShown: false }} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ReferralStats" component={VendorReferralStatsScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Category" component={CategoryScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Campus" component={CampusProductsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="TagProducts" component={TagProductsScreen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Notification" component={NotificationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
              <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MarketDetail" component={MarketDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Inbox" component={InboxScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: false }} />
            </>
          )}
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking} fallback={null}>
      <MainStackNavigator />
    </NavigationContainer>
  );
}