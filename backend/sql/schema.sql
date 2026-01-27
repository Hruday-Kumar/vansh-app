-- 🪷 VANSH DATABASE SCHEMA
-- Creates all tables for the Vansh family heritage app

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS vansh_db;
USE vansh_db;

-- ═══════════════════════════════════════════════════════════
-- FAMILIES TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE families (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    description TEXT,
    root_member_id VARCHAR(36),
    cover_image_url VARCHAR(500),
    privacy_level ENUM('private', 'family', 'public') DEFAULT 'private',
    allow_digital_echo BOOLEAN DEFAULT FALSE,
    plan ENUM('free', 'legacy', 'heritage') DEFAULT 'free',
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 1073741824,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- MEMBERS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    maiden_name VARCHAR(100),
    nickname VARCHAR(50),
    gender ENUM('male', 'female', 'other') NOT NULL,
    birth_date DATE,
    death_date DATE,
    birth_place VARCHAR(255),
    death_place VARCHAR(255),
    is_alive BOOLEAN DEFAULT TRUE,
    avatar_uri VARCHAR(500),
    cover_photo_url VARCHAR(500),
    bio TEXT,
    occupation VARCHAR(255),
    current_city VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════
-- USERS TABLE (Authentication)
-- Note: Phone authentication column exists but SMS/OTP not implemented yet
-- Currently only email + password login is fully functional
-- ═══════════════════════════════════════════════════════════
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) UNIQUE,
    family_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'elder', 'member', 'viewer') DEFAULT 'member',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    language VARCHAR(10) DEFAULT 'en',
    notification_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════
