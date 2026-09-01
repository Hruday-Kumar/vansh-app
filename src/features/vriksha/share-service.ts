/**
 * 🔗 SHARE SERVICE - Family Tree Sharing (v3)
 * ═══════════════════════════════════════════════════════════
 *
 * Multiple sharing methods:
 *   1. Compact Share Code  — short text code via WhatsApp/SMS
 *   2. File Share (.vansh) — JSON file via any messaging app
 *
 * Share modes:
 *   - 'view_only'      → Read-only: recipient can view the tree
 *   - 'invite_to_join'  → Editable: recipient can view AND add members
 *
 * v3 improvements over v2:
 *   - ID remapping: UUIDs → short numeric indices (0, 1, 2...)
 *   - Pipe-delimited format: no JSON keys/braces/quotes overhead
 *   - Deflate compression via pako (60-70% compression on top)
 *   - Common familyId stored once, not per member
 *   - Supports 15-20+ members in a single QR code
 *   - Backwards-compatible: still decodes v1 and v2 codes
 *
 * v2 improvements over v1:
 *   - Base64url encoding (no +/= chars that break in messaging apps)
 *   - Aggressively minified keys (60-70% smaller)
 *   - Whitespace/invisible-char stripping on decode (fixes WhatsApp line-wrap bug)
 *   - File-based sharing for large trees
 *   - Backwards-compatible: still decodes v1 codes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { deflate, inflate } from 'pako';
import { Share } from 'react-native';
import type { BasicRelationType, FamilyMember, StoredRelation } from './vriksha-store';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type ShareMode = 'view_only' | 'invite_to_join';

/** The decoded payload (canonical form) */
export interface SharePayload {
  v: number;              // version
  mode: ShareMode;
  name: string;           // sharer's display name
  ts: string;             // ISO timestamp
  syncTreeId?: string;    // Remote tree ID for auto-sync (sync disabled, see tree-sync-service.ts)
  data: {
    members: FamilyMember[];
    relations: StoredRelation[];
    rootMemberId: string;
  };
}

/** Backwards-compat: ShareToken for SharedTreeView */
export interface ShareToken {
  id: string;
  token: string;
  mode: ShareMode;
  memberId: string;
  memberName: string;
  familyId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  isActive: boolean;
  treeSnapshot?: {
    members: FamilyMember[];
    relations: StoredRelation[];
    rootMemberId: string;
  };
}

export interface ImportedTree {
  id: string;
  mode: ShareMode;
  sharedBy: string;
  importedAt: string;
  memberCount: number;
  members: FamilyMember[];
  relations: StoredRelation[];
  rootMemberId: string;
}

// ═══════════════════════════════════════════════════════════
// COMPACT v2 TYPES  (minified keys for small codes)
// ═══════════════════════════════════════════════════════════

/** Compact member — single-char keys */
interface CompactMember {
  i: string;              // id
  f: string;              // firstName
  l: string;              // lastName
  g: 'm' | 'f' | 'o';    // gender: male/female/other
  b?: string;             // birthDate
  d?: string;             // deathDate
  a: boolean;             // isAlive (alive)
  o?: string;             // occupation
  p?: string;             // birthPlace
  c?: string;             // currentCity
  fi: string;             // familyId
}

/** Compact relation */
interface CompactRelation {
  f: string;              // fromMemberId
  t: string;              // toMemberId
  y: string;              // type
  s?: string;             // subtype
}

/** Compact payload (v2 wire format) */
interface CompactPayload {
  v: 2;
  m: 'v' | 'e';          // mode: view_only / invite_to_join (edit)
  n: string;              // name
  t: string;              // timestamp (compact: epoch seconds in base36)
  s?: string;             // syncTreeId (optional, for live sync)
  d: {
    M: CompactMember[];   // members
    R: CompactRelation[]; // relations
    r: string;            // rootMemberId
  };
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const V1_PREFIX = 'VANSH:1:';
const V2_PREFIX = 'VANSH:2:';
const V3_PREFIX = 'VANSH:3:';
const STORAGE_KEY_IMPORTS = '@vansh/imported_trees';

// ═══════════════════════════════════════════════════════════
// BASE64URL — URL-safe base64 (no +/= that break in SMS/WhatsApp)
// ═══════════════════════════════════════════════════════════

/**
 * Encode a UTF-8 string to base64url.
 * Pure JS implementation — works in ALL JS runtimes (Hermes, V8, JSC).
 * Does NOT rely on btoa which can be buggy in some Hermes versions.
 */
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64url(str: string): string {
  // Step 1: UTF-8 encode via encodeURIComponent
  const utf8 = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/gi,
    (_match, hex) => String.fromCharCode(parseInt(hex, 16)),
  );

