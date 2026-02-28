/**
 * 🔄 TREE SYNC SERVICE - Firebase Realtime Sync
 * ═══════════════════════════════════════════════════════════
 * 
 * Syncs family tree data across all devices that share the same tree.
 * 
 * HOW IT WORKS:
 *   1. When a tree is SHARED, it gets a unique `treeId` stored in Firebase
 *   2. When a tree is IMPORTED, the device subscribes to that `treeId`
 *   3. Any device that modifies the tree pushes changes to Firebase
 *   4. All subscribed devices receive real-time updates automatically
 * 
 * DATA STRUCTURE in Firebase:
 *   /trees/{treeId}/
 *     metadata: { name, createdAt, updatedAt, version }
 *     members: { [memberId]: FamilyMember }
 *     relations: [ StoredRelation[] ]
 * 
 * CONFLICT RESOLUTION:
 *   - Last-write-wins with version counter
 *   - Each push increments version
 *   - Devices skip updates if local version >= remote version
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    set as fbSet,
    get,
    off,
    onValue,
    ref,
    type DatabaseReference,
    type Unsubscribe,
} from 'firebase/database';

import { firebaseDb, isFirebaseConfigured } from '../../config/firebase';
import type { FamilyMember, StoredRelation } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface TreeSyncMetadata {
  treeId: string;
  name: string;
  createdBy: string; // device id or member name
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SyncedTreeData {
  metadata: TreeSyncMetadata;
  members: FamilyMember[];
  relations: StoredRelation[];
}

interface LocalSyncInfo {
  treeId: string;
  localVersion: number;
  myIdentityId: string | null; // which member "I am"
  lastSyncAt: string;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY_SYNC = 'vansh_tree_sync_info';
const TREES_PATH = 'trees';

// ═══════════════════════════════════════════════════════════
// SYNC STATE
// ═══════════════════════════════════════════════════════════

let currentListener: Unsubscribe | null = null;
let currentTreeRef: DatabaseReference | null = null;
let localSyncInfo: LocalSyncInfo | null = null;
let syncCallbacks: Array<(data: SyncedTreeData) => void> = [];
let isSyncing = false;

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Firebase rejects `undefined` values — replace them with null recursively.
 */
const sanitizeForFirebase = <T>(obj: T): T =>
  JSON.parse(JSON.stringify(obj, (_key, value) =>
    value === undefined ? null : value
  )) as T;

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Initialize sync — loads local sync info and subscribes to remote updates
 */
export async function initTreeSync(
  onRemoteUpdate: (data: SyncedTreeData) => void
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseDb) {
    console.log('[TreeSync] Firebase not configured, sync disabled');
    return;
  }

  // Load local sync info
  localSyncInfo = await loadLocalSyncInfo();

  if (!localSyncInfo) {
    console.log('[TreeSync] No synced tree found locally');
    return;
  }

  // Subscribe to remote updates
  subscribeToTree(localSyncInfo.treeId, onRemoteUpdate);
  console.log(`[TreeSync] Subscribed to tree: ${localSyncInfo.treeId}`);
}

// ═══════════════════════════════════════════════════════════
// PUBLISH (Upload tree to Firebase)
// ═══════════════════════════════════════════════════════════

/**
 * Publish a tree to Firebase for the first time.
 * Returns the treeId that others can use to subscribe.
 */
