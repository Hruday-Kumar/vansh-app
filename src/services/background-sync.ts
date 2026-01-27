/**
 * 🪷 VANSH BACKGROUND SYNC OPTIMIZATION SERVICE
 * Enhanced sync with conflict resolution and retry logic
 * 
 * Features:
 * - Intelligent conflict resolution
 * - Exponential backoff retry
 * - Priority-based sync queue
 * - Batch operations
 * - Sync state persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: Record<string, unknown>;
  localTimestamp: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  retryCount: number;
  lastError?: string;
  conflictData?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  serverTimestamp?: number;
  error?: string;
  conflictResolution?: 'local' | 'server' | 'merge';
}

export interface ConflictResolution {
  strategy: 'local-wins' | 'server-wins' | 'merge' | 'manual';
  mergeFunction?: (local: Record<string, unknown>, server: Record<string, unknown>) => Record<string, unknown>;
}

export interface SyncConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  batchSize: number;
  conflictResolution: ConflictResolution;
  priorityOrder: SyncOperation['priority'][];
}

export interface SyncState {
  lastSyncTimestamp: number | null;
  pendingCount: number;
  failedCount: number;
  isRunning: boolean;
  lastError: string | null;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKGROUND_SYNC_TASK = 'vansh-background-sync';
const STORAGE_KEY_QUEUE = '@vansh_sync_queue';
const STORAGE_KEY_STATE = '@vansh_sync_state';

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000,  // 1 second
  maxRetryDelay: 60000,  // 1 minute
  batchSize: 10,
  conflictResolution: {
    strategy: 'merge',
  },
  priorityOrder: ['critical', 'high', 'normal', 'low'],
};

let config: SyncConfig = { ...DEFAULT_CONFIG };
let syncQueue: SyncOperation[] = [];
let syncState: SyncState = {
  lastSyncTimestamp: null,
  pendingCount: 0,
  failedCount: 0,
  isRunning: false,
  lastError: null,
};

// Sync handler (injected by consumer)
let syncHandler: ((operation: SyncOperation) => Promise<SyncResult>) | null = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize sync service
 */
export async function initializeSyncService(
  handler: (operation: SyncOperation) => Promise<SyncResult>,
  customConfig?: Partial<SyncConfig>
): Promise<void> {
  syncHandler = handler;
  
  if (customConfig) {
    config = { ...config, ...customConfig };
  }
  
  // Load persisted queue and state
  await loadSyncQueue();
  await loadSyncState();
  
  // Register background task
  await registerBackgroundSync();
  
  // Listen for network changes
  NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
    if (state.isConnected && syncQueue.length > 0) {
      processSyncQueue();
    }
  });
  
  console.log('[BackgroundSync] Initialized with', syncQueue.length, 'pending operations');
}

/**
 * Register background fetch task
 */
