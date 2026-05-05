import 'dotenv/config';

export default {
  expo: {
    name: "CediMart",
    slug: "freshyfoodfactory-mobile",
    version: "3.0.0",
    orientation: "portrait",
    icon: "./assets/cedimart_logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/cedimart_logo.png",
      resizeMode: "contain",
      backgroundColor: "#4CAF50"
    },
    // ... rest of your config
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.freshyfood.factory.ios",
  googleServicesFile: "./GoogleService-Info.plist",
  usesAppleSignIn: true,
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true, // Keep these as global backups
      NSAllowsArbitraryLoadsInWebContent: true,
      NSExceptionDomains: {
        "paystack.com": {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSAllowsArbitraryLoads: true,
        },
        "paystack.co": {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSAllowsArbitraryLoads: true,
        },
        "checkout.paystack.com": {
          NSIncludesSubdomains: true,
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSAllowsArbitraryLoads: true,
        }
      }
    }
  },
},

    android: {
      package: "com.freshyfood.factory",
      adaptiveIcon: {
        foregroundImage: "./assets/cedimart_logo.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/cedimart_logo.png"
    },
    updates: {
      url: "https://u.expo.dev/91d657de-bd96-4749-aa49-34001b7b4191"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
      EXPO_PayStack_publicKey: process.env.EXPO_PayStack_publicKey,
      eas: {
        projectId: "91d657de-bd96-4749-aa49-34001b7b4191"
      }
    },
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.34872065423-m8inhhq7qk25303taoitpgso8bcv9q95"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35
          }
        }
      ],
      "expo-font",
      "expo-notifications",
      "expo-asset",
      "expo-web-browser"
    ],
    owner: "affedziep44"
  }
};