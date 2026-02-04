/**
 * Seed Script
 * Populates database with test data for development
 * 
 * Usage: node database/seeds/run-seeds.js
 */

const User = require('../models/User');
const { testConnection, closePool } = require('../lib/connection');

const testUsers = [
  {
    name: 'Test Owner',
    email: 'owner@test.com',
    password: 'TestPass123',
    phone: '+1234567890',
    tenantId: null
  },
  {
    name: 'Test Manager',
    email: 'manager@test.com',
    password: 'TestPass123',
    phone: '+1234567891',
    tenantId: null
  },
  {
    name: 'Test Staff',
    email: 'staff@test.com',
    password: 'TestPass123',
    phone: '+1234567892',
    tenantId: null
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Create test users
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        
        if (existingUser) {
          console.log(`⏭️  User already exists: ${userData.email}`);
          continue;
        }

        // Create user
        const user = await User.createUser(userData);
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
        console.log(`   User ID: ${user.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✅ Database seeding completed!\n');
    console.log('Test User Credentials:');
    console.log('─────────────────────────────');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}\n`);
    });

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };











