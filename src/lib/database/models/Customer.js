/**
 * Customer Model
 * Data access layer for customer operations
 * Handles encryption/decryption for sensitive data
 */

const { query } = require('../lib/connection');
const { encrypt, decrypt, hash } = require('../lib/encryption');
const customerQueries = require('../lib/queries/customerQueries');

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Created customer (without sensitive encrypted data)
 */
async function createCustomer(customerData) {
  const { 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    dateOfBirth, 
    notes, 
    restaurantId,
    marketingOptIn = false,
    isActive = true 
  } = customerData;

  // Validate required fields
  if (!firstName || !lastName || !restaurantId) {
    throw new Error('First name, last name, and restaurant ID are required');
  }

  // Encrypt sensitive data
  const encryptedFirstName = encrypt(firstName);
  const encryptedLastName = encrypt(lastName);
  const encryptedEmail = email ? encrypt(email) : null;
  const emailHash = email ? hash(email) : null;
  const encryptedPhone = phoneNumber ? encrypt(phoneNumber) : null;
  const encryptedNotes = notes ? encrypt(notes) : null;

  // Check if email already exists for this restaurant
  if (emailHash) {
    const existsResult = await query(customerQueries.emailExists, [emailHash, restaurantId]);
    if (existsResult.rows[0].exists) {
      throw new Error('Email already registered for this restaurant');
    }
  }

  // Insert customer
  const result = await query(customerQueries.createCustomer, [
    encryptedFirstName,
    encryptedLastName,
    encryptedEmail,
    emailHash,
    encryptedPhone,
    dateOfBirth || null,
    encryptedNotes,
    restaurantId,
    isActive,
    marketingOptIn
  ]);

  return result.rows[0];
}

/**
 * Find customer by email
 * @param {string} email - Customer email
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Object|null>} Customer object or null
 */
async function findByEmail(email, restaurantId) {
  const emailHash = hash(email);
  const result = await query(customerQueries.findByEmailHash, [emailHash, restaurantId]);

  if (result.rows.length === 0) {
    return null;
  }

  const customer = result.rows[0];

  // Decrypt sensitive fields
  if (customer.first_name) {
    customer.first_name = decrypt(customer.first_name);
  }
  if (customer.last_name) {
    customer.last_name = decrypt(customer.last_name);
  }
  if (customer.email) {
    customer.email = decrypt(customer.email);
  }
  if (customer.phone_number) {
    customer.phone_number = decrypt(customer.phone_number);
  }
  if (customer.notes) {
    customer.notes = decrypt(customer.notes);
  }

  return customer;
}

/**
 * Find customer by ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object|null>} Customer object or null
 */
async function findById(customerId) {
  const result = await query(customerQueries.findById, [customerId]);

  if (result.rows.length === 0) {
    return null;
  }

  const customer = result.rows[0];

  // Decrypt sensitive fields
  if (customer.first_name) {
    customer.first_name = decrypt(customer.first_name);
  }
  if (customer.last_name) {
    customer.last_name = decrypt(customer.last_name);
  }
  if (customer.email) {
    customer.email = decrypt(customer.email);
  }
  if (customer.phone_number) {
    customer.phone_number = decrypt(customer.phone_number);
  }
  if (customer.notes) {
    customer.notes = decrypt(customer.notes);
  }

  return customer;
}

/**
 * Get customers by restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {boolean} activeOnly - Only return active customers
 * @returns {Promise<Array>} Array of customers
 */
async function findByRestaurant(restaurantId, activeOnly = false) {
  const result = activeOnly 
    ? await query(customerQueries.findActiveByRestaurant, [restaurantId])
    : await query(customerQueries.findByRestaurant, [restaurantId]);

  // Decrypt sensitive fields for all customers
  return result.rows.map(customer => {
    if (customer.first_name) customer.first_name = decrypt(customer.first_name);
    if (customer.last_name) customer.last_name = decrypt(customer.last_name);
    if (customer.email) customer.email = decrypt(customer.email);
    if (customer.phone_number) customer.phone_number = decrypt(customer.phone_number);
    if (customer.notes) customer.notes = decrypt(customer.notes);
    return customer;
  });
}

