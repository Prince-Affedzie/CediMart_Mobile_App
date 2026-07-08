import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BackendURL = Constants.expoConfig.extra?.EXPO_PUBLIC_BACKEND_URL;
const API = axios.create({
  baseURL: BackendURL,
  withCredentials: true,
  timeout: 30000,
});

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

API.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;