import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ActivateLayoutSchema = z.object({
  floorId: z.string(),
  expectVersion: z.number(),
});

function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default-tenant';
}

async function logAuditEvent(tenantId: string, action: string, metadata: any) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action,
        entityType: 'FLOOR',
        metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

async function initializeTableStatuses(tenantId: string, tables: any[]) {
  // Initialize or update table statuses for all tables in the layout
  for (const table of tables) {
    await prisma.tableStatus.upsert({
      where: { tableId: table.id },
      create: {
        tableId: table.id,
        tenantId,
        status: 'FREE',
        metadata: {
          capacity: table.capacity,
          seats: table.seats,
          shape: table.shape,
          zoneId: table.zoneId,
        },
      },
      update: {
        metadata: {
          capacity: table.capacity,
          seats: table.seats,
          shape: table.shape,
          zoneId: table.zoneId,
        },
      },
    });
  }
}

// PUT - Activate layout
export async function PUT(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    
    const validatedData = ActivateLayoutSchema.parse(body);
    const { floorId, expectVersion } = validatedData;
    
    // Get current layout
    const currentLayout = await prisma.floorLayout.findUnique({
      where: { floorId },
    });
    
    if (!currentLayout) {
      return NextResponse.json(
        {
          error: 'LAYOUT_NOT_FOUND',
          message: 'Floor layout not found',
        },
        { status: 404 }
      );
    }
    
    // Check version for optimistic locking
    if (currentLayout.version !== expectVersion) {
      return NextResponse.json(
        {
          error: 'STALE_VERSION',
          message: 'Layout has been modified by another user',
          currentVersion: currentLayout.version,
        },
        { status: 409 }
      );
    }
    
    // Validate draft exists
    if (!currentLayout.layoutDraft) {
      return NextResponse.json(
        {
          error: 'NO_DRAFT',
          message: 'No draft layout found to activate',
        },
        { status: 400 }
      );
    }
    
    const draftData = currentLayout.layoutDraft as any;
    
    // Final validation before activation
    const tables = draftData.tables || [];
    
    // Check for overlaps
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const t1 = tables[i];
        const t2 = tables[j];
        
        if (
          t1.x < t2.x + t2.w &&
          t1.x + t1.w > t2.x &&
          t1.y < t2.y + t2.h &&
          t1.y + t1.h > t2.y
        ) {
          return NextResponse.json(
            {
              error: 'INVALID_LAYOUT',
              message: `Cannot activate layout: Tables ${t1.id} and ${t2.id} overlap`,
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Check for invalid capacities
    const invalidTable = tables.find((t: any) => t.capacity < 1);
    if (invalidTable) {
      return NextResponse.json(
        {
          error: 'INVALID_LAYOUT',
          message: `Cannot activate layout: Table ${invalidTable.id} has invalid capacity`,
        },
        { status: 400 }
      );
    }
    
    const newVersion = currentLayout.version + 1;
    const now = new Date();
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Archive current active layout (if exists)
      if (currentLayout.layoutActive) {
        await logAuditEvent(tenantId, 'LAYOUT_ARCHIVED', {
          floorId,
          version: currentLayout.version,
          archivedAt: now.toISOString(),
        });
      }
      
      // Activate the draft
      await tx.floorLayout.update({
        where: { floorId },
        data: {
          layoutActive: draftData,
          // layoutDraft: null, // Clear draft after activation
          version: newVersion,
          updatedAt: now,
          updatedBy: 'current-user',
          metadata: {
            tableCount: tables.length,
            zoneCount: draftData.zones?.length || 0,
            activatedAt: now.toISOString(),
            previousVersion: currentLayout.version,
          },
        },
      });
      
      // Initialize table statuses
      await initializeTableStatuses(tenantId, tables);
    });
    
    // Log activation event
    await logAuditEvent(tenantId, 'LAYOUT_ACTIVATED', {
      floorId,
      version: newVersion,
      tableCount: tables.length,
      zoneCount: draftData.zones?.length || 0,
      activatedAt: now.toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Layout activated successfully',
      version: newVersion,
      activatedAt: now.toISOString(),
      summary: {
        tableCount: tables.length,
        zoneCount: draftData.zones?.length || 0,
        tablesInitialized: tables.length,
      },
    });
    
  } catch (error) {
    console.error('Error activating layout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to activate layout',
      },
      { status: 500 }
    );
  }
}

// Backward compatibility - POST method redirects to PUT
export async function POST(request: NextRequest) {
  return PUT(request);
}
