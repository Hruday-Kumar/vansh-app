/**
 * 🪷 VANSH DATABASE SCHEMA TYPES
 * MySQL Database Schema (Not PostgreSQL)
 * These types match the actual MySQL database in backend/sql/schema.sql
 * Note: Some advanced features (vector search, PostGIS) are future considerations
 */

// ═══════════════════════════════════════════════════════════
// MYSQL TABLE SCHEMAS
// ═══════════════════════════════════════════════════════════

/**
 * families - The root table for each Vansh
 */
export interface DbFamily {
  id: string; // UUID
  name: string;
  surname: string;
  root_member_id: string | null; // FK to members
  
  privacy_level: 'private' | 'family' | 'public';
  allow_digital_echo: boolean;
  
  plan: 'free' | 'heritage' | 'legacy';
  storage_used_bytes: number;
  storage_limit_bytes: number;
  
  created_at: Date;
  updated_at: Date;
  last_activity_at: Date;
}

/**
 * members - Each person in the family tree
 * Uses adjacency list + closure table for O(1) ancestry queries
 */
export interface DbMember {
  id: string; // UUID
  family_id: string; // FK to families
  
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  nicknames: string[]; // JSONB array
  gender: 'male' | 'female' | 'other';
  
  birth_date: Date | null;
  birth_place: string | null;
  birth_location_lat: number | null;
  birth_location_lng: number | null;
  
  death_date: Date | null;
  death_place: string | null;
  is_alive: boolean;
  
  avatar_uri: string | null;
  bio: string | null;
  
  current_location_lat: number | null;
  current_location_lng: number | null;
  current_city: string | null;
  
  created_at: Date;
  updated_at: Date;
  last_active_at: Date | null;
}

/**
 * member_closure - Closure table for O(1) ancestry queries
 * Note: Basic implementation exists but automatic triggers not yet implemented
 */
export interface DbMemberClosure {
  ancestor_id: string; // FK to members
  descendant_id: string; // FK to members
  depth: number; // 0 = self, 1 = parent, 2 = grandparent...
  path: string; // JSON string of member IDs array
}

/**
 * relationships - The "Prana" connections
 * Edge table for the family graph
 */
export interface DbRelationship {
  id: string; // UUID
  family_id: string;
  
  from_member_id: string;
  to_member_id: string;
  relationship_type: string; // parent, child, spouse, sibling, etc.
  
  // Marriage-specific
  marriage_date: Date | null;
  marriage_place: string | null;
  divorce_date: Date | null;
  
  // Prana metrics (updated by triggers)
  prana_strength: number; // 0.0-1.0
  shared_memory_count: number;
  shared_katha_count: number;
  last_interaction_at: Date | null;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * memories - Photos, videos, documents
 */
export interface DbMemory {
  id: string; // UUID
  family_id: string;
  
  type: 'photo' | 'video' | 'document' | 'audio';
  uri: string;
  thumbnail_uri: string | null;
  blurhash: string | null;
  
  captured_at: Date | null;
  uploaded_at: Date;
  uploaded_by: string; // FK to members
  
  // Location
  location_lat: number | null;
  location_lng: number | null;
  place_name: string | null;
  
  // AI-extracted (JSON)
  detected_faces: unknown | null;
  detected_objects: unknown | null;
  ocr_text: string | null;
  ai_description: string | null;
  
  // User-added
  title: string | null;
  description: string | null;
  tags: string[];
  
  // Era (for Time-River)
  era_name: string | null;
  era_year: number | null;
  
  is_favorite: boolean;
  is_featured: boolean;
  view_count: number;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * memory_members - Many-to-many: which members appear in which memories
 */
export interface DbMemoryMember {
  memory_id: string;
  member_id: string;
  tagged_by: string | null; // Who tagged them
  tagged_at: Date;
  is_ai_suggested: boolean;
  is_confirmed: boolean;
}

/**
 * kathas - Voice recordings and oral histories
 */
export interface DbKatha {
  id: string; // UUID
  family_id: string;
  
  type: 'voice_overlay' | 'standalone_story' | 'interview' | 'song';
  
  audio_uri: string;
  duration_seconds: number;
  waveform: number[]; // JSON array
  
  narrator_id: string; // FK to members
  recorded_at: Date;
  
  // Transcription
  transcript: string | null;
  transcript_segments: unknown | null; // JSON
  language: string;
  
  // AI-generated
  summary: string | null;
  emotions: unknown | null; // JSON
  topics: unknown | null; // JSON
  
  // Voice-Photo sync points
  linked_memory_id: string | null;
  sync_points: unknown | null; // JSON
  
  title: string;
  description: string | null;
  tags: unknown | null; // JSON
  
  is_favorite: boolean;
  is_featured: boolean;
  play_count: number;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * vasiyats - Time-locked wisdom messages
 */
export interface DbVasiyat {
  id: string; // UUID
  family_id: string;
  
  creator_id: string; // FK to members
  
  title: string;
  
  // Content
  content_text: string | null;
  media_uri: string | null;
  content_audio_uri: string | null;
  content_video_uri: string | null;
  content_attachments: unknown | null; // JSON array
  
  // Trigger conditions
  trigger_type: 'date' | 'event' | 'age' | 'after_passing' | 'age_milestone' | 'manual';
  trigger_date: Date | null;
  trigger_event: string | null;
  trigger_age: number | null;
  trigger_approvers: unknown | null; // JSON array of member IDs
  
  is_unlocked: boolean;
  unlocked_at: Date | null;
  
  mood: 'loving' | 'wisdom' | 'celebration' | 'comfort' | 'guidance';
  allow_ai_persona: boolean;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * vasiyat_recipients - Who receives each Vasiyat
 */
export interface DbVasiyatRecipient {
  vasiyat_id: string;
  member_id: string;
  relationship_label: string; // "my grandson"
  has_viewed: boolean;
  viewed_at: Date | null;
}

/**
 * paramparas - Family traditions and rituals
 */
export interface DbParampara {
  id: string; // UUID
  family_id: string;
  created_by: string;
  
  name: string;
  description: string;
  category: 'festival' | 'ritual' | 'recipe' | 'ceremony' | 'practice' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'occasional' | 'once';
  date_or_occasion: string | null;
  
  origin_story: string | null;
  significance: string | null;
  
  // JSON stored fields
  recipe_ingredients: unknown | null;
  recipe_steps: unknown | null;
  
  generations_count: number;
  region: string | null;
  tags: unknown | null; // JSON
  
  is_active: boolean;
  cover_image_url: string | null;
  
  created_at: Date;
  updated_at: Date;
}

// ═══════════════════════════════════════════════════════════
// FUTURE FEATURES - Not yet implemented in MySQL schema
// These interfaces are placeholders for potential future features
// ═══════════════════════════════════════════════════════════

/**
 * heritage_locations - Places significant to the family (NOT IMPLEMENTED)
 * Would require PostGIS or separate lat/lng columns
 */
export interface DbHeritageLocation {
  id: string;
  family_id: string;
  location_lat: number;
  location_lng: number;
  place_name: string;
  significance: 'birthplace' | 'residence' | 'ancestral_home' | 'visit' | 'migration';
  from_year: number | null;
  to_year: number | null;
  created_at: Date;
  updated_at: Date;
}

// Note: Vector embeddings, face recognition, and other AI features
// are not yet implemented in the MySQL schema
