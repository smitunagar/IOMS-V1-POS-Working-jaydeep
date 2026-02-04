-- Migration: Create Migration Tracker Table
-- Created: 2025-01-21
-- Description: Tracks which migrations have been applied to the database

CREATE TABLE IF NOT EXISTS migration_history (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Migration Information
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    migration_number INTEGER NOT NULL,
    
    -- Execution Details
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,  -- How long migration took
    applied_by VARCHAR(255),  -- User or system that ran migration
    
    -- Status
    status VARCHAR(50) DEFAULT 'SUCCESS',  -- SUCCESS, FAILED, ROLLED_BACK
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT migration_history_name_key UNIQUE (migration_name),
    CONSTRAINT migration_history_status_check CHECK (status IN ('SUCCESS', 'FAILED', 'ROLLED_BACK'))
);

-- Index for quick lookups
CREATE INDEX idx_migration_history_number ON migration_history(migration_number);
CREATE INDEX idx_migration_history_applied_at ON migration_history(applied_at);

-- Comments for Documentation
COMMENT ON TABLE migration_history IS 'Tracks database migration execution history';
COMMENT ON COLUMN migration_history.migration_name IS 'Filename of the migration (e.g., 001_create_users_table.sql)';
COMMENT ON COLUMN migration_history.migration_number IS 'Sequential migration number for ordering';
COMMENT ON COLUMN migration_history.execution_time_ms IS 'Time taken to execute migration in milliseconds';


