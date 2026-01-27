/**
 * 🪷 VANSH UTILITIES - ID Generators
 */

import type { FamilyId, KathaId, MemberId, MemoryId, VanshId, VasiyatId } from '../types';

// ═══════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate a random string of specified length
 */
function randomString(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique ID with prefix and timestamp
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a Vansh (app-level) ID
 */
export function generateVanshId(): VanshId {
  return generateId('van') as VanshId;
}

/**
 * Generate a Family ID
 */
export function generateFamilyId(): FamilyId {
  return generateId('fam') as FamilyId;
}

/**
 * Generate a Member ID
 */
export function generateMemberId(): MemberId {
  return generateId('mem') as MemberId;
}

/**
 * Generate a Memory ID
 */
export function generateMemoryId(): MemoryId {
  return generateId('smr') as MemoryId;
}

/**
 * Generate a Katha ID
 */
export function generateKathaId(): KathaId {
  return generateId('kat') as KathaId;
}

/**
 * Generate a Vasiyat ID
 */
export function generateVasiyatId(): VasiyatId {
  return generateId('vas') as VasiyatId;
}

// ═══════════════════════════════════════════════════════════
// INVITE CODES
// ═══════════════════════════════════════════════════════════

/**
 * Generate a human-readable invite code (6 characters)
 */
export function generateInviteCode(): string {
  // Use only uppercase letters and numbers, avoiding confusing chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate an invite code format
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(code);
}

// ═══════════════════════════════════════════════════════════
// ID PARSING
// ═══════════════════════════════════════════════════════════

/**
 * Get the type of an ID from its prefix
 */
export function getIdType(id: string): 'vansh' | 'family' | 'member' | 'memory' | 'katha' | 'vasiyat' | 'unknown' {
  const prefix = id.split('_')[0];
  switch (prefix) {
    case 'van': return 'vansh';
    case 'fam': return 'family';
    case 'mem': return 'member';
    case 'smr': return 'memory';
    case 'kat': return 'katha';
    case 'vas': return 'vasiyat';
    default: return 'unknown';
  }
}

/**
 * Extract timestamp from an ID
 */
export function getIdTimestamp(id: string): Date | null {
  try {
    const parts = id.split('_');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1], 36);
      return new Date(timestamp);
    }
    return null;
  } catch {
    return null;
  }
}
