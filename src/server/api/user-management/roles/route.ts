import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';
import Session from '@/lib/database/models/Session';
const AuditLog = require('../../../../../database/models/AuditLog');

/**
 * User Role Management API with Audit Logging
 * Handles role assignment and removal with comprehensive audit trails
 */

// Helper function to extract client information
function getClientInfo(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
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

// GET /api/user-management/roles - Get user roles for a specific user
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
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Log the VIEW operation
    await logAuditEntry(
      session,
      'VIEW',
      'user_roles',
      userId,
      null,
      null,
      null,
      ipAddress,
      userAgent
    );

    // Get user roles with role details
    const result = await query(`
      SELECT 
        ur.id as user_role_id,
        ur.user_id,
        ur.role_id,
        ur.created_at as assigned_at,
        ur.valid_until,
        r.role_name,
        r.description as role_description,
        r.is_active as role_active
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY ur.created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

// POST /api/user-management/roles - Assign role to user
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
    const { user_id, role_id, valid_until } = body;

    // Validate required fields
    if (!user_id || !role_id) {
      return NextResponse.json({
        error: 'user_id and role_id are required'
      }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Check if user exists
    const userExists = await query('SELECT id, name, email FROM users WHERE id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if role exists and is active
    const roleExists = await query('SELECT id, role_name, is_active FROM roles WHERE id = $1', [role_id]);
    if (roleExists.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (!roleExists.rows[0].is_active) {
      return NextResponse.json({ error: 'Cannot assign inactive role' }, { status: 400 });
    }

    // Check if user already has this role
    const existingAssignment = await query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [user_id, role_id]
    );

    if (existingAssignment.rows.length > 0) {
      return NextResponse.json({
        error: 'User already has this role assigned'
      }, { status: 409 });
    }

    // Assign role to user
    const result = await query(`
      INSERT INTO user_roles (user_id, role_id, valid_until)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, role_id, created_at, valid_until
    `, [user_id, role_id, valid_until || null]);

    const newAssignment = result.rows[0];
    
    // Log role assignment
    await logAuditEntry(
      session,
      'CREATE',
      'user_roles',
      user_id,
      'role_id',
      null,
      role_id,
      ipAddress,
      userAgent
    );

    // Get role name for response
    const roleName = roleExists.rows[0].role_name;
    const userName = userExists.rows[0].name;
    
    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: `Role "${roleName}" assigned to user "${userName}" successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// PUT /api/user-management/roles - Update role assignment (e.g., change valid_until)
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
    const { user_role_id, valid_until } = body;

    if (!user_role_id) {
      return NextResponse.json({ error: 'user_role_id is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Get current role assignment
    const currentAssignment = await query(`
      SELECT ur.*, r.role_name, u.name as user_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE ur.id = $1
    `, [user_role_id]);

    if (currentAssignment.rows.length === 0) {
      return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    const assignment = currentAssignment.rows[0];
    const oldValidUntil = assignment.valid_until;

    // Update role assignment
    const result = await query(`
      UPDATE user_roles 
      SET valid_until = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [valid_until, user_role_id]);

    const updatedAssignment = result.rows[0];

    // Log role update
    await logAuditEntry(
      session,
      'UPDATE',
      'user_roles',
      assignment.user_id,
      'valid_until',
      oldValidUntil ? oldValidUntil.toISOString() : null,
      valid_until ? valid_until : null,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: `Role assignment for "${assignment.role_name}" updated successfully`
    });

  } catch (error) {
    console.error('Error updating role assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update role assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-management/roles - Remove role from user
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
    const userRoleId = searchParams.get('user_role_id');

    if (!userRoleId) {
      return NextResponse.json({ error: 'user_role_id parameter is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Get role assignment details before deletion
    const assignmentDetails = await query(`
      SELECT ur.*, r.role_name, u.name as user_name, u.id as user_id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE ur.id = $1
    `, [userRoleId]);

    if (assignmentDetails.rows.length === 0) {
      return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    const assignment = assignmentDetails.rows[0];

    // Remove role assignment
    await query('DELETE FROM user_roles WHERE id = $1', [userRoleId]);
    
    // Log role removal
    await logAuditEntry(
      session,
      'DELETE',
      'user_roles',
      assignment.user_id,
      'role_id',
      assignment.role_id,
      null,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: `Role "${assignment.role_name}" removed from user "${assignment.user_name}" successfully`
    });

  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
}