export async function publishTree(
  members: FamilyMember[],
  relations: StoredRelation[],
  treeName: string,
  myIdentityId: string | null,
): Promise<string | null> {
  if (!isFirebaseConfigured || !firebaseDb) {
    console.warn('[TreeSync] Firebase not configured');
    return null;
  }

  // Generate a short, readable tree ID
  const treeId = generateTreeId();
  const now = new Date().toISOString();

  const treeData: SyncedTreeData = {
    metadata: {
      treeId,
      name: treeName,
      createdBy: myIdentityId || 'anonymous',
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    members: sanitizeForFirebase(members),
    relations: sanitizeForFirebase(relations),
  };

  try {
    const treeRef = ref(firebaseDb, `${TREES_PATH}/${treeId}`);
    await fbSet(treeRef, treeData);

    // Save sync info locally
    localSyncInfo = {
      treeId,
      localVersion: 1,
      myIdentityId,
      lastSyncAt: now,
    };
    await saveLocalSyncInfo(localSyncInfo);

    console.log(`[TreeSync] Published tree: ${treeId}`);
    return treeId;
  } catch (e) {
    console.error('[TreeSync] Failed to publish tree:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// PUSH CHANGES (Update Firebase when local data changes)
// ═══════════════════════════════════════════════════════════

/**
 * Push local changes to Firebase.
 * Called automatically when the store changes.
 */
export async function pushTreeChanges(
  members: FamilyMember[],
  relations: StoredRelation[],
): Promise<boolean> {
  if (!isFirebaseConfigured || !firebaseDb || !localSyncInfo) {
    return false;
  }

  try {
    isSyncing = true;
    const treeRef = ref(firebaseDb, `${TREES_PATH}/${localSyncInfo.treeId}`);

    // Get current remote version
    const snapshot = await get(treeRef);
    const remoteData = snapshot.val() as SyncedTreeData | null;
    const remoteVersion = remoteData?.metadata?.version || 0;

    const newVersion = Math.max(localSyncInfo.localVersion, remoteVersion) + 1;
    const now = new Date().toISOString();

    const updatedData: SyncedTreeData = {
      metadata: {
        ...(remoteData?.metadata || {
          treeId: localSyncInfo.treeId,
          name: 'Family Tree',
          createdBy: localSyncInfo.myIdentityId || 'unknown',
          createdAt: now,
        }),
        updatedAt: now,
        version: newVersion,
      },
      members: sanitizeForFirebase(members),
      relations: sanitizeForFirebase(relations),
    };

    await fbSet(treeRef, updatedData);

    localSyncInfo.localVersion = newVersion;
    localSyncInfo.lastSyncAt = now;
    await saveLocalSyncInfo(localSyncInfo);

    console.log(`[TreeSync] Pushed changes v${newVersion}`);
    isSyncing = false;
    return true;
  } catch (e) {
    console.error('[TreeSync] Push failed:', e);
    isSyncing = false;
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIBE (Listen for remote changes)
// ═══════════════════════════════════════════════════════════

/**
 * Subscribe to real-time changes on a tree.
 */
function subscribeToTree(
  treeId: string,
  onUpdate: (data: SyncedTreeData) => void,
): void {
  if (!firebaseDb) return;

  // Unsubscribe from previous tree
  unsubscribeFromTree();

  currentTreeRef = ref(firebaseDb, `${TREES_PATH}/${treeId}`);

  onValue(currentTreeRef, (snapshot) => {
    if (isSyncing) return; // Skip echoes of our own writes

    const raw = snapshot.val();
    if (!raw || !raw.metadata) return;

    // Normalize members: Firebase may return an object keyed by index instead of array
    const members: FamilyMember[] = Array.isArray(raw.members)
      ? raw.members
      : Object.values(raw.members || {}) as FamilyMember[];
    const relations: StoredRelation[] = Array.isArray(raw.relations)
      ? raw.relations
      : Object.values(raw.relations || {}) as StoredRelation[];

    const data: SyncedTreeData = { metadata: raw.metadata, members, relations };

    // Skip if we already have this version
    if (localSyncInfo && data.metadata.version <= localSyncInfo.localVersion) {
      return;
    }

    console.log(`[TreeSync] Remote update received v${data.metadata.version}`);

    // Update local version
    if (localSyncInfo) {
      localSyncInfo.localVersion = data.metadata.version;
      localSyncInfo.lastSyncAt = new Date().toISOString();
      saveLocalSyncInfo(localSyncInfo);
    }

    // Notify callback
    onUpdate(data);

    // Notify additional listeners
    syncCallbacks.forEach(cb => cb(data));
  });

  currentListener = () => {
    if (currentTreeRef) {
      off(currentTreeRef);
    }
  };
}

/**
 * Unsubscribe from the current tree.
 */
export function unsubscribeFromTree(): void {
  if (currentListener) {
    currentListener();
    currentListener = null;
    currentTreeRef = null;
  }
}

// ═══════════════════════════════════════════════════════════
// JOIN (Subscribe to an existing tree by ID)
// ═══════════════════════════════════════════════════════════

/**
 * Join a synced tree by its treeId.
 * Fetches the current data and subscribes for updates.
 */
export async function joinSyncedTree(
  treeId: string,
  myIdentityId: string | null,
  onUpdate: (data: SyncedTreeData) => void,
): Promise<SyncedTreeData | null> {
  if (!isFirebaseConfigured || !firebaseDb) {
    console.warn('[TreeSync] Firebase not configured');
    return null;
  }

  try {
    const treeRef = ref(firebaseDb, `${TREES_PATH}/${treeId}`);
    const snapshot = await get(treeRef);
    const data = snapshot.val() as SyncedTreeData | null;

    if (!data) {
      console.warn(`[TreeSync] Tree ${treeId} not found`);
      return null;
    }

    // Save sync info locally
    localSyncInfo = {
      treeId,
      localVersion: data.metadata.version,
      myIdentityId,
      lastSyncAt: new Date().toISOString(),
    };
    await saveLocalSyncInfo(localSyncInfo);

    // Subscribe to updates
    subscribeToTree(treeId, onUpdate);

    console.log(`[TreeSync] Joined tree: ${treeId} (v${data.metadata.version})`);
    return data;
  } catch (e) {
    console.error('[TreeSync] Join failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// SYNC STATUS
// ═══════════════════════════════════════════════════════════

/**
 * Get the current sync status info.
 */
export function getSyncInfo(): LocalSyncInfo | null {
  return localSyncInfo;
}

/**
 * Check if the current tree is synced to Firebase.
 */
export function isTreeSynced(): boolean {
  return localSyncInfo !== null && isFirebaseConfigured;
}

/**
 * Get the current tree ID if synced.
 */
export function getSyncedTreeId(): string | null {
  return localSyncInfo?.treeId || null;
}

/**
 * Add a listener for sync updates.
 */
export function addSyncListener(callback: (data: SyncedTreeData) => void): () => void {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Disconnect sync (e.g., when clearing tree).
 */
export async function disconnectSync(): Promise<void> {
  unsubscribeFromTree();
  localSyncInfo = null;
  await AsyncStorage.removeItem(STORAGE_KEY_SYNC);
  console.log('[TreeSync] Disconnected');
}

// ═══════════════════════════════════════════════════════════
// LOCAL PERSISTENCE
// ═══════════════════════════════════════════════════════════

async function loadLocalSyncInfo(): Promise<LocalSyncInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SYNC);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveLocalSyncInfo(info: LocalSyncInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(info));
  } catch (e) {
    console.warn('[TreeSync] Failed to save sync info:', e);
  }
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Generate a short, human-friendly tree ID.
 * Format: "vansh-XXXX-XXXX" (easy to share/read)
 */
function generateTreeId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no confusing chars
  const part = () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  };
  return `vansh-${part()}-${part()}`;
}
