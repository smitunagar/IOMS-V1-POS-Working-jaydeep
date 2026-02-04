/**
 * Test script for Updated Current Endpoints with Audit Logging
 * This script tests the existing endpoints to ensure audit logging works
 */

const BASE_URL = 'http://localhost:3000';

async function testCurrentEndpointsWithAuditLogging() {
  console.log('🧪 Testing Current Endpoints with Audit Logging...\n');

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
      return;
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    console.log('✅ Login successful');

    // Step 2: Test GET /api/users (should log VIEW operation)
    console.log('\n2. Testing GET /api/users (should log VIEW operation)...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`✅ Users fetched successfully: ${usersData.data?.length || 0} users`);
    } else {
      console.log('❌ Failed to fetch users');
    }

    // Step 3: Get roles for testing
    console.log('\n3. Getting available roles...');
    const rolesResponse = await fetch(`${BASE_URL}/api/roles`);
    const rolesData = await rolesResponse.json();
    console.log(`✅ Found ${rolesData.data?.length || 0} roles`);

    // Step 4: Test role assignment (should log CREATE operation)
    if (rolesData.data && rolesData.data.length > 0) {
      console.log('\n4. Testing role assignment (should log CREATE operation)...');
      
      // Get first user and first role for testing
      const usersResponse2 = await fetch(`${BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const usersData2 = await usersResponse2.json();
      
      if (usersData2.data && usersData2.data.length > 0) {
        const testUser = usersData2.data[0];
        const testRole = rolesData.data[0];
        
        // Check if user already has this role
        const userRolesResponse = await fetch(`${BASE_URL}/api/user-roles?user_id=${testUser.id}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (userRolesResponse.ok) {
          const userRolesData = await userRolesResponse.json();
          const hasRole = userRolesData.data.some(role => role.role_id === testRole.id);
          
          if (!hasRole) {
            // Assign role
            const assignResponse = await fetch(`${BASE_URL}/api/user-roles`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: testUser.id,
                role_id: testRole.id
              })
            });
            
            if (assignResponse.ok) {
              console.log(`✅ Role "${testRole.role_name}" assigned to "${testUser.name}"`);
            } else {
              const errorData = await assignResponse.json();
              console.log(`❌ Failed to assign role: ${errorData.error}`);
            }
          } else {
            console.log(`ℹ️ User "${testUser.name}" already has role "${testRole.role_name}"`);
          }
        }
      }
    }

    // Step 5: Check audit logs
    console.log('\n5. Checking audit logs...');
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
          if (log.field_name) {
            console.log(`      Field: ${log.field_name}, Old: ${log.old_value || 'null'}, New: ${log.new_value || 'null'}`);
          }
        });
      }
    } else {
      console.log('❌ Failed to fetch audit logs');
    }

    console.log('\n🎉 Testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCurrentEndpointsWithAuditLogging();






