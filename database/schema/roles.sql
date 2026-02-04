-- Schema Snapshot: roles table
-- Current structure as of migration 005

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,

    CONSTRAINT roles_name_length_check CHECK (LENGTH(role_name) >= 2 AND LENGTH(role_name) <= 100)
);

-- Indexes
CREATE INDEX idx_roles_name ON roles(role_name);
CREATE INDEX idx_roles_is_active ON roles(is_active);
CREATE INDEX idx_roles_created_at ON roles(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();









