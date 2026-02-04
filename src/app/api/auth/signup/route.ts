import { NextRequest, NextResponse } from 'next/server';

// Import our database models
const User = require('@/lib/database/models/User');
const Restaurant = require('@/lib/database/models/Restaurant');

/**
 * POST /api/auth/signup
 * Creates a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone,
      // Restaurant information (optional - can be provided during signup)
      restaurantName,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      restaurantPhone,
      restaurantEmail,
      taxId,
      websiteUrl,
      cuisineType,
      restaurantType
    } = body;
    
    // Normalize phone - treat empty strings, null, undefined as no phone
    const phoneValue = phone && String(phone).trim() !== '' ? String(phone).trim() : null;

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
    // Only validate if phone is actually provided and not empty/null/undefined
    if (phoneValue !== null) {
      // Basic phone validation - allows international formats
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = phoneValue.replace(/[\s\-\(\)]/g, '').trim();
      
      if (cleanPhone === '' || !phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please enter a valid phone number or leave it empty' 
          },
          { status: 400 }
        );
      }
    }

    // Create user (encryption and hashing happens automatically in User model)
    const user = await User.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phoneValue,
      tenantId: null // Single tenant for now
    });

    // Only assign "owner" role to the very first user (system admin)
    try {
      const { query } = require('@/lib/database/lib/connection');
      
      // Check if this is the first user in the system
      const userCountResult = await query('SELECT COUNT(*) as count FROM users WHERE id != $1', [user.id]);
      const userCount = parseInt(userCountResult.rows[0].count);
      
      if (userCount === 0) {
        // This is the first user, assign Owner role
        const roleResult = await query('SELECT id FROM roles WHERE role_name = $1', ['Owner']);
        if (roleResult.rows.length === 0) {
          throw new Error('Owner role not found in database');
        }
        
        const ownerRoleId = roleResult.rows[0].id;
        
        // Assign owner role to the first user
        await query(
          'INSERT INTO user_roles (user_id, role_id, created_at, valid_until) VALUES ($1, $2, NOW(), NULL)',
          [user.id, ownerRoleId]
        );
        
        console.log(`✅ Owner role assigned to first user: ${user.id}`);
      } else {
        console.log(`ℹ️ User ${user.id} created without automatic role assignment (not first user)`);
      }
    } catch (roleError) {
      console.error('❌ Failed to assign owner role:', roleError);
      // Don't fail the signup if role assignment fails, but log it
    }

    // Create restaurant if restaurant information is provided
    let restaurant = null;
    if (restaurantName && addressStreet && addressCity && addressState && addressZip && addressCountry) {
      try {
        const restaurantData = {
          userId: user.id,
          name: restaurantName.trim(),
          addressStreet: addressStreet.trim(),
          addressCity: addressCity.trim(),
          addressState: addressState.trim(),
          addressZip: addressZip.trim(),
          addressCountry: addressCountry.trim(),
          websiteUrl: websiteUrl?.trim() || null,
          email: restaurantEmail?.trim() || null,
          taxId: taxId?.trim() || null,
          cuisineType: cuisineType?.trim() || null,
          restaurantType: restaurantType?.trim() || null,
          status: 'active'
        };

        restaurant = await Restaurant.create(restaurantData);
        console.log(`✅ Restaurant created for user ${user.id}: ${restaurant.id} (${restaurantName})`);
      } catch (restaurantError) {
        console.error('❌ Failed to create restaurant during signup:', restaurantError);
        // Don't fail the signup if restaurant creation fails, but log it
        // The user can create the restaurant later
      }
    }

    // TODO: Add audit logging back once import path is fixed

    // Log successful signup (without sensitive data)
    console.log(`✅ New user registered: ${user.id} (${name})`);

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please login to continue.',
      userId: user.id,
      restaurantId: restaurant?.id || null
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Handle specific error cases
    if (error instanceof Error) {
      // Email already exists
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'An account with this email already exists. Please use a different email or try logging in.' 
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
            error: 'Account creation failed. Please try again.' 
          },
          { status: 500 }
        );
      }
    }

    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        success: false, 
        error: 'Account creation failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/signup
 * Returns signup form requirements (for frontend validation)
 */
export async function GET() {
  return NextResponse.json({
    requirements: {
      name: {
        minLength: 2,
        required: true,
        message: 'Name must be at least 2 characters long'
      },
      email: {
        required: true,
        pattern: 'email',
        message: 'Please enter a valid email address'
      },
      password: {
        minLength: 8,
        requireNumbers: true,
        required: true,
        message: 'Password must be at least 8 characters long and contain at least one number'
      },
      phone: {
        required: false,
        pattern: 'phone',
        message: 'Please enter a valid phone number'
      }
    }
  });
}
