/**
 * 🪷 VANSH NAVIGATION TYPES
 * Type-safe navigation across the app
 */

import type { KathaId, MemberId, MemoryId, VasiyatId } from '../types';

// ═══════════════════════════════════════════════════════════
// ROOT NAVIGATION
// ═══════════════════════════════════════════════════════════

export type RootStackParamList = {
  // Auth flow
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Onboarding
  Onboarding: undefined;
  FamilySetup: undefined;
  ProfileSetup: { familyId: string };
  InviteFamily: { familyId: string };
  
  // Main app
  Main: undefined;
  
  // Modals
  MemoryViewer: { memoryId: MemoryId };
  KathaPlayer: { kathaId: KathaId };
  MemberProfile: { memberId: MemberId };
  VasiyatViewer: { vasiyatId: VasiyatId };
  VasiyatCreator: undefined;
  KathaRecorder: { linkedMemoryId?: MemoryId };
  MemoryUpload: undefined;
  Settings: undefined;
};

// ═══════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════

export type TabParamList = {
  index: undefined; // Time River (Home)
  smriti: undefined; // Memories
  katha: undefined; // Voice Stories
  vriksha: undefined; // Family Tree
  vasiyat: undefined; // Wisdom Vault
};

// ═══════════════════════════════════════════════════════════
// FEATURE-SPECIFIC PARAMS
// ═══════════════════════════════════════════════════════════

export interface MemoryViewerParams {
  memoryId: MemoryId;
  initialIndex?: number;
  fromGallery?: boolean;
}

export interface KathaPlayerParams {
  kathaId: KathaId;
  autoPlay?: boolean;
  timestamp?: number;
}

export interface MemberProfileParams {
  memberId: MemberId;
  highlightRelation?: MemberId;
}

export interface VasiyatViewerParams {
  vasiyatId: VasiyatId;
  attemptUnlock?: boolean;
}

// ═══════════════════════════════════════════════════════════
// DEEP LINK PATHS
// ═══════════════════════════════════════════════════════════

export const DeepLinkPaths = {
  // Family invites
  joinFamily: 'vansh://join/:inviteCode',
  
  // Direct content
  memory: 'vansh://memory/:memoryId',
  katha: 'vansh://katha/:kathaId',
  member: 'vansh://member/:memberId',
  vasiyat: 'vansh://vasiyat/:vasiyatId',
  
  // Actions
  recordKatha: 'vansh://record',
  uploadMemory: 'vansh://upload',
} as const;

// ═══════════════════════════════════════════════════════════
// NAVIGATION STATE
// ═══════════════════════════════════════════════════════════

export interface NavigationState {
  isReady: boolean;
  currentRoute: string | null;
  previousRoute: string | null;
  routeParams: Record<string, unknown>;
  
  // For deep linking
  pendingDeepLink: string | null;
  
  // Modal state
  activeModal: keyof RootStackParamList | null;
  modalParams: Record<string, unknown>;
}

export const initialNavigationState: NavigationState = {
  isReady: false,
  currentRoute: null,
  previousRoute: null,
  routeParams: {},
  pendingDeepLink: null,
  activeModal: null,
  modalParams: {},
};
