-- 🪷 ADD PHONE COLUMN TO USERS TABLE
-- This fixes the "Unknown column 'phone'" error

USE vansh_db;

-- Add phone column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE AFTER email;

-- Verify it worked
DESCRIBE users;
