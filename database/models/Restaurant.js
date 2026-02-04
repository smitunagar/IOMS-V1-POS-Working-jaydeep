/**
 * Restaurant Model
 * Data access layer for restaurant operations with encryption support
 */

const { query } = require('../lib/connection');
const { encrypt, decrypt } = require('../lib/encryption');
const restaurantQueries = require('../lib/queries/restaurantQueries');

class Restaurant {
  /**
   * Create a new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @returns {Promise<Object>} Created restaurant
   */
  static async create(restaurantData) {
    const {
      userId,
      name,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      taxId,
      websiteUrl,
      email,
      cuisineType,
      status = 'active'
    } = restaurantData;

    try {
      // Encrypt sensitive fields
      const encryptedTaxId = taxId ? encrypt(taxId) : null;
      const encryptedEmail = email ? encrypt(email) : null;

      const result = await query(restaurantQueries.createRestaurant, [
        userId,
        name,
        addressStreet || null,
        addressCity || null,
        addressState || null,
        addressZip || null,
        addressCountry || null,
        encryptedTaxId,
        websiteUrl || null,
        encryptedEmail,
        cuisineType || null,
        status
      ]);

      const restaurant = result.rows[0];
      
      // Decrypt sensitive fields for response
      if (restaurant) {
        restaurant.taxId = restaurant.taxId ? decrypt(restaurant.taxId) : null;
        restaurant.email = restaurant.email ? decrypt(restaurant.email) : null;
      }

      return restaurant;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  /**
   * Get restaurant by ID
   * @param {string} restaurantId - Restaurant ID
   * @returns {Promise<Object|null>} Restaurant data
   */
  static async getById(restaurantId) {
    try {
      const result = await query(restaurantQueries.getRestaurantById, [restaurantId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const restaurant = result.rows[0];
      
      // Decrypt sensitive fields
      restaurant.taxId = restaurant.taxId ? decrypt(restaurant.taxId) : null;
      restaurant.email = restaurant.email ? decrypt(restaurant.email) : null;

      return restaurant;
    } catch (error) {
      console.error('Error getting restaurant by ID:', error);
      throw error;
    }
  }

  /**
   * Get all restaurants for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of restaurants
   */
  static async getByUserId(userId) {
    try {
      const result = await query(restaurantQueries.getRestaurantsByUserId, [userId]);
      
      // Decrypt sensitive fields for each restaurant
      return result.rows.map(restaurant => ({
        ...restaurant,
        taxId: restaurant.taxId ? decrypt(restaurant.taxId) : null,
        email: restaurant.email ? decrypt(restaurant.email) : null
      }));
    } catch (error) {
      console.error('Error getting restaurants by user ID:', error);
      throw error;
    }
  }

  /**
   * Get restaurants by status
   * @param {string} userId - User ID
   * @param {string} status - Restaurant status
   * @returns {Promise<Array>} Array of restaurants
   */
  static async getByStatus(userId, status) {
    try {
      const result = await query(restaurantQueries.getRestaurantsByStatus, [userId, status]);
      
      // Decrypt sensitive fields for each restaurant
      return result.rows.map(restaurant => ({
        ...restaurant,
        taxId: restaurant.taxId ? decrypt(restaurant.taxId) : null,
        email: restaurant.email ? decrypt(restaurant.email) : null
      }));
    } catch (error) {
      console.error('Error getting restaurants by status:', error);
      throw error;
    }
  }

  /**
   * Get restaurants by cuisine type
   * @param {string} userId - User ID
   * @param {string} cuisineType - Cuisine type
   * @returns {Promise<Array>} Array of restaurants
   */
  static async getByCuisine(userId, cuisineType) {
    try {
      const result = await query(restaurantQueries.getRestaurantsByCuisine, [userId, cuisineType]);
      
      // Decrypt sensitive fields for each restaurant
      return result.rows.map(restaurant => ({
        ...restaurant,
        taxId: restaurant.taxId ? decrypt(restaurant.taxId) : null,
        email: restaurant.email ? decrypt(restaurant.email) : null
      }));
    } catch (error) {
      console.error('Error getting restaurants by cuisine:', error);
      throw error;
    }
  }

  /**
   * Update restaurant
   * @param {string} restaurantId - Restaurant ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated restaurant
   */
  static async update(restaurantId, userId, updateData) {
    const {
      name,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      taxId,
      websiteUrl,
      email,
      cuisineType,
      status
    } = updateData;

    try {
      // Encrypt sensitive fields
      const encryptedTaxId = taxId ? encrypt(taxId) : null;
      const encryptedEmail = email ? encrypt(email) : null;

      const result = await query(restaurantQueries.updateRestaurant, [
        restaurantId,
        name,
        addressStreet || null,
        addressCity || null,
        addressState || null,
        addressZip || null,
        addressCountry || null,
        encryptedTaxId,
        websiteUrl || null,
        encryptedEmail,
        cuisineType || null,
        status,
        userId
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const restaurant = result.rows[0];
      
      // Decrypt sensitive fields for response
      restaurant.taxId = restaurant.taxId ? decrypt(restaurant.taxId) : null;
      restaurant.email = restaurant.email ? decrypt(restaurant.email) : null;

      return restaurant;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  /**
   * Update restaurant status
   * @param {string} restaurantId - Restaurant ID
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>} Updated restaurant
   */
  static async updateStatus(restaurantId, userId, status) {
    try {
      const result = await query(restaurantQueries.updateRestaurantStatus, [
        restaurantId,
        status,
        userId
      ]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      throw error;
    }
  }

  /**
   * Delete restaurant (soft delete)
   * @param {string} restaurantId - Restaurant ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted restaurant
   */
  static async delete(restaurantId, userId) {
    try {
      const result = await query(restaurantQueries.deleteRestaurant, [restaurantId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  /**
   * Hard delete restaurant
   * @param {string} restaurantId - Restaurant ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted restaurant
   */
  static async hardDelete(restaurantId, userId) {
    try {
      const result = await query(restaurantQueries.hardDeleteRestaurant, [restaurantId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error hard deleting restaurant:', error);
      throw error;
    }
  }

  /**
   * Search restaurants by name
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of restaurants
   */
  static async searchByName(userId, searchTerm) {
    try {
      const result = await query(restaurantQueries.searchRestaurantsByName, [
        userId,
        `%${searchTerm}%`
      ]);
      
      // Decrypt sensitive fields for each restaurant
      return result.rows.map(restaurant => ({
        ...restaurant,
        taxId: restaurant.taxId ? decrypt(restaurant.taxId) : null,
        email: restaurant.email ? decrypt(restaurant.email) : null
      }));
    } catch (error) {
      console.error('Error searching restaurants by name:', error);
      throw error;
    }
  }

  /**
   * Get restaurant count by user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Restaurant count
   */
  static async getCountByUser(userId) {
    try {
      const result = await query(restaurantQueries.getRestaurantCountByUser, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting restaurant count by user:', error);
      throw error;
    }
  }

  /**
   * Get restaurant count by status
   * @param {string} userId - User ID
   * @param {string} status - Restaurant status
   * @returns {Promise<number>} Restaurant count
   */
  static async getCountByStatus(userId, status) {
    try {
      const result = await query(restaurantQueries.getRestaurantCountByStatus, [userId, status]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting restaurant count by status:', error);
      throw error;
    }
  }

  /**
   * Check if restaurant name exists for user
   * @param {string} userId - User ID
   * @param {string} name - Restaurant name
   * @param {string} excludeId - Restaurant ID to exclude from check
   * @returns {Promise<boolean>} True if name exists
   */
  static async nameExists(userId, name, excludeId = null) {
    try {
      const result = await query(restaurantQueries.checkRestaurantNameExists, [
        userId,
        name,
        excludeId
      ]);
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking restaurant name exists:', error);
      throw error;
    }
  }

  /**
   * Get restaurants with pagination
   * @param {string} userId - User ID
   * @param {number} limit - Number of restaurants to return
   * @param {number} offset - Number of restaurants to skip
   * @returns {Promise<Array>} Array of restaurants
   */
  static async getPaginated(userId, limit, offset) {
    try {
      const result = await query(restaurantQueries.getRestaurantsPaginated, [
        userId,
        limit,
        offset
      ]);
      
      // Decrypt sensitive fields for each restaurant
      return result.rows.map(restaurant => ({
        ...restaurant,
        taxId: restaurant.taxId ? decrypt(restaurant.taxId) : null,
        email: restaurant.email ? decrypt(restaurant.email) : null
      }));
    } catch (error) {
      console.error('Error getting paginated restaurants:', error);
      throw error;
    }
  }

  /**
   * Get all unique cuisine types for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of cuisine types
   */
  static async getCuisineTypes(userId) {
    try {
      const result = await query(restaurantQueries.getCuisineTypesByUser, [userId]);
      return result.rows.map(row => row.cuisine_type);
    } catch (error) {
      console.error('Error getting cuisine types:', error);
      throw error;
    }
  }
}

module.exports = Restaurant;









