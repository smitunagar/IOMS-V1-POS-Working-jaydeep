-- Migration: Create Sessions Table
-- Created: 2025-01-21
-- Description: Session management for user authentication and tracking

CREATE TABLE IF NOT EXISTS sessions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Key to Users
    user_id UUID NOT NULL,
    
    -- Session Token
    session_token VARCHAR(500) UNIQUE NOT NULL,
    
    -- Session Timing
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Session Status
    is_active BOOLEAN DEFAULT true,
    
    -- Device & Network Information
    ip_address VARCHAR(45),  -- Supports both IPv4 and IPv6
    device TEXT,  -- User agent string
    
    -- Foreign Key Constraint
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_user_login ON sessions(user_id, login_time DESC);
CREATE INDEX idx_sessions_active_unexpired ON sessions(is_active, expires_at) WHERE is_active = true;

-- Comments for Documentation
COMMENT ON TABLE sessions IS 'Tracks user authentication sessions across devices';
COMMENT ON COLUMN sessions.session_token IS 'Unique session identifier stored in client';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp (default: 30 days from login)';
COMMENT ON COLUMN sessions.last_activity IS 'Last time session was used (for activity tracking)';
COMMENT ON COLUMN sessions.is_active IS 'Quick flag to invalidate session without deletion';
COMMENT ON COLUMN sessions.device IS 'User agent string for device identification';


