import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const User = require('@/lib/database/models/User');
const AuditLog = require('../../../../../database/models/AuditLog');

/**
 * POST /api/users/create
 * Creates a new user through user management (no automatic role assignment)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name, email, and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Validate password requirements
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain at least one number' 
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name must be at least 2 characters long' 
        },
        { status: 400 }
      );
    }

    // Validate phone format (if provided)
    if (phone && phone.trim() !== '') {
      // Basic phone validation - allows international formats
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please enter a valid phone number' 
          },
          { status: 400 }
        );
      }
    }

    // Get session information for audit logging
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    const Session = require('@/lib/database/models/Session');
    const session = await Session.findByToken(sessionToken);
    
    if (!session || !session.is_active) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Create user (encryption and hashing happens automatically in User model)
    const user = await User.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone ? phone.trim() : null,
      tenantId: null // Single tenant for now
    });

    // Log the user creation in audit log
    try {
      const ipAddress = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       request.ip ||
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await AuditLog.createAuditLog({
        userId: user.id,
        sessionId: session.id,
        changeBy: session.user_id,
        operation: 'CREATE',
        tableName: 'users',
        fieldName: null,
        oldValue: null,
        newValue: JSON.stringify({
          name: user.name,
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : null
        }),
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    // Log successful user creation (without sensitive data)
    console.log(`✅ New user created via user management: ${user.id} (${name})`);

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User created successfully!',
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        active: user.active,
        signup_date: user.signup_date
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ User creation error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      // Email already exists
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An account with this email already exists. Please use a different email.' 
          },
          { status: 409 }
        );
      }

      // Password validation errors
      if (error.message.includes('Password must')) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message 
          },
          { status: 400 }
        );
      }

      // Database connection errors
      if (error.message.includes('connection') || error.message.includes('database')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Service temporarily unavailable. Please try again later.' 
          },
          { status: 503 }
        );
      }

      // Encryption errors
      if (error.message.includes('encrypt') || error.message.includes('Encryption')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User creation failed. Please try again.' 
          },
          { status: 500 }
        );
      }
    }

    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        success: false, 
        error: 'User creation failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}






