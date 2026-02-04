/**
 * Database Configuration
 * Manages database connection settings for different environments
 */

// Load environment variables from .env.local (Next.js convention)
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

// Check if GCP Cloud SQL environment variables are set
const isGCPCloudSQL = process.env.DB_HOST && 
                      process.env.DB_HOST !== 'localhost' && 
                      process.env.DB_HOST.includes('.');

const config = {
  // Development Configuration
  // Uses GCP Cloud SQL if DB_HOST is set to GCP IP, otherwise uses local PostgreSQL
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ioms_production',
    user: process.env.DB_USER || process.env.USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
    
    // Connection Pool Settings
    max: 20,  // Maximum number of connections
    min: 2,   // Minimum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    
    // SSL Settings
    // Enable SSL for GCP Cloud SQL, disable for local development
    ssl: isGCPCloudSQL ? {
      rejectUnauthorized: false // GCP Cloud SQL doesn't require CA cert for public IP connections
    } : false
  },

  // Production Configuration (GCP Cloud SQL)
  production: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ioms_production',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    
    // Connection Pool Settings (higher for production)
    max: 50,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    
    // SSL Settings (required for GCP Cloud SQL)
    // Use rejectUnauthorized: false for public IP connections (no CA cert needed)
    ssl: {
      rejectUnauthorized: false
    }
  },

  // Test Configuration (Separate test database)
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_TEST_NAME || 'ioms_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    
    // Lower pool settings for testing
    max: 5,
    min: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    
    ssl: false
  }
};

// Get configuration based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

// Validate required environment variables for production
if (environment === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = dbConfig;

