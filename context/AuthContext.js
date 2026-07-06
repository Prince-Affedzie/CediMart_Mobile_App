// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';
import { updateProfile, deleteProfile, logout, loginByGoogle, signUpByGoogle, apple_signUp, vendorLogin } from '../apis/userApi';

const AuthContext = createContext();

// ─── Storage Helpers with Expiration ─────────────────────────────────────────

/**
 * Store data with expiration time
 * @param {string} key - Storage key
 * @param {any} value - Data to store (objects will be stringified)
 * @param {number} expiresInHours - Expiration in hours (default: 72 = 3 days)
 */
const setWithExpiry = async (key, value, expiresInHours = 120) => {
  try {
    const item = {
      value,
      expiry: Date.now() + expiresInHours * 60 * 60 * 1000,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
  }
};

/**
 * Retrieve data and check expiration
 * @param {string} key - Storage key
 * @returns {any|null} - Stored value or null if expired/not found
 */
const getWithExpiry = async (key) => {
  try {
    const itemStr = await AsyncStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = Date.now();

    // Check if expired
    if (now > item.expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
};

/**
 * Remove multiple keys at once
 */
const removeMultiple = async (keys) => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error removing keys:', error);
  }
};

// ─── Expiration Durations ────────────────────────────────────────────────────
const TOKEN_EXPIRY_HOURS = 120;      // Auth token: 3 days
const USER_EXPIRY_HOURS = 120;      // User data: 7 days
const ROLE_EXPIRY_HOURS = 120;       // Role data: 3 days (syncs with token)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ── Check stored auth on app start ────────────────────────────────────────

  const checkAuthStatus = async () => {
    try {
      const storedToken = await getWithExpiry('@cedimart_token');
      const storedUser = await getWithExpiry('@cedimart_user');
      const storedRole = await getWithExpiry('@cedimart_role');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser);
        setRole(storedRole || null);
        setIsAuthenticated(true);
      } else {
        // Clean up any remaining partial data
        await removeMultiple([
          '@cedimart_token',
          '@cedimart_user',
          '@cedimart_role',
        ]);
        setToken(null);
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Helper: Store auth data after successful login/signup ─────────────────

  const storeAuthData = async (tokenData, userData, roleData) => {
    await setWithExpiry('@cedimart_token', tokenData, TOKEN_EXPIRY_HOURS);
    await setWithExpiry('@cedimart_user', typeof userData === 'string' ? userData : JSON.stringify(userData), USER_EXPIRY_HOURS);
    await setWithExpiry('@cedimart_role', roleData || null, ROLE_EXPIRY_HOURS);
    setToken(tokenData);
    setUser(userData);
    setRole(roleData || null);
    setIsAuthenticated(true);
  };

  // ── Apple Sign-In ──────────────────────────────────────────────────────────

  const signUpByApple = async (data) => {
    try {
      console.log(data);
      const response = await apple_signUp(data);
      console.log(response.data);

      if (response.status === 200 || response.success) {
        await storeAuthData(response.data.token, response.data.user, response.data.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "An error occurred. Please try again later.";
      return { success: false, error: errorMessage };
    }
  };

  // ── Google Login ───────────────────────────────────────────────────────────

  const google_login = async (data) => {
    try {
      const response = await loginByGoogle(data);

      if (response.status === 200) {
        console.log(response.data);
        await storeAuthData(response.data.token, response.data.user, response.data.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Google login error:', err);
      return {
        success: false,
        status: err.response?.status || (err.request ? 0 : 500),
        message:
          err.response?.data?.message ||
          (err.response?.status === 404
            ? 'User not found. Please check your email or sign up.'
            : err.response?.status === 401
            ? 'Invalid credentials. Please try again.'
            : err.request
            ? 'Network error. Please check your internet connection.'
            : 'An unexpected error occurred. Please try again.'),
      };
    }
  };

  // ── Google Sign-Up ─────────────────────────────────────────────────────────

  const google_signUp = async (data) => {
    try {
      console.log(data);
      const response = await signUpByGoogle(data);
      console.log(response.data);

      if (response.status === 200) {
        await storeAuthData(response.data.token, response.data.user, response.data.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "An account with this email already exists. Please login instead.";
      return { success: false, error: errorMessage };
    }
  };

  // ── Regular Login ──────────────────────────────────────────────────────────

  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials);
      console.log(response.data);

      if (response.success) {
        await storeAuthData(response.data.token, response.data.user, response.data.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        status: err.response?.status || (err.request ? 0 : 500),
        message:
          err.response?.data?.message ||
          (err.response?.status === 404
            ? 'User not found. Please check your email or sign up.'
            : err.response?.status === 401
            ? 'Invalid email or password. Please try again.'
            : err.request
            ? 'Network error. Please check your internet connection.'
            : 'An unexpected error occurred. Please try again.'),
      };
    }
  };

  // ── Vendor Login ───────────────────────────────────────────────────────────

  const vendor_login = async (credentials) => {
    try {
      const response = await vendorLogin(credentials);

      if (response.status === 200) {
        await storeAuthData(response.data.token, response.data.user, response.data.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Vendor login error:', err);
      return {
        success: false,
        status: err.response?.status || (err.request ? 0 : 500),
        message:
          err.response?.data?.message ||
          (err.response?.status === 404
            ? 'Vendor account not found. Please sign up as a vendor first.'
            : err.response?.status === 401
            ? 'Invalid credentials. Please try again.'
            : err.request
            ? 'Network error. Please check your internet connection.'
            : 'An unexpected error occurred. Please try again.'),
      };
    }
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────

  const signUp = async (userData) => {
    try {
      const response = await AuthService.signUp(userData);

      if (response.success) {
        await storeAuthData(response.token, response.user, response.data?.role);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "An account with this email already exists. Please login instead.";
      return { success: false, error: errorMessage };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logoutUser = async () => {
    try {
      const response = await logout();
      if (response.status === 200) {
        await removeMultiple([
          '@cedimart_token',
          '@cedimart_user',
          '@cedimart_role',
        ]);
        setToken(null);
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear even if API call fails
      await removeMultiple([
        '@cedimart_token',
        '@cedimart_user',
        '@cedimart_role',
      ]);
      setToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    }
  };

  // ── Update User ────────────────────────────────────────────────────────────

  const updateUser = async (updatedUser) => {
    try {
      await setWithExpiry('@cedimart_user', JSON.stringify(updatedUser), USER_EXPIRY_HOURS);
      const res = await updateProfile(updatedUser);
      setUser(updatedUser);
      return res;
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // ── Delete Account ─────────────────────────────────────────────────────────

  const deleteAccount = async () => {
    try {
      const res = await deleteProfile();

      if (res?.status === 200) {
        await removeMultiple([
          '@cedimart_token',
          '@cedimart_user',
          '@cedimart_role',
        ]);
        setToken(null);
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }

      return res;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated,
        login,
        vendor_login,
        signUp,
        google_signUp,
        google_login,
        signUpByApple,
        logoutUser,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};