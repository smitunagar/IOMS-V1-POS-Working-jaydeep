import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const User = require('@/lib/database/models/User');
const Session = require('@/lib/database/models/Session');

/**
 * POST /api/auth/login
 * Authenticates user and creates session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required' 
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

    // Special admin user - bypasses database checks
    const SPECIAL_ADMIN_EMAIL = 'sam@gmail.com';
    const SPECIAL_ADMIN_PASSWORD = 'Createnew1234';
    
    const normalizedEmail = email.toLowerCase().trim();
    let user;
    let sessionToken;

    if (normalizedEmail === SPECIAL_ADMIN_EMAIL && password === SPECIAL_ADMIN_PASSWORD) {
      // Special admin user - create virtual user and special session token
      user = {
        id: 'special-admin-sam',
        name: 'Sam Admin',
        email: SPECIAL_ADMIN_EMAIL,
        tenant_id: null,
        active: true,
        signup_date: new Date().toISOString(),
        phone: null
      };

      // Generate special session token (prefixed to identify it)
      const { generateToken } = require('@/lib/database/lib/encryption');
      sessionToken = `SPECIAL_SAM_${generateToken(32)}`;

      // Log special admin login
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      console.log(`✅ Special Admin logged in: ${user.email} from ${ipAddress}`);
    } else {
      // Regular user authentication - verify credentials from database
      user = await User.verifyPassword(normalizedEmail, password);
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email or password' 
          },
          { status: 401 }
        );
      }

      // Check if user account is active
      if (!user.active) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Account is deactivated. Please contact support.' 
          },
          { status: 403 }
        );
      }

      // Get client information for session tracking
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      const device = request.headers.get('user-agent') || 'unknown';

      // Create session in database
      const session = await Session.createSession({
        userId: user.id,
        ipAddress: ipAddress,
        device: device,
        expiryDays: 30 // 30-day session
      });

      sessionToken = session.session_token;

      // Log successful login (without sensitive data)
      console.log(`✅ User logged in: ${user.id} (${user.name}) from ${ipAddress}`);
    }

    // Return success response with session token
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      sessionToken: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenant_id
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Login error:', error);

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
            error: 'Authentication failed. Please try again.' 
          },
          { status: 500 }
        );
      }
    }

    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/login
 * Returns login form requirements (for frontend validation)
 */
export async function GET() {
  return NextResponse.json({
    requirements: {
      email: {
        required: true,
        pattern: 'email',
        message: 'Please enter a valid email address'
      },
      password: {
        required: true,
        message: 'Password is required'
      }
    }
  });
}
