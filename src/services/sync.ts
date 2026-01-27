/**
 * 🪷 SYNC SERVICE
 * Handles offline/online sync and network state
 */

import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { api } from './api';
import {
    completeAction,
    failAction,
    getPendingActions,
    getQueueStats,
    queueAction,
    type SyncQueueItem,
} from './offline-db';

// ═══════════════════════════════════════════════════════════
// NETWORK STATE
// ═══════════════════════════════════════════════════════════

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType | null;
}

let currentNetworkState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: null,
};

const networkListeners: Array<(state: NetworkState) => void> = [];

/**
 * Initialize network monitoring
 */
export async function initNetworkMonitoring(): Promise<void> {
  // Get initial state
  const state = await Network.getNetworkStateAsync();
  currentNetworkState = {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    type: state.type ?? null,
  };
  
  console.log('📡 Network state:', currentNetworkState.isConnected ? 'Online' : 'Offline');
  
  // Note: expo-network doesn't have a built-in subscription
  // We'll poll for changes every 5 seconds when the app is active
  setInterval(async () => {
    const newState = await Network.getNetworkStateAsync();
    const wasConnected = currentNetworkState.isConnected;
    
    currentNetworkState = {
      isConnected: newState.isConnected ?? false,
      isInternetReachable: newState.isInternetReachable ?? false,
      type: newState.type ?? null,
    };
    
    // If we just came back online, trigger sync
    if (!wasConnected && currentNetworkState.isConnected) {
      console.log('📡 Network restored - starting sync');
      processSyncQueue();
    }
    
    // Notify listeners
    networkListeners.forEach(listener => listener(currentNetworkState));
  }, 5000);
}

/**
 * Get current network state
 */
export function getNetworkState(): NetworkState {
  return currentNetworkState;
}

/**
 * Subscribe to network changes
 */
export function subscribeToNetwork(callback: (state: NetworkState) => void): () => void {
  networkListeners.push(callback);
  return () => {
    const index = networkListeners.indexOf(callback);
    if (index > -1) networkListeners.splice(index, 1);
  };
}

// ═══════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(currentNetworkState);
  
  useEffect(() => {
    return subscribeToNetwork(setState);
  }, []);
  
  return state;
}

export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected && isInternetReachable;
}

// ═══════════════════════════════════════════════════════════
// SYNC QUEUE PROCESSING
// ═══════════════════════════════════════════════════════════

let isSyncing = false;
const syncListeners: Array<(stats: { pending: number; processing: boolean }) => void> = [];

/**
 * Process pending actions in the sync queue
 */
export async function processSyncQueue(): Promise<void> {
  if (isSyncing) {
    console.log('⏳ Sync already in progress');
    return;
  }
  
  if (!currentNetworkState.isConnected) {
    console.log('📴 Offline - skipping sync');
    return;
  }
  
  isSyncing = true;
  notifySyncListeners();
  
  try {
    const pendingActions = await getPendingActions();
    console.log(`🔄 Processing ${pendingActions.length} pending actions`);
    
    for (const action of pendingActions) {
      try {
        await processAction(action);
        await completeAction(action.id);
        console.log(`✅ Synced: ${action.actionType} ${action.entityType}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await failAction(action.id, errorMessage);
        console.error(`❌ Failed: ${action.actionType} ${action.entityType}:`, errorMessage);
        
        // If too many retries, skip this action
        if (action.retryCount >= 3) {
          console.warn(`⚠️ Giving up on action ${action.id} after 3 retries`);
        }
      }
    }
  } finally {
    isSyncing = false;
    notifySyncListeners();
  }
}

/**
 * Process a single sync action
 */
async function processAction(action: SyncQueueItem): Promise<void> {
  const { actionType, entityType, payload } = action;
  
  // Route to appropriate API method based on entity type and action
  switch (entityType) {
    case 'memory':
      if (actionType === 'create') {
        await api.uploadMemory(payload as any);
      }
      break;
      
    case 'katha':
      if (actionType === 'create') {
        await api.recordKatha(payload as any);
      }
      break;
      
    case 'member':
      if (actionType === 'create') {
        const { familyId, ...memberData } = payload as any;
        await api.createMember(familyId, memberData);
      }
      break;
      
    case 'relationship':
      if (actionType === 'create') {
        await api.addRelationship(payload as any);
      }
      break;
      
    case 'vasiyat':
      if (actionType === 'create') {
        await api.createVasiyat(payload as any);
      }
      break;
      
    default:
      console.warn(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Subscribe to sync status changes
 */
export function subscribeToSync(
  callback: (stats: { pending: number; processing: boolean }) => void
): () => void {
  syncListeners.push(callback);
  return () => {
    const index = syncListeners.indexOf(callback);
    if (index > -1) syncListeners.splice(index, 1);
  };
}

async function notifySyncListeners(): Promise<void> {
  const stats = await getQueueStats();
  syncListeners.forEach(listener => 
    listener({ pending: stats.pending, processing: isSyncing })
  );
}

// ═══════════════════════════════════════════════════════════
// OFFLINE-AWARE API WRAPPER
// ═══════════════════════════════════════════════════════════

/**
 * Execute an API call, or queue it for later if offline
 */
export async function executeOrQueue<T>(
  actionType: 'create' | 'update' | 'delete',
  entityType: string,
  payload: unknown,
  onlineExecutor: () => Promise<T>,
  entityId?: string
): Promise<{ queued: boolean; result?: T }> {
  if (currentNetworkState.isConnected && currentNetworkState.isInternetReachable) {
    try {
      const result = await onlineExecutor();
      return { queued: false, result };
    } catch (error) {
      // If network error, queue the action
      if (isNetworkError(error)) {
        await queueAction(actionType, entityType, payload, entityId);
        return { queued: true };
      }
      throw error;
    }
  } else {
    // Offline - queue the action
    await queueAction(actionType, entityType, payload, entityId);
    return { queued: true };
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    );
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// SYNC STATUS HOOK
// ═══════════════════════════════════════════════════════════

export function useSyncStatus(): { pending: number; processing: boolean } {
  const [status, setStatus] = useState({ pending: 0, processing: false });
  
  useEffect(() => {
    // Get initial stats
    getQueueStats().then(stats => setStatus({ pending: stats.pending, processing: isSyncing }));
    
    // Subscribe to updates
    return subscribeToSync(setStatus);
  }, []);
  
  return status;
}
