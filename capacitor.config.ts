import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baselineapp.app',
  appName: 'BaselineApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    StatusBar: {
      // iOS: Light content (white icons)
      // Android: Light style (dark icons on light background)
      style: 'LIGHT',
      // Edge-to-edge: status bar overlays WebView on both platforms
      // Safe area handled via CSS env(safe-area-inset-top)
      overlaysWebView: true,
      backgroundColor: '#00000000',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
