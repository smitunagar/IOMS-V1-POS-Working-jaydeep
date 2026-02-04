import { NextRequest, NextResponse } from 'next/server';
import Restaurant from '@/lib/database/models/Restaurant';
import Session from '@/lib/database/models/Session';

// GET /api/restaurants/cuisine-types - Get all cuisine types for the authenticated user
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

    // Get cuisine types for the user
    const cuisineTypes = await Restaurant.getCuisineTypes(session.user_id);
    
    return NextResponse.json({
      success: true,
      data: cuisineTypes
    });

  } catch (error) {
    console.error('Error fetching cuisine types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cuisine types' },
      { status: 500 }
    );
  }
}









