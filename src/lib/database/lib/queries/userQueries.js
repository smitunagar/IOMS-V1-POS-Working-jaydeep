/**
 * User Queries
 * SQL queries for user operations
 */

const queries = {
  // Create new user
  createUser: `
    INSERT INTO users (name, email, email_hash, phone, password, tenant_id, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email_hash, tenant_id, active, signup_date
  `,

  // Find user by email hash
  findByEmailHash: `
    SELECT id, name, email, email_hash, phone, password, tenant_id, active, signup_date
    FROM users
    WHERE email_hash = $1
  `,

  // Find user by ID
  findById: `
    SELECT id, name, email, email_hash, phone, tenant_id, active, signup_date
    FROM users
    WHERE id = $1
  `,

  // Update user
  updateUser: `
    UPDATE users
    SET name = COALESCE($2, name),
        email = COALESCE($3, email),
        email_hash = COALESCE($4, email_hash),
        phone = COALESCE($5, phone),
        active = COALESCE($6, active)
    WHERE id = $1
    RETURNING id, name, email_hash, tenant_id, active, signup_date
  `,

  // Update password
  updatePassword: `
    UPDATE users
    SET password = $2
    WHERE id = $1
    RETURNING id
  `,

  // Set user active status
  setActiveStatus: `
    UPDATE users
    SET active = $2
    WHERE id = $1
    RETURNING id, active
  `,

  // Delete user (soft delete by setting active = false)
  softDeleteUser: `
    UPDATE users
    SET active = false
    WHERE id = $1
    RETURNING id
  `,

  // Hard delete user (permanent)
  hardDeleteUser: `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `,

  // Get all users (with pagination)
  getAllUsers: `
    SELECT id, name, email_hash, tenant_id, active, signup_date
    FROM users
    ORDER BY signup_date DESC
    LIMIT $1 OFFSET $2
  `,

  // Get users by tenant
  getUsersByTenant: `
    SELECT id, name, email_hash, tenant_id, active, signup_date
    FROM users
    WHERE tenant_id = $1
    ORDER BY signup_date DESC
  `,

  // Get active users count
  getActiveUsersCount: `
    SELECT COUNT(*) as count
    FROM users
    WHERE active = true
  `,

  // Check if email exists (by hash)
  emailExists: `
    SELECT EXISTS(
      SELECT 1 FROM users WHERE email_hash = $1
    ) as exists
  `
};

module.exports = queries;

