/**
 * Jest Setup File
 * Global test configuration and custom matchers
 */

// Note: In @testing-library/react-native v13+, extend-expect is auto-loaded via setupFilesAfterEnv
// No explicit import needed when using jest-expo preset

// Mock React Native Animated (using virtual mock)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Mock Expo modules with virtual: true to handle optional/not-installed deps
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}), { virtual: true });

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_STRONG: 2,
    BIOMETRIC_WEAK: 3,
  },
}), { virtual: true });

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}), { virtual: true });

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/document/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, isDirectory: false, size: 1000 })),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({
    uri: 'file:///mock/manipulated.jpg',
    width: 800,
    height: 600,
  })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}), { virtual: true });

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}), { virtual: true });

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}), { virtual: true });

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({
        recording: {
          stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
          getURI: jest.fn(() => 'file:///mock/recording.m4a'),
        },
        status: { canRecord: true, isRecording: true },
      })),
    },
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(() => Promise.resolve()),
          pauseAsync: jest.fn(() => Promise.resolve()),
          stopAsync: jest.fn(() => Promise.resolve()),
          unloadAsync: jest.fn(() => Promise.resolve()),
        },
      })),
    },
  },
}), { virtual: true });

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}), { virtual: true });

jest.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
  isRTL: false,
  region: 'US',
  getLocales: jest.fn(() => [{
    languageTag: 'en-US',
    languageCode: 'en',
    regionCode: 'US',
    textDirection: 'ltr',
  }]),
}), { virtual: true });

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `vanshapp://${path}`),
  parse: jest.fn((url: string) => ({ path: url, queryParams: {} })),
  openURL: jest.fn(() => Promise.resolve(true)),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}), { virtual: true });

// Mock console methods for cleaner test output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

beforeAll(() => {
  // Suppress noisy console output during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Custom test matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },

  toBeValidDate(received: string | Date) {
    const date = received instanceof Date ? received : new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid date`,
    };
  },

  toHaveBeenCalledWithMatch(received: jest.Mock, expectedArgs: unknown[]) {
    const calls = received.mock.calls;
    const pass = calls.some(call =>
      expectedArgs.every((arg, index) => {
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(call[index]).includes(JSON.stringify(arg));
        }
        return call[index] === arg;
      })
    );
    return {
      pass,
      message: () =>
        pass
          ? `expected function not to be called with matching args`
          : `expected function to be called with matching args ${JSON.stringify(expectedArgs)}`,
    };
  },
});

// Extend Jest types for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidDate(): R;
      toHaveBeenCalledWithMatch(expectedArgs: unknown[]): R;
    }
  }
}

// Global test utilities
global.testUtils = {
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  mockDate: (date: Date | string) => {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as unknown as () => Date);
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  },
  restoreDate: () => {
    jest.restoreAllMocks();
  },
};

declare global {
  var testUtils: {
    flushPromises: () => Promise<void>;
    waitFor: (ms: number) => Promise<void>;
    mockDate: (date: Date | string) => void;
    restoreDate: () => void;
  };
}