-- USER SESSIONS TABLE (For refresh tokens)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════
-- RELATIONSHIPS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE relationships (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    from_member_id VARCHAR(36) NOT NULL,
    to_member_id VARCHAR(36) NOT NULL,
    relationship_type ENUM(
        'parent', 'child', 'spouse', 'sibling',
        'grandparent', 'grandchild', 'uncle', 'aunt',
        'nephew', 'niece', 'cousin', 'in_law', 'other'
    ) NOT NULL,
    relationship_subtype VARCHAR(50),
    marriage_date DATE,
    prana_strength FLOAT DEFAULT 1.0,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (from_member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (to_member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relationship (from_member_id, to_member_id, relationship_type)
);

-- ═══════════════════════════════════════════════════════════
-- MEMORIES TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE memories (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    type ENUM('photo', 'video', 'audio', 'document') NOT NULL DEFAULT 'photo',
    uri VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    captured_at DATE,
    uploaded_by VARCHAR(36) NOT NULL,
    place_name VARCHAR(255),
    era_name VARCHAR(100),
    era_year INT,
    tags JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    privacy_level ENUM('private', 'family', 'public') DEFAULT 'family',
    ai_description TEXT,
    ocr_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES members(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════
-- MEMORY TAGS & MEMBERS
-- Note: Tags are currently stored as JSON in memories.tags column
-- This table is not used but kept for potential future migration
-- ═══════════════════════════════════════════════════════════
/*
CREATE TABLE memory_tags (
    id VARCHAR(36) PRIMARY KEY,
    memory_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_memory_tag (memory_id, tag)
);
*/

CREATE TABLE memory_members (
    id VARCHAR(36) PRIMARY KEY,
    memory_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    x_position FLOAT,
    y_position FLOAT,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_memory_member (memory_id, member_id)
);

-- ═══════════════════════════════════════════════════════════
-- KATHAS (Voice Stories) TABLE
-- Supports standalone stories and voice-photo stitching
-- linked_memory_id + sync_points enable voice overlay on photos
-- ═══════════════════════════════════════════════════════════
CREATE TABLE kathas (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    type ENUM('standalone_story', 'interview', 'memory_narration', 'wisdom', 'recipe', 'other') DEFAULT 'standalone_story',
    audio_uri VARCHAR(500) NOT NULL,
    duration_seconds INT NOT NULL,
    narrator_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    transcript TEXT,
    ai_summary TEXT,
    language VARCHAR(10) DEFAULT 'hi',
    topics JSON,
    tags JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    play_count INT DEFAULT 0,
    privacy_level ENUM('private', 'family', 'public') DEFAULT 'family',
    linked_memory_id VARCHAR(36),
    sync_points JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (narrator_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_memory_id) REFERENCES memories(id) ON DELETE SET NULL
);

CREATE TABLE katha_listeners (
    id VARCHAR(36) PRIMARY KEY,
    katha_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_percentage INT DEFAULT 0,
    FOREIGN KEY (katha_id) REFERENCES kathas(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_listener (katha_id, member_id)
);

-- ═══════════════════════════════════════════════════════════
-- VASIYATS (Time-locked Messages) TABLE
-- Supports text, audio, video, and document attachments
-- Content can be encrypted for security (application-level)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE vasiyats (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    creator_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    media_uri VARCHAR(500),
    content_audio_uri VARCHAR(500),
    content_video_uri VARCHAR(500),
    content_attachments JSON,
    trigger_type ENUM('date', 'event', 'after_passing', 'age_milestone', 'manual') NOT NULL DEFAULT 'event',
    trigger_date DATE,
    trigger_event VARCHAR(255),
    mood VARCHAR(50),
    allow_ai_persona BOOLEAN DEFAULT FALSE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    status ENUM('draft', 'sealed', 'unlocked', 'viewed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE vasiyat_recipients (
    id VARCHAR(36) PRIMARY KEY,
    vasiyat_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    relationship_label VARCHAR(255),
    has_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP,
    FOREIGN KEY (vasiyat_id) REFERENCES vasiyats(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_recipient (vasiyat_id, member_id)
);

CREATE TABLE vasiyat_trustees (
    id VARCHAR(36) PRIMARY KEY,
    vasiyat_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    can_unlock BOOLEAN DEFAULT FALSE,
    has_approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (vasiyat_id) REFERENCES vasiyats(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trustee (vasiyat_id, member_id)
);

-- ═══════════════════════════════════════════════════════════
-- TRADITIONS (Parampara) TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE traditions (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('festival', 'ritual', 'recipe', 'ceremony', 'practice', 'other') NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly', 'occasional', 'once') DEFAULT 'yearly',
    date_or_occasion VARCHAR(255),
    origin_story TEXT,
    significance TEXT,
    recipe_ingredients JSON,
    recipe_steps JSON,
    generations_count INT DEFAULT 1,
    region VARCHAR(255),
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE tradition_steps (
    id VARCHAR(36) PRIMARY KEY,
    tradition_id VARCHAR(36) NOT NULL,
    step_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url VARCHAR(500),
    duration_minutes INT,
    FOREIGN KEY (tradition_id) REFERENCES traditions(id) ON DELETE CASCADE
);

CREATE TABLE tradition_participants (
    id VARCHAR(36) PRIMARY KEY,
    tradition_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    role VARCHAR(100),
    FOREIGN KEY (tradition_id) REFERENCES traditions(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (tradition_id, member_id)
);

-- ═══════════════════════════════════════════════════════════
-- ECHO AI CONVERSATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE echo_conversations (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    messages JSON NOT NULL,
    context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_members_family ON members(family_id);
CREATE INDEX idx_members_alive ON members(is_alive);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_relationships_member ON relationships(from_member_id);
CREATE INDEX idx_memories_family ON memories(family_id);
CREATE INDEX idx_memories_uploaded_by ON memories(uploaded_by);
CREATE INDEX idx_memories_favorite ON memories(is_favorite);
CREATE INDEX idx_kathas_family ON kathas(family_id);
CREATE INDEX idx_kathas_favorite ON kathas(is_favorite);
CREATE INDEX idx_vasiyats_family ON vasiyats(family_id);
CREATE INDEX idx_vasiyats_trigger_date ON vasiyats(trigger_date);
CREATE INDEX idx_traditions_family ON traditions(family_id);

-- ═══════════════════════════════════════════════════════════
-- MEMBER CLOSURE TABLE (for hierarchical family tree queries)
-- Enables O(1) ancestry queries - get all ancestors/descendants
-- Note: Triggers for automatic updates not yet implemented
-- Currently maintained manually when relationships change
-- ═══════════════════════════════════════════════════════════
CREATE TABLE member_closure (
    ancestor_id VARCHAR(36) NOT NULL,
    descendant_id VARCHAR(36) NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    path TEXT,
    PRIMARY KEY (ancestor_id, descendant_id),
    FOREIGN KEY (ancestor_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (descendant_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_closure_ancestor ON member_closure(ancestor_id);
CREATE INDEX idx_closure_descendant ON member_closure(descendant_id);
CREATE INDEX idx_closure_depth ON member_closure(depth);

SELECT '✅ Vansh database schema created successfully!' as status;
