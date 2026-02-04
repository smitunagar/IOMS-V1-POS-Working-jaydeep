/**
 * Customer Queries
 * SQL queries for customer operations
 */

const queries = {
  // Create new customer
  createCustomer: `
    INSERT INTO customers (first_name, last_name, email, email_hash, phone_number, date_of_birth, notes, restaurant_id, is_active, marketing_opt_in)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING customer_id, date_created
  `,

  // Find customer by email hash
  findByEmailHash: `
    SELECT customer_id, first_name, last_name, email, email_hash, phone_number, date_of_birth, notes, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    WHERE email_hash = $1 AND restaurant_id = $2
  `,

  // Find customer by ID
  findById: `
    SELECT customer_id, first_name, last_name, email, email_hash, phone_number, date_of_birth, notes, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    WHERE customer_id = $1
  `,

  // Get customers by restaurant
  findByRestaurant: `
    SELECT customer_id, first_name, last_name, email, email_hash, phone_number, date_of_birth, notes, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    WHERE restaurant_id = $1
    ORDER BY date_created DESC
  `,

  // Get active customers by restaurant
  findActiveByRestaurant: `
    SELECT customer_id, first_name, last_name, email, email_hash, phone_number, date_of_birth, notes, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    WHERE restaurant_id = $1 AND is_active = true
    ORDER BY last_visit DESC NULLS LAST, date_created DESC
  `,

  // Update customer
  updateCustomer: `
    UPDATE customers
    SET first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        email_hash = COALESCE($5, email_hash),
        phone_number = COALESCE($6, phone_number),
        date_of_birth = COALESCE($7, date_of_birth),
        notes = COALESCE($8, notes),
        marketing_opt_in = COALESCE($9, marketing_opt_in),
        is_active = COALESCE($10, is_active)
    WHERE customer_id = $1
    RETURNING customer_id, date_created, last_visit
  `,

  // Update last visit
  updateLastVisit: `
    UPDATE customers
    SET last_visit = CURRENT_TIMESTAMP
    WHERE customer_id = $1
    RETURNING customer_id, last_visit
  `,

  // Set active status
  setActiveStatus: `
    UPDATE customers
    SET is_active = $2
    WHERE customer_id = $1
    RETURNING customer_id, is_active
  `,

  // Delete customer (hard delete)
  deleteCustomer: `
    DELETE FROM customers
    WHERE customer_id = $1
    RETURNING customer_id
  `,

  // Get customers with pagination
  getAllCustomers: `
    SELECT customer_id, first_name, last_name, email_hash, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    ORDER BY date_created DESC
    LIMIT $1 OFFSET $2
  `,

  // Count customers by restaurant
  countByRestaurant: `
    SELECT COUNT(*) as count
    FROM customers
    WHERE restaurant_id = $1 AND is_active = true
  `,

  // Check if email exists for a restaurant (by hash)
  emailExists: `
    SELECT EXISTS(
      SELECT 1 FROM customers 
      WHERE email_hash = $1 AND restaurant_id = $2
    ) as exists
  `,

  // Get customers with marketing consent
  getMarketingConsentCustomers: `
    SELECT customer_id, first_name, last_name, email, email_hash, phone_number, date_created, last_visit, restaurant_id
    FROM customers
    WHERE restaurant_id = $1 AND marketing_opt_in = true AND is_active = true
    ORDER BY date_created DESC
  `,

  // Search customers by name
  searchByName: `
    SELECT customer_id, first_name, last_name, email_hash, marketing_opt_in, date_created, last_visit, restaurant_id, is_active
    FROM customers
    WHERE restaurant_id = $1 
      AND (first_name ILIKE $2 OR last_name ILIKE $2)
      AND is_active = true
    ORDER BY last_visit DESC NULLS LAST
    LIMIT $3
  `
};

module.exports = queries;




