import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Request validation schema
const ActivateLayoutSchema = z.object({
  tables: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    shape: z.enum(['round', 'square', 'rect']),
    capacity: z.number().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
  })),
  zones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    bounds: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }).optional(),
  })),
  fixtures: z.array(z.object({
    id: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })).optional(),
  floorId: z.string(),
  version: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ActivateLayoutSchema.parse(body);
    
    // Extract tenant ID from headers or use default
    const tenantId = request.headers.get('x-tenant-id') || 'default';
    const tables = validatedData.tables || [];

    // Validate table data
    if (tables.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tables provided',
          details: 'At least one table is required to activate a layout',
        },
        { status: 400 }
      );
    }

    // Mock result for now - database operations commented out
    const result = {
      id: crypto.randomUUID(),
      tenantId,
      status: 'ACTIVE',
      data: JSON.stringify(validatedData),
      metadata: JSON.stringify(validatedData.metadata),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Layout activated successfully',
      layoutId: result.id,
      tableCount: tables.length,
      zoneCount: validatedData.zones.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error activating layout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}