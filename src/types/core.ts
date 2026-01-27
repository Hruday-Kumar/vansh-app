/**
 * 🪷 VANSH CORE TYPES - The DNA of Digital Sanskriti
 */

// ═══════════════════════════════════════════════════════════
// BASE IDENTIFIERS
// ═══════════════════════════════════════════════════════════

export type VanshId = string & { readonly __brand: 'VanshId' };
export type FamilyId = string & { readonly __brand: 'FamilyId' };
export type MemberId = string & { readonly __brand: 'MemberId' };
export type MemoryId = string & { readonly __brand: 'MemoryId' };
export type KathaId = string & { readonly __brand: 'KathaId' };
export type VasiyatId = string & { readonly __brand: 'VasiyatId' };

export type Timestamp = number;
export type DateString = string; // ISO 8601

// ═══════════════════════════════════════════════════════════
// PILLAR 1: SMRITI (Memory) - Photos, Videos, Documents
// ═══════════════════════════════════════════════════════════

export type MediaType = 'photo' | 'video' | 'document' | 'audio';

export interface SmritiMedia {
  id: MemoryId;
  type: MediaType;
  uri: string;
  thumbnailUri?: string;
  blurhash?: string;
  
  // Metadata
  capturedAt?: DateString;
  uploadedAt: Timestamp;
  uploadedBy: MemberId;
  
  // Location
  location?: GeoLocation;
  placeName?: string;
  
  // AI-extracted
  faces?: FaceTag[];
  objects?: string[];
  ocrText?: string;
  
  // User-added
  title?: string;
  description?: string;
  tags: string[];
  
  // Connections
  linkedMembers: MemberId[];
  linkedKathas: KathaId[];
  era?: Era;
}

export interface FaceTag {
  memberId?: MemberId;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  suggestedName?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface Era {
  name: string;
  startYear: number;
  endYear?: number;
  color: string; // For Time-River visualization
  ambientSound?: string; // Era-specific audio
}

// ═══════════════════════════════════════════════════════════
// PILLAR 2: KATHA (Oral History) - Voice Overlays
// ═══════════════════════════════════════════════════════════

export interface Katha {
  id: KathaId;
  type: 'voice_overlay' | 'standalone_story' | 'interview' | 'song';
  
  // Audio data
  audioUri: string;
  duration: number; // seconds
  waveform: number[]; // For visualization
  
  // Narrator
  narratorId: MemberId;
  recordedAt: Timestamp;
  
  // Transcription
  transcript?: string;
  transcriptSegments?: TranscriptSegment[];
  language: string;
  
  // Connections
  linkedMedia: MemoryId[];
  linkedMembers: MemberId[];
  
  // AI-generated
  summary?: string;
  emotions?: EmotionTag[];
  topics?: string[];
  
  // For Voice-Photo Stitching
  syncPoints?: VoiceSyncPoint[];
}

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: MemberId;
  confidence: number;
}

export interface VoiceSyncPoint {
  audioTime: number; // When in the audio
  mediaId: MemoryId; // Which photo/video
  action: 'show' | 'zoom' | 'highlight';
  target?: { x: number; y: number }; // Where to focus
}

export interface EmotionTag {
  emotion: 'joy' | 'nostalgia' | 'love' | 'pride' | 'sorrow' | 'wisdom';
  intensity: number; // 0-1
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════
// PILLAR 3: VRIKSHA (Family Tree) - The Living Graph
// ═══════════════════════════════════════════════════════════

export type Gender = 'male' | 'female' | 'other';
export type RelationType = 
  | 'parent' | 'child' | 'spouse' | 'sibling'
  | 'grandparent' | 'grandchild' | 'uncle' | 'aunt'
  | 'cousin' | 'nephew' | 'niece' | 'in_law';

export interface VrikshaMember {
  id: MemberId;
  familyId: FamilyId;
  
  // Identity
  firstName: string;
  lastName: string;
  maidenName?: string;
  nicknames: string[];
  gender: Gender;
  
  // Life events
  birthDate?: DateString;
  birthPlace?: string;
  deathDate?: DateString;
  deathPlace?: string;
  isAlive: boolean;
  
  // Profile
  avatarUri?: string;
  bio?: string;
  
  // Current location (for living members)
  currentLocation?: GeoLocation;
  currentCity?: string;
  
  // Connections - The "Prana" (life-lines)
  relationships: Relationship[];
  
  // Stats
  memoryCount: number;
  kathaCount: number;
  lastActive?: Timestamp;
  
  // For Digital Echo
  hasVoiceSamples: boolean;
  voiceEmbedding?: number[]; // Vector for voice cloning
  personalityEmbedding?: number[]; // For RAG persona
}

export interface Relationship {
  type: RelationType;
  memberId: MemberId;
  
