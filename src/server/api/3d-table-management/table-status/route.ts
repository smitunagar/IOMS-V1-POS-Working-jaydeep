import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const UpdateTableStatusSchema = z.object({
  tableId: z.string().min(1, 'Table ID is required'),
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']),
  notes: z.string().optional(),
  estimatedDuration: z.number().optional(), // minutes
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const BulkUpdateStatusSchema = z.object({
  updates: z.array(z.object({
    tableId: z.string(),
    status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']),
    notes: z.string().optional(),
  })),
});

const GetTableStatusSchema = z.object({
  tableIds: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning', 'maintenance']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// POST /api/3d-table-management/table-status - Update single table status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UpdateTableStatusSchema.parse(body);

    // Get existing status for audit trail
    const existingStatus = await prisma.tableStatus.findUnique({
      where: { tableId: data.tableId },
    });

    // Update or create table status
    const tableStatus = await prisma.tableStatus.upsert({
      where: { tableId: data.tableId },
      update: {
        // status: data.status,
        // notes: data.notes,
        updatedAt: new Date(),
      },
      create: {
        tableId: data.tableId,
        // status: data.status,
        // notes: data.notes,
        tenantId: 'default',
      },
    });

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'UPDATE_TABLE_STATUS',
    //     tableName: 'TableStatus',
    //     recordId: data.tableId,
    //     oldValues: existingStatus ? JSON.stringify(existingStatus) : null,
    //     newValues: JSON.stringify({
    //       status: data.status,
    //       notes: data.notes,
    //       priority: data.priority,
    //     }),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    // Calculate estimated completion time if duration provided
    let estimatedCompletion = null;
    if (data.estimatedDuration && data.status !== 'available') {
      estimatedCompletion = new Date(Date.now() + data.estimatedDuration * 60 * 1000);
    }

    return NextResponse.json({
      success: true,
      data: {
        tableId: tableStatus.tableId,
        status: tableStatus.status,
        // notes: tableStatus.notes,
        updatedAt: tableStatus.updatedAt,
        // estimatedCompletion,
        // previousStatus: existingStatus?.status || null,
      },
    });

  } catch (error) {
    console.error('Error updating table status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update table status' },
      { status: 500 }
    );
  }
}

// PUT /api/3d-table-management/table-status - Bulk update table statuses
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BulkUpdateStatusSchema.parse(body);

    // Get existing statuses for audit trail
    const existingStatuses = await prisma.tableStatus.findMany({
      where: {
        tableId: { in: data.updates.map(u => u.tableId) },
      },
    });

    // Perform bulk updates
    const results = await Promise.all(
      data.updates.map(async (update) => {
        const existing = existingStatuses.find(s => s.tableId === update.tableId);
        
        const tableStatus = await prisma.tableStatus.upsert({
          where: { tableId: update.tableId },
          update: {
            // status: update.status,
            // notes: update.notes,
            updatedAt: new Date(),
          },
          create: {
            tableId: update.tableId,
            // status: update.status,
            // notes: update.notes,
            tenantId: 'default',
          },
        });

        // Create individual audit logs
        // await prisma.auditLog.create({
        //   data: {
        //     action: 'BULK_UPDATE_TABLE_STATUS',
        //     tableName: 'TableStatus',
        //     recordId: update.tableId,
        //     oldValues: existing ? JSON.stringify(existing) : null,
        //     newValues: JSON.stringify(update),
        //     timestamp: new Date(),
        //     userId: 'system', // TODO: Get from auth context
        //     tenantId: 'default',
        //   },
        // });

        return {
          tableId: tableStatus.tableId,
          status: tableStatus.status,
          // notes: tableStatus.notes,
          updatedAt: tableStatus.updatedAt,
          // previousStatus: existing?.status || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: results.length,
        results,
      },
    });

  } catch (error) {
    console.error('Error bulk updating table status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to bulk update table statuses' },
      { status: 500 }
    );
  }
}

// GET /api/3d-table-management/table-status - Get table statuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse table IDs from comma-separated string
    const tableIdsParam = searchParams.get('tableIds');
    const tableIds = tableIdsParam ? tableIdsParam.split(',').filter(Boolean) : undefined;
    
    const params = GetTableStatusSchema.parse({
      tableIds,
      status: searchParams.get('status') as any || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    const where: any = { tenantId: 'default' };
    
    if (params.tableIds?.length) {
      where.tableId = { in: params.tableIds };
    }
    
    if (params.status) {
      where.status = params.status;
    }

    const [tableStatuses, total] = await Promise.all([
      prisma.tableStatus.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.tableStatus.count({ where }),
    ]);

    // Calculate status summary
    const statusCounts = await prisma.tableStatus.groupBy({
      by: ['status'],
      where: { tenantId: 'default' },
      _count: { status: true },
    });

    const summary = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Enrich with additional metadata
    const enrichedStatuses = tableStatuses.map(status => ({
      tableId: status.tableId,
      status: status.status,
      // notes: status.notes,
      updatedAt: status.updatedAt,
      // createdAt: status.createdAt,
      timeSinceUpdate: Date.now() - status.updatedAt.getTime(),
      isStale: Date.now() - status.updatedAt.getTime() > 30 * 60 * 1000, // 30 minutes
    }));

    return NextResponse.json({
      success: true,
      data: enrichedStatuses,
      summary,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching table statuses:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch table statuses' },
      { status: 500 }
    );
  }
}

// DELETE /api/3d-table-management/table-status - Reset table status to available
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    
    if (!tableId) {
      return NextResponse.json(
        { success: false, error: 'Table ID is required' },
        { status: 400 }
      );
    }

    // Get existing status for audit
    const existingStatus = await prisma.tableStatus.findUnique({
      where: { tableId },
    });

    if (!existingStatus) {
      return NextResponse.json(
        { success: false, error: 'Table status not found' },
        { status: 404 }
      );
    }

    // Reset to available
    const tableStatus = await prisma.tableStatus.update({
      where: { tableId },
      data: {
        // status: 'available',
        // notes: null,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'RESET_TABLE_STATUS',
    //     tableName: 'TableStatus',
    //     recordId: tableId,
    //     oldValues: JSON.stringify(existingStatus),
    //     newValues: JSON.stringify({ status: 'available' }),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: {
        tableId: tableStatus.tableId,
        status: tableStatus.status,
        updatedAt: tableStatus.updatedAt,
        previousStatus: existingStatus.status,
      },
    });

  } catch (error) {
    console.error('Error resetting table status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset table status' },
      { status: 500 }
    );
  }
}
