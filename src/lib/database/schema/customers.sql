-- ============================================
-- SCHEMA SNAPSHOT: Customers Table
-- Migration: 006_create_customers_table.sql
-- Description: Current state of customers table
-- ============================================

CREATE TABLE customers (
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

-- Indexes
CREATE INDEX idx_customers_email_hash ON customers(email_hash);
CREATE INDEX idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX idx_customers_date_created ON customers(date_created);
CREATE INDEX idx_customers_last_visit ON customers(last_visit);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_marketing_opt_in ON customers(marketing_opt_in);
CREATE INDEX idx_customers_restaurant_active ON customers(restaurant_id, is_active);

-- Table Comments
COMMENT ON TABLE customers IS 'Stores customer information for restaurants with encrypted PII data';
COMMENT ON COLUMN customers.first_name IS 'Encrypted first name (AES-256-GCM)';
COMMENT ON COLUMN customers.last_name IS 'Encrypted last name (AES-256-GCM)';
COMMENT ON COLUMN customers.email IS 'Encrypted email address (AES-256-GCM)';
COMMENT ON COLUMN customers.email_hash IS 'SHA-256 hash for email lookups';
COMMENT ON COLUMN customers.phone_number IS 'Encrypted phone number (AES-256-GCM)';
COMMENT ON COLUMN customers.notes IS 'Encrypted allergy information and preferences (AES-256-GCM)';

-- ============================================
-- FIELD DESCRIPTIONS
-- ============================================
-- customer_id:      Unique customer identifier (UUID)
-- first_name:       Encrypted first name (AES-256-GCM)
-- last_name:        Encrypted last name (AES-256-GCM)
-- email:            Encrypted email address (AES-256-GCM)
-- phone_number:     Encrypted phone number (AES-256-GCM)
-- email_hash:       SHA-256 hash for email lookups
-- date_of_birth:    Customer date of birth (for age verification)
-- marketing_opt_in: Marketing consent flag (default: false)
-- notes:            Encrypted allergy info and preferences
-- date_created:     Customer record creation timestamp
-- last_visit:       Last visit timestamp for analytics
-- restaurant_id:    Foreign key to restaurants table
-- is_active:        Customer active status (default: true)
-- ============================================




