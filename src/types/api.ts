/**
 * 🪷 VANSH API TYPES
 * Request/Response types for all API endpoints
 */

import type {
    AncestryPath,
    BhoogolYatra,
    DigitalEcho, EchoMessage,
    Era,
    FamilyId,
    Katha,
    KathaId,
    MemberId,
    MemoryId,
    SmritiMedia,
    TimeRiverItem,
    Vasiyat,
    VasiyatId,
    VrikshaMember
} from './core';

// ═══════════════════════════════════════════════════════════
// COMMON API TYPES
// ═══════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  cursor?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

// ═══════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════

export interface LoginRequest {
  email?: string;
  phone?: string;
  otp: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: MemberId;
    email: string;
    familyId: FamilyId;
    role: 'admin' | 'elder' | 'member' | 'viewer';
  };
}

export interface InviteMemberRequest {
  email?: string;
  phone?: string;
  memberId: MemberId; // Which family member they'll be linked to
  role: 'elder' | 'member' | 'viewer';
}

// ═══════════════════════════════════════════════════════════
// SMRITI (MEMORY) API
// ═══════════════════════════════════════════════════════════

export interface UploadMemoryRequest {
  file: Blob;
  type: 'photo' | 'video' | 'document' | 'audio';
  title?: string;
  description?: string;
  capturedAt?: string; // ISO date
  location?: { latitude: number; longitude: number };
  placeName?: string;
  taggedMembers?: MemberId[];
  tags?: string[];
}

export interface UploadMemoryResponse {
  memory: SmritiMedia;
  aiSuggestions: {
    detectedFaces: Array<{
      boundingBox: { x: number; y: number; width: number; height: number };
      suggestedMemberId?: MemberId;
      suggestedName?: string;
      confidence: number;
    }>;
    suggestedTags: string[];
    suggestedEra?: Era;
    extractedText?: string;
  };
}

export interface GetMemoriesRequest extends PaginationParams {
  familyId: FamilyId;
  memberIds?: MemberId[];
  types?: SmritiMedia['type'][];
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  era?: string;
  searchQuery?: string;
}

export interface GetMemoriesResponse {
  memories: SmritiMedia[];
  meta: ApiMeta;
}

export interface LinkKathaToMemoryRequest {
  memoryId: MemoryId;
  kathaId: KathaId;
  syncPoints?: Array<{
    audioTime: number;
    action: 'show' | 'zoom' | 'highlight';
    target?: { x: number; y: number };
  }>;
}

// ═══════════════════════════════════════════════════════════
// KATHA (VOICE) API - Voice-Photo Stitching
// ═══════════════════════════════════════════════════════════

export interface RecordKathaRequest {
  audioBlob: Blob;
  type: 'voice_overlay' | 'standalone_story' | 'interview' | 'song';
  narratorId: MemberId;
  language: string;
  linkedMemories?: MemoryId[];
  linkedMembers?: MemberId[];
}

export interface RecordKathaResponse {
  katha: Katha;
  transcription: {
    text: string;
    segments: Array<{
      text: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    language: string;
  };
  aiAnalysis: {
    summary: string;
    emotions: Array<{ emotion: string; intensity: number; timestamp: number }>;
    topics: string[];
    suggestedSyncPoints?: Array<{
      audioTime: number;
      matchedMemoryId: MemoryId;
      matchReason: string;
    }>;
  };
}

export interface VoicePhotoStitchRequest {
  kathaId: KathaId;
  memoryIds: MemoryId[];
  mode: 'auto' | 'manual';
  manualSyncPoints?: Array<{
    audioTime: number;
    memoryId: MemoryId;
    action: 'show' | 'zoom' | 'highlight';
    target?: { x: number; y: number };
  }>;
}

export interface VoicePhotoStitchResponse {
  kathaId: KathaId;
  syncPoints: Array<{
    audioTime: number;
    memoryId: MemoryId;
    action: 'show' | 'zoom' | 'highlight';
    target?: { x: number; y: number };
    confidence: number;
  }>;
  previewUrl: string; // Temporary URL to preview the stitched experience
}

// ═══════════════════════════════════════════════════════════
// VRIKSHA (FAMILY TREE) API
// ═══════════════════════════════════════════════════════════

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  maidenName?: string;
  nicknames?: string[];
  gender: 'male' | 'female' | 'other';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  isAlive?: boolean;
  bio?: string;
  avatarBlob?: Blob;
}

export interface AddRelationshipRequest {
  fromMemberId: MemberId;
  toMemberId: MemberId;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  marriageDate?: string;
  marriagePlace?: string;
}

export interface GetAncestryRequest {
  memberId: MemberId;
  direction: 'ancestors' | 'descendants' | 'both';
  maxDepth?: number;
  branch?: 'paternal' | 'maternal' | 'both';
}

export interface GetAncestryResponse {
  member: VrikshaMember;
  paths: AncestryPath[];
  stats: {
    totalAncestors: number;
    totalDescendants: number;
    generationsUp: number;
    generationsDown: number;
    oldestKnown?: { member: VrikshaMember; year: number };
  };
}

export interface GetFamilyTreeRequest {
  familyId: FamilyId;
  centeredOn?: MemberId;
  includeDeceased?: boolean;
  includePrana?: boolean; // Include relationship strength data
}

export interface GetFamilyTreeResponse {
  members: VrikshaMember[];
  relationships: Array<{
    from: MemberId;
    to: MemberId;
    type: string;
    prana: {
      strength: number;
      sharedMemoryCount: number;
      pulseIntensity: number;
    };
  }>;
  layout: {
    generations: Array<{
      depth: number;
      members: MemberId[];
    }>;
  };
}

