import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const Restaurant = require('@/lib/database/models/Restaurant');
const User = require('@/lib/database/models/User');

// POST /api/restaurants/setup - Create restaurant during signup process
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      userId,
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
    if (!userId || !name || !addressStreet || !addressCity || !addressState || !addressZip || !addressCountry) {
      return NextResponse.json({
        error: 'Missing required fields: userId, name, and address fields are required'
      }, { status: 400 });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if restaurant name already exists for this user
    const nameExists = await Restaurant.nameExists(userId, name);
    if (nameExists) {
      return NextResponse.json({
        error: 'A restaurant with this name already exists'
      }, { status: 409 });
    }

    // Create restaurant
    const restaurantData = {
      userId,
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
    console.error('Error creating restaurant during setup:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