  // Step 2: Manual base64 encode (pure JS, no btoa)
  let b64 = '';
  for (let i = 0; i < utf8.length; i += 3) {
    const a = utf8.charCodeAt(i);
    const bVal = i + 1 < utf8.length ? utf8.charCodeAt(i + 1) : 0;
    const c = i + 2 < utf8.length ? utf8.charCodeAt(i + 2) : 0;
    b64 += B64_CHARS[a >> 2];
    b64 += B64_CHARS[((a & 3) << 4) | (bVal >> 4)];
    b64 += i + 1 < utf8.length ? B64_CHARS[((bVal & 15) << 2) | (c >> 6)] : '=';
    b64 += i + 2 < utf8.length ? B64_CHARS[c & 63] : '=';
  }

  // Step 3: Convert to base64url (URL-safe, no padding)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64url string back to UTF-8.
 * Pure JS implementation — works in ALL JS runtimes.
 * Does NOT rely on atob which can be buggy in some Hermes versions.
 */
function fromBase64url(b64url: string): string {
  // Step 1: base64url → standard base64
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Re-add padding
  while (b64.length % 4 !== 0) b64 += '=';

  // Step 2: Manual base64 decode (pure JS, no atob)
  let binary = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of b64) {
    if (ch === '=') break;
    const idx = B64_CHARS.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      binary += String.fromCharCode((buffer >> bits) & 0xFF);
    }
  }

  // Step 3: Decode UTF-8 via decodeURIComponent
  const percent = binary
    .split('')
    .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  return decodeURIComponent(percent);
}

// ═══════════════════════════════════════════════════════════
// v1 COMPAT — old base64 functions (for decoding legacy codes)
// ═══════════════════════════════════════════════════════════

function base64ToUtf8(b64: string): string {
  // Just use fromBase64url — it handles both base64 and base64url
  return fromBase64url(b64);
}

// ═══════════════════════════════════════════════════════════
// COMPACT / EXPAND — Convert between full and compact formats
// ═══════════════════════════════════════════════════════════

function genderToCompact(g: string): 'm' | 'f' | 'o' {
  if (g === 'male') return 'm';
  if (g === 'female') return 'f';
  return 'o';
}

function genderFromCompact(g: 'm' | 'f' | 'o'): 'male' | 'female' | 'other' {
  if (g === 'm') return 'male';
  if (g === 'f') return 'female';
  return 'other';
}

function compactMemberV2(m: FamilyMember): CompactMember {
  const cm: CompactMember = {
    i: m.id,
    f: m.firstName,
    l: m.lastName || '',
    g: genderToCompact(m.gender),
    a: m.isAlive,
    fi: m.familyId || 'fam',
  };
  // Only include non-empty optional fields
  if (m.birthDate) cm.b = m.birthDate;
  if (m.deathDate) cm.d = m.deathDate;
  if (m.occupation) cm.o = m.occupation;
  if (m.birthPlace) cm.p = m.birthPlace;
  if (m.currentCity) cm.c = m.currentCity;
  return cm;
}

