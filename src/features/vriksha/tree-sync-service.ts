/**
 * 🔄 TREE SYNC SERVICE — disabled
 * ═══════════════════════════════════════════════════════════
 *
 * The Firebase-backed implementation was removed in Phase 0
 * Workstream 0.1 (the Realtime Database was publicly readable/writable).
 * Cross-device tree sync returns in Phase 0 Workstream 0.4 on top of
 * Postgres + core/sync — see docs/phases/phase-0-foundation.md.
 *
 * All exports below keep their original signatures as no-ops so callers
 * don't need to change until the core/sync rebuild replaces this file.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FamilyMember, StoredRelation } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface TreeSyncMetadata {
  treeId: string;
  name: string;
  createdBy: string;
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
  myIdentityId: string | null;
  lastSyncAt: string;
}

const STORAGE_KEY_SYNC = 'vansh_tree_sync_info';

export const isFirebaseConfigured = false;

export async function initTreeSync(
  _onRemoteUpdate: (data: SyncedTreeData) => void
): Promise<void> {
  console.log('[TreeSync] Sync disabled (Phase 0 Workstream 0.1)');
}

export async function publishTree(
  _members: FamilyMember[],
  _relations: StoredRelation[],
  _treeName: string,
  _myIdentityId: string | null,
): Promise<string | null> {
  console.warn('[TreeSync] Sync disabled (Phase 0 Workstream 0.1)');
  return null;
}

export async function pushTreeChanges(
  _members: FamilyMember[],
  _relations: StoredRelation[],
): Promise<boolean> {
  return false;
}

export function unsubscribeFromTree(): void {}

export async function joinSyncedTree(
  _treeId: string,
  _myIdentityId: string | null,
  _onUpdate: (data: SyncedTreeData) => void,
): Promise<SyncedTreeData | null> {
  console.warn('[TreeSync] Sync disabled (Phase 0 Workstream 0.1)');
  return null;
}

export function getSyncInfo(): LocalSyncInfo | null {
  return null;
}

export function isTreeSynced(): boolean {
  return false;
}

export function getSyncedTreeId(): string | null {
  return null;
}

export function addSyncListener(_callback: (data: SyncedTreeData) => void): () => void {
  return () => {};
}

export async function disconnectSync(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_SYNC);
}
