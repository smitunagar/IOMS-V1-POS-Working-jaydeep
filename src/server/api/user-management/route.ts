import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';
const Session = require('../../../../database/models/Session');
const User = require('../../../../database/models/User');
const AuditLog = require('../../../../database/models/AuditLog');

/**
 * Enhanced User Management API with Audit Logging
 * Handles all user management operations with comprehensive audit trails
 */

// Helper function to extract client information
function getClientInfo(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Helper function to log audit entry
async function logAuditEntry(
  session: any,
  operation: string,
  tableName: string,
  userId: string | null,
  fieldName: string | null = null,
  oldValue: string | null = null,
  newValue: string | null = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
) {
  try {
    await AuditLog.createAuditLog({
      userId,
      sessionId: session.id,
      changeBy: session.user_id,
      operation,
      tableName,
      fieldName,
      oldValue,
      newValue,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

// GET /api/user-management - Get all users with their roles and audit info
export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Log the VIEW operation
    await logAuditEntry(
      session,
      'VIEW',
      'users',
      null,
      null,
      null,
      null,
      ipAddress,
      userAgent
    );

    // First, get all users with pagination
    let userQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.active,
        u.signup_date,
        u.tenant_id
      FROM users u
    `;
    
    const queryParams: any[] = [];
    
    if (!includeInactive) {
      userQuery += ' WHERE u.active = true';
    }
    
    userQuery += ' ORDER BY u.signup_date DESC LIMIT $1 OFFSET $2';
    queryParams.push(limit, offset);

    const userResult = await query(userQuery, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users u';
    const countParams: any[] = [];
    
    if (!includeInactive) {
      countQuery += ' WHERE u.active = true';
    }
    
    const countResult = await query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].total);

    // Get roles for each user
    const users = await Promise.all(userResult.rows.map(async (user) => {
      const rolesQuery = `
        SELECT 
          ur.id,
          ur.role_id,
          r.role_name,
          r.description as role_description,
          ur.created_at as assigned_at,
          ur.valid_until
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
        ORDER BY ur.created_at DESC
      `;
      
      const rolesResult = await query(rolesQuery, [user.id]);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.active ? 'active' : 'inactive',
        createdAt: user.signup_date,
        tenantId: user.tenant_id,
        roles: rolesResult.rows,
        permissions: {
          pos: true, // Default permissions - can be enhanced later
          inventory: true,
          analytics: true,
          settings: true
        }
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        limit,
        offset,
        hasMore: offset + limit < totalUsers
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/user-management - Create new user
export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, password, tenantId, roles } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({
        error: 'Name, email, and password are required'
      }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Create user
    const newUser = await User.createUser({
      name,
      email,
      phone,
      password,
      tenantId: tenantId || session.tenant_id
    });

    // Log user creation
    await logAuditEntry(
      session,
      'CREATE',
      'users',
      newUser.id,
      null,
      null,
      JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        tenantId: newUser.tenant_id
      }),
      ipAddress,
      userAgent
    );

    // Assign roles if provided
    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const roleId of roles) {
        try {
          await query(`
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, role_id) DO NOTHING
          `, [newUser.id, roleId]);

          // Log role assignment
          await logAuditEntry(
            session,
            'CREATE',
            'user_roles',
            newUser.id,
            'role_id',
            null,
            roleId,
            ipAddress,
            userAgent
          );
        } catch (error) {
          console.error('Error assigning role:', error);
          // Continue with other roles even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Email already registered')) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      if (error.message.includes('Password must')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/user-management - Update user
export async function PUT(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, name, email, phone, active, password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Get current user data for audit logging
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Update user if there are changes
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.updateUser(userId, updateData);

      // Log field changes
      for (const [field, newValue] of Object.entries(updateData)) {
        const oldValue = currentUser[field];
        if (oldValue !== newValue) {
          await logAuditEntry(
            session,
            'UPDATE',
            'users',
            userId,
            field,
            oldValue ? String(oldValue) : null,
            newValue ? String(newValue) : null,
            ipAddress,
            userAgent
          );
        }
      }
    }

    // Update password if provided
    if (password) {
      await User.updatePassword(userId, password);
      
      // Log password change (don't log the actual password)
      await logAuditEntry(
        session,
        'UPDATE',
        'users',
        userId,
        'password',
        '[REDACTED]',
        '[REDACTED]',
        ipAddress,
        userAgent
      );
    }

    // Update active status if provided
    if (active !== undefined) {
      const oldStatus = currentUser.active;
      await User.setActiveStatus(userId, active);
      
      // Log status change
      await logAuditEntry(
        session,
        'UPDATE',
        'users',
        userId,
        'active',
        String(oldStatus),
        String(active),
        ipAddress,
        userAgent
      );
    }

    // Get updated user data
    const updatedUser = await User.findById(userId);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-management - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permanent = searchParams.get('permanent') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Get current user data for audit logging
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let success = false;
    let operation = '';

    if (permanent) {
      // Hard delete
      success = await User.deleteUser(userId);
      operation = 'DELETE';
    } else {
      // Soft delete (deactivate)
      success = await User.deactivateUser(userId);
      operation = 'UPDATE';
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log deletion
    await logAuditEntry(
      session,
      operation,
      'users',
      userId,
      permanent ? null : 'active',
      permanent ? JSON.stringify(currentUser) : String(currentUser.active),
      permanent ? null : 'false',
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: permanent ? 'User permanently deleted' : 'User deactivated'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

