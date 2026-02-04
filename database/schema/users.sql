-- ============================================
-- SCHEMA SNAPSHOT: Users Table
-- Last Updated: 2025-01-21
-- Description: Current state of users table
-- ============================================

-- This file represents the CURRENT state of the users table.
-- It should be updated whenever migrations modify this table.
-- For change history, refer to migration files.

CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    name VARCHAR(255) NOT NULL,
    
    -- Encrypted Fields (AES-256-GCM)
    email VARCHAR(500) NOT NULL,
    phone VARCHAR(500),
    
    -- Lookup Hash (SHA-256 of email)
    email_hash VARCHAR(255) UNIQUE NOT NULL,
    
    -- Authentication (bcrypt hashed)
    password VARCHAR(255) NOT NULL,
    
    -- Status & Multi-tenancy
    active BOOLEAN DEFAULT true,
    tenant_id UUID,
    
    -- Timestamps
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_email_hash_key UNIQUE (email_hash)
);

-- Indexes
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_signup_date ON users(signup_date);

-- ============================================
-- FIELD DESCRIPTIONS
-- ============================================
-- id:          Unique identifier (UUID)
-- name:        User's display name
-- email:       Encrypted email address
-- phone:       Encrypted phone number (optional)
-- email_hash:  SHA-256 hash for email lookups
-- password:    Bcrypt hashed password
-- active:      Account status flag
-- tenant_id:   Multi-tenant restaurant identifier
-- signup_date: Account creation timestamp
-- ============================================


