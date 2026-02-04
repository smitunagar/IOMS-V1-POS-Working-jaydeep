import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Floor layout draft API

// Validation schemas
const TableNodeSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number().min(32),
  h: z.number().min(32),
  shape: z.enum(['round', 'square', 'rect']),
  capacity: z.number().min(1),
  seats: z.number().min(1),
  label: z.string().optional(),
  zoneId: z.string().optional(),
  childIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  visible: z.boolean(),
});

const LayoutDraftSchema = z.object({
  tables: z.array(TableNodeSchema),
  zones: z.array(ZoneSchema),
});

const SaveDraftSchema = z.object({
  floorId: z.string(),
  layoutDraft: LayoutDraftSchema,
  version: z.number().optional(),
});

// Helper functions
function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default-tenant';
}

function validateNoOverlaps(tables: any[]): boolean {
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const t1 = tables[i];
      const t2 = tables[j];
      
      // AABB collision detection
      if (
        t1.x < t2.x + t2.w &&
        t1.x + t1.w > t2.x &&
        t1.y < t2.y + t2.h &&
        t1.y + t1.h > t2.y
      ) {
        return false;
      }
    }
  }
  return true;
}

function validateUniqueTableIds(tables: any[]): boolean {
  const ids = tables.map(t => t.id);
  return new Set(ids).size === ids.length;
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

// POST - Save draft layout
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = SaveDraftSchema.parse(body);
    const { floorId, layoutDraft, version } = validatedData;
    
    // Business validation
    if (!validateNoOverlaps(layoutDraft.tables)) {
      return NextResponse.json(
        { 
          error: 'OVERLAPPING_TABLES',
          message: 'Tables cannot overlap'
        },
        { status: 400 }
      );
    }
    
    if (!validateUniqueTableIds(layoutDraft.tables)) {
      return NextResponse.json(
        { 
          error: 'DUPLICATE_TABLE_ID',
          message: 'All table IDs must be unique'
        },
        { status: 400 }
      );
    }
    
    // Check for existing layout
    const existingLayout = await prisma.floorLayout.findUnique({
      where: { floorId },
    });
    
    // Version conflict check (optimistic locking)
    if (existingLayout && version && existingLayout.version !== version) {
      return NextResponse.json(
        {
          error: 'STALE_VERSION',
          message: 'Layout has been modified by another user',
          currentVersion: existingLayout.version,
        },
        { status: 409 }
      );
    }
    
    const newVersion = (existingLayout?.version || 0) + 1;
    const now = new Date();
    
    // Upsert the layout
    const updatedLayout = await prisma.floorLayout.upsert({
      where: { floorId },
      create: {
        floorId,
        tenantId,
        siteId: 'main-site',
        layoutDraft: layoutDraft,
        // layoutActive: existingLayout?.layoutActive || null,
        version: newVersion,
        updatedBy: 'current-user',
        metadata: {
          tableCount: layoutDraft.tables.length,
          zoneCount: layoutDraft.zones.length,
          lastDraftSave: now.toISOString(),
        },
      },
      update: {
        layoutDraft: layoutDraft,
        version: newVersion,
        updatedAt: now,
        updatedBy: 'current-user',
        metadata: {
          tableCount: layoutDraft.tables.length,
          zoneCount: layoutDraft.zones.length,
          lastDraftSave: now.toISOString(),
        },
      },
    });
    
    // Log audit event
    await logAuditEvent(tenantId, 'FLOOR_DRAFT_SAVED', {
      floorId,
      version: newVersion,
      tableCount: layoutDraft.tables.length,
      zoneCount: layoutDraft.zones.length,
    });
    
    return NextResponse.json({
      success: true,
      version: updatedLayout.version,
      savedAt: updatedLayout.updatedAt.toISOString(),
    });
    
  } catch (error) {
    console.error('Error saving draft:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: 'Failed to save draft'
      },
      { status: 500 }
    );
  }
}

// GET - Load draft layout
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    
    if (!floorId) {
      return NextResponse.json(
        { 
          error: 'MISSING_FLOOR_ID',
          message: 'floorId query parameter is required'
        },
        { status: 400 }
      );
    }
    
    const layout = await prisma.floorLayout.findUnique({
      where: { floorId },
      select: {
        layoutDraft: true,
        version: true,
        updatedAt: true,
        metadata: true,
      },
    });
    
    if (!layout) {
      return NextResponse.json(
        { 
          error: 'LAYOUT_NOT_FOUND',
          message: 'Floor layout not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      layoutDraft: layout.layoutDraft,
      version: layout.version,
      updatedAt: layout.updatedAt.toISOString(),
      metadata: layout.metadata,
    });
    
  } catch (error) {
    console.error('Error loading draft:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: 'Failed to load draft'
      },
      { status: 500 }
    );
  }
}
