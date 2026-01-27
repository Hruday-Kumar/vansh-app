/**
 * 🪷 VANSH MEMORY CACHE SERVICE
 * High-performance caching with TTL and LRU eviction
 * 
 * Features:
 * - In-memory LRU cache
 * - Persistent cache with AsyncStorage
 * - TTL (time-to-live) support
 * - Automatic cleanup
 * - Cache statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number | null;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  /** Time to live in milliseconds (null = never expires) */
  ttl?: number | null;
  /** Whether to persist to AsyncStorage */
  persist?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private stats = { hits: 0, misses: 0 };
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // Update access info (LRU tracking)
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.value;
  }
  
  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl: number | null = null): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }
    
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: ttl ? now + ttl : null,
      accessCount: 0,
      lastAccessed: now,
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
  
  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
  
  /**
   * Evict least recently used entry
   */
  private evict(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get all entries (for persistence)
   */
  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }
  
  /**
   * Restore entries (from persistence)
   */
  restore(entries: Array<[string, CacheEntry<T>]>): void {
    const now = Date.now();
    for (const [key, entry] of entries) {
      // Skip expired entries
      if (entry.expiresAt && now > entry.expiresAt) continue;
      this.cache.set(key, entry);
    }
  }
}

// ============================================================================
// CACHE NAMESPACES
// ============================================================================

const CACHE_PREFIX = '@vansh_cache:';

type CacheNamespace = 
  | 'api'      // API response cache
  | 'member'   // Member profile data
  | 'memory'   // Memory metadata
  | 'search'   // Search results
  | 'ui';      // UI state cache

// Create namespace-specific caches
const caches: Record<CacheNamespace, LRUCache<unknown>> = {
  api: new LRUCache(50),
  member: new LRUCache(100),
  memory: new LRUCache(200),
  search: new LRUCache(20),
  ui: new LRUCache(30),
};

// Namespace-specific TTLs (in milliseconds)
const defaultTTLs: Record<CacheNamespace, number | null> = {
  api: 5 * 60 * 1000,      // 5 minutes
  member: 30 * 60 * 1000,  // 30 minutes
  memory: 60 * 60 * 1000,  // 1 hour
  search: 10 * 60 * 1000,  // 10 minutes
  ui: null,                // No expiration
};

// ============================================================================
// CACHE API
// ============================================================================

/**
 * Get a value from cache
 */
export function getCached<T>(
  namespace: CacheNamespace,
  key: string
): T | undefined {
  return caches[namespace].get(key) as T | undefined;
}

/**
 * Set a value in cache
 */
export function setCached<T>(
  namespace: CacheNamespace,
  key: string,
  value: T,
  options: CacheOptions = {}
): void {
  const ttl = options.ttl !== undefined ? options.ttl : defaultTTLs[namespace];
  caches[namespace].set(key, value, ttl);
  
  if (options.persist) {
    persistEntry(namespace, key);
  }
}

/**
 * Delete a cached value
 */
export function deleteCached(namespace: CacheNamespace, key: string): void {
  caches[namespace].delete(key);
  AsyncStorage.removeItem(`${CACHE_PREFIX}${namespace}:${key}`).catch(() => {});
}

/**
 * Check if a key exists in cache
 */
export function hasCached(namespace: CacheNamespace, key: string): boolean {
  return caches[namespace].has(key);
}

/**
 * Clear a namespace or all caches
 */
