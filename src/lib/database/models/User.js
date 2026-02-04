/**
 * User Model
 * Data access layer for user operations
 * Handles encryption/decryption and password hashing
 */

const bcrypt = require('bcryptjs');
const { query } = require('../lib/connection');
const { encrypt, decrypt, hash } = require('../lib/encryption');
const userQueries = require('../lib/queries/userQueries');

const SALT_ROUNDS = 10;

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user (without password)
 */
async function createUser(userData) {
  const { name, email, phone, password, tenantId = null } = userData;

  // Validate required fields
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  // Validate password requirements
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  // Create email hash for lookup
  const emailHash = hash(email);

  // Check if email already exists
  const existsResult = await query(userQueries.emailExists, [emailHash]);
  if (existsResult.rows[0].exists) {
    throw new Error('Email already registered');
  }

  // Encrypt sensitive data
  const encryptedEmail = encrypt(email);
  const encryptedPhone = phone ? encrypt(phone) : null;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await query(userQueries.createUser, [
    name,
    encryptedEmail,
    emailHash,
    encryptedPhone,
    hashedPassword,
    tenantId,
    true // active by default
  ]);

  return result.rows[0];
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findByEmail(email) {
  const emailHash = hash(email);
  const result = await query(userQueries.findByEmailHash, [emailHash]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Decrypt sensitive fields
  if (user.email) {
    user.email = decrypt(user.email);
  }
  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  return user;
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(userId) {
  const result = await query(userQueries.findById, [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Decrypt sensitive fields
  if (user.email) {
    user.email = decrypt(user.email);
  }
  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  // Remove password from response
  delete user.password;

  return user;
}

/**
 * Verify user password
 * @param {string} email - User email
 * @param {string} password - Password to verify
 * @returns {Promise<Object|null>} User object if password matches, null otherwise
 */
async function verifyPassword(email, password) {
  const emailHash = hash(email);
  const result = await query(userQueries.findByEmailHash, [emailHash]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  // Decrypt sensitive fields
  if (user.email) {
    user.email = decrypt(user.email);
  }
  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  // Remove password from response
  delete user.password;

  return user;
}

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(userId, updateData) {
  const { name, email, phone } = updateData;

  // Encrypt if provided
  const encryptedEmail = email ? encrypt(email) : null;
  const emailHash = email ? hash(email) : null;
  const encryptedPhone = phone ? encrypt(phone) : null;

  const result = await query(userQueries.updateUser, [
    userId,
    name || null,
    encryptedEmail,
    emailHash,
    encryptedPhone,
    null // active status not updated here
  ]);

  return result.rows[0];
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
async function updatePassword(userId, newPassword) {
  // Validate password requirements
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (!/\d/.test(newPassword)) {
    throw new Error('Password must contain at least one number');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await query(userQueries.updatePassword, [userId, hashedPassword]);

  return result.rowCount > 0;
}

/**
 * Set user active status
 * @param {string} userId - User ID
 * @param {boolean} active - Active status
 * @returns {Promise<boolean>} Success status
 */
async function setActiveStatus(userId, active) {
  const result = await query(userQueries.setActiveStatus, [userId, active]);
  return result.rowCount > 0;
}

/**
 * Deactivate user (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deactivateUser(userId) {
  return setActiveStatus(userId, false);
}

/**
 * Delete user permanently
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUser(userId) {
  const result = await query(userQueries.hardDeleteUser, [userId]);
  return result.rowCount > 0;
}

/**
 * Get all users with pagination
 * @param {number} limit - Number of users to return
 * @param {number} offset - Number of users to skip
 * @returns {Promise<Array>} Array of users
 */
async function getAllUsers(limit = 50, offset = 0) {
  const result = await query(userQueries.getAllUsers, [limit, offset]);
  return result.rows;
}

/**
 * Get users by tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of users
 */
async function getUsersByTenant(tenantId) {
  const result = await query(userQueries.getUsersByTenant, [tenantId]);
  return result.rows;
}

/**
 * Get active users count
 * @returns {Promise<number>} Count of active users
 */
async function getActiveUsersCount() {
  const result = await query(userQueries.getActiveUsersCount);
  return parseInt(result.rows[0].count);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  verifyPassword,
  updateUser,
  updatePassword,
  setActiveStatus,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getUsersByTenant,
  getActiveUsersCount
};

