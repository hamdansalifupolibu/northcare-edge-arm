jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(() => {
        const cleanup = effect();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [effect]);
    },
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: () => false,
    }),
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    useSegments: () => [],
    Link: ({ children }) => children,
    Stack: { Screen: () => null },
    Tabs: { Screen: () => null },
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    },
  };
});

jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  supportedAuthenticationTypesAsync: jest.fn(async () => []),
  authenticateAsync: jest.fn(async () => ({ success: false, error: 'not_available' })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
}));

jest.mock('expo-crypto', () => {
  let counter = 0;
  return {
    getRandomBytes: jest.fn((size) => {
      counter += 1;
      return Uint8Array.from({ length: size }, (_, i) => (counter + i) % 256);
    }),
    getRandomBytesAsync: jest.fn(async (size) => {
      counter += 1;
      return Uint8Array.from({ length: size }, (_, i) => (counter + i) % 256);
    }),
    randomUUID: jest.fn(() => {
      counter += 1;
      const hex = counter.toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${hex.slice(-12)}`;
    }),
  };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    throw new Error('expo-sqlite is not available in Jest; use NodeSqliteDriver in tests');
  }),
  deleteDatabaseAsync: jest.fn(async () => undefined),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Circle: Mock,
    G: Mock,
    Path: Mock,
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => React.createElement(View, { testID: 'mock-qrcode', ...props }),
  };
});

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props) => React.createElement(View, { testID: 'mock-camera', ...props }),
    useCameraPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn()],
  };
});

jest.mock('expo-notifications', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
}));

jest.mock('whisper.rn', () => ({
  initWhisper: jest.fn(async () => ({
    transcribe: jest.fn(() => ({
      promise: Promise.resolve({ result: 'MOCK TRANSCRIPT' }),
      stop: jest.fn(),
    })),
    release: jest.fn(async () => undefined),
  })),
}));
