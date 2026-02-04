/**
 * Restaurant Queries
 * Raw SQL queries for restaurant table operations
 */

const restaurantQueries = {
  // Create a new restaurant
  createRestaurant: `
    INSERT INTO restaurants (
      user_id, name, address_street, address_city, address_state, 
      address_zip, address_country, tax_id, website_url, email, 
      cuisine_type, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, user_id, name, address_street, address_city, 
              address_state, address_zip, address_country, 
              created_at, website_url, cuisine_type, status, 
              last_updated_at
  `,

  // Get restaurant by ID
  getRestaurantById: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE id = $1
  `,

  // Get all restaurants for a user
  getRestaurantsByUserId: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE user_id = $1
    ORDER BY created_at DESC
  `,

  // Get restaurants by status
  getRestaurantsByStatus: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE user_id = $1 AND status = $2
    ORDER BY created_at DESC
  `,

  // Get restaurants by cuisine type
  getRestaurantsByCuisine: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE user_id = $1 AND cuisine_type = $2
    ORDER BY created_at DESC
  `,

  // Update restaurant
  updateRestaurant: `
    UPDATE restaurants 
    SET name = $2, address_street = $3, address_city = $4, 
        address_state = $5, address_zip = $6, address_country = $7,
        tax_id = $8, website_url = $9, email = $10, 
        cuisine_type = $11, status = $12
    WHERE id = $1 AND user_id = $13
    RETURNING id, user_id, name, address_street, address_city, 
              address_state, address_zip, address_country, 
              created_at, website_url, cuisine_type, status, 
              last_updated_at
  `,

  // Update restaurant status
  updateRestaurantStatus: `
    UPDATE restaurants 
    SET status = $2
    WHERE id = $1 AND user_id = $3
    RETURNING id, status, last_updated_at
  `,

  // Delete restaurant (soft delete by setting status to 'closed')
  deleteRestaurant: `
    UPDATE restaurants 
    SET status = 'closed'
    WHERE id = $1 AND user_id = $2
    RETURNING id, status, last_updated_at
  `,

  // Hard delete restaurant
  hardDeleteRestaurant: `
    DELETE FROM restaurants 
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `,

  // Search restaurants by name
  searchRestaurantsByName: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE user_id = $1 AND name ILIKE $2
    ORDER BY name ASC
  `,

  // Get restaurant count by user
  getRestaurantCountByUser: `
    SELECT COUNT(*) as count
    FROM restaurants 
    WHERE user_id = $1
  `,

  // Get restaurant count by status
  getRestaurantCountByStatus: `
    SELECT COUNT(*) as count
    FROM restaurants 
    WHERE user_id = $1 AND status = $2
  `,

  // Check if restaurant name exists for user
  checkRestaurantNameExists: `
    SELECT EXISTS(
      SELECT 1 FROM restaurants 
      WHERE user_id = $1 AND name = $2 AND id != $3
    ) as exists
  `,

  // Get restaurants with pagination
  getRestaurantsPaginated: `
    SELECT id, user_id, name, address_street, address_city, 
           address_state, address_zip, address_country, 
           created_at, tax_id, website_url, email, 
           cuisine_type, status, last_updated_at
    FROM restaurants 
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  // Get all unique cuisine types for a user
  getCuisineTypesByUser: `
    SELECT DISTINCT cuisine_type
    FROM restaurants 
    WHERE user_id = $1 AND cuisine_type IS NOT NULL
    ORDER BY cuisine_type ASC
  `
};

module.exports = restaurantQueries;









