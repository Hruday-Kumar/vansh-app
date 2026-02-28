/**
 * 🪷 OFFLINE DATABASE - Web Stub
 * expo-sqlite is not supported on web (WASM loading fails in Metro).
 * All functions gracefully no-op on web platform.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getDatabase(): Promise<null> {
    return null;
}

export async function cacheItem(
    _table: string,
    _id: string,
    _data: Record<string, unknown>
): Promise<void> { }

export async function getCachedItem<T>(
    _table: string,
    _id: string
): Promise<T | null> {
    return null;
}

export async function getCachedItems<T>(
    _table: string,
    _familyId: string
): Promise<T[]> {
    return [];
}

export async function cacheItems(
    _table: string,
    _items: Array<{ id: string; familyId?: string; data: Record<string, unknown> }>
): Promise<void> { }

export async function clearCache(_table: string): Promise<void> { }

export async function clearAllCaches(): Promise<void> { }

export async function setKV(_key: string, _value: unknown): Promise<void> { }

export async function getKV<T>(_key: string): Promise<T | null> {
    return null;
}

export async function deleteKV(_key: string): Promise<void> { }

export interface SyncQueueItem {
    id: number;
    actionType: 'create' | 'update' | 'delete';
    entityType: string;
    entityId: string | null;
    payload: unknown;
    createdAt: number;
    retryCount: number;
    lastError: string | null;
    status: 'pending' | 'processing' | 'failed' | 'completed';
}

export async function queueAction(
    _actionType: 'create' | 'update' | 'delete',
    _entityType: string,
    _payload: unknown,
    _entityId?: string
): Promise<number> {
    return -1;
}

export async function getPendingActions(): Promise<SyncQueueItem[]> {
    return [];
}

export async function completeAction(_id: number): Promise<void> { }

export async function failAction(_id: number, _error: string): Promise<void> { }

export async function getQueueStats(): Promise<{ pending: number; failed: number; completed: number }> {
    return { pending: 0, failed: 0, completed: 0 };
}

export async function cleanupQueue(_daysOld?: number): Promise<void> { }
