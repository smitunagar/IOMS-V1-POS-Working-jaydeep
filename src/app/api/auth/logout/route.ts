import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const Session = require('@/lib/database/models/Session');

/**
 * POST /api/auth/logout
 * Ends user session
 */
export async function POST(request: NextRequest) {
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
        { status: 400 }
      );
    }

    // Logout the session
    const success = await Session.logoutSession(sessionToken);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found or already logged out' 
        },
        { status: 404 }
      );
    }

    // Log successful logout
    console.log(`✅ User logged out: session ${sessionToken}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Logout error:', error);

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
        error: 'Logout failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/logout
 * Alternative logout method (RESTful)
 */
export async function DELETE(request: NextRequest) {
  return POST(request);
}