/**
 * Update customer information
 * @param {string} customerId - Customer ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated customer
 */
async function updateCustomer(customerId, updateData) {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    dateOfBirth,
    notes,
    marketingOptIn,
    isActive
  } = updateData;

  // Encrypt if provided
  const encryptedFirstName = firstName ? encrypt(firstName) : null;
  const encryptedLastName = lastName ? encrypt(lastName) : null;
  const encryptedEmail = email ? encrypt(email) : null;
  const emailHash = email ? hash(email) : null;
  const encryptedPhone = phoneNumber ? encrypt(phoneNumber) : null;
  const encryptedNotes = notes ? encrypt(notes) : null;

  const result = await query(customerQueries.updateCustomer, [
    customerId,
    encryptedFirstName,
    encryptedLastName,
    encryptedEmail,
    emailHash,
    encryptedPhone,
    dateOfBirth,
    encryptedNotes,
    marketingOptIn,
    isActive
  ]);

  return result.rows[0];
}

/**
 * Update last visit timestamp
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Updated customer
 */
async function updateLastVisit(customerId) {
  const result = await query(customerQueries.updateLastVisit, [customerId]);
  return result.rows[0];
}

/**
 * Set customer active status
 * @param {string} customerId - Customer ID
 * @param {boolean} active - Active status
 * @returns {Promise<boolean>} Success status
 */
async function setActiveStatus(customerId, active) {
  const result = await query(customerQueries.setActiveStatus, [customerId, active]);
  return result.rowCount > 0;
}

/**
 * Delete customer permanently
 * @param {string} customerId - Customer ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteCustomer(customerId) {
  const result = await query(customerQueries.deleteCustomer, [customerId]);
  return result.rowCount > 0;
}

/**
 * Get all customers with pagination
 * @param {number} limit - Number of customers to return
 * @param {number} offset - Number of customers to skip
 * @returns {Promise<Array>} Array of customers (with encrypted data)
 */
async function getAllCustomers(limit = 50, offset = 0) {
  const result = await query(customerQueries.getAllCustomers, [limit, offset]);
  return result.rows;
}

/**
 * Count customers by restaurant
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<number>} Count of active customers
 */
async function countByRestaurant(restaurantId) {
  const result = await query(customerQueries.countByRestaurant, [restaurantId]);
  return parseInt(result.rows[0].count);
}

/**
 * Get customers with marketing consent
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<Array>} Array of customers with marketing consent
 */
async function getMarketingConsentCustomers(restaurantId) {
  const result = await query(customerQueries.getMarketingConsentCustomers, [restaurantId]);
  
  // Decrypt sensitive fields
  return result.rows.map(customer => {
    if (customer.first_name) customer.first_name = decrypt(customer.first_name);
    if (customer.last_name) customer.last_name = decrypt(customer.last_name);
    if (customer.email) customer.email = decrypt(customer.email);
    if (customer.phone_number) customer.phone_number = decrypt(customer.phone_number);
    return customer;
  });
}

/**
 * Search customers by name
 * @param {string} restaurantId - Restaurant ID
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} Array of matching customers
 */
async function searchByName(restaurantId, searchTerm, limit = 10) {
  const searchPattern = `%${searchTerm}%`;
  const result = await query(customerQueries.searchByName, [restaurantId, searchPattern, limit]);
  
  // Decrypt sensitive fields
  return result.rows.map(customer => {
    if (customer.first_name) customer.first_name = decrypt(customer.first_name);
    if (customer.last_name) customer.last_name = decrypt(customer.last_name);
    return customer;
  });
}

module.exports = {
  createCustomer,
  findByEmail,
  findById,
  findByRestaurant,
  updateCustomer,
  updateLastVisit,
  setActiveStatus,
  deleteCustomer,
  getAllCustomers,
  countByRestaurant,
  getMarketingConsentCustomers,
  searchByName
};




