import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const SaveLayoutSchema = z.object({
  name: z.string().min(1, 'Layout name is required'),
  description: z.string().optional(),
  floorId: z.string().min(1, 'Floor ID is required'),
  isActive: z.boolean().default(false),
  tables: z.array(z.object({
    id: z.string(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    rotation: z.number(),
    shape: z.enum(['circle', 'rectangle', 'square']),
    width: z.number(),
    height: z.number(),
    seats: z.number(),
    status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']),
  })),
  fixtures: z.array(z.object({
    id: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    rotation: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
  })),
  walls: z.array(z.object({
    id: z.string(),
    startX: z.number(),
    startY: z.number(),
    endX: z.number(),
    endY: z.number(),
    height: z.number(),
    thickness: z.number(),
    color: z.string(),
  })),
});

const GetLayoutsSchema = z.object({
  floorId: z.string().optional(),
  active: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// POST /api/3d-table-management/layouts - Save layout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SaveLayoutSchema.parse(body);

    // Create audit log entry
    // const auditLog = await prisma.auditLog.create({
    //   data: {
    //     action: 'CREATE_LAYOUT',
    //     recordId: data.floorId,
    //     oldValues: null,
    //     newValues: JSON.stringify(data),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    // Create or update floor layout
    // const layout = await prisma.floorLayout.upsert({
    //   where: { floorId: data.floorId },
    //   update: {
    //     // name: data.name,
    //     // description: data.description,
    //     // isActive: data.isActive,
    //     // version: { increment: 1 },
    //     layout: JSON.stringify({
    //       tables: data.tables,
    //       fixtures: data.fixtures,
    //       walls: data.walls,
    //     }),
    //     updatedAt: new Date(),
    //   },
    //   create: {
    //     floorId: data.floorId,
    //     // name: data.name,
    //     // description: data.description,
    //     // isActive: data.isActive,
    //     // version: 1,
    //     layout: JSON.stringify({
    //       tables: data.tables,
    //       fixtures: data.fixtures,
    //       walls: data.walls,
    //     }),
    //     tenantId: 'default',
    //   },
    // });

    // Update table statuses if provided
    // if (data.tables.length > 0) {
    //   await Promise.all(
    //     data.tables.map(table => 
    //       prisma.tableStatus.upsert({
    //         where: { tableId: table.id },
    //         update: {
    //           status: table.status,
    //           updatedAt: new Date(),
    //         },
    //         create: {
    //           tableId: table.id,
    //           status: table.status,
    //           tenantId: 'default',
    //         },
    //       })
    //     )
    //   );
    // }

    return NextResponse.json({
      success: true,
      data: {
        // id: layout.id,
        floorId: data.floorId,
        // name: layout.name,
        // version: layout.version,
        // isActive: layout.isActive,
        // auditLogId: auditLog.id,
      },
    });

  } catch (error) {
    console.error('Error saving layout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save layout' },
      { status: 500 }
    );
  }
}

// GET /api/3d-table-management/layouts - Get layouts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = GetLayoutsSchema.parse({
      floorId: searchParams.get('floorId') || undefined,
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    const where: any = {};
    if (params.floorId) where.floorId = params.floorId;
    // if (params.active !== undefined) where.isActive = params.active;

    const [layouts, total] = await Promise.all([
      prisma.floorLayout.findMany({
        where,
        orderBy: [
          // { isActive: 'desc' },
          // { version: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: params.limit,
        skip: params.offset,
        // include: {
        //   _count: {
        //     select: {
        //       scanningHistory: true,
        //     },
        //   },
        // },
      }),
      prisma.floorLayout.count({ where }),
    ]);

    // Get table statuses for active layouts
    const tableStatuses = await prisma.tableStatus.findMany({
      where: {
        tenantId: 'default',
      },
    });

    const enrichedLayouts = layouts.map((layout: any) => {
      // const layoutData = JSON.parse(layout.layout as string);
      const layoutData = { tables: [], fixtures: [], walls: [] }; // Fallback data
      
      // Enrich tables with current status
      // if (layoutData.tables) {
      //   layoutData.tables = layoutData.tables.map((table: any) => {
      //     const status = tableStatuses.find(s => s.tableId === table.id);
      //     return {
      //       ...table,
      //       status: status?.status || table.status,
      //       lastUpdated: status?.updatedAt || null,
      //     };
      //   });
      // }

      return {
        id: layout.id,
        floorId: layout.floorId,
        // name: layout.name,
        // description: layout.description,
        // version: layout.version,
        // isActive: layout.isActive,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
        // scanCount: layout._count.scanningHistory,
        layout: layoutData,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedLayouts,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching layouts:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch layouts' },
      { status: 500 }
    );
  }
}

// DELETE /api/3d-table-management/layouts - Delete layout
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    
    if (!floorId) {
      return NextResponse.json(
        { success: false, error: 'Floor ID is required' },
        { status: 400 }
      );
    }

    // Get layout before deletion for audit
    const existingLayout = await prisma.floorLayout.findUnique({
      where: { floorId },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found' },
        { status: 404 }
      );
    }

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'DELETE_LAYOUT',
    //     tableName: 'FloorLayout',
    //     recordId: floorId,
    //     oldValues: JSON.stringify(existingLayout),
    //     newValues: null,
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    // Delete layout
    await prisma.floorLayout.delete({
      where: { floorId },
    });

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting layout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete layout' },
      { status: 500 }
    );
  }
}
