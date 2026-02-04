import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TableStatusUpdateSchema = z.object({
  tableId: z.string(),
  status: z.enum(['FREE', 'SEATED', 'DIRTY', 'RESERVED']),
  metadata: z.record(z.any()).optional(),
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
        entityType: 'TABLE',
        metadata,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Simple in-memory storage for WebSocket connections
// In production, use Redis or proper message broker
const connections = new Map<string, Set<WebSocket>>();

function broadcastToTenant(tenantId: string, message: any) {
  const tenantConnections = connections.get(tenantId);
  if (tenantConnections) {
    const messageStr = JSON.stringify(message);
    tenantConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

// PATCH - Update table status
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    
    const validatedData = TableStatusUpdateSchema.parse(body);
    const { tableId, status, metadata } = validatedData;
    
    // Update table status
    const updatedStatus = await prisma.tableStatus.upsert({
      where: { tableId },
      create: {
        tableId,
        tenantId,
        status,
        metadata: metadata || {},
      },
      update: {
        status,
        metadata: metadata || {},
        updatedAt: new Date(),
      },
    });
    
    // Log audit event
    await logAuditEvent(tenantId, 'TABLE_STATUS_CHANGED', {
      tableId,
      previousStatus: 'unknown', // Could track this in the future
      newStatus: status,
      metadata,
    });
    
    // Broadcast real-time update
    const broadcastMessage = {
      type: 'TABLE_STATUS_CHANGED',
      data: {
        tableId,
        status,
        updatedAt: updatedStatus.updatedAt.toISOString(),
        metadata: updatedStatus.metadata,
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToTenant(tenantId, broadcastMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Table status updated successfully',
      tableStatus: {
        tableId: updatedStatus.tableId,
        status: updatedStatus.status,
        updatedAt: updatedStatus.updatedAt.toISOString(),
        metadata: updatedStatus.metadata,
      },
    });
    
  } catch (error) {
    console.error('Error updating table status:', error);
    
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
        message: 'Failed to update table status',
      },
      { status: 500 }
    );
  }
}

// GET - Get table statuses
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    
    if (tableId) {
      // Get specific table status
      const tableStatus = await prisma.tableStatus.findUnique({
        where: { tableId },
      });
      
      if (!tableStatus) {
        return NextResponse.json(
          {
            error: 'TABLE_NOT_FOUND',
            message: 'Table status not found',
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        tableStatus: {
          tableId: tableStatus.tableId,
          status: tableStatus.status,
          updatedAt: tableStatus.updatedAt.toISOString(),
          metadata: tableStatus.metadata,
        },
      });
    } else {
      // Get all table statuses for tenant
      const tableStatuses = await prisma.tableStatus.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
      });
      
      return NextResponse.json({
        tableStatuses: tableStatuses.map(ts => ({
          tableId: ts.tableId,
          status: ts.status,
          updatedAt: ts.updatedAt.toISOString(),
          metadata: ts.metadata,
        })),
        total: tableStatuses.length,
      });
    }
    
  } catch (error) {
    console.error('Error getting table statuses:', error);
    
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to get table statuses',
      },
      { status: 500 }
    );
  }
}
