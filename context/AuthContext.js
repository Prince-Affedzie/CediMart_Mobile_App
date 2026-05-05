// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';
import { updateProfile,deleteProfile,logout,loginByGoogle,signUpByGoogle ,apple_signUp,vendorLogin} from '../apis/userApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role,setRole] = useState(null)
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@freshyfood_token');
      const storedUser = await AsyncStorage.getItem('@freshyfood_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  
//apple_login

const signUpByApple = async (data) => {
  try {
    
    console.log(data)
    const response = await apple_signUp(data);
    console.log(response.data)
    
    if (response.status === 200 || response.success) {
      await AsyncStorage.setItem('@freshyfood_token', response.data.token);
      await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
      setToken(response.data.token);
      setUser(response.data.user);
      setRole(response.data.role);
      setIsAuthenticated(true);
      
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
      "An error occured. Please try again later";;
    return { success: false, error: errorMessage };
  } 
}


const google_login = async (data) => {
    try {
      
      const response = await loginByGoogle(data);
      
      if (response.status === 200) {
        console.log(response.data)
        await AsyncStorage.setItem('@freshyfood_token', response.data.token);
        await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
        setToken(response.data.token);
        setUser(response.data.user);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
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


  const google_signUp = async (data) => {
    try {
      
      console.log(data)
      const response = await signUpByGoogle(data);
      console.log(response.data)
      
      if (response.status ===200) {
        await AsyncStorage.setItem('@freshyfood_token', response.data.token);
        await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
        setToken(response.data.token);
        setUser(response.data.user);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "An account with this email already exists. Please login instead.";;
      return { success: false, error: errorMessage };
    } 
  };


  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials);
      console.log(response.data)
      
      if (response.success) {
        await AsyncStorage.setItem('@freshyfood_token', response.data.token);
        await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
        setToken(response.data.token);
        setUser(response.data.user);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
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
    };;
    } 
  };


  const vendor_login = async (credentials) => {
    try {
      const response = await vendorLogin(credentials);
      
      if (response.status === 200) {
        
        await AsyncStorage.setItem('@freshyfood_token', response.data.token);
        await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
        setToken(response.data.token);
        setUser(response.data.user);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
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
    };;
    } 
  };

  const signUp = async (userData) => {
    try {
      
      const response = await AuthService.signUp(userData);
      
      if (response.success) {
        await AsyncStorage.setItem('@freshyfood_token', response.token);
        await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@freshyfood_role', JSON.stringify(response.data.role));
        setToken(response.token);
        setUser(response.user);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        "An account with this email already exists. Please login instead.";;
      return { success: false, error: errorMessage };
    } 
  };

  const logoutUser = async () => {
    try {
      const response = await logout()
      if (response.status === 200){
        await AsyncStorage.removeItem('@freshyfood_token');
        await AsyncStorage.removeItem('@freshyfood_user');
        await AsyncStorage.removeItem('@freshyfood_role');
      
      setToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      }
      return response;
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      await AsyncStorage.setItem('@freshyfood_user', JSON.stringify(updatedUser));
      const res = await  updateProfile(updatedUser)
      setUser(updatedUser);
      return res;
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

 const deleteAccount = async () => {
  try {
    const res = await deleteProfile();
    
    if (res?.status === 200) {
      await AsyncStorage.removeItem('@freshyfood_token');
      await AsyncStorage.removeItem('@freshyfood_user');
      setToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    }
    
    return res;
  } catch (error) {
    console.error('Delete account error:', error);
    throw error; // or return error object
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