function expandMemberV2(cm: CompactMember): FamilyMember {
  return {
    id: cm.i,
    firstName: cm.f,
    lastName: cm.l,
    gender: genderFromCompact(cm.g),
    isAlive: cm.a,
    familyId: cm.fi || 'fam',
    birthDate: cm.b,
    deathDate: cm.d,
    occupation: cm.o,
    birthPlace: cm.p,
    currentCity: cm.c,
    memoryCount: 0,
    kathaCount: 0,
    hasVoiceSamples: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function compactRelationV2(r: StoredRelation): CompactRelation {
  const cr: CompactRelation = {
    f: r.fromMemberId,
    t: r.toMemberId,
    y: r.type,
  };
  if (r.subtype) cr.s = r.subtype;
  return cr;
}

function expandRelationV2(cr: CompactRelation): StoredRelation {
  return {
    id: `rel_${cr.f}_${cr.t}`,
    fromMemberId: cr.f,
    toMemberId: cr.t,
    type: cr.y as BasicRelationType,
    subtype: cr.s,
    createdAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════
// v3 ULTRA-COMPACT — Pipe-delimited + Deflate compression
// ═══════════════════════════════════════════════════════════

/**
 * v3 wire format (pipe-delimited, deflate-compressed):
 *
 * Header line:    3|<mode:v/e>|<name>|<timestamp_b36>|<familyId>|<syncTreeId?>|<rootIdx>
 * Member lines:   M|<idx>|<firstName>|<lastName>|<gender:m/f/o>|<alive:1/0>|<birth?>|<death?>|<occ?>|<place?>|<city?>
 * Relation lines: R|<fromIdx>|<toIdx>|<type>|<subtype?>
 *
 * All fields joined by newlines, then deflated, then base64url encoded.
 * Member IDs are remapped to short numeric indices (0, 1, 2...).
 *
 * Typical size: ~25 chars per member vs ~95 in v2.
 * Supports 15-20+ members in a QR code (vs ~4 in v2).
 */

/** Encode bytes (Uint8Array) to base64url string */
function bytesToBase64url(bytes: Uint8Array): string {
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const bVal = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    b64 += B64_CHARS[a >> 2];
    b64 += B64_CHARS[((a & 3) << 4) | (bVal >> 4)];
    b64 += i + 1 < bytes.length ? B64_CHARS[((bVal & 15) << 2) | (c >> 6)] : '=';
    b64 += i + 2 < bytes.length ? B64_CHARS[c & 63] : '=';
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode base64url string to bytes (Uint8Array) */
function base64urlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';

  const byteArr: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of b64) {
    if (ch === '=') break;
    const idx = B64_CHARS.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      byteArr.push((buffer >> bits) & 0xFF);
    }
  }
  return new Uint8Array(byteArr);
}

/** Escape pipe chars in user data to prevent delimiter collision */
function esc(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/\|/g, '\\|').replace(/\n/g, '\\n');
}

/** Unescape pipe chars */
function unesc(s: string): string {
  if (!s) return '';
  return s.replace(/\\\|/g, '|').replace(/\\n/g, '\n');
}

function encodeV3(params: {
  mode: ShareMode;
  memberName: string;
  members: FamilyMember[];
  relations: StoredRelation[];
  rootMemberId: string;
  syncTreeId?: string;
}): string {
  // Step 1: Remap member IDs to short numeric indices
  const idMap = new Map<string, number>();
  params.members.forEach((m, idx) => idMap.set(m.id, idx));

  const rootIdx = idMap.get(params.rootMemberId) ?? 0;
  const familyId = params.members[0]?.familyId || 'fam';

  // Step 2: Build pipe-delimited lines
  const lines: string[] = [];

  // Header line
  lines.push([
    '3',
    params.mode === 'view_only' ? 'v' : 'e',
    esc(params.memberName),
    Math.floor(Date.now() / 1000).toString(36),
    esc(familyId),
    esc(params.syncTreeId || ''),
    rootIdx.toString(),
  ].join('|'));

  // Member lines (order = index)
  for (const m of params.members) {
    lines.push([
      'M',
      idMap.get(m.id)!.toString(),
      esc(m.firstName),
      esc(m.lastName || ''),
      genderToCompact(m.gender),
      m.isAlive ? '1' : '0',
      m.birthDate || '',
      m.deathDate || '',
      esc(m.occupation || ''),
      esc(m.birthPlace || ''),
      esc(m.currentCity || ''),
    ].join('|'));
  }

  // Relation lines (using numeric indices)
  for (const r of params.relations) {
    const fi = idMap.get(r.fromMemberId);
    const ti = idMap.get(r.toMemberId);
    if (fi === undefined || ti === undefined) continue;
    lines.push([
      'R',
      fi.toString(),
      ti.toString(),
      r.type,
      r.subtype || '',
    ].join('|'));
  }

  // Step 3: Join, deflate-compress, base64url-encode
  const raw = lines.join('\n');
  const compressed = deflate(raw, { level: 9 });
  const encoded = bytesToBase64url(compressed);

  return V3_PREFIX + encoded;
}

function decodeV3(compressedBase64url: string): SharePayload | null {
  try {
    // Step 1: base64url-decode → inflate
    const compressed = base64urlToBytes(compressedBase64url);
    const raw = new TextDecoder().decode(inflate(compressed));

    // Step 2: Parse pipe-delimited lines
    const lines = raw.split('\n');
    if (lines.length < 2) return null;

    // Parse header
    const hdr = lines[0].split('|');
    if (hdr[0] !== '3') return null;

    const mode: ShareMode = hdr[1] === 'e' ? 'invite_to_join' : 'view_only';
    const name = unesc(hdr[2]);
    const epochSeconds = parseInt(hdr[3], 36);
    const ts = new Date(epochSeconds * 1000).toISOString();
    const familyId = unesc(hdr[4]) || 'fam';
    const syncTreeId = hdr[5] ? unesc(hdr[5]) : undefined;
    const rootIdx = parseInt(hdr[6], 10);

    // Parse members and relations
    const members: FamilyMember[] = [];
    const relations: StoredRelation[] = [];
    const idxToId = new Map<number, string>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('|');
      if (parts[0] === 'M') {
        const idx = parseInt(parts[1], 10);
        // Generate a stable ID from index for imported members
        const id = `imp_${idx}_${epochSeconds.toString(36)}`;
        idxToId.set(idx, id);
        members.push({
          id,
          firstName: unesc(parts[2]),
          lastName: unesc(parts[3]),
          gender: genderFromCompact(parts[4] as 'm' | 'f' | 'o'),
          isAlive: parts[5] === '1',
          familyId,
          birthDate: parts[6] || undefined,
          deathDate: parts[7] || undefined,
          occupation: unesc(parts[8]) || undefined,
          birthPlace: unesc(parts[9]) || undefined,
          currentCity: unesc(parts[10]) || undefined,
          memoryCount: 0,
          kathaCount: 0,
          hasVoiceSamples: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (parts[0] === 'R') {
        const fi = parseInt(parts[1], 10);
        const ti = parseInt(parts[2], 10);
        const fromId = idxToId.get(fi);
        const toId = idxToId.get(ti);
        if (!fromId || !toId) continue;
        relations.push({
          id: `rel_${fromId}_${toId}`,
          fromMemberId: fromId,
          toMemberId: toId,
          type: parts[3] as BasicRelationType,
          subtype: parts[4] || undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const rootId = idxToId.get(rootIdx);
    if (!rootId || members.length === 0) return null;

    return {
      v: 3,
      mode,
      name,
      ts,
      syncTreeId,
      data: { members, relations, rootMemberId: rootId },
    };
  } catch (e) {
    console.warn('[ShareService] v3 decode failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// ENCODE — Tree → Share Code (v3 ultra-compact, fallback v2)
// ═══════════════════════════════════════════════════════════

/**
 * Encode the family tree as a share code.
 *
 * Uses v3 ultra-compact format by default (deflate + pipe-delimited).
 * Falls back to v2 if v3 somehow fails.
 *
 * v3 typical size: ~25 chars per member (vs ~95 in v2).
 * Supports 15-20+ members in a QR code.
 */
export function encodeTreeAsShareCode(params: {
  mode: ShareMode;
  memberName: string;
  members: FamilyMember[];
  relations: StoredRelation[];
  rootMemberId: string;
  syncTreeId?: string;
}): string {
  try {
    // Try v3 first (much smaller)
    return encodeV3(params);
  } catch (e) {
    console.warn('[ShareService] v3 encode failed, falling back to v2:', e);
    // Fallback to v2
    const compact: CompactPayload = {
      v: 2,
      m: params.mode === 'view_only' ? 'v' : 'e',
      n: params.memberName,
      t: Math.floor(Date.now() / 1000).toString(36),
      ...(params.syncTreeId ? { s: params.syncTreeId } : {}),
      d: {
        M: params.members.map(compactMemberV2),
        R: params.relations.map(compactRelationV2),
        r: params.rootMemberId,
      },
    };

    const json = JSON.stringify(compact);
    const encoded = toBase64url(json);
    return V2_PREFIX + encoded;
  }
}

/**
 * Get estimated character count for share code.
 * Helps decide whether to use code sharing or file sharing.
 */
export function estimateShareCodeSize(memberCount: number, relationCount: number): number {
  // v3 estimate: ~25 chars per member + ~10 per relation + overhead,
  // then compressed ~40%, then base64 expansion ~1.37x
  return Math.round((memberCount * 25 + relationCount * 10 + 50) * 0.4 * 1.37);
}

// ═══════════════════════════════════════════════════════════
// DECODE — Share Code → Tree Data (supports v1 + v2)
// ═══════════════════════════════════════════════════════════

/**
 * Clean up a pasted share code.
 * Strips whitespace, invisible Unicode chars, line breaks, etc.
 * that messaging apps (WhatsApp, SMS) inject into long text.
 */
function cleanShareCode(raw: string): string {
  let cleaned = raw.trim();

  // Find the VANSH prefix (try v3 first, then v2, then v1)
  const v3Idx = cleaned.indexOf('VANSH:3:');
  const v2Idx = cleaned.indexOf('VANSH:2:');
  const v1Idx = cleaned.indexOf('VANSH:1:');
  const prefixIdx = v3Idx !== -1 ? v3Idx : v2Idx !== -1 ? v2Idx : v1Idx;
  if (prefixIdx === -1) return '';

  const version = v3Idx !== -1 && (v2Idx === -1 || v3Idx <= v2Idx) && (v1Idx === -1 || v3Idx <= v1Idx) ? 3
    : v2Idx !== -1 && (v1Idx === -1 || v2Idx <= v1Idx) ? 2 : 1;
  const prefix = `VANSH:${version}:`;
  const afterPrefix = cleaned.substring(prefixIdx + prefix.length);

  // ★ KEY FIX: Strip ALL whitespace, newlines, zero-width chars, quotes,
  // and any non-base64url character. This fixes the WhatsApp line-wrap bug
  // where the old regex would stop at the first newline and truncate the code.
  const base64Only = afterPrefix.replace(/[^A-Za-z0-9+/=\-_]/g, '');

  return prefix + base64Only;
}

/**
 * Decode a v2 compact payload into a canonical SharePayload.
 */
function decodeV2(base64urlData: string): SharePayload | null {
  try {
    const json = fromBase64url(base64urlData);
    const compact = JSON.parse(json) as CompactPayload;

    if (compact.v !== 2) return null;
    if (!compact.d?.M || !compact.d?.R || !compact.d?.r) return null;

    const mode: ShareMode = compact.m === 'e' ? 'invite_to_join' : 'view_only';
    const epochSeconds = parseInt(compact.t, 36);
    const ts = new Date(epochSeconds * 1000).toISOString();

    return {
      v: 2,
      mode,
      name: compact.n,
      ts,
      syncTreeId: compact.s,
      data: {
        members: compact.d.M.map(expandMemberV2),
        relations: compact.d.R.map(expandRelationV2),
        rootMemberId: compact.d.r,
      },
    };
  } catch (e) {
    console.warn('[ShareService] v2 decode failed:', e);
    return null;
  }
}

/**
 * Decode a v1 payload (backwards compat).
 */
function decodeV1(base64Data: string): SharePayload | null {
  try {
    const json = base64ToUtf8(base64Data);
    const payload = JSON.parse(json) as SharePayload;

    if (payload.v !== 1) return null;
    if (!payload.mode || !payload.data) return null;
    if (!payload.data.members || !Array.isArray(payload.data.members)) return null;
    if (!payload.data.relations || !Array.isArray(payload.data.relations)) return null;
    if (!payload.data.rootMemberId) return null;

    // Ensure all members have required fields
    payload.data.members = payload.data.members.map(m => ({
      ...m,
      memoryCount: m.memoryCount ?? 0,
      kathaCount: m.kathaCount ?? 0,
      hasVoiceSamples: m.hasVoiceSamples ?? false,
      createdAt: m.createdAt ?? new Date().toISOString(),
      updatedAt: m.updatedAt ?? new Date().toISOString(),
    }));

    return payload;
  } catch (e) {
    console.warn('[ShareService] v1 decode failed:', e);
    return null;
  }
}

/**
 * Decode a share code (v1 or v2) back into tree data.
 * Returns null if the code is invalid.
 *
 * Robust against:
 *   - WhatsApp line wrapping / text mangling
 *   - SMS character escaping
 *   - Invisible Unicode characters (zero-width spaces etc.)
 *   - Partial copies with surrounding text
 */
export function decodeShareCode(code: string): SharePayload | null {
  try {
    const cleaned = cleanShareCode(code);
    if (!cleaned) return null;

    // Try v3 first (deflate-compressed)
    if (cleaned.startsWith(V3_PREFIX)) {
      const data = cleaned.substring(V3_PREFIX.length);
      const result = decodeV3(data);
      if (result) return result;
    }

    // Try v2
    if (cleaned.startsWith(V2_PREFIX)) {
      const data = cleaned.substring(V2_PREFIX.length);
      const result = decodeV2(data);
      if (result) return result;
    }

    // Fall back to v1
    if (cleaned.startsWith(V1_PREFIX) || cleaned.includes(V1_PREFIX)) {
      const startIdx = cleaned.indexOf(V1_PREFIX);
      const data = cleaned.substring(startIdx + V1_PREFIX.length);
      const result = decodeV1(data);
      if (result) return result;
    }

    // Last resort: try all decoders on raw data (in case prefix mismatch)
    const rawData = cleaned.replace(/^VANSH:\d:/, '');
    return decodeV3(rawData) || decodeV2(rawData) || decodeV1(rawData);
  } catch (e) {
    console.warn('[ShareService] Failed to decode share code:', e);
    return null;
  }
}

/**
 * Build a ShareToken from a decoded payload (for SharedTreeView compatibility).
 */
export function payloadToShareToken(payload: SharePayload): ShareToken {
  return {
    id: `import_${Date.now()}`,
    token: '',
    mode: payload.mode,
    memberId: payload.data.rootMemberId,
    memberName: payload.name,
    familyId: 'imported',
    createdBy: 'imported',
    createdAt: payload.ts,
    expiresAt: null,
    maxUses: null,
    uses: 0,
    isActive: true,
    treeSnapshot: payload.data,
  };
}

// ═══════════════════════════════════════════════════════════
// SHARE VIA NATIVE SHARE SHEET (Text Code)
// ═══════════════════════════════════════════════════════════

export async function shareTreeCode(params: {
  shareCode: string;
  memberName: string;
  memberCount: number;
  mode: ShareMode;
}): Promise<boolean> {
  const modeEmoji = params.mode === 'view_only' ? '👀' : '✏️';
  const modeText = params.mode === 'view_only'
    ? 'View my family tree'
    : 'Join & add to my family tree';

  const message = [
    `🌳 ${modeText}`,
    '',
    `I'm sharing ${params.memberName}'s family tree (${params.memberCount} members) on Vansh.`,
    '',
    `${modeEmoji} To import: Open Vansh app → Tree tab → tap Import (⬇) → paste this code:`,
    '',
    params.shareCode,
  ].join('\n');

  try {
    const result = await Share.share(
      { message },
      { dialogTitle: 'Share Family Tree' },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// FILE-BASED SHARING (.vansh files)
// ═══════════════════════════════════════════════════════════

/**
 * Export tree as a .json file and share it via native share sheet.
 * Uses expo-sharing + expo-file-system for real file attachment sharing.
 * Works in Expo Go!
 */
export async function shareTreeAsFile(params: {
  mode: ShareMode;
  memberName: string;
  members: FamilyMember[];
  relations: StoredRelation[];
  rootMemberId: string;
  syncTreeId?: string;
}): Promise<boolean> {
  try {
    // Build the full payload (human-readable JSON, easy to import)
    const payload: SharePayload = {
      v: 2,
      mode: params.mode,
      name: params.memberName,
      ts: new Date().toISOString(),
      syncTreeId: params.syncTreeId,
      data: {
        members: params.members.map(m => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          gender: m.gender,
          birthDate: m.birthDate,
          deathDate: m.deathDate,
          isAlive: m.isAlive,
          occupation: m.occupation,
          birthPlace: m.birthPlace,
          currentCity: m.currentCity,
          familyId: m.familyId,
          memoryCount: 0,
          kathaCount: 0,
          hasVoiceSamples: false,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString(),
        } as FamilyMember)),
        relations: params.relations.map(r => ({
          id: r.id || `rel_${r.fromMemberId}_${r.toMemberId}`,
          fromMemberId: r.fromMemberId,
          toMemberId: r.toMemberId,
          type: r.type,
          subtype: r.subtype,
          createdAt: r.createdAt || new Date().toISOString(),
        })),
        rootMemberId: params.rootMemberId,
      },
    };

    // Write to a temp JSON file using expo-file-system v19 API
    // Using require() to prevent auto-import-organizer from stripping the import
     
    const EFS = require('expo-file-system');
    const safeName = params.memberName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}_family_tree.json`;
    const file = new EFS.File(EFS.Paths.cache, fileName);
    file.write(JSON.stringify(payload, null, 2));
    const fileUri: string = file.uri;

    // Check if sharing is available (it always is on iOS/Android)
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      // Fallback to text share with code
      const shareCode = encodeTreeAsShareCode(params);
      await Share.share({ message: shareCode });
      return true;
    }

    // Share the actual file as an attachment!
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: `Share ${params.memberName}'s Family Tree`,
      UTI: 'public.json',
    });

    return true;
  } catch (e) {
    console.warn('[ShareService] File share failed:', e);
    return false;
  }
}

/**
 * Import a tree from raw JSON text (e.g., pasted or read from a file).
 */
export async function importTreeFromFile(jsonContent: string): Promise<SharePayload | null> {
  try {
    const payload = JSON.parse(jsonContent) as SharePayload;

    if (!payload.data?.members || !payload.data?.relations || !payload.data?.rootMemberId) {
      return null;
    }

    // Ensure all members have required fields
    payload.data.members = payload.data.members.map(m => ({
      ...m,
      memoryCount: m.memoryCount ?? 0,
      kathaCount: m.kathaCount ?? 0,
      hasVoiceSamples: m.hasVoiceSamples ?? false,
      createdAt: m.createdAt ?? new Date().toISOString(),
      updatedAt: m.updatedAt ?? new Date().toISOString(),
    }));

    return payload;
  } catch (e) {
    console.warn('[ShareService] JSON import failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// IMPORT — Save imported tree locally
// ═══════════════════════════════════════════════════════════

export async function saveImportedTree(payload: SharePayload): Promise<ImportedTree> {
  const imported: ImportedTree = {
    id: `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mode: payload.mode,
    sharedBy: payload.name,
    importedAt: new Date().toISOString(),
    memberCount: payload.data.members.length,
    members: payload.data.members,
    relations: payload.data.relations,
    rootMemberId: payload.data.rootMemberId,
  };

  const imports = await getAllImports();
  imports.push(imported);
  await AsyncStorage.setItem(STORAGE_KEY_IMPORTS, JSON.stringify(imports));
  return imported;
}

export async function getImportedTrees(): Promise<ImportedTree[]> {
  return getAllImports();
}

// ═══════════════════════════════════════════════════════════
// LOCAL PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════

async function getAllImports(): Promise<ImportedTree[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_IMPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