  // The "Prana" - shared life between two people
  prana: PranaConnection;
  
  // Marriage-specific
  marriageDate?: DateString;
  marriagePlace?: string;
  divorceDate?: DateString;
}

export interface PranaConnection {
  strength: number; // 0-1, based on shared memories/interactions
  sharedMemories: MemoryId[];
  sharedKathas: KathaId[];
  lastInteraction?: Timestamp;
  
  // Visual properties for the tree
  pulseIntensity: number;
  glowColor: string;
}

// Recursive ancestry query result
export interface AncestryPath {
  member: VrikshaMember;
  depth: number; // 0 = self, 1 = parent, 2 = grandparent...
  path: MemberId[]; // Full path from queried member
  branch: 'paternal' | 'maternal' | 'both';
}

// ═══════════════════════════════════════════════════════════
// PILLAR 4: PARAMPARA (Traditions) - Family Rituals
// ═══════════════════════════════════════════════════════════

export type ParamparaType = 
  | 'puja' | 'recipe' | 'song' | 'story' | 'craft' 
  | 'festival' | 'ceremony' | 'custom';

export interface Parampara {
  id: string;
  familyId: FamilyId;
  type: ParamparaType;
  
  // Identity
  name: string;
  description: string;
  
  // Origin
  originStory?: string;
  originMemberId?: MemberId; // Who started this tradition
  originYear?: number;
  
  // Content
  steps?: ParamparaStep[];
  ingredients?: Ingredient[]; // For recipes
  materials?: string[]; // For crafts
  
  // Media
  photos: MemoryId[];
  videos: MemoryId[];
  audioGuide?: KathaId;
  
  // Scheduling
  occasion?: string; // "Diwali", "Wedding", etc.
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'occasional' | 'once';
  
  // Secret sauce
  familySecrets?: string[]; // Encrypted, only family can view
  
  // Preservation
  lastPerformed?: DateString;
  performedBy: MemberId[];
  atRisk: boolean; // If no one young knows it
}

export interface ParamparaStep {
  order: number;
  instruction: string;
  tips?: string;
  imageUri?: string;
  videoUri?: string;
  duration?: number; // minutes
}

export interface Ingredient {
  name: string;
  quantity: string;
  substitutes?: string[];
  isSecret?: boolean;
}

// ═══════════════════════════════════════════════════════════
// PILLAR 5: VASIYAT (Wisdom Vault) - Time-Locked Inheritance
// ═══════════════════════════════════════════════════════════

export type VasiyatTrigger = 
  | { type: 'date'; date: DateString }
  | { type: 'event'; event: LifeEvent }
  | { type: 'age'; recipientAge: number }
  | { type: 'death'; creatorDeath: true }
  | { type: 'manual'; approvers: MemberId[] };

export type LifeEvent = 
  | 'wedding' | 'first_child' | 'graduation' | 'retirement'
  | 'loss_of_parent' | 'major_illness' | 'career_milestone';

export interface Vasiyat {
  id: VasiyatId;
  familyId: FamilyId;
  
  // Creator
  creatorId: MemberId;
  createdAt: Timestamp;
  lastModified: Timestamp;
  
  // Content (encrypted at rest)
  title: string;
  content: VasiyatContent;
  
  // Recipients
  recipients: VasiyatRecipient[];
  
  // Unlock conditions
  trigger: VasiyatTrigger;
  isUnlocked: boolean;
  unlockedAt?: Timestamp;
  
  // Verification
  witnessIds?: MemberId[];
  notaryHash?: string; // Blockchain anchor for legal validity
  
  // Emotional metadata
  mood: 'loving' | 'wisdom' | 'celebration' | 'comfort' | 'guidance';
  
  // For Digital Echo
  allowAIPersona: boolean;
}

export interface VasiyatContent {
  text?: string;
  audioId?: KathaId;
  videoId?: MemoryId;
  documents?: MemoryId[];
  
  // For Digital Echo RAG
  contextFragments?: WisdomFragment[];
}

export interface WisdomFragment {
  id: string;
  text: string;
  embedding: number[]; // Vector for semantic search
  topic: string;
  emotion: string;
  source: 'text' | 'transcription' | 'interview';
}

export interface VasiyatRecipient {
  memberId: MemberId;
  relationship: string; // "my grandson", "my daughter"
  personalMessage?: string;
  hasViewed: boolean;
  viewedAt?: Timestamp;
}

// ═══════════════════════════════════════════════════════════
// DIGITAL ECHO - AI Persona System
// ═══════════════════════════════════════════════════════════

export interface DigitalEcho {
  memberId: MemberId;
  familyId: FamilyId;
  
  // Is this enabled by the person (while alive) or family (after)?
  consentGivenBy: MemberId;
  consentDate: Timestamp;
  
