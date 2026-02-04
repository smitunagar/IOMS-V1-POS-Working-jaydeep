-- Migration 005: Create Roles and User Roles Tables
-- This migration creates the role-based access control system

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,

    CONSTRAINT roles_name_length_check CHECK (LENGTH(role_name) >= 2 AND LENGTH(role_name) <= 100)
);

-- Create user_roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Ensure a user cannot be assigned the same role twice
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(role_name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON user_roles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_valid_until ON user_roles(valid_until);

-- Trigger to update updated_at on roles table
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

-- Insert default roles
INSERT INTO roles (role_name, description, is_active) VALUES
('Owner', 'Full system access and control over all operations', true),
('Restaurant Manager', 'Manage daily operations, staff, and customer service', true),
('Assistant Manager / Shift Lead', 'Assist in management tasks and lead shifts', true),
('Accountant/Finance', 'Handle financial operations, billing, and accounting', true),
('HR Admin', 'Manage human resources, employee records, and policies', true),
('Chef/Kitchen Manager', 'Oversee kitchen operations, menu planning, and food preparation', true),
('Server/Waiter', 'Serve customers, take orders, and handle table service', true),
('Bartender/Barback', 'Prepare drinks, manage bar operations, and assist bartenders', true),
('Cashier', 'Handle payments, process transactions, and manage cash register', true),
('Inventory Manager', 'Manage stock levels, ordering, and inventory tracking', true),
('Delivery Driver', 'Handle food delivery and transportation logistics', true),
('Marketing Manager', 'Develop marketing strategies and manage promotional activities', true),
('Employee (App Access)', 'Basic employee access to essential app features', true)
ON CONFLICT (role_name) DO NOTHING;