export function clearCache(namespace?: CacheNamespace): void {
  if (namespace) {
    caches[namespace].clear();
    clearPersistedNamespace(namespace);
  } else {
    for (const ns of Object.keys(caches) as CacheNamespace[]) {
      caches[ns].clear();
      clearPersistedNamespace(ns);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(namespace?: CacheNamespace): CacheStats | Record<CacheNamespace, CacheStats> {
  if (namespace) {
    return caches[namespace].getStats();
  }
  
  const stats: Partial<Record<CacheNamespace, CacheStats>> = {};
  for (const [ns, cache] of Object.entries(caches)) {
    stats[ns as CacheNamespace] = cache.getStats();
  }
  return stats as Record<CacheNamespace, CacheStats>;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Persist a single entry
 */
async function persistEntry(namespace: CacheNamespace, key: string): Promise<void> {
  try {
    const cache = caches[namespace];
    const entries = cache.entries();
    const entry = entries.find(([k]) => k === key);
    
    if (entry) {
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${namespace}:${key}`,
        JSON.stringify(entry[1])
      );
    }
  } catch (error) {
    console.error('[Cache] Persist failed:', error);
  }
}

/**
 * Clear persisted namespace
 */
async function clearPersistedNamespace(namespace: CacheNamespace): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = `${CACHE_PREFIX}${namespace}:`;
    const keysToRemove = allKeys.filter(key => key.startsWith(prefix));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('[Cache] Clear persisted failed:', error);
  }
}

/**
 * Load persisted cache entries
 */
export async function loadPersistedCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length === 0) return;
    
    const entries = await AsyncStorage.multiGet(cacheKeys);
    
    for (const [key, value] of entries) {
      if (!value) continue;
      
      try {
        const [, rest] = key.split(CACHE_PREFIX);
        const [namespace, entryKey] = rest.split(':');
        
        if (namespace in caches) {
          const entry = JSON.parse(value);
          caches[namespace as CacheNamespace].restore([[entryKey, entry]]);
        }
      } catch {
        // Skip invalid entries
      }
    }
    
    console.log(`[Cache] Loaded ${cacheKeys.length} persisted entries`);
  } catch (error) {
    console.error('[Cache] Load persisted failed:', error);
  }
}

/**
 * Persist all cache entries
 */
export async function persistAllCache(): Promise<void> {
  try {
    const items: Array<[string, string]> = [];
    
    for (const [namespace, cache] of Object.entries(caches)) {
      for (const [key, entry] of cache.entries()) {
        items.push([
          `${CACHE_PREFIX}${namespace}:${key}`,
          JSON.stringify(entry),
        ]);
      }
    }
    
    if (items.length > 0) {
      await AsyncStorage.multiSet(items);
    }
    
    console.log(`[Cache] Persisted ${items.length} entries`);
  } catch (error) {
    console.error('[Cache] Persist all failed:', error);
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic cache cleanup
 */
export function startCacheCleanup(intervalMs: number = 60000): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    let totalRemoved = 0;
    for (const cache of Object.values(caches)) {
      totalRemoved += cache.cleanup();
    }
    
    if (totalRemoved > 0) {
      console.log(`[Cache] Cleaned up ${totalRemoved} expired entries`);
    }
  }, intervalMs);
}

/**
 * Stop automatic cache cleanup
 */
export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================================================
// CACHE DECORATORS / HELPERS
// ============================================================================

/**
 * Cache wrapper for async functions
 */
export function withCache<T>(
  namespace: CacheNamespace,
  keyFn: (...args: unknown[]) => string,
  fn: (...args: unknown[]) => Promise<T>,
  options: CacheOptions = {}
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]): Promise<T> => {
    const key = keyFn(...args);
    
    // Check cache first
    const cached = getCached<T>(namespace, key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Cache result
    setCached(namespace, key, result, options);
    
    return result;
  };
}

/**
 * Stale-while-revalidate pattern
 */
export async function getWithRevalidate<T>(
  namespace: CacheNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & { revalidateAfter?: number } = {}
): Promise<T> {
  const { revalidateAfter = 60000, ...cacheOptions } = options;
  
  const cached = getCached<T>(namespace, key);
  
  if (cached !== undefined) {
    // Check if stale and revalidate in background
    const cache = caches[namespace];
    const entries = cache.entries();
    const entry = entries.find(([k]) => k === key);
    
    if (entry && Date.now() - entry[1].lastAccessed > revalidateAfter) {
      // Revalidate in background
      fetchFn()
        .then(result => setCached(namespace, key, result, cacheOptions))
        .catch(() => {}); // Ignore background errors
    }
    
    return cached;
  }
  
  // Fetch fresh data
  const result = await fetchFn();
  setCached(namespace, key, result, cacheOptions);
  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  get: getCached,
  set: setCached,
  delete: deleteCached,
  has: hasCached,
  clear: clearCache,
  getStats: getCacheStats,
  loadPersisted: loadPersistedCache,
  persistAll: persistAllCache,
  startCleanup: startCacheCleanup,
  stopCleanup: stopCacheCleanup,
  withCache,
  getWithRevalidate,
};
