-- Schema Snapshot: restaurants.sql
-- Description: Current schema for restaurants table
-- Last Updated: 2025-10-22

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tax_id VARCHAR(500), -- Encrypted tax ID (AES-256-GCM)
    website_url TEXT,
    email VARCHAR(500), -- Encrypted restaurant email (AES-256-GCM)
    cuisine_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_restaurants_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_restaurants_created_at ON restaurants(created_at);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_cuisine_type ON restaurants(cuisine_type);

-- Constraints
ALTER TABLE restaurants ADD CONSTRAINT restaurants_status_check 
    CHECK (status IN ('active', 'inactive', 'closed', 'pending'));

-- Trigger function for auto-updating last_updated_at
CREATE OR REPLACE FUNCTION update_restaurants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurants_updated_at();









