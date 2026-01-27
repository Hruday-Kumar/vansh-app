/**
 * 🪷 SECURE STORAGE SERVICE
 * Encrypted storage for sensitive data using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Require biometric/passcode to access (iOS)
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Storage key prefixes for organization
const KEY_PREFIX = {
  AUTH: 'vansh_auth_',
  USER: 'vansh_user_',
  ENCRYPTION: 'vansh_enc_',
  SETTINGS: 'vansh_settings_',
};

// ═══════════════════════════════════════════════════════════
// CORE SECURE STORAGE
// ═══════════════════════════════════════════════════════════

/**
 * Secure storage wrapper with encryption
 */
export const secureStorage = {
  /**
   * Store a value securely
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
    } catch (error) {
      console.error(`Failed to store secure value for key ${key}:`, error);
      throw new Error('Failed to store secure data');
    }
  },

  /**
   * Retrieve a secure value
   */
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
    } catch (error) {
      console.error(`Failed to retrieve secure value for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a secure value
   */
  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
    } catch (error) {
      console.error(`Failed to delete secure value for key ${key}:`, error);
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  },
};

// ═══════════════════════════════════════════════════════════
// AUTH TOKEN STORAGE
// ═══════════════════════════════════════════════════════════

const TOKEN_KEY = KEY_PREFIX.AUTH + 'token';
const REFRESH_TOKEN_KEY = KEY_PREFIX.AUTH + 'refresh_token';
const TOKEN_EXPIRY_KEY = KEY_PREFIX.AUTH + 'token_expiry';

export const authTokenStorage = {
  /**
   * Store auth tokens securely
   */
  async saveTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const expiryTime = Date.now() + expiresIn * 1000;
    await Promise.all([
      secureStorage.set(TOKEN_KEY, accessToken),
      secureStorage.set(REFRESH_TOKEN_KEY, refreshToken),
      secureStorage.set(TOKEN_EXPIRY_KEY, expiryTime.toString()),
    ]);
  },

  /**
   * Get the current access token
   */
  async getAccessToken(): Promise<string | null> {
    const [token, expiry] = await Promise.all([
      secureStorage.get(TOKEN_KEY),
      secureStorage.get(TOKEN_EXPIRY_KEY),
    ]);

    // Check if token is expired
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() >= expiryTime) {
        return null; // Token expired
      }
    }

    return token;
  },

  /**
   * Get the refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return secureStorage.get(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if tokens are stored
   */
  async hasTokens(): Promise<boolean> {
    const token = await secureStorage.get(TOKEN_KEY);
    return token !== null;
  },

  /**
   * Clear all auth tokens
   */
  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.delete(TOKEN_KEY),
      secureStorage.delete(REFRESH_TOKEN_KEY),
      secureStorage.delete(TOKEN_EXPIRY_KEY),
    ]);
  },

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  async isTokenExpiringSoon(): Promise<boolean> {
    const expiry = await secureStorage.get(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    const expiryTime = parseInt(expiry, 10);
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= expiryTime - fiveMinutes;
  },
};

// ═══════════════════════════════════════════════════════════
// USER CREDENTIALS STORAGE
// ═══════════════════════════════════════════════════════════

const USER_ID_KEY = KEY_PREFIX.USER + 'id';
const USER_EMAIL_KEY = KEY_PREFIX.USER + 'email';
const FAMILY_ID_KEY = KEY_PREFIX.USER + 'family_id';

export const userCredentialsStorage = {
  /**
   * Save user credentials for quick login
   */
  async saveUserInfo(userId: string, email: string, familyId?: string): Promise<void> {
    await Promise.all([
      secureStorage.set(USER_ID_KEY, userId),
      secureStorage.set(USER_EMAIL_KEY, email),
      familyId ? secureStorage.set(FAMILY_ID_KEY, familyId) : Promise.resolve(),
    ]);
  },

  /**
   * Get stored user info
   */
  async getUserInfo(): Promise<{ userId: string; email: string; familyId?: string } | null> {
    const [userId, email, familyId] = await Promise.all([
      secureStorage.get(USER_ID_KEY),
      secureStorage.get(USER_EMAIL_KEY),
      secureStorage.get(FAMILY_ID_KEY),
    ]);

    if (!userId || !email) return null;

    return { userId, email, familyId: familyId || undefined };
  },

  /**
   * Clear user info
   */
  async clearUserInfo(): Promise<void> {
    await Promise.all([
      secureStorage.delete(USER_ID_KEY),
      secureStorage.delete(USER_EMAIL_KEY),
      secureStorage.delete(FAMILY_ID_KEY),
    ]);
  },
};

// ═══════════════════════════════════════════════════════════
// ENCRYPTION KEY STORAGE
// ═══════════════════════════════════════════════════════════

const MASTER_KEY = KEY_PREFIX.ENCRYPTION + 'master_key';
const VASIYAT_KEY = KEY_PREFIX.ENCRYPTION + 'vasiyat_key';

export const encryptionKeyStorage = {
  /**
   * Store the master encryption key
   */
  async saveMasterKey(key: string): Promise<void> {
    await secureStorage.set(MASTER_KEY, key);
  },

  /**
   * Get the master encryption key
   */
  async getMasterKey(): Promise<string | null> {
    return secureStorage.get(MASTER_KEY);
  },

  /**
   * Store the vasiyat encryption key (separate for extra security)
   */
  async saveVasiyatKey(key: string): Promise<void> {
    await secureStorage.set(VASIYAT_KEY, key);
  },

  /**
   * Get the vasiyat encryption key
   */
  async getVasiyatKey(): Promise<string | null> {
    return secureStorage.get(VASIYAT_KEY);
  },

  /**
   * Clear all encryption keys (CAUTION: Data encrypted with these keys will be unrecoverable)
   */
  async clearAllKeys(): Promise<void> {
    await Promise.all([
      secureStorage.delete(MASTER_KEY),
      secureStorage.delete(VASIYAT_KEY),
    ]);
  },
};

// ═══════════════════════════════════════════════════════════
// FULL LOGOUT
// ═══════════════════════════════════════════════════════════

/**
 * Clear all secure storage (for logout)
 */
export async function clearAllSecureStorage(): Promise<void> {
  await Promise.all([
    authTokenStorage.clearTokens(),
    userCredentialsStorage.clearUserInfo(),
    // Note: We keep encryption keys to allow data recovery if user logs back in
  ]);
}

/**
 * Full wipe of all secure data (for account deletion)
 */
export async function wipeAllSecureData(): Promise<void> {
  await Promise.all([
    authTokenStorage.clearTokens(),
    userCredentialsStorage.clearUserInfo(),
    encryptionKeyStorage.clearAllKeys(),
    secureStorage.delete(KEY_PREFIX.SETTINGS + 'biometric_enabled'),
  ]);
}

// ═══════════════════════════════════════════════════════════
// WEB FALLBACK
// ═══════════════════════════════════════════════════════════

/**
 * Note: expo-secure-store doesn't work on web.
 * For web, you should use a different approach like:
 * - HTTP-only cookies for auth tokens
 * - Web Crypto API for encryption
 * - IndexedDB with encryption for local data
 * 
 * The above functions will throw on web. You may want to wrap them
 * with platform checks or use a different storage solution for web.
 */

export function isSecureStorageAvailable(): boolean {
  return Platform.OS !== 'web';
}
