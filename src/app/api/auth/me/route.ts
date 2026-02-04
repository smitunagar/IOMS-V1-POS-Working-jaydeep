import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const User = require('@/lib/database/models/User');
const Session = require('@/lib/database/models/Session');

/**
 * GET /api/auth/me
 * Returns current user information based on session token
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No session token provided' 
        },
        { status: 401 }
      );
    }

    // Check for special admin session token
    let user;
    let session;

    if (sessionToken.startsWith('SPECIAL_SAM_')) {
      // Special admin user - return virtual user without database lookup
      user = {
        id: 'special-admin-sam',
        name: 'Sam Admin',
        email: 'sam@gmail.com',
        tenant_id: null,
        active: true,
        signup_date: new Date().toISOString(),
        phone: null
      };

      // Create virtual session info
      session = {
        login_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
    } else {
      // Regular user - validate session from database
      session = await Session.validateSession(sessionToken);

      if (!session) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired session' 
          },
          { status: 401 }
        );
      }

      // Get user information
      user = await User.findById(session.user_id);

      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 404 }
        );
      }

      // Check if user is active
      if (!user.active) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Account is deactivated' 
          },
          { status: 403 }
        );
      }
    }

    // Return user information (without sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tenantId: user.tenant_id,
        signupDate: user.signup_date
      },
      session: {
        loginTime: session.login_time,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Get user info error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
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

      // Encryption/decryption errors
      if (error.message.includes('decrypt') || error.message.includes('encrypt')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unable to retrieve user information. Please login again.' 
          },
          { status: 500 }
        );
      }
    }

    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve user information' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/me
 * Updates current user information
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No session token provided' 
        },
        { status: 401 }
      );
    }

    // Validate session
    const session = await Session.validateSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired session' 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, phone } = body;

    // Validate input
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name must be at least 2 characters long' 
        },
        { status: 400 }
      );
    }

    // Update user information
    const updatedUser = await User.updateUser(session.user_id, {
      name: name ? name.trim() : undefined,
      phone: phone ? phone.trim() : undefined
    });

    // Return updated user information
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        tenantId: updatedUser.tenant_id,
        signupDate: updatedUser.signup_date
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Update user info error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
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
    }

    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile' 
      },
      { status: 500 }
    );
  }
}
