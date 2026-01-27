/**
 * 🪷 OFFLINE DATABASE
 * SQLite-based local storage for offline-first architecture
 */

import * as SQLite from 'expo-sqlite';

// ═══════════════════════════════════════════════════════════
// DATABASE INSTANCE
// ═══════════════════════════════════════════════════════════

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('vansh_offline.db');
    await initializeDatabase(db);
  }
  return db;
}

// ═══════════════════════════════════════════════════════════
// SCHEMA INITIALIZATION
// ═══════════════════════════════════════════════════════════

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  // Create tables for offline caching
  await database.execAsync(`
    -- User session cache
    CREATE TABLE IF NOT EXISTS user_cache (
      id TEXT PRIMARY KEY,
      email TEXT,
      member_id TEXT,
      family_id TEXT,
      role TEXT,
      data TEXT,
      updated_at INTEGER
    );

    -- Family members cache
    CREATE TABLE IF NOT EXISTS members_cache (
      id TEXT PRIMARY KEY,
      family_id TEXT,
      first_name TEXT,
      last_name TEXT,
      avatar_uri TEXT,
      data TEXT,
      updated_at INTEGER
    );

    -- Memories cache
    CREATE TABLE IF NOT EXISTS memories_cache (
      id TEXT PRIMARY KEY,
      family_id TEXT,
      type TEXT,
      title TEXT,
      thumbnail_uri TEXT,
      local_uri TEXT,
      data TEXT,
      updated_at INTEGER
    );

    -- Kathas cache
    CREATE TABLE IF NOT EXISTS kathas_cache (
      id TEXT PRIMARY KEY,
      family_id TEXT,
      narrator_id TEXT,
      title TEXT,
      local_uri TEXT,
      data TEXT,
      updated_at INTEGER
    );

    -- Offline action queue
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      status TEXT DEFAULT 'pending'
    );

    -- Key-value store for misc data
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_members_family ON members_cache(family_id);
    CREATE INDEX IF NOT EXISTS idx_memories_family ON memories_cache(family_id);
    CREATE INDEX IF NOT EXISTS idx_kathas_family ON kathas_cache(family_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);

  console.log('🗄️ Offline database initialized');
}

// ═══════════════════════════════════════════════════════════
// CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Cache a single item
 */
export async function cacheItem(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();
  
  await database.runAsync(
    `INSERT OR REPLACE INTO ${table} (id, data, updated_at) VALUES (?, ?, ?)`,
    [id, JSON.stringify(data), now]
  );
}

/**
 * Get a cached item by ID
 */
export async function getCachedItem<T>(
  table: string,
  id: string
): Promise<T | null> {
  const database = await getDatabase();
  
  const result = await database.getFirstAsync<{ data: string }>(
    `SELECT data FROM ${table} WHERE id = ?`,
    [id]
  );
  
  if (result?.data) {
    return JSON.parse(result.data) as T;
  }
  return null;
}

/**
 * Get all cached items for a family
 */
export async function getCachedItems<T>(
  table: string,
  familyId: string
): Promise<T[]> {
  const database = await getDatabase();
  
  const results = await database.getAllAsync<{ data: string }>(
    `SELECT data FROM ${table} WHERE family_id = ? ORDER BY updated_at DESC`,
    [familyId]
  );
  
  return results.map(r => JSON.parse(r.data) as T);
}

/**
 * Cache multiple items
 */
export async function cacheItems(
  table: string,
  items: Array<{ id: string; familyId?: string; data: Record<string, unknown> }>
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();
  
  const stmt = await database.prepareAsync(
    `INSERT OR REPLACE INTO ${table} (id, family_id, data, updated_at) VALUES (?, ?, ?, ?)`
  );
  
  try {
    for (const item of items) {
      await stmt.executeAsync([item.id, item.familyId ?? null, JSON.stringify(item.data), now]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

/**
 * Clear cache for a table
 */
export async function clearCache(table: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM ${table}`);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM user_cache;
    DELETE FROM members_cache;
    DELETE FROM memories_cache;
    DELETE FROM kathas_cache;
    DELETE FROM kv_store;
  `);
  console.log('🧹 All caches cleared');
}

// ═══════════════════════════════════════════════════════════
// KEY-VALUE STORE
// ═══════════════════════════════════════════════════════════

export async function setKV(key: string, value: unknown): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, JSON.stringify(value), Date.now()]
  );
}

export async function getKV<T>(key: string): Promise<T | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM kv_store WHERE key = ?`,
    [key]
  );
  return result ? JSON.parse(result.value) as T : null;
}

export async function deleteKV(key: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM kv_store WHERE key = ?`, [key]);
}

// ═══════════════════════════════════════════════════════════
// SYNC QUEUE OPERATIONS
// ═══════════════════════════════════════════════════════════

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

/**
 * Add an action to the sync queue
 */
export async function queueAction(
  actionType: 'create' | 'update' | 'delete',
  entityType: string,
  payload: unknown,
  entityId?: string
): Promise<number> {
  const database = await getDatabase();
  
  const result = await database.runAsync(
    `INSERT INTO sync_queue (action_type, entity_type, entity_id, payload, created_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [actionType, entityType, entityId ?? null, JSON.stringify(payload), Date.now()]
  );
  
  console.log(`📥 Queued ${actionType} ${entityType}${entityId ? ` (${entityId})` : ''}`);
  return result.lastInsertRowId;
}

/**
 * Get pending items from sync queue
 */
export async function getPendingActions(): Promise<SyncQueueItem[]> {
  const database = await getDatabase();
  
  const results = await database.getAllAsync<{
    id: number;
    action_type: string;
    entity_type: string;
    entity_id: string | null;
    payload: string;
    created_at: number;
    retry_count: number;
    last_error: string | null;
    status: string;
  }>(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC`
  );
  
  return results.map(r => ({
    id: r.id,
    actionType: r.action_type as 'create' | 'update' | 'delete',
    entityType: r.entity_type,
    entityId: r.entity_id,
    payload: JSON.parse(r.payload),
    createdAt: r.created_at,
    retryCount: r.retry_count,
    lastError: r.last_error,
    status: r.status as 'pending' | 'processing' | 'failed' | 'completed',
  }));
}

/**
 * Mark action as completed
 */
export async function completeAction(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE sync_queue SET status = 'completed' WHERE id = ?`,
    [id]
  );
}

/**
 * Mark action as failed
 */
export async function failAction(id: number, error: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE sync_queue SET status = 'failed', retry_count = retry_count + 1, last_error = ? WHERE id = ?`,
    [error, id]
  );
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ pending: number; failed: number; completed: number }> {
  const database = await getDatabase();
  
  const result = await database.getFirstAsync<{ pending: number; failed: number; completed: number }>(`
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM sync_queue
  `);
  
  return result || { pending: 0, failed: 0, completed: 0 };
}

/**
 * Clear completed actions older than specified days
 */
export async function cleanupQueue(daysOld = 7): Promise<void> {
  const database = await getDatabase();
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  await database.runAsync(
    `DELETE FROM sync_queue WHERE status = 'completed' AND created_at < ?`,
    [cutoff]
  );
}
