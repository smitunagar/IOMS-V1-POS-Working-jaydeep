-- Migration: Create Users Table
-- Created: 2025-01-21
-- Description: Initial users table with encryption support for email and phone

CREATE TABLE IF NOT EXISTS users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    name VARCHAR(255) NOT NULL,
    
    -- Encrypted Fields (stored as encrypted strings)
    email VARCHAR(500) NOT NULL,
    phone VARCHAR(500),
    
    -- Lookup Hash (for querying encrypted email)
    email_hash VARCHAR(255) UNIQUE NOT NULL,
    
    -- Authentication
    password VARCHAR(255) NOT NULL,  -- bcrypt hash
    
    -- Status & Multi-tenancy
    active BOOLEAN DEFAULT true,
    tenant_id UUID,
    
    -- Timestamps
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_hash_key UNIQUE (email_hash)
);

-- Indexes for Performance
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_signup_date ON users(signup_date);

-- Comments for Documentation
COMMENT ON TABLE users IS 'Stores user account information with encrypted PII';
COMMENT ON COLUMN users.email IS 'Encrypted email address (AES-256-GCM)';
COMMENT ON COLUMN users.phone IS 'Encrypted phone number (AES-256-GCM)';
COMMENT ON COLUMN users.email_hash IS 'SHA-256 hash of email for lookup purposes';
COMMENT ON COLUMN users.password IS 'Bcrypt hashed password (salt rounds: 10)';
COMMENT ON COLUMN users.tenant_id IS 'Multi-tenant identifier for restaurant separation';


