import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { sendPushToken } from "../apis/userApi";
import { useAuth } from "../context/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function registerAndSendToken() {
      // Only attempt registration if we are on a physical device
      if (!Device.isDevice) {
        console.log("Push notifications skipped: Not a physical device");
        return;
      }

      try {
        const token = await registerForPushNotificationsAsync();
        
        if (isMounted && token) {
          setExpoPushToken(token);
          
          // Only sync with backend if we have both a user and a token
          if (user?._id) {
            await syncTokenWithBackend(user._id, token);
          }
        }
      } catch (error) {
        console.error("Error in registration flow:", error);
      }
    }

    registerAndSendToken();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    return () => {
      isMounted = false;
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user?._id]); // Re-run specifically when the user ID changes

  return { expoPushToken, notification,syncTokenWithBackend };
}

/**
 * CORE FIX: Removed the Alert.alert that told users to go to settings.
 * This ensures the app is "Optional" per Apple Guideline 4.5.4.
 */
async function registerForPushNotificationsAsync() {
  let token;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If they still haven't granted permission, exit SILENTLY.
    // Do NOT show an Alert here.
    if (finalStatus !== "granted") {
      console.log("User declined notification permissions.");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("EAS Project ID missing in app.config.js");
      return null;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenResult.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

/**
 * Helper to sync token to your Heroku backend
 */
async function syncTokenWithBackend(userId, token) {
  try {
    const response = await sendPushToken({ userId, token });
    if (response.status === 200) {
      console.log("Push token synced to backend successfully");
    }
  } catch (error) {
    console.error("Backend sync failed:", error.message);
  }
}

function handleNotificationResponse(response) {
  const data = response.notification.request.content.data;
  console.log("User tapped notification with data:", data);
}