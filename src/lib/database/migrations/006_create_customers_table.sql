-- Migration 006: Create Customers Table
-- This migration creates the customers table for restaurant customer management

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Encrypted Personal Information
    first_name VARCHAR(500) NOT NULL, -- AES-256-GCM encrypted
    last_name VARCHAR(500) NOT NULL, -- AES-256-GCM encrypted
    email VARCHAR(500), -- AES-256-GCM encrypted
    phone_number VARCHAR(500), -- AES-256-GCM encrypted
    
    -- Lookup Hash (SHA-256 of email for lookups)
    email_hash VARCHAR(255),
    
    -- Optional Information
    date_of_birth DATE, -- For age verification/promotions
    marketing_opt_in BOOLEAN DEFAULT false,
    notes TEXT, -- Encrypted allergy info and preferences
    
    -- Tracking Information
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    restaurant_id UUID NOT NULL, -- FK to restaurants table
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT fk_customers_restaurant 
        FOREIGN KEY (restaurant_id) 
        REFERENCES restaurants(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email_hash ON customers(email_hash);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_date_created ON customers(date_created);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_marketing_opt_in ON customers(marketing_opt_in);

-- Create composite index for common queries (restaurant + active)
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_active ON customers(restaurant_id, is_active);

-- Add table comment
COMMENT ON TABLE customers IS 'Stores customer information for restaurants with encrypted PII data';
COMMENT ON COLUMN customers.first_name IS 'Encrypted first name (AES-256-GCM)';
COMMENT ON COLUMN customers.last_name IS 'Encrypted last name (AES-256-GCM)';
COMMENT ON COLUMN customers.email IS 'Encrypted email address (AES-256-GCM)';
COMMENT ON COLUMN customers.email_hash IS 'SHA-256 hash for email lookups';
COMMENT ON COLUMN customers.phone_number IS 'Encrypted phone number (AES-256-GCM)';
COMMENT ON COLUMN customers.notes IS 'Encrypted allergy information and preferences (AES-256-GCM)';




