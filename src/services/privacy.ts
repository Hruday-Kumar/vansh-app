/**
 * 🪷 PRIVACY CONTROLS
 * Data privacy settings and visibility controls
 */

import { secureStorage } from './secure-storage';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type VisibilityLevel = 'public' | 'family' | 'private';

export interface PrivacySettings {
  /** Default visibility for new memories */
  defaultMemoryVisibility: VisibilityLevel;
  /** Default visibility for new kathas */
  defaultKathaVisibility: VisibilityLevel;
  /** Whether to show profile in family search */
  showInFamilySearch: boolean;
  /** Whether to allow family members to tag you */
  allowTagging: boolean;
  /** Whether to show birth date */
  showBirthDate: boolean;
  /** Whether to show contact info */
  showContactInfo: boolean;
  /** Whether to receive family notifications */
  familyNotifications: boolean;
  /** Data sharing consent */
  dataSharing: DataSharingSettings;
}

export interface DataSharingSettings {
  /** Share analytics (anonymized) */
  analytics: boolean;
  /** Share crash reports */
  crashReports: boolean;
  /** Personalized recommendations */
  personalization: boolean;
}

export type FamilyRole = 'admin' | 'elder' | 'member' | 'viewer';

export interface FamilyPermission {
  role: FamilyRole;
  permissions: {
    canAddMembers: boolean;
    canEditMembers: boolean;
    canDeleteMembers: boolean;
    canViewVasiyat: boolean;
    canEditVasiyat: boolean;
    canUploadMemories: boolean;
    canDeleteMemories: boolean;
    canRecordKatha: boolean;
    canManageParampara: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canExportData: boolean;
  };
}

// ═══════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  defaultMemoryVisibility: 'family',
  defaultKathaVisibility: 'family',
  showInFamilySearch: true,
  allowTagging: true,
  showBirthDate: true,
  showContactInfo: false,
  familyNotifications: true,
  dataSharing: {
    analytics: false,
    crashReports: true,
    personalization: false,
  },
};

export const ROLE_PERMISSIONS: Record<FamilyRole, FamilyPermission> = {
  admin: {
    role: 'admin',
    permissions: {
      canAddMembers: true,
      canEditMembers: true,
      canDeleteMembers: true,
      canViewVasiyat: true,
      canEditVasiyat: true,
      canUploadMemories: true,
      canDeleteMemories: true,
      canRecordKatha: true,
      canManageParampara: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canExportData: true,
    },
  },
  elder: {
    role: 'elder',
    permissions: {
      canAddMembers: true,
      canEditMembers: true,
      canDeleteMembers: false,
      canViewVasiyat: true,
      canEditVasiyat: true,
      canUploadMemories: true,
      canDeleteMemories: false,
      canRecordKatha: true,
      canManageParampara: true,
      canInviteMembers: true,
      canRemoveMembers: false,
      canExportData: true,
    },
  },
  member: {
    role: 'member',
    permissions: {
      canAddMembers: false,
      canEditMembers: false,
      canDeleteMembers: false,
      canViewVasiyat: false,
      canEditVasiyat: false,
      canUploadMemories: true,
      canDeleteMemories: false,
      canRecordKatha: true,
      canManageParampara: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canExportData: false,
    },
  },
  viewer: {
    role: 'viewer',
    permissions: {
      canAddMembers: false,
      canEditMembers: false,
      canDeleteMembers: false,
      canViewVasiyat: false,
      canEditVasiyat: false,
      canUploadMemories: false,
      canDeleteMemories: false,
      canRecordKatha: false,
      canManageParampara: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canExportData: false,
    },
  },
};

// ═══════════════════════════════════════════════════════════
// PRIVACY SETTINGS STORAGE
// ═══════════════════════════════════════════════════════════

const PRIVACY_KEY = 'vansh_privacy_settings';

/**
 * Get current privacy settings
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  const stored = await secureStorage.get(PRIVACY_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PRIVACY_SETTINGS;
    }
  }
  return DEFAULT_PRIVACY_SETTINGS;
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  updates: Partial<PrivacySettings>
): Promise<PrivacySettings> {
  const current = await getPrivacySettings();
  const updated = { ...current, ...updates };
  await secureStorage.set(PRIVACY_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Reset privacy settings to defaults
 */
