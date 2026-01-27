/**
 * 🪷 BIOMETRIC AUTHENTICATION SERVICE
 * Face ID, Touch ID, and Fingerprint authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { secureStorage } from './secure-storage';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapabilities {
  /** Whether device has biometric hardware */
  hasHardware: boolean;
  /** Whether biometrics are enrolled on device */
  isEnrolled: boolean;
  /** Types of biometrics available */
  types: BiometricType[];
  /** Security level (Android only) */
  securityLevel: LocalAuthentication.SecurityLevel;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY CHECK
// ═══════════════════════════════════════════════════════════

/**
 * Check biometric capabilities of the device
 */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

  const types: BiometricType[] = supportedTypes.map(type => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'facial';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'iris';
      default:
        return 'none';
    }
  });

  return {
    hasHardware,
    isEnrolled,
    types: types.filter(t => t !== 'none'),
    securityLevel,
  };
}

/**
 * Get a human-readable name for the biometric type
 */
export function getBiometricName(types: BiometricType[]): string {
  if (types.includes('facial')) {
    return Platform.OS === 'ios' ? 'Face ID' : 'चेहरा पहचान';
  }
  if (types.includes('fingerprint')) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'फ़िंगरप्रिंट';
  }
  if (types.includes('iris')) {
    return 'आईरिस स्कैन';
  }
  return 'बायोमेट्रिक';
}

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  reason: string = 'कृपया पहचान सत्यापित करें'
): Promise<BiometricAuthResult> {
  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.hasHardware) {
      return {
        success: false,
        error: 'इस डिवाइस में बायोमेट्रिक हार्डवेयर नहीं है',
      };
    }

    if (!capabilities.isEnrolled) {
      return {
        success: false,
        error: 'कोई बायोमेट्रिक्स सेटअप नहीं है। कृपया डिवाइस सेटिंग्स में सेटअप करें।',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'रद्द करें',
      disableDeviceFallback: false, // Allow PIN/password as backup
      fallbackLabel: 'पासवर्ड का उपयोग करें',
    });

    if (result.success) {
      return { success: true };
    }

    // Handle different error types
    const errorString = result.error as string;
    switch (errorString) {
      case 'user_cancel':
        return { success: false, error: 'उपयोगकर्ता द्वारा रद्द किया गया' };
      case 'user_fallback':
        return { success: false, warning: 'पासवर्ड विकल्प चुना गया' };
      case 'system_cancel':
        return { success: false, error: 'सिस्टम द्वारा रद्द किया गया' };
      case 'not_enrolled':
        return { success: false, error: 'बायोमेट्रिक्स सेटअप नहीं है' };
      case 'lockout':
        return { success: false, error: 'बहुत अधिक प्रयास। कृपया बाद में पुनः प्रयास करें।' };
      case 'lockout_permanent':
        return { success: false, error: 'बायोमेट्रिक लॉक हो गया। डिवाइस पासवर्ड का उपयोग करें।' };
      default:
        return { success: false, error: 'प्रमाणीकरण विफल' };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'प्रमाणीकरण में त्रुटि',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// BIOMETRIC SETTINGS
// ═══════════════════════════════════════════════════════════

const BIOMETRIC_ENABLED_KEY = 'vansh_biometric_enabled';

/**
 * Check if biometric login is enabled by user
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  const value = await secureStorage.get(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

/**
 * Enable or disable biometric login
 */
export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    // Verify biometrics work before enabling
    const result = await authenticateWithBiometrics('बायोमेट्रिक लॉगिन सक्षम करने के लिए सत्यापित करें');
    if (!result.success) {
      throw new Error(result.error || 'Biometric verification failed');
    }
  }
  await secureStorage.set(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

// ═══════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Hook to get biometric capabilities
 */
export function useBiometricCapabilities(): {
  capabilities: BiometricCapabilities | null;
  loading: boolean;
  biometricName: string;
} {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBiometricCapabilities()
      .then(setCapabilities)
      .finally(() => setLoading(false));
  }, []);

  const biometricName = capabilities ? getBiometricName(capabilities.types) : 'बायोमेट्रिक';

  return { capabilities, loading, biometricName };
}

/**
 * Hook for biometric authentication
 */
export function useBiometricAuth(): {
  authenticate: (reason?: string) => Promise<BiometricAuthResult>;
  isAuthenticating: boolean;
  lastResult: BiometricAuthResult | null;
} {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastResult, setLastResult] = useState<BiometricAuthResult | null>(null);

  const authenticate = useCallback(async (reason?: string): Promise<BiometricAuthResult> => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometrics(reason);
      setLastResult(result);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return { authenticate, isAuthenticating, lastResult };
}

/**
 * Hook for biometric login settings
 */
export function useBiometricSettings(): {
  isEnabled: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
  error: string | null;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isBiometricLoginEnabled()
      .then(setIsEnabled)
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    setError(null);
    try {
      const newValue = !isEnabled;
      await setBiometricLoginEnabled(newValue);
      setIsEnabled(newValue);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle biometric login');
    }
  }, [isEnabled]);

  return { isEnabled, loading, toggle, error };
}