  // Source data
  voiceSamples: KathaId[];
  writtenContent: string[];
  personalityTraits: PersonalityTrait[];
  
  // RAG Knowledge Base
  knowledgeFragments: WisdomFragment[];
  totalFragments: number;
  lastUpdated: Timestamp;
  
  // Guardrails
  allowedTopics: string[];
  blockedTopics: string[];
  disclaimerText: string;
  
  // Usage
  totalInteractions: number;
  lastInteraction?: Timestamp;
}

export interface PersonalityTrait {
  trait: string;
  value: number; // -1 to 1
  evidence: string[]; // Quotes that show this trait
}

export interface EchoConversation {
  id: string;
  echoMemberId: MemberId;
  querierMemberId: MemberId;
  
  messages: EchoMessage[];
  startedAt: Timestamp;
  
  // For improving the Echo
  feedback?: 'accurate' | 'somewhat' | 'not_like_them';
}

export interface EchoMessage {
  role: 'user' | 'echo';
  content: string;
  timestamp: Timestamp;
  
  // Sources used for this response
  sourceFragments?: string[];
  confidence: number;
}

// ═══════════════════════════════════════════════════════════
// BHOOGOL YATRA - Heritage Mapping
// ═══════════════════════════════════════════════════════════

export interface BhoogolYatra {
  familyId: FamilyId;
  
  // All locations the family has been
  locations: HeritageLocation[];
  
  // Migration paths
  migrations: MigrationPath[];
  
  // Timeline bounds
  earliestYear: number;
  latestYear: number;
}

export interface HeritageLocation {
  id: string;
  location: GeoLocation;
  placeName: string;
  
  // Who lived here
  residents: MemberId[];
  
  // Time period
  fromYear?: number;
  toYear?: number;
  
  // Significance
  significance: 'birthplace' | 'residence' | 'ancestral_home' | 'visit' | 'migration';
  
  // Connected memories
  memories: MemoryId[];
  stories: KathaId[];
}

export interface MigrationPath {
  id: string;
  from: HeritageLocation;
  to: HeritageLocation;
  year: number;
  
  // Who migrated
  members: MemberId[];
  
  // The story behind
  reason?: string;
  storyId?: KathaId;
  
  // Visual
  pathColor: string;
  glowIntensity: number;
}

// ═══════════════════════════════════════════════════════════
// TIME-RIVER - The Main Feed
// ═══════════════════════════════════════════════════════════

export interface TimeRiverItem {
  id: string;
  type: 'memory' | 'katha' | 'milestone' | 'vasiyat_unlocked' | 'member_joined';
  
  // Core reference
  referenceId: MemoryId | KathaId | VasiyatId | MemberId;
  
  // Timeline position
  date: DateString;
  era: Era;
  
  // Display
  title: string;
  preview: string;
  thumbnailUri?: string;
  
  // Participants
  members: MemberId[];
  
  // Engagement
  viewCount: number;
  commentCount: number;
  
  // For horizontal scroll position
  xPosition: number; // Calculated based on date
}

export interface TimeRiverState {
  items: TimeRiverItem[];
  currentEra: Era;
  scrollPosition: number;
  
  // Ambient
  currentAmbientSound?: string;
  currentBackgroundColor: string;
  
  // Filters
  filterByMembers?: MemberId[];
  filterByType?: TimeRiverItem['type'][];
  filterByEra?: Era;
}

// ═══════════════════════════════════════════════════════════
// FAMILY & APP STATE
// ═══════════════════════════════════════════════════════════

export interface VanshFamily {
  id: FamilyId;
  name: string;
  surname: string;
  
  // The root
  rootMemberId: MemberId;
  
  // Stats
  memberCount: number;
  generationCount: number;
  memoryCount: number;
  kathaCount: number;
  
  // Settings
  privacyLevel: 'private' | 'extended' | 'public';
  allowDigitalEcho: boolean;
  
  // Subscription
  plan: 'free' | 'heritage' | 'legacy';
  storageUsed: number;
  storageLimit: number;
  
  // Dates
  createdAt: Timestamp;
  lastActivity: Timestamp;
}

export interface VanshUser {
  id: MemberId;
  email: string;
  phone?: string;
  
  // Which family member they are
  memberId: MemberId;
  familyId: FamilyId;
  
  // Permissions
  role: 'admin' | 'elder' | 'member' | 'viewer';
  
  // Preferences
  language: string;
  notifications: NotificationPreferences;
  
  // Session
  lastLogin: Timestamp;
  deviceTokens: string[];
}

export interface NotificationPreferences {
  newMemory: boolean;
  newKatha: boolean;
  vasiyatUnlocked: boolean;
  familyMilestone: boolean;
  smaranNudge: boolean; // The passive ingestion prompts
}