async function registerBackgroundSync(): Promise<void> {
  try {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      console.log('[BackgroundSync] Background task executing');
      
      try {
        await processSyncQueue();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('[BackgroundSync] Background task failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    // Register for background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    console.log('[BackgroundSync] Background task registered');
  } catch (error) {
    console.error('[BackgroundSync] Failed to register background task:', error);
  }
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Add operation to sync queue
 */
export async function queueSyncOperation(
  type: SyncOperation['type'],
  entity: string,
  data: Record<string, unknown>,
  priority: SyncOperation['priority'] = 'normal'
): Promise<string> {
  const operation: SyncOperation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    entity,
    data,
    localTimestamp: Date.now(),
    priority,
    retryCount: 0,
  };
  
  syncQueue.push(operation);
  await saveSyncQueue();
  
  updateSyncState({ pendingCount: syncQueue.length });
  
  // Try to process immediately if online
  const netInfo = await NetInfo.fetch();
  if (netInfo.isConnected) {
    processSyncQueue();
  }
  
  return operation.id;
}

/**
 * Remove operation from queue
 */
export async function removeSyncOperation(operationId: string): Promise<void> {
  syncQueue = syncQueue.filter(op => op.id !== operationId);
  await saveSyncQueue();
  updateSyncState({ pendingCount: syncQueue.length });
}

/**
 * Get pending operations
 */
export function getPendingOperations(): SyncOperation[] {
  return [...syncQueue];
}

/**
 * Get operations for a specific entity
 */
export function getOperationsForEntity(entity: string): SyncOperation[] {
  return syncQueue.filter(op => op.entity === entity);
}

// ============================================================================
// SYNC PROCESSING
// ============================================================================

let isProcessing = false;

/**
 * Process the sync queue
 */
export async function processSyncQueue(): Promise<void> {
  if (isProcessing || !syncHandler) {
    return;
  }
  
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('[BackgroundSync] No network, skipping sync');
    return;
  }
  
  isProcessing = true;
  updateSyncState({ isRunning: true, lastError: null });
  
  try {
    // Sort by priority
    const sortedQueue = sortByPriority(syncQueue);
    
    // Process in batches
    for (let i = 0; i < sortedQueue.length; i += config.batchSize) {
      const batch = sortedQueue.slice(i, i + config.batchSize);
      
      const results = await Promise.allSettled(
        batch.map(op => processOperation(op))
      );
      
      // Handle results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const operation = batch[j];
        
        if (result.status === 'fulfilled' && result.value.success) {
          // Remove from queue
          syncQueue = syncQueue.filter(op => op.id !== operation.id);
        }
      }
      
      await saveSyncQueue();
    }
    
    updateSyncState({
      lastSyncTimestamp: Date.now(),
      pendingCount: syncQueue.length,
      failedCount: syncQueue.filter(op => op.retryCount >= config.maxRetries).length,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    updateSyncState({ lastError: message });
    console.error('[BackgroundSync] Sync failed:', error);
  } finally {
    isProcessing = false;
    updateSyncState({ isRunning: false });
  }
}

/**
 * Process a single operation
 */
async function processOperation(operation: SyncOperation): Promise<SyncResult> {
  try {
    const result = await syncHandler!(operation);
    
    if (!result.success) {
      // Handle failure
      operation.retryCount++;
      operation.lastError = result.error;
      
      if (result.conflictResolution) {
        // Conflict was detected and resolved
        console.log(`[BackgroundSync] Conflict resolved: ${result.conflictResolution}`);
      }
      
      if (operation.retryCount < config.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = calculateRetryDelay(operation.retryCount);
        setTimeout(() => processSyncQueue(), delay);
      }
    }
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    operation.retryCount++;
    operation.lastError = message;
    
    return {
      success: false,
      operationId: operation.id,
      error: message,
    };
  }
}

/**
 * Sort operations by priority
 */
function sortByPriority(operations: SyncOperation[]): SyncOperation[] {
  const priorityMap: Record<SyncOperation['priority'], number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  
  return [...operations].sort((a, b) => {
    const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Same priority - sort by timestamp (oldest first)
    return a.localTimestamp - b.localTimestamp;
  });
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(retryCount: number): number {
  const delay = config.baseRetryDelay * Math.pow(2, retryCount);
  return Math.min(delay, config.maxRetryDelay);
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve a data conflict
 */
export function resolveConflict(
  local: Record<string, unknown>,
  server: Record<string, unknown>,
  strategy?: ConflictResolution['strategy']
): Record<string, unknown> {
  const resolveStrategy = strategy || config.conflictResolution.strategy;
  
  switch (resolveStrategy) {
    case 'local-wins':
      return local;
      
    case 'server-wins':
      return server;
      
    case 'merge':
      return mergeData(local, server);
      
    case 'manual':
      // Return both for manual resolution
      return {
        _conflict: true,
        local,
        server,
      };
      
    default:
      return server;
  }
}

/**
 * Merge local and server data
 * Strategy: Server values win, but local changes to fields not in server are kept
 */
function mergeData(
  local: Record<string, unknown>,
  server: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...server };
  
  // Get local timestamp if available
  const localUpdated = local.updatedAt as number | undefined;
  const serverUpdated = server.updatedAt as number | undefined;
  
  // If custom merge function is provided, use it
  if (config.conflictResolution.mergeFunction) {
    return config.conflictResolution.mergeFunction(local, server);
  }
  
  // Default merge: prefer server but keep local-only fields
  for (const [key, value] of Object.entries(local)) {
    if (!(key in server)) {
      // Field only exists in local - keep it
      merged[key] = value;
    } else if (localUpdated && serverUpdated && localUpdated > serverUpdated) {
      // Local is newer - use local value
      merged[key] = value;
    }
    // Otherwise, server value wins (already in merged)
  }
  
  // Set merged timestamp
  merged.updatedAt = Date.now();
  merged._mergedAt = Date.now();
  
  return merged;
}

/**
 * Mark a conflict as manually resolved
 */
export async function resolveManualConflict(
  operationId: string,
  resolvedData: Record<string, unknown>
): Promise<void> {
  const operation = syncQueue.find(op => op.id === operationId);
  if (!operation) return;
  
  operation.data = resolvedData;
  operation.conflictData = undefined;
  operation.retryCount = 0;
  
  await saveSyncQueue();
  processSyncQueue();
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Save sync queue to storage
 */
async function saveSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(syncQueue));
  } catch (error) {
    console.error('[BackgroundSync] Failed to save queue:', error);
  }
}

/**
 * Load sync queue from storage
 */
async function loadSyncQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_QUEUE);
    if (stored) {
      syncQueue = JSON.parse(stored);
    }
  } catch (error) {
    console.error('[BackgroundSync] Failed to load queue:', error);
    syncQueue = [];
  }
}

/**
 * Save sync state to storage
 */
async function saveSyncState(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(syncState));
  } catch (error) {
    console.error('[BackgroundSync] Failed to save state:', error);
  }
}

/**
 * Load sync state from storage
 */
async function loadSyncState(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    if (stored) {
      syncState = { ...syncState, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[BackgroundSync] Failed to load state:', error);
  }
}

/**
 * Update sync state
 */
function updateSyncState(update: Partial<SyncState>): void {
  syncState = { ...syncState, ...update };
  saveSyncState();
}

// ============================================================================
// STATE ACCESS
// ============================================================================

/**
 * Get current sync state
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Force a sync now
 */
export async function forceSync(): Promise<void> {
  await processSyncQueue();
}

/**
 * Clear the sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  syncQueue = [];
  await saveSyncQueue();
  updateSyncState({
    pendingCount: 0,
    failedCount: 0,
    lastError: null,
  });
}

/**
 * Retry failed operations
 */
export async function retryFailedOperations(): Promise<void> {
  for (const operation of syncQueue) {
    if (operation.retryCount >= config.maxRetries) {
      operation.retryCount = 0;
      operation.lastError = undefined;
    }
  }
  
  await saveSyncQueue();
  processSyncQueue();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initialize: initializeSyncService,
  queue: queueSyncOperation,
  remove: removeSyncOperation,
  process: processSyncQueue,
  forceSync,
  getState: getSyncState,
  getPending: getPendingOperations,
  getForEntity: getOperationsForEntity,
  clear: clearSyncQueue,
  retryFailed: retryFailedOperations,
  resolveConflict,
  resolveManualConflict,
};
