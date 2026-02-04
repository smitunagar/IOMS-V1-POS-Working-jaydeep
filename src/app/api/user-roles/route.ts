import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';
import Session from '@/lib/database/models/Session';
const AuditLog = require('../../../../database/models/AuditLog');

// GET /api/user-roles - Get user roles for a specific user
export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken) as any;
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
    const ipAddress = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the VIEW operation
    try {
      await AuditLog.createAuditLog({
        userId: userId,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: 'VIEW',
        tableName: 'user_roles',
        fieldName: null,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
      // Don't throw error to avoid breaking the main operation
    }

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

// POST /api/user-roles - Assign role to user
export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken) as any;
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
    const ipAddress = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if user exists
    const userExists = await query('SELECT id, name FROM users WHERE id = $1', [user_id]);
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
    
    // Log the role assignment
    try {
      await AuditLog.createAuditLog({
        userId: user_id,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: 'CREATE',
        tableName: 'user_roles',
        fieldName: 'role_id',
        oldValue: null,
        newValue: role_id,
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
      // Don't throw error to avoid breaking the main operation
    }
    
    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: 'Role assigned successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles - Remove role from user
export async function DELETE(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session and get user
    const session = await Session.validateSession(sessionToken) as any;
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
    const ipAddress = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

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
    
    // Log the role removal
    try {
      await AuditLog.createAuditLog({
        userId: assignment.user_id,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: 'DELETE',
        tableName: 'user_roles',
        fieldName: 'role_id',
        oldValue: assignment.role_id,
        newValue: null,
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
      // Don't throw error to avoid breaking the main operation
    }
    
    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    });

  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
}



