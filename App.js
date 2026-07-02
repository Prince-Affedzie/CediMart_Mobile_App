// App.js
import React, {useEffect,useContext} from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import Constants from "expo-constants";

import AppNavigator from './navigation/AppNavigator';
import { SafeAreaProvider,SafeAreaView } from 'react-native-safe-area-context';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import {ChatProvider} from './context/ChatContext';
import { PaystackProvider } from "react-native-paystack-webview";
import * as Updates from 'expo-updates';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import usePushNotifications from './hooks/usePushNotification'
import { NotificationProvider } from './context/NotificationContext';
const PayStack_Public_Key = Constants.expoConfig.extra?.EXPO_PayStack_publicKey;


export default function App() {

   useEffect(()=>{
        GoogleSignin.configure({
         webClientId:'34872065423-88pioj4h26bguflctfpub95mt0830an6.apps.googleusercontent.com'
        })
    },[])

  function PushNotificationInitializer() {
    usePushNotifications();
    return null;
  }
  

  useEffect(() => {
      async function checkUpdates() {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (e) {
          console.log("Update error:", e);
        }
      }
  
      checkUpdates();
    }, []);

  
    return (
    
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#2E7D32" translucent={true} />
        <AuthProvider>
          <NotificationProvider>
           <ChatProvider>

          <CartProvider>
       
        
        <PaystackProvider debug 
         publicKey={PayStack_Public_Key}
         currency="GHS"
         defaultChannels={['card','mobile_money','bank_transfer']}
          containerStyle={{ 
          flex: 1, 
          height: '100%', 
          width: '100%', 
          zIndex: 9999, 
           marginTop: 20 // Pushes it down slightly to force a repaint
          }}
         > 
         <PushNotificationInitializer/>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#2E7D32' }} edges={['top']}>
        <AppNavigator />
        </SafeAreaView>
        </PaystackProvider>
        </CartProvider>
         </ChatProvider>
        </NotificationProvider>
        </AuthProvider>
        
      </SafeAreaProvider>
    
  );
}