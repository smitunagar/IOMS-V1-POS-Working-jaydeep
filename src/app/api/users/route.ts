import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';
import Session from '@/lib/database/models/Session';
const AuditLog = require('../../../../database/models/AuditLog');

// GET /api/users - Get all users with their roles
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

    // Get client info for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the VIEW operation
    try {
      await AuditLog.createAuditLog({
        userId: null,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: 'VIEW',
        tableName: 'users',
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // First, get all users
    let userQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.active,
        u.signup_date
      FROM users u
    `;
    
    const queryParams: any[] = [];
    
    if (!includeInactive) {
      userQuery += ' WHERE u.active = true';
    }
    
    userQuery += ' ORDER BY u.signup_date DESC';

    const userResult = await query(userQuery, queryParams);
    
    // Get roles for each user
    const users = await Promise.all(userResult.rows.map(async (user: any) => {
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
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user (soft delete by default)
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
    const userId = searchParams.get('userId');
    const permanent = searchParams.get('permanent') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // Get client info for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get current user data for audit logging
    const currentUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = currentUserResult.rows[0];
    let success = false;
    let operation = '';

    if (permanent) {
      // Hard delete - remove from database
      const deleteResult = await query('DELETE FROM users WHERE id = $1', [userId]);
      success = deleteResult.rowCount > 0;
      operation = 'DELETE';
    } else {
      // Soft delete - deactivate user
      const updateResult = await query('UPDATE users SET active = false WHERE id = $1', [userId]);
      success = updateResult.rowCount > 0;
      operation = 'UPDATE';
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log deletion in audit log
    try {
      await AuditLog.createAuditLog({
        userId: userId,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: operation,
        tableName: 'users',
        fieldName: permanent ? null : 'active',
        oldValue: permanent ? JSON.stringify(currentUser) : String(currentUser.active),
        newValue: permanent ? null : 'false',
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
      // Don't throw error to avoid breaking the main operation
    }

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
