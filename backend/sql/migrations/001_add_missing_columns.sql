-- Migration: Add Missing Columns to Existing Database
-- Date: 2026-01-19
-- Description: Adds columns that were missing from schema.sql but used in controllers
--              Also removes unused columns to clean up the schema

USE vansh_db;

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add missing columns
-- ═══════════════════════════════════════════════════════════

-- Add phone column to users table (if not exists)
ALTER TABLE users 
  MODIFY COLUMN email VARCHAR(255) UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Add storage tracking to families table
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 1073741824,
  ADD COLUMN IF NOT EXISTS allow_digital_echo BOOLEAN DEFAULT FALSE;

-- Add missing columns to memories table
ALTER TABLE memories 
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ocr_text TEXT;

-- Add missing columns to kathas table
ALTER TABLE kathas 
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS linked_memory_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS sync_points JSON;

-- Add foreign key for linked_memory_id (check if exists first)
SET @fk_exists = (SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'vansh_db' 
  AND TABLE_NAME = 'kathas' 
  AND CONSTRAINT_NAME = 'fk_kathas_linked_memory');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE kathas ADD CONSTRAINT fk_kathas_linked_memory FOREIGN KEY (linked_memory_id) REFERENCES memories(id) ON DELETE SET NULL',
  'SELECT "Foreign key already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add missing columns to vasiyats table
ALTER TABLE vasiyats 
  ADD COLUMN IF NOT EXISTS content_audio_uri VARCHAR(500),
  ADD COLUMN IF NOT EXISTS content_video_uri VARCHAR(500),
  ADD COLUMN IF NOT EXISTS content_attachments JSON;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Remove unused columns (optional - comment out if unsure)
-- ═══════════════════════════════════════════════════════════

-- Uncomment these if you want to remove unused columns from families table
-- ALTER TABLE families DROP COLUMN IF EXISTS motto;
-- ALTER TABLE families DROP COLUMN IF EXISTS crest_url;
-- ALTER TABLE families DROP COLUMN IF EXISTS origin_location;
-- ALTER TABLE families DROP COLUMN IF EXISTS origin_date;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Create indexes for new columns
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories(is_favorite);
CREATE INDEX IF NOT EXISTS idx_memories_uploaded_by ON memories(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_kathas_favorite ON kathas(is_favorite);
CREATE INDEX IF NOT EXISTS idx_kathas_linked_memory ON kathas(linked_memory_id);
CREATE INDEX IF NOT EXISTS idx_members_alive ON members(is_alive);
CREATE INDEX IF NOT EXISTS idx_vasiyats_trigger_date ON vasiyats(trigger_date);

SELECT '✅ Migration completed successfully!' as status;
