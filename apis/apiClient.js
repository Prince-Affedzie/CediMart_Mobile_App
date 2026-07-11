import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BackendURL = Constants.expoConfig.extra?.EXPO_PUBLIC_BACKEND_URL;
const API = axios.create({
  baseURL: BackendURL,
  withCredentials: true,
  timeout: 30000,
});

const AUTH_KEYS = ["@cedimart_token", "@cedimart_user", "@cedimart_role"];

const getStoredToken = async () => {
  try {
    const itemStr = await AsyncStorage.getItem("@cedimart_token");
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);

    // Handle the { value, expiry } envelope written by setWithExpiry
    if (item && typeof item === "object" && "value" in item) {
      if (item.expiry && Date.now() > item.expiry) {
        await AsyncStorage.removeItem("@cedimart_token");
        return null;
      }
      return item.value;
    }

    // Fallback in case a raw string was ever stored
    return itemStr;
  } catch {
    return null;
  }
};

// ── Optional hook so AuthContext (or navigation) can react immediately ──────
// Call API.registerSessionExpiredHandler(fn) once, e.g. inside AuthProvider,
// so a 401 can flip isAuthenticated to false and redirect to login right away
// instead of the user sitting on a broken screen until they force-reopen the app.
let onSessionExpired = null;
API.registerSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

API.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Session is no longer valid (e.g. secret rotation, real expiry, tampering).
      // Clear the stale local session so the user isn't stuck retrying with a
      // token that will never verify again.
      await AsyncStorage.multiRemove(AUTH_KEYS);
      if (onSessionExpired) onSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default API;