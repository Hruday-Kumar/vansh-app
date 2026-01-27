/**
 * 🪷 VANSH SERVICES
 * Central export point for all service modules
 */

export * from './analytics';
export { api } from './api';
export * from './deep-linking';
export * from './notifications';
export * from './offline-db';
export * from './search';
export * from './sync';
export * from './transcription';

// Security & Privacy
export * from './biometrics';
export * from './encryption';
export * from './privacy';
export * from './secure-storage';

// Performance & Optimization
// Using named imports to avoid conflicts with sync.ts
export {
    clearSyncQueue, forceSync,
    getSyncState as getBackgroundSyncState, getOperationsForEntity, getPendingOperations, initializeSyncService as initializeBackgroundSync, processSyncQueue as processBackgroundSyncQueue, queueSyncOperation,
    removeSyncOperation, resolveConflict,
    resolveManualConflict, retryFailedOperations, type SyncState as BackgroundSyncState, type ConflictResolution,
    type SyncConfig, type SyncOperation,
    type SyncResult
} from './background-sync';

export {
    clearCache as clearMemoryCache, deleteCached, getCached, getCacheStats as getMemoryCacheStats, getWithRevalidate, hasCached, loadPersistedCache,
    persistAllCache, setCached, startCacheCleanup,
    stopCacheCleanup,
    withCache, type CacheEntry,
    type CacheOptions,
    type CacheStats
} from './cache';

export * from './image-optimization';
export * from './performance';

