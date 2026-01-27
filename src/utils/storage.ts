/**
 * 🪷 VANSH UTILITIES - Storage Helpers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════

export const StorageKeys = {
  // Auth
  AUTH_TOKEN: '@vansh/auth_token',
  REFRESH_TOKEN: '@vansh/refresh_token',
  USER_ID: '@vansh/user_id',
  
  // Onboarding
  ONBOARDING_COMPLETE: '@vansh/onboarding_complete',
  FIRST_LAUNCH: '@vansh/first_launch',
  
  // Family
  CURRENT_FAMILY_ID: '@vansh/current_family_id',
  FAMILY_CACHE: '@vansh/family_cache',
  
  // Preferences
  LANGUAGE: '@vansh/language',
  THEME: '@vansh/theme',
  NOTIFICATIONS_ENABLED: '@vansh/notifications_enabled',
  
  // Cache
  MEMORIES_CACHE: '@vansh/memories_cache',
  KATHAS_CACHE: '@vansh/kathas_cache',
  MEMBERS_CACHE: '@vansh/members_cache',
  
  // Offline queue
  UPLOAD_QUEUE: '@vansh/upload_queue',
  PENDING_ACTIONS: '@vansh/pending_actions',
  
  // Recording drafts
  KATHA_DRAFT: '@vansh/katha_draft',
  VASIYAT_DRAFT: '@vansh/vasiyat_draft',
} as const;

// ═══════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Save a value to storage
 */
export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving to storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Get a value from storage
 */
export async function getFromStorage<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error reading from storage [${key}]:`, error);
    return null;
  }
}

/**
 * Remove a value from storage
 */
export async function removeFromStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage [${key}]:`, error);
  }
}

/**
 * Clear all app storage
 */
export async function clearAllStorage(): Promise<void> {
  try {
    const keys = Object.values(StorageKeys);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH STORAGE
// ═══════════════════════════════════════════════════════════

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Save auth tokens
 */
export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    saveToStorage(StorageKeys.AUTH_TOKEN, tokens.accessToken),
    saveToStorage(StorageKeys.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

/**
 * Get auth tokens
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getFromStorage<string>(StorageKeys.AUTH_TOKEN),
    getFromStorage<string>(StorageKeys.REFRESH_TOKEN),
  ]);
  
  if (!accessToken || !refreshToken) return null;
  
  return {
    accessToken,
    refreshToken,
    expiresAt: 0, // Would need to decode JWT to get expiry
  };
}

/**
 * Clear auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    removeFromStorage(StorageKeys.AUTH_TOKEN),
    removeFromStorage(StorageKeys.REFRESH_TOKEN),
    removeFromStorage(StorageKeys.USER_ID),
  ]);
}

// ═══════════════════════════════════════════════════════════
// CACHE HELPERS
// ═══════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Save data to cache with expiry
 */
export async function saveToCache<T>(
  key: string,
  data: T,
  ttlMinutes: number = 60
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };
  await saveToStorage(key, entry);
}

/**
 * Get data from cache (returns null if expired)
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  const entry = await getFromStorage<CacheEntry<T>>(key);
  
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    await removeFromStorage(key);
    return null;
  }
  
  return entry.data;
}

// ═══════════════════════════════════════════════════════════
// OFFLINE QUEUE
// ═══════════════════════════════════════════════════════════

export interface PendingAction {
  id: string;
  type: 'upload_memory' | 'upload_katha' | 'create_vasiyat' | 'update_member';
  payload: unknown;
  createdAt: number;
  retryCount: number;
}

/**
 * Add an action to the offline queue
 */
export async function addToPendingQueue(action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  const queue = await getFromStorage<PendingAction[]>(StorageKeys.PENDING_ACTIONS) || [];
  
  const newAction: PendingAction = {
    ...action,
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  
  queue.push(newAction);
  await saveToStorage(StorageKeys.PENDING_ACTIONS, queue);
}

/**
 * Get all pending actions
 */
export async function getPendingQueue(): Promise<PendingAction[]> {
  return await getFromStorage<PendingAction[]>(StorageKeys.PENDING_ACTIONS) || [];
}

/**
 * Remove a completed action from the queue
 */
export async function removeFromPendingQueue(actionId: string): Promise<void> {
  const queue = await getPendingQueue();
  const filtered = queue.filter(a => a.id !== actionId);
  await saveToStorage(StorageKeys.PENDING_ACTIONS, filtered);
}

/**
 * Increment retry count for a failed action
 */
export async function incrementRetryCount(actionId: string): Promise<void> {
  const queue = await getPendingQueue();
  const updated = queue.map(a => 
    a.id === actionId 
      ? { ...a, retryCount: a.retryCount + 1 }
      : a
  );
  await saveToStorage(StorageKeys.PENDING_ACTIONS, updated);
}
