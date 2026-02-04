import { NextRequest, NextResponse } from 'next/server';
import Restaurant from '@/lib/database/models/Restaurant';
import Session from '@/lib/database/models/Session';

// GET /api/restaurants - Get all restaurants for the authenticated user
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

    // Get restaurants for the user
    const restaurants = await Restaurant.getByUserId(session.user_id);
    
    return NextResponse.json({
      success: true,
      data: restaurants
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

// POST /api/restaurants - Create a new restaurant
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
    const {
      name,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      websiteUrl,
      email,
      cuisineType,
      restaurantType,
      status = 'active'
    } = body;

    // Validate required fields
    if (!name || !addressStreet || !addressCity || !addressState || !addressZip || !addressCountry || !cuisineType) {
      return NextResponse.json({
        error: 'Missing required fields: name, address, and cuisine type are required'
      }, { status: 400 });
    }

    // Check if restaurant name already exists for this user
    const nameExists = await Restaurant.nameExists(session.user_id, name);
    if (nameExists) {
      return NextResponse.json({
        error: 'A restaurant with this name already exists'
      }, { status: 409 });
    }

    // Create restaurant
    const restaurantData = {
      userId: session.user_id,
      name,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      websiteUrl,
      email,
      cuisineType,
      restaurantType,
      status
    };

    const restaurant = await Restaurant.create(restaurantData);
    
    return NextResponse.json({
      success: true,
      data: restaurant,
      message: 'Restaurant created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}









