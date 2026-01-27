/**
 * 🪷 DATABASE SETUP SCRIPT
 * Creates all tables for Vansh Family Heritage App
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const SCHEMA = `
-- ═══════════════════════════════════════════════════════════
-- 🪷 VANSH DATABASE SCHEMA - MySQL
-- Family Heritage App Database
-- ═══════════════════════════════════════════════════════════

-- Disable foreign key checks to allow dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS vasiyat_trustees;
DROP TABLE IF EXISTS vasiyat_recipients;
DROP TABLE IF EXISTS vasiyats;
DROP TABLE IF EXISTS katha_members;
DROP TABLE IF EXISTS kathas;
DROP TABLE IF EXISTS memory_members;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS member_closure;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS traditions;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════
-- FAMILIES TABLE - Root of each Vansh
-- ═══════════════════════════════════════════════════════════
CREATE TABLE families (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  description TEXT,
  root_member_id VARCHAR(36),
  
  privacy_level ENUM('private', 'extended', 'public') DEFAULT 'private',
  allow_digital_echo BOOLEAN DEFAULT FALSE,
  
  plan ENUM('free', 'heritage', 'legacy') DEFAULT 'free',
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 1073741824, -- 1GB default
  
  settings JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_surname (surname),
  INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- USERS TABLE - Authentication accounts
-- ═══════════════════════════════════════════════════════════
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  
  member_id VARCHAR(36),
  family_id VARCHAR(36),
  role ENUM('admin', 'elder', 'member', 'viewer') DEFAULT 'member',
  
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP NULL,
  
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_family (family_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- USER SESSIONS TABLE - JWT Refresh Tokens
-- ═══════════════════════════════════════════════════════════
CREATE TABLE user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  device_info JSON,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_token (refresh_token(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- MEMBERS TABLE - Family tree nodes
-- ═══════════════════════════════════════════════════════════
CREATE TABLE members (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  maiden_name VARCHAR(100),
  nicknames JSON, -- Array of nicknames
  gender ENUM('male', 'female', 'other') NOT NULL,
  
  birth_date DATE,
  birth_place VARCHAR(255),
  birth_lat DECIMAL(10, 8),
  birth_lng DECIMAL(11, 8),
  
  death_date DATE,
  death_place VARCHAR(255),
  is_alive BOOLEAN DEFAULT TRUE,
  
  avatar_uri VARCHAR(500),
  bio TEXT,
  occupation VARCHAR(255),
  education VARCHAR(255),
  
  current_city VARCHAR(255),
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  
  -- Digital Echo
  has_voice_samples BOOLEAN DEFAULT FALSE,
  voice_sample_count INT DEFAULT 0,
  allow_digital_echo BOOLEAN DEFAULT FALSE,
  
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  metadata JSON, -- Additional custom fields
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NULL,
  
  INDEX idx_family (family_id),
  INDEX idx_name (first_name, last_name),
  INDEX idx_birth_date (birth_date),
  FULLTEXT idx_search (first_name, last_name, bio),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key to families after members table exists
ALTER TABLE families ADD CONSTRAINT fk_root_member 
  FOREIGN KEY (root_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════
-- MEMBER CLOSURE TABLE - For O(1) ancestry queries
-- ═══════════════════════════════════════════════════════════
CREATE TABLE member_closure (
  ancestor_id VARCHAR(36) NOT NULL,
  descendant_id VARCHAR(36) NOT NULL,
  depth INT NOT NULL DEFAULT 0,
  path JSON, -- Array of member IDs
  branch ENUM('paternal', 'maternal', 'both') DEFAULT 'both',
  
  PRIMARY KEY (ancestor_id, descendant_id),
  INDEX idx_descendant (descendant_id),
  INDEX idx_depth (depth),
  FOREIGN KEY (ancestor_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (descendant_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- RELATIONSHIPS TABLE - Family connections (Prana)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE relationships (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  
  from_member_id VARCHAR(36) NOT NULL,
  to_member_id VARCHAR(36) NOT NULL,
  relationship_type ENUM('parent', 'child', 'spouse', 'sibling', 'guardian', 'adopted_parent', 'adopted_child') NOT NULL,
  
  -- Marriage specific
  marriage_date DATE,
  marriage_place VARCHAR(255),
  divorce_date DATE,
  
  -- Connection strength
  prana_strength DECIMAL(3, 2) DEFAULT 1.00, -- 0.00 to 1.00
  shared_memory_count INT DEFAULT 0,
  shared_katha_count INT DEFAULT 0,
  last_interaction_at TIMESTAMP NULL,
  
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(36),
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_relationship (from_member_id, to_member_id, relationship_type),
  INDEX idx_family (family_id),
  INDEX idx_from (from_member_id),
  INDEX idx_to (to_member_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- MEMORIES TABLE - Photos, videos, documents (Smriti)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE memories (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  
  type ENUM('photo', 'video', 'document', 'audio') NOT NULL,
  uri VARCHAR(500) NOT NULL,
  thumbnail_uri VARCHAR(500),
  blurhash VARCHAR(100),
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  captured_at TIMESTAMP NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(36),
  
  -- Location
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  place_name VARCHAR(255),
  
  -- AI extracted
  detected_faces JSON, -- Array of face detections
  detected_objects JSON, -- Array of detected objects
  ocr_text TEXT,
  ai_description TEXT,
  
  -- User added
  title VARCHAR(255),
  description TEXT,
  tags JSON, -- Array of tags
  
  -- Era for Time-River
  era_name VARCHAR(100),
  era_year INT,
  
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family (family_id),
  INDEX idx_type (type),
  INDEX idx_captured (captured_at),
  INDEX idx_era (era_year),
  FULLTEXT idx_search (title, description, ocr_text),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- MEMORY MEMBERS - Junction table for tagged members
-- ═══════════════════════════════════════════════════════════
CREATE TABLE memory_members (
  memory_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  tagged_by VARCHAR(36),
  tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_ai_suggested BOOLEAN DEFAULT FALSE,
  is_confirmed BOOLEAN DEFAULT TRUE,
  face_region JSON, -- Bounding box if face tagged
  
  PRIMARY KEY (memory_id, member_id),
  FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- KATHAS TABLE - Voice recordings and oral histories
-- ═══════════════════════════════════════════════════════════
CREATE TABLE kathas (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  
  type ENUM('voice_overlay', 'standalone_story', 'interview', 'song') DEFAULT 'standalone_story',
  
  audio_uri VARCHAR(500) NOT NULL,
  duration_seconds INT NOT NULL,
  waveform JSON, -- Array of amplitude values
  file_size BIGINT,
  
  narrator_id VARCHAR(36),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Transcription
  transcript TEXT,
  transcript_segments JSON, -- Array of {text, start, end, speaker}
  language VARCHAR(10) DEFAULT 'en',
  
  -- AI generated
  summary TEXT,
  emotions JSON, -- Array of {emotion, intensity, timestamp}
  topics JSON, -- Array of topics
  
  -- Voice-Photo sync (for overlay type)
  linked_memory_id VARCHAR(36),
  sync_points JSON, -- Array of sync points
  
  title VARCHAR(255),
  description TEXT,
  tags JSON,
  
  is_favorite BOOLEAN DEFAULT FALSE,
  play_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family (family_id),
  INDEX idx_narrator (narrator_id),
  INDEX idx_type (type),
  FULLTEXT idx_search (title, transcript),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (narrator_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_memory_id) REFERENCES memories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- KATHA MEMBERS - Junction table for mentioned members
-- ═══════════════════════════════════════════════════════════
CREATE TABLE katha_members (
  katha_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  role ENUM('narrator', 'mentioned', 'participant') DEFAULT 'mentioned',
  mention_timestamps JSON, -- Array of timestamps where mentioned
  
  PRIMARY KEY (katha_id, member_id),
  FOREIGN KEY (katha_id) REFERENCES kathas(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- VASIYATS TABLE - Time-locked wisdom messages
-- ═══════════════════════════════════════════════════════════
CREATE TABLE vasiyats (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  creator_id VARCHAR(36) NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  
  -- Content (stored encrypted in production)
  content_text TEXT,
  content_audio_uri VARCHAR(500),
  content_video_uri VARCHAR(500),
  content_attachments JSON, -- Array of attachment URIs
  
  -- Trigger conditions
  trigger_type ENUM('date', 'event', 'age', 'death', 'manual') NOT NULL,
  trigger_date DATE,
  trigger_event VARCHAR(100), -- wedding, graduation, birth, etc.
  trigger_age INT,
  trigger_approvers JSON, -- Array of member IDs for manual unlock
  
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP NULL,
  unlocked_by VARCHAR(36),
  
  mood ENUM('loving', 'wisdom', 'celebration', 'comfort', 'guidance') DEFAULT 'loving',
  allow_ai_persona BOOLEAN DEFAULT FALSE,
  
  -- Delivery preferences
  notification_sent BOOLEAN DEFAULT FALSE,
  delivery_method ENUM('app', 'email', 'both') DEFAULT 'app',
  
  -- For legal validity
  witness_ids JSON, -- Array of witness member IDs
  is_notarized BOOLEAN DEFAULT FALSE,
  notary_hash VARCHAR(255),
  
  view_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family (family_id),
  INDEX idx_creator (creator_id),
  INDEX idx_trigger (trigger_type, is_unlocked),
  INDEX idx_trigger_date (trigger_date),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- VASIYAT RECIPIENTS - Who receives the vasiyat
-- ═══════════════════════════════════════════════════════════
CREATE TABLE vasiyat_recipients (
  vasiyat_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  relationship_label VARCHAR(100), -- "my beloved son", "dear daughter"
  has_viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP NULL,
  
  PRIMARY KEY (vasiyat_id, member_id),
  FOREIGN KEY (vasiyat_id) REFERENCES vasiyats(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- TRADITIONS TABLE - Family customs and practices (Parampara)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE traditions (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('festival', 'ritual', 'recipe', 'song', 'custom', 'other') DEFAULT 'custom',
  
  -- When it happens
  frequency ENUM('daily', 'weekly', 'monthly', 'yearly', 'occasion') DEFAULT 'yearly',
  date_or_occasion VARCHAR(255), -- "Diwali", "Every Sunday", "First Monday of month"
  
  -- Media
  cover_image_uri VARCHAR(500),
  gallery_images JSON, -- Array of image URIs
  related_kathas JSON, -- Array of katha IDs
  
  -- Recipe specific
  recipe_ingredients JSON,
  recipe_steps JSON,
  
  -- Song/chant specific
  lyrics TEXT,
  audio_uri VARCHAR(500),
  
  instructions TEXT,
  tips TEXT,
  
  -- Metadata
  origin_story TEXT,
  started_by VARCHAR(36), -- Member who started tradition
  started_year INT,
  generations_count INT DEFAULT 1,
  
  is_active BOOLEAN DEFAULT TRUE,
  tags JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_family (family_id),
  INDEX idx_category (category),
  FULLTEXT idx_search (name, description),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- DATABASE CREATED SUCCESSFULLY
-- ═══════════════════════════════════════════════════════════
`;

async function setupDatabase() {
  console.log('🪷 Setting up Vansh database...\n');
  
  // First connect without database to create it
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    multipleStatements: true,
  };
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to MySQL server');
    
    // Create database if not exists
    const dbName = process.env.DB_NAME || 'vansh_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database "${dbName}" ready`);
    
    // Use the database
    await connection.query(`USE \`${dbName}\``);
    
    // Execute schema
    console.log('📝 Creating tables...');
    await connection.query(SCHEMA);
    console.log('✅ All tables created successfully');
    
    await connection.end();
    
    console.log('\n🪷 Database setup complete!\n');
    console.log('Run "npm run db:seed" to add sample data.\n');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
