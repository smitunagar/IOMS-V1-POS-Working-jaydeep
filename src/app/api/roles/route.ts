import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/lib/connection';

// GET /api/roles - Get all active roles
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let queryText = `
      SELECT id, role_name, description, is_active, created_at, updated_at, valid_until
      FROM roles
    `;
    
    const queryParams: any[] = [];
    
    if (!includeInactive) {
      queryText += ' WHERE is_active = true';
    }
    
    queryText += ' ORDER BY role_name ASC';

    const result = await query(queryText, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    // TODO: Validate session and check if user has permission to create roles
    // For now, we'll skip session validation for development

    // Parse request body
    const body = await request.json();
    const { role_name, description, is_active = true, valid_until } = body;

    // Validate required fields
    if (!role_name || role_name.trim().length < 2 || role_name.trim().length > 100) {
      return NextResponse.json({
        error: 'Role name is required and must be between 2-100 characters'
      }, { status: 400 });
    }

    // Check if role name already exists
    const existingRole = await query(
      'SELECT id FROM roles WHERE role_name = $1',
      [role_name.trim()]
    );

    if (existingRole.rows.length > 0) {
      return NextResponse.json({
        error: 'A role with this name already exists'
      }, { status: 409 });
    }

    // Create role
    const result = await query(`
      INSERT INTO roles (role_name, description, is_active, valid_until)
      VALUES ($1, $2, $3, $4)
      RETURNING id, role_name, description, is_active, created_at, updated_at, valid_until
    `, [role_name.trim(), description || null, is_active, valid_until || null]);

    const newRole = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}