export async function resetPrivacySettings(): Promise<void> {
  await secureStorage.delete(PRIVACY_KEY);
}

// ═══════════════════════════════════════════════════════════
// PERMISSION CHECKING
// ═══════════════════════════════════════════════════════════

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: FamilyRole,
  permission: keyof FamilyPermission['permissions']
): boolean {
  return ROLE_PERMISSIONS[role].permissions[permission];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: FamilyRole): FamilyPermission {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user can perform an action based on their role
 */
export function canPerformAction(
  userRole: FamilyRole,
  action: keyof FamilyPermission['permissions']
): boolean {
  return hasPermission(userRole, action);
}

// ═══════════════════════════════════════════════════════════
// VISIBILITY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Check if content is visible to a user
 */
export function isContentVisible(
  contentVisibility: VisibilityLevel,
  viewerRelation: 'self' | 'family' | 'public'
): boolean {
  switch (contentVisibility) {
    case 'public':
      return true;
    case 'family':
      return viewerRelation === 'self' || viewerRelation === 'family';
    case 'private':
      return viewerRelation === 'self';
  }
}

/**
 * Get visibility label in Hindi
 */
export function getVisibilityLabel(visibility: VisibilityLevel): string {
  switch (visibility) {
    case 'public':
      return 'सार्वजनिक';
    case 'family':
      return 'केवल परिवार';
    case 'private':
      return 'निजी';
  }
}

/**
 * Get role label in Hindi
 */
export function getRoleLabel(role: FamilyRole): string {
  switch (role) {
    case 'admin':
      return 'प्रशासक';
    case 'elder':
      return 'बुज़ुर्ग';
    case 'member':
      return 'सदस्य';
    case 'viewer':
      return 'दर्शक';
  }
}

// ═══════════════════════════════════════════════════════════
// DATA EXPORT & DELETION (GDPR/Privacy compliance)
// ═══════════════════════════════════════════════════════════

export interface DataExportRequest {
  requestedAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  expiresAt?: Date;
}

/**
 * Request data export (for privacy compliance)
 */
export async function requestDataExport(): Promise<DataExportRequest> {
  // This would typically call the backend API
  // For now, return a placeholder
  return {
    requestedAt: new Date(),
    status: 'pending',
  };
}

/**
 * Request account deletion (for privacy compliance)
 */
export async function requestAccountDeletion(): Promise<{ success: boolean; message: string }> {
  // This would typically call the backend API
  // For now, return a placeholder
  return {
    success: true,
    message: 'खाता हटाने का अनुरोध प्राप्त हुआ। 30 दिनों में प्रोसेस किया जाएगा।',
  };
}

// ═══════════════════════════════════════════════════════════
// CONSENT MANAGEMENT
// ═══════════════════════════════════════════════════════════

const CONSENT_KEY = 'vansh_consent_records';

export interface ConsentRecord {
  type: 'privacy_policy' | 'terms_of_service' | 'data_sharing' | 'marketing';
  accepted: boolean;
  timestamp: string;
  version: string;
}

/**
 * Record user consent
 */
export async function recordConsent(
  type: ConsentRecord['type'],
  accepted: boolean,
  version: string
): Promise<void> {
  const stored = await secureStorage.get(CONSENT_KEY);
  const consents: ConsentRecord[] = stored ? JSON.parse(stored) : [];
  
  // Add new consent record
  consents.push({
    type,
    accepted,
    timestamp: new Date().toISOString(),
    version,
  });
  
  await secureStorage.set(CONSENT_KEY, JSON.stringify(consents));
}

/**
 * Get consent history
 */
export async function getConsentHistory(): Promise<ConsentRecord[]> {
  const stored = await secureStorage.get(CONSENT_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Check if user has accepted a specific consent
 */
export async function hasAcceptedConsent(type: ConsentRecord['type']): Promise<boolean> {
  const history = await getConsentHistory();
  const latest = history
    .filter(c => c.type === type)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  return latest?.accepted ?? false;
}
