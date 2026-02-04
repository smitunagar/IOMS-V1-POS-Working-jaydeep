/**
 * Test script for User Management API with Audit Logging
 * This script tests the API endpoints to ensure they work correctly
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'TestPassword123'
};

const testRole = {
  user_id: '', // Will be filled after user creation
  role_id: '' // Will be filled after getting roles
};

async function testAPI() {
  console.log('🧪 Testing User Management API with Audit Logging...\n');

  try {
    // Step 1: Login to get session token
    console.log('1. Logging in to get session token...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com', // Assuming admin user exists
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please ensure you have an admin user in the database.');
      console.log('   You can create one by running the database seeds.');
      return;
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    console.log('✅ Login successful');

    // Step 2: Get existing users
    console.log('\n2. Fetching existing users...');
    const usersResponse = await fetch(`${BASE_URL}/api/user-management`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    const usersData = await usersResponse.json();
    console.log(`✅ Found ${usersData.data?.length || 0} users`);

    // Step 3: Get roles
    console.log('\n3. Fetching available roles...');
    const rolesResponse = await fetch(`${BASE_URL}/api/roles`);
    const rolesData = await rolesResponse.json();
    console.log(`✅ Found ${rolesData.data?.length || 0} roles`);

    if (rolesData.data && rolesData.data.length > 0) {
      testRole.role_id = rolesData.data[0].id; // Use first available role
    }

    // Step 4: Create a test user
    console.log('\n4. Creating test user...');
    const createUserResponse = await fetch(`${BASE_URL}/api/user-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (createUserResponse.ok) {
      const createData = await createUserResponse.json();
      testRole.user_id = createData.data.id;
      console.log('✅ Test user created successfully');
    } else {
      const errorData = await createUserResponse.json();
      console.log(`❌ Failed to create user: ${errorData.error}`);
    }

    // Step 5: Assign role to user
    if (testRole.user_id && testRole.role_id) {
      console.log('\n5. Assigning role to user...');
      const assignRoleResponse = await fetch(`${BASE_URL}/api/user-management/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRole)
      });

      if (assignRoleResponse.ok) {
        console.log('✅ Role assigned successfully');
      } else {
        const errorData = await assignRoleResponse.json();
        console.log(`❌ Failed to assign role: ${errorData.error}`);
      }
    }

    // Step 6: Check audit logs
    console.log('\n6. Checking audit logs...');
    const auditResponse = await fetch(`${BASE_URL}/api/audit-logs`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (auditResponse.ok) {
      const auditData = await auditResponse.json();
      console.log(`✅ Found ${auditData.data?.length || 0} audit log entries`);
      
      if (auditData.data && auditData.data.length > 0) {
        console.log('\n📋 Recent audit log entries:');
        auditData.data.slice(0, 5).forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.operation} on ${log.table_name} by ${log.change_by_name || 'Unknown'}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch audit logs');
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPI();







