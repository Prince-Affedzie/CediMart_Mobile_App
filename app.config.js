import 'dotenv/config';

export default {
  expo: {
    name: "CediMart",
    slug: "freshyfoodfactory-mobile",
    version: "4.0.0",
    orientation: "portrait",
    icon: "./assets/cedimart_logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/cedimart_logo.png",
      resizeMode: "contain",
      backgroundColor: "#4CAF50"
    },
    scheme: "cedimart", // Add this at the top level too
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.freshyfood.factory.ios",
      associatedDomains: [
        "applinks:cedimart.app",
        "applinks:www.cedimart.app"
      ],
      googleServicesFile: "./GoogleService-Info.plist",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsArbitraryLoadsInWebContent: true,
          NSPhotoLibraryUsageDescription:
            "Cedimart uses your photo library to let you upload profile photos and product images.",
          NSCameraUsageDescription:
            "Cedimart uses your camera to let you take profile photos and product images.",
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
        },
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "cedimart",
              "com.googleusercontent.apps.34872065423-m8inhhq7qk25303taoitpgso8bcv9q95"
            ]
          }
        ]
      },
    },

    android: {
      package: "com.freshyfood.factory",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "cedimart.app",
              pathPrefix: "/product"
            },
            {
              scheme: "https",
              host: "cedimart.app",
              pathPrefix: "/vendor"
            },
            {
              scheme: "https",
              host: "cedimart.app",
              pathPrefix: "/tag"
            },
            {
              scheme: "https",
              host: "www.cedimart.app",
              pathPrefix: "/product"
            },
            {
              scheme: "https",
              host: "www.cedimart.app",
              pathPrefix: "/vendor"
            },
            {
              scheme: "https",
              host: "www.cedimart.app",
              pathPrefix: "/tag"
            },
            {
              scheme: "cedimart",
              host: "*"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/cedimart_logo.png",
        backgroundColor: "#ffffff"
      },
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_EXTERNAL_STORAGE"
      ],
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