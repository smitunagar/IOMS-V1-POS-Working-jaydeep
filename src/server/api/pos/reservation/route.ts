import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ReservationSchema = z.object({
  tableId: z.string(),
  customerName: z.string().min(1),
  partySize: z.number().min(1).max(20),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateReservationSchema = ReservationSchema.partial().extend({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
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
        entityType: 'RESERVATION',
        metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

async function checkReservationConflicts(
  tableId: string,
  startAt: Date,
  endAt: Date,
  excludeReservationId?: string
): Promise<boolean> {
  const conflictingReservations = await prisma.posReservation.findMany({
    where: {
      tableId,
      status: 'ACTIVE',
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      OR: [
        // New reservation starts during existing reservation
        {
          AND: [
            { startAt: { lte: startAt } },
            { endAt: { gt: startAt } },
          ],
        },
        // New reservation ends during existing reservation
        {
          AND: [
            { startAt: { lt: endAt } },
            { endAt: { gte: endAt } },
          ],
        },
        // New reservation completely contains existing reservation
        {
          AND: [
            { startAt: { gte: startAt } },
            { endAt: { lte: endAt } },
          ],
        },
        // Existing reservation completely contains new reservation
        {
          AND: [
            { startAt: { lte: startAt } },
            { endAt: { gte: endAt } },
          ],
        },
      ],
    },
  });

  return conflictingReservations.length > 0;
}

// POST - Create reservation
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    
    const validatedData = ReservationSchema.parse(body);
    const { tableId, customerName, partySize, startAt, endAt, notes, metadata } = validatedData;
    
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    
    // Validate time range
    if (startDate >= endDate) {
      return NextResponse.json(
        {
          error: 'INVALID_TIME_RANGE',
          message: 'Start time must be before end time',
        },
        { status: 400 }
      );
    }
    
    // Check for conflicts
    const hasConflict = await checkReservationConflicts(tableId, startDate, endDate);
    
    if (hasConflict) {
      return NextResponse.json(
        {
          error: 'RESERVATION_CONFLICT',
          message: 'Table is already reserved for the specified time period',
        },
        { status: 409 }
      );
    }
    
    // Create reservation
    const reservation = await prisma.posReservation.create({
      data: {
        tenantId,
        tableId,
        customerName,
        partySize,
        startAt: startDate,
        endAt: endDate,
        status: 'ACTIVE',
        notes,
        metadata: metadata || {},
      },
    });
    
    // Log audit event
    await logAuditEvent(tenantId, 'RESERVATION_CREATED', {
      reservationId: reservation.id,
      tableId,
      customerName,
      partySize,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    });
    
    // Update table status to RESERVED if reservation is starting soon (within 30 minutes)
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    if (startDate <= thirtyMinutesFromNow) {
      await prisma.tableStatus.upsert({
        where: { tableId },
        create: {
          tableId,
          tenantId,
          status: 'RESERVED',
          metadata: {
            reservationId: reservation.id,
            customerName,
          },
        },
        update: {
          status: 'RESERVED',
          metadata: {
            reservationId: reservation.id,
            customerName,
          },
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      reservation: {
        id: reservation.id,
        tableId: reservation.tableId,
        customerName: reservation.customerName,
        partySize: reservation.partySize,
        startAt: reservation.startAt.toISOString(),
        endAt: reservation.endAt.toISOString(),
        status: reservation.status,
        notes: reservation.notes,
        createdAt: reservation.createdAt.toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    
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
        message: 'Failed to create reservation',
      },
      { status: 500 }
    );
  }
}

// GET - Get reservations
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    let whereClause: any = { tenantId };
    
    if (tableId) {
      whereClause.tableId = tableId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      whereClause.startAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    
    const reservations = await prisma.posReservation.findMany({
      where: whereClause,
      orderBy: { startAt: 'asc' },
    });
    
    return NextResponse.json({
      reservations: reservations.map(r => ({
        id: r.id,
        tableId: r.tableId,
        customerName: r.customerName,
        partySize: r.partySize,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total: reservations.length,
    });
    
  } catch (error) {
    console.error('Error getting reservations:', error);
    
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to get reservations',
      },
      { status: 500 }
    );
  }
}
