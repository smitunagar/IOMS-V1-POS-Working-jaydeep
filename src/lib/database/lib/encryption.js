/**
 * Encryption Module
 * Handles AES-256-GCM encryption/decryption for sensitive data
 * 
 * IMPORTANT: For production deployment to GCP
 * - Move ENCRYPTION_KEY to Google Cloud KMS (Key Management Service)
 * - Use Secret Manager for key rotation
 * - Never commit encryption keys to Git
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * @returns {Buffer} Encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }
  
  // Convert hex string to buffer
  if (key.length !== KEY_LENGTH * 2) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`);
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Generate a random encryption key (for setup only)
 * @returns {string} Hex encoded encryption key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data (format: iv:authTag:ciphertext in hex)
 */
function encrypt(plaintext) {
  if (!plaintext || plaintext === '') {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:ciphertext (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data (format: iv:authTag:ciphertext)
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData || encryptedData === '') {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    
    // Split iv:authTag:ciphertext
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Create SHA-256 hash (for email lookup)
 * @param {string} data - Data to hash
 * @returns {string} Hex encoded hash
 */
function hash(data) {
  if (!data || data === '') {
    return null;
  }
  
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}

/**
 * Generate a random session token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Hex encoded random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate encryption key format
 * @returns {boolean} Whether encryption key is valid
 */
function validateEncryptionKey() {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== KEY_LENGTH * 2) {
      return false;
    }
    // Try to convert to buffer
    Buffer.from(key, 'hex');
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================
// GCP KMS MIGRATION NOTES
// ============================================
// When deploying to GCP, migrate from .env to Cloud KMS:
//
// 1. Create encryption key in Cloud KMS:
//    gcloud kms keyrings create ioms-keyring --location=global
//    gcloud kms keys create encryption-key --location=global --keyring=ioms-keyring --purpose=encryption
//
// 2. Replace getEncryptionKey() to fetch from KMS:
//    const {KeyManagementServiceClient} = require('@google-cloud/kms');
//    const client = new KeyManagementServiceClient();
//    // Use client.encrypt() and client.decrypt()
//
// 3. Store key name in Secret Manager, not .env
//
// 4. Implement key rotation policy (every 90 days recommended)
// ============================================

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  generateEncryptionKey,
  validateEncryptionKey
};

