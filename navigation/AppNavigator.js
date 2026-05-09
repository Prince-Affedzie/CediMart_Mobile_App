// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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


// ── Vendor screens ──
import VendorLoginScreen from '../vendorscreens/VendorLogin';
import VendorDashboardScreen from '../vendorscreens/vendordashboard';
import MyProductsScreen from '../vendorscreens/VendorProducts';         // you'll create these
import AddProductScreen from '../vendorscreens/AddProduct';  
import VendorAccountScreen from '../vendorscreens/EditProfile';       // or use existing AddProduct
import VendorProductDetailScreen from '../vendorscreens/ProductDetail'; 
import VendorOrdersScreen from '../vendorscreens/VendorOrders'      // future
import VendorOrderDetailScreen from '../vendorscreens/OrderDetail'
     
// future (reuse edit vendor)
/*import VendorOrdersScreen from '../vendorscreens/VendorOrdersScreen'; */    // placeholder for now

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

// ───────────────────────────────────────────────────
// CUSTOMER AUTH FLOW
// ───────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFFFFF' } }}>
      <AuthStack.Screen name="GuestHome" component={GuestHomeScreen} />
      <AuthStack.Screen name="GuestProductDetail" component={GuestProductDetailScreen} />
      <AuthStack.Screen name="GuestMarketDetail" component={GuestMarketDetailScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="VendorLogin" component={VendorLoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </AuthStack.Navigator>
  );
}

// ───────────────────────────────────────────────────
// VENDOR TAB NAVIGATOR
// ───────────────────────────────────────────────────
function VendorTabNavigator() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'MyProducts':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'Orders':
              iconName = focused ? 'clipboard' : 'clipboard-outline';
              break;
            case 'Settings':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          paddingBottom: 5 + bottom,
          paddingTop: 5,
          height: 60 + bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'Products' }} />
       <Tab.Screen name="Orders" component={ VendorOrdersScreen} options={{ title: 'Orders' }} />
       <Tab.Screen name="Settings" component={VendorAccountScreen} options={{ title: 'Profile' }} />
     
     
    </Tab.Navigator>
  );
}

// ───────────────────────────────────────────────────
// CUSTOMER TAB NAVIGATOR (unchanged)
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
            case 'Home':       iconName = focused ? 'home' : 'home-outline'; break;
            case 'Products':   iconName = focused ? 'basket' : 'basket-outline'; break;
            case 'Cart':       iconName = focused ? 'cart' : 'cart-outline'; break;
            case 'Vendors':    iconName = focused ? 'storefront' : 'storefront-outline'; break;
            case 'Orders':     iconName = focused ? 'receipt':'receipt-outline'; break;
            case 'Profile':    iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          paddingBottom: 5 + bottom,
          paddingTop: 5,
          height: 60 + bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} options={{ title: 'Home' }} />
      {/*<Tab.Screen name="Vendors"  component={MarketsScreen} options={{ title: 'Vendors' }} />*/}
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF3B30', fontSize: 12, minWidth: 20, height: 20 },
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Profile"  component={AccountScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ───────────────────────────────────────────────────
// MAIN STACK – role‑based routing
// ───────────────────────────────────────────────────
function MainStackNavigator() {
  const { user, role, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const init = async () => {
      const first = await checkIfFirstLaunch();
      setIsFirstLaunch(first);
    };
    init();
  }, []);

  if (loading || isFirstLaunch === null) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && <Stack.Screen name="Welcome" component={WelcomeScreen} />}

      {!user ? (
       
         // Not authenticated → show auth flow + a few public screens
        <>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        </>
       
      ) : (
         // Authenticated flow – show vendor or customer tabs
        <>
          {role ==='vendor'? (
            <>
              <Stack.Screen name="VendorMainTabs" component={VendorTabNavigator} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ProductDetail" component={VendorProductDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} options={{ headerShown: false }} />
             
            
              </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              {/* Customer extra screens */}
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Category" component={CategoryScreen} options={{ animation: 'slide_from_right' }} />
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
            </>
          )}
          {/* Both roles still have access to Auth (for re‑login) 
          <Stack.Screen name="Auth" component={AuthNavigator} />
          */}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStackNavigator />
    </NavigationContainer>
  );
}