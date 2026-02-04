import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const StartScanSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
  scanType: z.enum(['full', 'table_only', 'fixture_only']).default('full'),
  notes: z.string().optional(),
});

const UpdateScanSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  status: z.enum(['in_progress', 'completed', 'failed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  results: z.object({
    tables: z.array(z.object({
      id: z.string(),
      detected: z.boolean(),
      confidence: z.number(),
      x: z.number(),
      y: z.number(),
      rotation: z.number(),
      width: z.number(),
      height: z.number(),
    })).optional(),
    fixtures: z.array(z.object({
      id: z.string(),
      type: z.string(),
      detected: z.boolean(),
      confidence: z.number(),
      x: z.number(),
      y: z.number(),
    })).optional(),
  }).optional(),
  notes: z.string().optional(),
});

// POST /api/3d-table-management/scanning - Start new scanning session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = StartScanSchema.parse(body);

    // Create scanning session
    // const session = await prisma.scanningSession.create({
    //   data: {
    //     floorId: data.floorId,
    //     // mode: 'MANUAL', // Required field
    //     // status: 'PENDING', // Changed from 'in_progress' to valid enum value
    //     // progress: 0,
    //     // scanType: data.scanType,
    //     // notes: data.notes,
    //     tenantId: 'default',
    //   },
    // });
    
    const session = { id: 'mock-session-id' }; // Mock session for now

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'START_SCANNING',
    //     tableName: 'ScanningSession',
    //     recordId: session.id,
    //     oldValues: null,
    //     newValues: JSON.stringify(data),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        floorId: data.floorId,
        // status: session.status,
        // progress: session.progress,
        // scanType: session.scanType,
        startedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error starting scan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to start scanning session' },
      { status: 500 }
    );
  }
}

// PUT /api/3d-table-management/scanning - Update scanning session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UpdateScanSchema.parse(body);

    // Get existing session
    const existingSession = await prisma.scanningSession.findUnique({
      where: { id: data.sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Scanning session not found' },
        { status: 404 }
      );
    }

    // Update session
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    if (data.results) {
      updateData.results = JSON.stringify(data.results);
    }

    if (data.notes) {
      updateData.notes = data.notes;
    }

    const session = await prisma.scanningSession.update({
      where: { id: data.sessionId },
      data: updateData,
    });

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'UPDATE_SCANNING',
    //     tableName: 'ScanningSession',
    //     recordId: session.id,
    //     oldValues: JSON.stringify(existingSession),
    //     newValues: JSON.stringify(updateData),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        // progress: session.progress,
        // results: session.results ? JSON.parse(session.results as string) : null,
        updatedAt: session.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating scan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update scanning session' },
      { status: 500 }
    );
  }
}

// GET /api/3d-table-management/scanning - Get scanning sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = { tenantId: 'default' };
    if (floorId) where.floorId = floorId;
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.scanningSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.scanningSession.count({ where }),
    ]);

    const enrichedSessions = sessions.map(session => ({
      id: session.id,
      floorId: session.floorId,
      status: session.status,
      // progress: session.progress,
      // scanType: session.scanType,
      // startedAt: session.startedAt,
      // completedAt: session.completedAt,
      updatedAt: session.updatedAt,
      // notes: session.notes,
      // results: session.results ? JSON.parse(session.results as string) : null,
      // duration: session.completedAt 
      //   ? session.completedAt.getTime() - session.startedAt.getTime()
      //   : Date.now() - session.startedAt.getTime(),
    }));

    return NextResponse.json({
      success: true,
      data: enrichedSessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching scanning sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scanning sessions' },
      { status: 500 }
    );
  }
}

// DELETE /api/3d-table-management/scanning - Cancel/delete scanning session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session before deletion
    const existingSession = await prisma.scanningSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Scanning session not found' },
        { status: 404 }
      );
    }

    // If session is in progress, cancel it first
    // if (existingSession.status === 'in_progress') {
    //   await prisma.scanningSession.update({
    //     where: { id: sessionId },
    //     data: {
    //       status: 'cancelled',
    //       updatedAt: new Date(),
    //     },
    //   });
    // }

    // Create audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'DELETE_SCANNING',
    //     tableName: 'ScanningSession',
    //     recordId: sessionId,
    //     oldValues: JSON.stringify(existingSession),
    //     newValues: null,
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    // Delete session
    await prisma.scanningSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Scanning session deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting scanning session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete scanning session' },
      { status: 500 }
    );
  }
}
