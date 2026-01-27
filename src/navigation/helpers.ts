/**
 * 🪷 VANSH NAVIGATION HELPERS
 * Utility functions for navigation
 */

import { router } from 'expo-router';
import type { KathaId, MemberId, MemoryId, VasiyatId } from '../types';

// ═══════════════════════════════════════════════════════════
// MODAL NAVIGATION
// ═══════════════════════════════════════════════════════════

/**
 * Open memory viewer modal
 */
export function openMemoryViewer(memoryId: MemoryId) {
  router.push({
    pathname: '/modal',
    params: { type: 'memory', id: memoryId },
  });
}

/**
 * Open katha player modal
 */
export function openKathaPlayer(kathaId: KathaId, autoPlay = true) {
  router.push({
    pathname: '/modal',
    params: { type: 'katha', id: kathaId, autoPlay: autoPlay ? '1' : '0' },
  });
}

/**
 * Open member profile modal
 */
export function openMemberProfile(memberId: MemberId) {
  router.push({
    pathname: '/modal',
    params: { type: 'member', id: memberId },
  });
}

/**
 * Open vasiyat viewer modal
 */
export function openVasiyatViewer(vasiyatId: VasiyatId) {
  router.push({
    pathname: '/modal',
    params: { type: 'vasiyat', id: vasiyatId },
  });
}

/**
 * Open vasiyat creator
 */
export function openVasiyatCreator() {
  router.push({
    pathname: '/modal',
    params: { type: 'vasiyat-create' },
  });
}

/**
 * Open katha recorder
 */
export function openKathaRecorder(linkedMemoryId?: MemoryId) {
  router.push({
    pathname: '/modal',
    params: { 
      type: 'katha-record',
      ...(linkedMemoryId && { linkedMemory: linkedMemoryId }),
    },
  });
}

/**
 * Open memory upload
 */
export function openMemoryUpload() {
  router.push({
    pathname: '/modal',
    params: { type: 'memory-upload' },
  });
}

// ═══════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════

/**
 * Navigate to a specific tab
 */
export function navigateToTab(tab: 'index' | 'smriti' | 'katha' | 'vriksha' | 'vasiyat') {
  const routes: Record<string, string> = {
    index: '/(tabs)',
    smriti: '/(tabs)/smriti',
    katha: '/(tabs)/katha',
    vriksha: '/(tabs)/vriksha',
    vasiyat: '/(tabs)/vasiyat',
  };
  router.push(routes[tab] as any);
}

/**
 * Navigate to home (Time River)
 */
export function navigateToHome() {
  router.push('/(tabs)');
}

/**
 * Navigate to memories
 */
export function navigateToMemories() {
  router.push('/(tabs)/smriti');
}

/**
 * Navigate to stories
 */
export function navigateToStories() {
  router.push('/(tabs)/katha');
}

/**
 * Navigate to family tree
 */
export function navigateToFamilyTree() {
  router.push('/(tabs)/vriksha');
}

/**
 * Navigate to wisdom vault
 */
export function navigateToWisdomVault() {
  router.push('/(tabs)/vasiyat');
}

// ═══════════════════════════════════════════════════════════
// DEEP LINK HANDLING
// ═══════════════════════════════════════════════════════════

export interface ParsedDeepLink {
  type: 'memory' | 'katha' | 'member' | 'vasiyat' | 'invite' | 'unknown';
  id?: string;
  params?: Record<string, string>;
}

/**
 * Parse a deep link URL into structured data
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    // Remove scheme
    const path = url.replace(/^vansh:\/\//, '');
    const [type, ...rest] = path.split('/');
    
    switch (type) {
      case 'memory':
        return { type: 'memory', id: rest[0] };
      case 'katha':
        return { type: 'katha', id: rest[0] };
      case 'member':
        return { type: 'member', id: rest[0] };
      case 'vasiyat':
        return { type: 'vasiyat', id: rest[0] };
      case 'join':
        return { type: 'invite', id: rest[0] };
      default:
        return { type: 'unknown' };
    }
  } catch {
    return { type: 'unknown' };
  }
}

/**
 * Handle a deep link by navigating to the appropriate screen
 */
export function handleDeepLink(url: string) {
  const parsed = parseDeepLink(url);
  
  switch (parsed.type) {
    case 'memory':
      if (parsed.id) openMemoryViewer(parsed.id as MemoryId);
      break;
    case 'katha':
      if (parsed.id) openKathaPlayer(parsed.id as KathaId);
      break;
    case 'member':
      if (parsed.id) openMemberProfile(parsed.id as MemberId);
      break;
    case 'vasiyat':
      if (parsed.id) openVasiyatViewer(parsed.id as VasiyatId);
      break;
    case 'invite':
      // Handle family invite - navigate to join flow
      router.push({
        pathname: '/(auth)/join' as any,
        params: { code: parsed.id },
      });
      break;
    default:
      // Unknown link, go home
      navigateToHome();
  }
}

// ═══════════════════════════════════════════════════════════
// SHARE LINKS
// ═══════════════════════════════════════════════════════════

/**
 * Generate a shareable link for content
 */
export function generateShareLink(
  type: 'memory' | 'katha' | 'member' | 'vasiyat',
  id: string
): string {
  return `https://vansh.app/${type}/${id}`;
}

/**
 * Generate a family invite link
 */
export function generateInviteLink(inviteCode: string): string {
  return `https://vansh.app/join/${inviteCode}`;
}
