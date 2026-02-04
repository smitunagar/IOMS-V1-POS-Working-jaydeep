import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    // Mock response for now - database operations commented out
    const mockLayout = {
      id: 'mock-layout-id',
      tenantId,
      status: 'ACTIVE',
      data: JSON.stringify({
        tables: [],
        zones: [],
        fixtures: [],
      }),
      metadata: JSON.stringify({}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockTableStatuses: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        layout: mockLayout,
        tableStatuses: mockTableStatuses,
      },
    });

  } catch (error) {
    console.error('Error fetching active layout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch active layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}