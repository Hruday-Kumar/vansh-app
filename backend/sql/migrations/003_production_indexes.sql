-- 🪷 VANSH DATABASE PRODUCTION SCHEMA
-- Production-ready schema with indexes, constraints, and optimizations
-- Run after schema.sql or as a migration

-- ═══════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_member ON users(member_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Members table indexes
CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_members_alive ON members(is_alive);
CREATE INDEX IF NOT EXISTS idx_members_birth ON members(birth_date);

-- Relationships table indexes
CREATE INDEX IF NOT EXISTS idx_relationships_family ON relationships(family_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_member_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_member_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Memories table indexes
CREATE INDEX IF NOT EXISTS idx_memories_family ON memories(family_id);
CREATE INDEX IF NOT EXISTS idx_memories_uploader ON memories(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_captured ON memories(captured_at);
CREATE INDEX IF NOT EXISTS idx_memories_featured ON memories(is_featured);
CREATE FULLTEXT INDEX IF NOT EXISTS idx_memories_search ON memories(title, description);

-- Kathas table indexes
CREATE INDEX IF NOT EXISTS idx_kathas_family ON kathas(family_id);
CREATE INDEX IF NOT EXISTS idx_kathas_narrator ON kathas(narrator_id);
CREATE INDEX IF NOT EXISTS idx_kathas_type ON kathas(type);
CREATE INDEX IF NOT EXISTS idx_kathas_featured ON kathas(is_featured);
CREATE FULLTEXT INDEX IF NOT EXISTS idx_kathas_search ON kathas(title, description, transcript);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token(100));

-- Vasiyats table indexes
CREATE INDEX IF NOT EXISTS idx_vasiyats_family ON vasiyats(family_id);
CREATE INDEX IF NOT EXISTS idx_vasiyats_creator ON vasiyats(creator_id);
CREATE INDEX IF NOT EXISTS idx_vasiyats_status ON vasiyats(status);

-- ═══════════════════════════════════════════════════════════
-- CLEANUP PROCEDURES
-- ═══════════════════════════════════════════════════════════

-- Auto-cleanup expired sessions (run via cron/scheduler)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END //
DELIMITER ;

-- Create an event to run cleanup daily (requires EVENT scheduler enabled)
-- SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS cleanup_sessions_daily
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_expired_sessions();

-- ═══════════════════════════════════════════════════════════
-- AUDIT TRIGGERS (Optional - for tracking changes)
-- ═══════════════════════════════════════════════════════════

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_data JSON,
    new_data JSON,
    user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_created (created_at)
);

-- ═══════════════════════════════════════════════════════════
-- STORAGE TRACKING TRIGGER
-- ═══════════════════════════════════════════════════════════

DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_family_storage_after_memory
AFTER INSERT ON memories
FOR EACH ROW
BEGIN
    -- Estimate file size (placeholder - actual implementation would get real file size)
    DECLARE estimated_size BIGINT DEFAULT 1048576; -- 1MB default
    UPDATE families 
    SET storage_used_bytes = storage_used_bytes + estimated_size 
    WHERE id = NEW.family_id;
END //
DELIMITER ;

-- ═══════════════════════════════════════════════════════════
-- VIEWS FOR COMMON QUERIES
-- ═══════════════════════════════════════════════════════════

-- Family dashboard stats view
CREATE OR REPLACE VIEW v_family_stats AS
SELECT 
    f.id as family_id,
    f.name as family_name,
    f.surname,
    (SELECT COUNT(*) FROM members m WHERE m.family_id = f.id) as member_count,
    (SELECT COUNT(*) FROM members m WHERE m.family_id = f.id AND m.is_alive = TRUE) as living_count,
    (SELECT COUNT(*) FROM memories mem WHERE mem.family_id = f.id) as memory_count,
    (SELECT COUNT(*) FROM kathas k WHERE k.family_id = f.id) as katha_count,
    (SELECT COUNT(*) FROM relationships r WHERE r.family_id = f.id) as relationship_count,
    f.storage_used_bytes,
    f.storage_limit_bytes,
    ROUND((f.storage_used_bytes / f.storage_limit_bytes) * 100, 2) as storage_percent_used,
    f.created_at
FROM families f;

-- Active users view (logged in within last 30 days)
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    u.id,
    u.email,
    u.role,
    m.first_name,
    m.last_name,
    f.name as family_name,
    u.last_login,
    DATEDIFF(NOW(), u.last_login) as days_since_login
FROM users u
LEFT JOIN members m ON u.member_id = m.id
LEFT JOIN families f ON u.family_id = f.id
WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ═══════════════════════════════════════════════════════════
-- DATA INTEGRITY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════

-- Ensure relationship members are in the same family
DELIMITER //
CREATE TRIGGER IF NOT EXISTS check_relationship_family
BEFORE INSERT ON relationships
FOR EACH ROW
BEGIN
    DECLARE from_family VARCHAR(36);
    DECLARE to_family VARCHAR(36);
    
    SELECT family_id INTO from_family FROM members WHERE id = NEW.from_member_id;
    SELECT family_id INTO to_family FROM members WHERE id = NEW.to_member_id;
    
    IF from_family != to_family OR from_family != NEW.family_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Relationship members must belong to the same family';
    END IF;
END //
DELIMITER ;

-- ═══════════════════════════════════════════════════════════
-- PERFORMANCE OPTIMIZATION: Partitioning for large tables
-- (Uncomment if you have large datasets)
-- ═══════════════════════════════════════════════════════════

-- ALTER TABLE memories 
-- PARTITION BY RANGE (YEAR(created_at)) (
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

-- ═══════════════════════════════════════════════════════════
-- STATISTICS UPDATE (Run periodically for query optimization)
-- ═══════════════════════════════════════════════════════════

ANALYZE TABLE users;
ANALYZE TABLE members;
ANALYZE TABLE relationships;
ANALYZE TABLE memories;
ANALYZE TABLE kathas;
ANALYZE TABLE families;
