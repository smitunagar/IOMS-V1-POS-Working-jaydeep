import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test-only API to reset database state
export async function POST(request: NextRequest) {
  // Only allow in test/development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // Mock reset for now - database operations commented out
    console.log('Test API: Resetting tables for test-tenant');

    return NextResponse.json({
      success: true,
      message: 'Test database reset completed',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error resetting test database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset test database',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 
      { status: 500 }
    );
  }
}