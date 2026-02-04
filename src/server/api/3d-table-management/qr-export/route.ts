import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const GenerateQRSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
  tables: z.array(z.object({
    id: z.string(),
    name: z.string(),
    qrData: z.object({
      tableId: z.string(),
      tableNumber: z.string(),
      restaurantName: z.string().optional(),
      baseUrl: z.string().url(),
    }),
  })),
  format: z.enum(['png', 'svg', 'pdf']).default('png'),
  size: z.number().min(100).max(1000).default(200),
  logoUrl: z.string().url().optional(),
});

const GetQRHistorySchema = z.object({
  floorId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Helper function to generate QR code
async function generateQRCode(data: string, format: string, size: number): Promise<string | Buffer> {
  const options = {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };

  switch (format) {
    case 'svg':
      return await QRCode.toString(data, { ...options, type: 'svg' });
    case 'png':
      return await QRCode.toBuffer(data, { ...options, type: 'png' });
    default:
      return await QRCode.toDataURL(data, options);
  }
}

// POST /api/3d-table-management/qr-export - Generate QR codes for tables
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = GenerateQRSchema.parse(body);

    // Generate QR codes for all tables
    const qrCodes = await Promise.all(
      data.tables.map(async (table) => {
        const qrString = JSON.stringify(table.qrData);
        const qrCode = await generateQRCode(qrString, data.format, data.size);
        
        return {
          tableId: table.id,
          tableName: table.name,
          qrCode: data.format === 'png' 
            ? `data:image/png;base64,${(qrCode as Buffer).toString('base64')}`
            : qrCode,
          qrData: table.qrData,
        };
      })
    );

    // Save QR generation event to audit log
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'GENERATE_QR_CODES',
    //     tableName: 'QRExport',
    //     recordId: data.floorId,
    //     oldValues: null,
    //     newValues: JSON.stringify({
    //       floorId: data.floorId,
    //       tableCount: data.tables.length,
    //       format: data.format,
    //       size: data.size,
    //     }),
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    // If format is PDF, create a combined PDF response
    if (data.format === 'pdf') {
      // For now, return individual QR codes - in production, you'd use a PDF library
      // to combine them into a single PDF document
      return NextResponse.json({
        success: true,
        message: 'PDF generation not implemented yet. Use PNG or SVG format.',
        data: qrCodes,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        floorId: data.floorId,
        format: data.format,
        size: data.size,
        tableCount: qrCodes.length,
        qrCodes,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate QR codes' },
      { status: 500 }
    );
  }
}

// GET /api/3d-table-management/qr-export - Get QR generation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = GetQRHistorySchema.parse({
      floorId: searchParams.get('floorId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    const where: any = {
      // action: 'GENERATE_QR_CODES',
      // tenantId: 'default',
    };
    
    // if (params.floorId) {
    //   where.recordId = params.floorId;
    // }

    // const [auditLogs, total] = await Promise.all([
    //   prisma.auditLog.findMany({
    //     where,
    //     orderBy: { timestamp: 'desc' },
    //     take: params.limit,
    //     skip: params.offset,
    //     select: {
    //       id: true,
    //       // recordId: true,
    //       newValues: true,
    //       timestamp: true,
    //       userId: true,
    //     },
    //   }),
    //   prisma.auditLog.count({ where }),
    // ]);
    
    const auditLogs: any[] = [];
    const total = 0;

    const qrHistory = auditLogs.map(log => {
      const data = log.newValues ? JSON.parse(log.newValues as string) : {};
      return {
        id: log.id,
        floorId: log.recordId,
        tableCount: data.tableCount || 0,
        format: data.format || 'unknown',
        size: data.size || 0,
        generatedAt: log.timestamp,
        generatedBy: log.userId,
      };
    });

    return NextResponse.json({
      success: true,
      data: qrHistory,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching QR history:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch QR history' },
      { status: 500 }
    );
  }
}

// DELETE /api/3d-table-management/qr-export - Clear QR generation history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');
    const olderThan = searchParams.get('olderThan'); // ISO date string
    
    const where: any = {
      action: 'GENERATE_QR_CODES',
      tenantId: 'default',
    };

    if (floorId) {
      where.recordId = floorId;
    }

    if (olderThan) {
      where.timestamp = {
        lt: new Date(olderThan),
      };
    }

    // Count records to be deleted
    const count = await prisma.auditLog.count({ where });

    // Delete audit logs
    await prisma.auditLog.deleteMany({ where });

    // Log the cleanup action
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'CLEANUP_QR_HISTORY',
    //     tableName: 'AuditLog',
    //     recordId: floorId || 'all',
    //     oldValues: JSON.stringify({ deletedCount: count }),
    //     newValues: null,
    //     timestamp: new Date(),
    //     userId: 'system', // TODO: Get from auth context
    //     tenantId: 'default',
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} QR generation records`,
      deletedCount: count,
    });

  } catch (error) {
    console.error('Error clearing QR history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear QR history' },
      { status: 500 }
    );
  }
}
