-- Migration: Create Migration Tracker Table
-- Created: 2025-01-21
-- Description: Tracks which migrations have been applied to the database
-- NOTE: This migration is now a no-op as the migration_history table is created by the migration runner

-- Comments for Documentation
COMMENT ON TABLE migration_history IS 'Tracks database migration execution history';
COMMENT ON COLUMN migration_history.migration_name IS 'Filename of the migration (e.g., 001_create_users_table.sql)';
COMMENT ON COLUMN migration_history.migration_number IS 'Sequential migration number for ordering';
COMMENT ON COLUMN migration_history.execution_time_ms IS 'Time taken to execute migration in milliseconds';