// ═══════════════════════════════════════════════════════════
// VASIYAT (WISDOM VAULT) API - Time-Locked Inheritance
// ═══════════════════════════════════════════════════════════

export interface CreateVasiyatRequest {
  title: string;
  content: {
    text?: string;
    audioBlob?: Blob;
    videoBlob?: Blob;
    documentBlobs?: Blob[];
  };
  recipients: Array<{
    memberId: MemberId;
    relationshipLabel: string; // "my beloved grandson"
    personalMessage?: string;
  }>;
  trigger:
    | { type: 'date'; date: string }
    | { type: 'event'; event: string }
    | { type: 'age'; recipientAge: number }
    | { type: 'death' }
    | { type: 'manual'; approverIds: MemberId[] };
  mood: 'loving' | 'wisdom' | 'celebration' | 'comfort' | 'guidance';
  allowAIPersona: boolean;
  witnessIds?: MemberId[];
}

export interface CreateVasiyatResponse {
  vasiyat: Vasiyat;
  encryptionConfirmed: boolean;
  estimatedUnlockDate?: string;
}

export interface CheckVasiyatUnlockRequest {
  vasiyatId: VasiyatId;
  event?: string; // If trigger is event-based
  approvals?: MemberId[]; // If trigger is manual
}

export interface CheckVasiyatUnlockResponse {
  isUnlocked: boolean;
  reason?: string;
  unlockDate?: string;
  remainingApprovals?: MemberId[];
}

export interface GetVasiyatContentRequest {
  vasiyatId: VasiyatId;
  recipientId: MemberId;
}

export interface GetVasiyatContentResponse {
  title: string;
  content: {
    text?: string;
    audioUrl?: string;
    videoUrl?: string;
    documentUrls?: string[];
  };
  personalMessage?: string;
  creatorName: string;
  createdAt: string;
  mood: string;
}

// ═══════════════════════════════════════════════════════════
// DIGITAL ECHO API - RAG-based Persona
// ═══════════════════════════════════════════════════════════

export interface InitializeEchoRequest {
  memberId: MemberId;
  consentGivenBy: MemberId;
  voiceSampleKathaIds: KathaId[];
  allowedTopics?: string[];
  blockedTopics?: string[];
  customDisclaimer?: string;
}

export interface InitializeEchoResponse {
  echo: DigitalEcho;
  processingStatus: 'processing' | 'ready';
  estimatedReadyTime?: string;
  fragmentCount: number;
}

export interface ChatWithEchoRequest {
  echoMemberId: MemberId;
  message: string;
  conversationId?: string; // Continue existing conversation
  context?: {
    currentMemoryId?: MemoryId; // If looking at a photo
    currentTopic?: string;
  };
}

export interface ChatWithEchoResponse {
  conversationId: string;
  response: EchoMessage;
  sourceFragments: Array<{
    text: string;
    source: string;
    relevance: number;
  }>;
  suggestedFollowUps: string[];
  disclaimer: string;
}

export interface GetEchoInsightsRequest {
  memberId: MemberId;
  topic?: string;
}

export interface GetEchoInsightsResponse {
  personalityTraits: Array<{
    trait: string;
    value: number;
    examples: string[];
  }>;
  commonTopics: Array<{
    topic: string;
    fragmentCount: number;
  }>;
  suggestedQuestions: string[];
}

// ═══════════════════════════════════════════════════════════
// BHOOGOL YATRA (HERITAGE MAPPING) API
// ═══════════════════════════════════════════════════════════

export interface GetHeritageMapRequest {
  familyId: FamilyId;
  fromYear?: number;
  toYear?: number;
  memberIds?: MemberId[];
}

export interface GetHeritageMapResponse {
  yatra: BhoogolYatra;
  geoJson: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: {
        type: 'Point' | 'LineString';
        coordinates: number[] | number[][];
      };
      properties: {
        type: 'location' | 'migration';
        name: string;
        year?: number;
        members: MemberId[];
        color: string;
      };
    }>;
  };
}

// ═══════════════════════════════════════════════════════════
// TIME-RIVER (MAIN FEED) API
// ═══════════════════════════════════════════════════════════

export interface GetTimeRiverRequest extends PaginationParams {
  familyId: FamilyId;
  fromDate?: string;
  toDate?: string;
  types?: TimeRiverItem['type'][];
  memberIds?: MemberId[];
  era?: string;
}

export interface GetTimeRiverResponse {
  items: TimeRiverItem[];
  eras: Era[];
  meta: ApiMeta;
  ambientConfig: {
    currentEra: Era;
    backgroundGradient: string[];
    ambientSoundUrl?: string;
  };
}

// ═══════════════════════════════════════════════════════════
// SMARAN NUDGE (PASSIVE INGESTION) API
// ═══════════════════════════════════════════════════════════

export interface GetNudgeRequest {
  memberId: MemberId;
  context: 'morning' | 'evening' | 'anniversary' | 'random';
}

export interface GetNudgeResponse {
  nudge: {
    type: 'memory_prompt' | 'story_request' | 'connection_reminder' | 'milestone';
    message: string;
    relatedMemory?: SmritiMedia;
    relatedMember?: VrikshaMember;
    suggestedAction: string;
  };
}

export interface RespondToNudgeRequest {
  nudgeId: string;
  response:
    | { type: 'photo'; blob: Blob; caption?: string }
    | { type: 'audio'; blob: Blob }
    | { type: 'text'; content: string }
    | { type: 'skip'; reason?: string };
}
