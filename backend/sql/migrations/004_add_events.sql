-- ═══════════════════════════════════════════════════════════
-- MIGRATION 004: Add Events (Family Album / Folder System)
-- ═══════════════════════════════════════════════════════════

-- Events table: each event is a "folder" for memories
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    family_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('wedding','birthday','festival','reunion','trip','ceremony','milestone','other') DEFAULT 'other',
    event_date DATE,
    event_end_date DATE,
    location VARCHAR(255),
    cover_memory_id VARCHAR(36),
    created_by VARCHAR(36) NOT NULL,
    memory_count INT DEFAULT 0,
    video_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (cover_memory_id) REFERENCES memories(id) ON DELETE SET NULL
);

-- Junction table: a memory can belong to multiple events
CREATE TABLE IF NOT EXISTS event_memories (
    event_id VARCHAR(36) NOT NULL,
    memory_id VARCHAR(36) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, memory_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_events_family ON events(family_id);
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_event_memories_memory ON event_memories(memory_id);

-- Extend kathas type enum to support video and photo_story
ALTER TABLE kathas MODIFY COLUMN type ENUM(
    'standalone_story','interview','memory_narration',
    'wisdom','recipe','video','photo_story','other'
) DEFAULT 'standalone_story';
