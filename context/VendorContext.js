// src/context/VendorContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMyOrders, getMyProducts, getMyProfileDetails } from '../apis/vendorApi';

const VendorContext = createContext(null);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

export const VendorProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const isVendor = user?.role === 'vendor';

  // ── State ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [lastFetched, setLastFetched] = useState(null);

  // ── Fetch All Vendor Data ──────────────────────────────────────────────────
  const fetchAllVendorData = useCallback(async (showLoader = true) => {
    if (!isVendor) {
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [profileRes, productsRes, ordersRes] = await Promise.all([
        getMyProfileDetails(),
        getMyProducts(),
        getMyOrders(),
      ]);

      // Process profile
      if (profileRes?.status === 200 || profileRes?.data?.success  ) {
        setProfile(profileRes.data.data || profileRes.data);
      }

      // Process products
      if (productsRes?.status === 200 || productsRes?.data?.success ) {
        const productsData =productsRes.data?.data || 
                            productsRes.data || 
                            productsRes.data?.data.products || 
                            [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      }

      // Process orders
      if (ordersRes?.data?.success || ordersRes?.status === 200) {
        const ordersData = ordersRes.data.data || 
                          ordersRes.data || 
                          [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }

      setLastFetched(new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch vendor data:', err);
      setError(err?.response?.data?.message || 'Failed to load vendor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isVendor]);

  // ── Fetch on mount and when user becomes a vendor ──────────────────────────
  useEffect(() => {
    if (isVendor) {
      fetchAllVendorData();
    } else {
      // Clear vendor data when not a vendor
      setProfile(null);
      setProducts([]);
      setOrders([]);
      setLoading(false);
    }
  }, [isVendor, fetchAllVendorData]);

  // ── Refresh (pull-to-refresh) ──────────────────────────────────────────────
  const refreshVendorData = useCallback(async () => {
    setRefreshing(true);
    await fetchAllVendorData(false);
  }, [fetchAllVendorData]);

  // ── Individual Refetch Functions (for after mutations) ─────────────────────
  const refetchProfile = useCallback(async () => {
    try {
      const res = await getMyProfileDetails();
      if (res?.status === 200 || res?.data?.success  ) {
        setProfile(res.data.data || res.data);
      }
    } catch (err) {
      console.error('Failed to refetch profile:', err);
    }
  }, []);

  const refetchProducts = useCallback(async () => {
    try {
      const res = await getMyProducts();
      if (res?.status === 200 || res?.data?.success ) {
        const data =  res.data.data || res.data || res.data.data?.products || [];
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to refetch products:', err);
    }
  }, []);

  const refetchOrders = useCallback(async () => {
    try {
      const res = await getMyOrders();
      if (res?.data?.success || res?.status === 200) {
        const data = res.data.data?.orders || res.data.data || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to refetch orders:', err);
    }
  }, []);

  // ── Optimistic Updates (for immediate UI feedback) ─────────────────────────
  const addProductLocally = useCallback((newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const updateProductLocally = useCallback((productId, updates) => {
    setProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, ...updates } : p
    ));
  }, []);

  const removeProductLocally = useCallback((productId) => {
    setProducts(prev => prev.filter(p => p._id !== productId));
  }, []);

  const addOrderLocally = useCallback((newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderLocally = useCallback((orderId, updates) => {
    setOrders(prev => prev.map(o => 
      o._id === orderId ? { ...o, ...updates } : o
    ));
  }, []);

  // ── Computed Values ────────────────────────────────────────────────────────
  const activeProducts = products.filter(p => p.isAvailable !== false);
  const soldOutProducts = products.filter(p => p.isAvailable === false);
  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // ── Value ──────────────────────────────────────────────────────────────────
  const value = {
    // Data
    profile,
    products,
    orders,
    
    // Loading states
    loading,
    refreshing,
    error,
    lastFetched,
    
    // Actions
    refreshVendorData,
    refetchProfile,
    refetchProducts,
    refetchOrders,
    fetchAllVendorData,
    
    // Optimistic updates
    addProductLocally,
    updateProductLocally,
    removeProductLocally,
    addOrderLocally,
    updateOrderLocally,
    
    // Computed
    activeProducts,
    soldOutProducts,
    activeOrders,
    completedOrders,
    totalRevenue,
    pendingOrdersCount,
    
    // Flags
    isVendor,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};

export default VendorContext;