/**
 * Session Queries
 * SQL queries for session operations
 */

const queries = {
  // Create new session
  createSession: `
    INSERT INTO sessions (user_id, session_token, expires_at, ip_address, device)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, session_token, login_time, expires_at, is_active
  `,

  // Find session by token
  findByToken: `
    SELECT id, user_id, session_token, login_time, logout_time, expires_at, 
           last_activity, is_active, ip_address, device
    FROM sessions
    WHERE session_token = $1
  `,

  // Find active session by token
  findActiveByToken: `
    SELECT id, user_id, session_token, login_time, expires_at, last_activity
    FROM sessions
    WHERE session_token = $1 
      AND is_active = true 
      AND expires_at > NOW()
  `,

  // Get all user sessions
  getUserSessions: `
    SELECT id, session_token, login_time, logout_time, expires_at, 
           last_activity, is_active, ip_address, device
    FROM sessions
    WHERE user_id = $1
    ORDER BY login_time DESC
  `,

  // Get active user sessions
  getActiveUserSessions: `
    SELECT id, session_token, login_time, expires_at, last_activity, ip_address, device
    FROM sessions
    WHERE user_id = $1 
      AND is_active = true 
      AND expires_at > NOW()
    ORDER BY last_activity DESC
  `,

  // Update last activity
  updateLastActivity: `
    UPDATE sessions
    SET last_activity = NOW()
    WHERE session_token = $1
    RETURNING last_activity
  `,

  // Logout session (set logout_time and deactivate)
  logoutSession: `
    UPDATE sessions
    SET logout_time = NOW(),
        is_active = false
    WHERE session_token = $1
    RETURNING id, logout_time
  `,

  // Logout all user sessions
  logoutAllUserSessions: `
    UPDATE sessions
    SET logout_time = NOW(),
        is_active = false
    WHERE user_id = $1 AND is_active = true
    RETURNING id
  `,

  // Invalidate session
  invalidateSession: `
    UPDATE sessions
    SET is_active = false
    WHERE session_token = $1
    RETURNING id
  `,

  // Delete session
  deleteSession: `
    DELETE FROM sessions
    WHERE id = $1
    RETURNING id
  `,

  // Clean up expired sessions
  cleanupExpiredSessions: `
    DELETE FROM sessions
    WHERE expires_at < NOW()
    RETURNING id
  `,

  // Clean up old sessions (older than X days)
  cleanupOldSessions: `
    DELETE FROM sessions
    WHERE login_time < NOW() - INTERVAL '$1 days'
    RETURNING id
  `,

  // Get session count by user
  getSessionCountByUser: `
    SELECT COUNT(*) as count
    FROM sessions
    WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
  `,

  // Get recent login activity
  getRecentLoginActivity: `
    SELECT user_id, login_time, ip_address, device
    FROM sessions
    WHERE user_id = $1
    ORDER BY login_time DESC
    LIMIT $2
  `
};

module.exports = queries;

