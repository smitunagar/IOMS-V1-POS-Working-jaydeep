import { NextRequest, NextResponse } from 'next/server';
import Restaurant from '@/lib/database/models/Restaurant';
import Session from '@/lib/database/models/Session';

// GET /api/restaurants/[id] - Get a specific restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const restaurantId = params.id;
    
    // Get restaurant
    const restaurant = await Restaurant.getById(restaurantId);
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Check if restaurant belongs to the user
    if (restaurant.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: restaurant
    });

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurants/[id] - Update a restaurant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const restaurantId = params.id;
    
    // Check if restaurant exists and belongs to user
    const existingRestaurant = await Restaurant.getById(restaurantId);
    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (existingRestaurant.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
      status
    } = body;

    // Validate required fields if provided
    if (name && (!addressStreet || !addressCity || !addressState || !addressZip || !addressCountry || !cuisineType)) {
      return NextResponse.json({
        error: 'When updating name, all address fields and cuisine type are required'
      }, { status: 400 });
    }

    // Check if restaurant name already exists for this user (excluding current restaurant)
    if (name && name !== existingRestaurant.name) {
      const nameExists = await Restaurant.nameExists(session.user_id, name, restaurantId);
      if (nameExists) {
        return NextResponse.json({
          error: 'A restaurant with this name already exists'
        }, { status: 409 });
      }
    }

    // Update restaurant
    const updateData = {
      name: name || existingRestaurant.name,
      addressStreet: addressStreet || existingRestaurant.address_street,
      addressCity: addressCity || existingRestaurant.address_city,
      addressState: addressState || existingRestaurant.address_state,
      addressZip: addressZip || existingRestaurant.address_zip,
      addressCountry: addressCountry || existingRestaurant.address_country,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : existingRestaurant.website_url,
      email: email !== undefined ? email : existingRestaurant.email,
      cuisineType: cuisineType || existingRestaurant.cuisine_type,
      status: status || existingRestaurant.status
    };

    const restaurant = await Restaurant.update(restaurantId, session.user_id, updateData);
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: restaurant,
      message: 'Restaurant updated successfully'
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurants/[id] - Delete a restaurant (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const restaurantId = params.id;
    
    // Check if restaurant exists and belongs to user
    const existingRestaurant = await Restaurant.getById(restaurantId);
    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (existingRestaurant.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete restaurant (set status to 'closed')
    const result = await Restaurant.delete(restaurantId, session.user_id);
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}









