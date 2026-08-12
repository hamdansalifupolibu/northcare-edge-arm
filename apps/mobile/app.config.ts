import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo configuration for NorthCare AI (Stage 4 navigation shell).
 * Android package identifier is PROVISIONAL — review before public release.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NorthCare AI',
  slug: 'northcare-ai',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/app-icon/northcare-app-icon-preview-light.png',
  backgroundColor: '#FFFFFF',
  scheme: 'northcare',
  userInterfaceStyle: 'light',
  platforms: ['android', 'ios'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.northcareai.app',
  },
  android: {
    package: 'com.northcareai.app',
    versionCode: 5,
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      // Use the white-background composite — NOT northcare-adaptive-icon-foreground.png
      // (that file is the teal-blob logo layer and causes a teal launcher on device).
      foregroundImage: './assets/app-icon/northcare-app-icon-preview-light.png',
      backgroundColor: '#FFFFFF',
    },
  },
  web: {
    favicon: './assets/app-icon/northcare-app-icon-preview-light.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    // Standard Expo SQLite (no SQLCipher). Encryption remains unevaluated — see LOCAL_DATABASE_SECURITY.md.
    'expo-sqlite',
    // expo-print / expo-sharing autolink on native rebuild (no config plugin required for outbound PDF/share).
    // Older binaries without ExpoPrint hide PDF actions; text Share caregiver slip remains available.
    [
      'expo-notifications',
      {
        icon: './assets/notifications/northcare-notification-icon-monochrome.png',
        defaultChannel: 'northcare-follow-up-reminders',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow NorthCare AI to use the camera to scan referral passport QR codes.',
        recordAudioAndroid: false,
        barcodeScannerEnabled: true,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/brand/northcare-logo-symbol-primary.png',
        imageWidth: 160,
        resizeMode: 'contain',
        android: {
          backgroundColor: '#FFFFFF',
          image: './assets/brand/northcare-logo-symbol-primary.png',
          imageWidth: 160,
          resizeMode: 'contain',
        },
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'Allow NorthCare AI to record short private voice notes on this device.',
        enableBackgroundRecording: false,
        enableBackgroundPlayback: false,
        recordAudioAndroid: true,
      },
    ],
    './plugins/withBundledOfflineAiModel.js',
    [
      'llama.rn',
      {
        enableEntitlements: true,
        entitlementsProfile: 'production',
        forceCxx20: true,
        // Stage 1: CPU inference only — do not depend on OpenCL/Hexagon for completion.
        enableOpenCLAndHexagon: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    provisionalAndroidPackage: true,
    // Temporary development gate — never enable for production builds.
    devAuthBypass: process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true',
    devAlwaysShowOnboarding: process.env.EXPO_PUBLIC_DEV_ALWAYS_SHOW_ONBOARDING !== 'false',
    demoAutoSeed: process.env.EXPO_PUBLIC_DEMO_AUTO_SEED !== 'false',
    bundledOfflineAi: process.env.EXPO_PUBLIC_BUNDLED_OFFLINE_AI !== 'false',
  },
});
