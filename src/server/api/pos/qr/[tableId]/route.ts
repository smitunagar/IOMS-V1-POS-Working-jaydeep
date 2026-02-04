import { NextRequest, NextResponse } from 'next/server';
import { QRGenerationRequestSchema } from '@/server/lib/schemas/table-management';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

const prisma = new PrismaClient();

// Helper function to get tenant ID
function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default';
}

// Helper function to generate QR code URL
function generateQRUrl(tenantId: string, tableId: string, version?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const versionParam = version ? `?v=${version}` : '';
  return `${baseUrl}/o/${tenantId}/${tableId}${versionParam}`;
}

// Generate PNG QR Code
async function generatePNGQRCode(url: string, size: 'SMALL' | 'MEDIUM' | 'LARGE'): Promise<Buffer> {
  const sizeMap = {
    SMALL: 200,
    MEDIUM: 400,
    LARGE: 600
  };
  
  const options = {
    type: 'png' as const,
    width: sizeMap[size],
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  return Buffer.from(await QRCode.toBuffer(url, options));
}

// Generate PDF QR Code with custom layout
async function generatePDFQRCode(
  url: string, 
  tableId: string, 
  size: 'SMALL' | 'MEDIUM' | 'LARGE',
  customText?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text('Table QR Code', 50, 50);
      
      // Table information
      doc.fontSize(16).font('Helvetica');
      doc.text(`Table: ${tableId}`, 50, 100);
      
      if (customText) {
        doc.text(customText, 50, 130);
      }
      
      // QR Code placeholder (in production, embed actual QR code image)
      const qrSize = size === 'LARGE' ? 200 : size === 'MEDIUM' ? 150 : 100;
      const qrX = (doc.page.width - qrSize) / 2;
      const qrY = 180;
      
      doc.rect(qrX, qrY, qrSize, qrSize).stroke();
      doc.fontSize(12).text('QR Code', qrX + qrSize/2 - 30, qrY + qrSize/2);
      
      // Instructions
      doc.fontSize(12).font('Helvetica');
      doc.text('Scan this QR code to:', 50, qrY + qrSize + 30);
      doc.text('• View menu and place orders', 50, qrY + qrSize + 50);
      doc.text('• Call for service', 50, qrY + qrSize + 70);
      doc.text('• Leave feedback', 50, qrY + qrSize + 90);
      
      // Footer
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, 50, doc.page.height - 100);
      doc.text(`URL: ${url}`, 50, doc.page.height - 80);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Store asset in database
async function storeAsset(
  tenantId: string,
  type: 'QR_PNG' | 'QR_PDF',
  buffer: Buffer,
  metadata: any
): Promise<string> {
  // In production, upload to cloud storage (S3, etc.)
  const base64Data = buffer.toString('base64');
  const url = `data:${type === 'QR_PNG' ? 'image/png' : 'application/pdf'};base64,${base64Data}`;
  
  const asset = await prisma.asset.create({
    data: {
      tenantId,
      type: type as any,
      url,
      meta: metadata
    }
  });
  
  return asset.id;
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    
    if (!tableId) {
      return NextResponse.json(
        {
          error: 'Missing tableId parameter',
          code: 'MISSING_RESOURCE',
          message: 'tableId is required'
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = QRGenerationRequestSchema.parse(body);
    const { format, size, includeQRCode, customText } = validatedData;
    
    // Generate QR code URL
    const qrVersion = crypto.randomUUID().substring(0, 8);
    const qrUrl = generateQRUrl(tenantId, tableId, qrVersion);
    
    const results: any = {
      tableId,
      qrUrl,
      version: qrVersion,
      generatedAt: new Date().toISOString(),
      assets: []
    };
    
    // Generate PNG if requested
    if (format === 'PNG' || format === 'BOTH') {
      const pngBuffer = await generatePNGQRCode(qrUrl, size);
      const pngAssetId = await storeAsset(tenantId, 'QR_PNG', pngBuffer, {
        tableId,
        size,
        qrVersion,
        includeQRCode,
        generatedAt: new Date().toISOString()
      });
      
      results.assets.push({
        type: 'PNG',
        assetId: pngAssetId,
        downloadUrl: `/api/pos/assets/${pngAssetId}`,
        size: pngBuffer.length
      });
    }
    
    // Generate PDF if requested
    if (format === 'PDF' || format === 'BOTH') {
      const pdfBuffer = await generatePDFQRCode(qrUrl, tableId, size, customText);
      const pdfAssetId = await storeAsset(tenantId, 'QR_PDF', pdfBuffer, {
        tableId,
        size,
        qrVersion,
        customText,
        includeQRCode,
        generatedAt: new Date().toISOString()
      });
      
      results.assets.push({
        type: 'PDF',
        assetId: pdfAssetId,
        downloadUrl: `/api/pos/assets/${pdfAssetId}`,
        size: pdfBuffer.length
      });
    }
    
    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'QR_CODE_GENERATED',
        entityType: 'TABLE',
        entityId: tableId,
        metadata: {
          format,
          size,
          qrVersion,
          assetsCount: results.assets.length
        }
      }
    });
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'INVALID_REQUEST',
          message: 'Invalid QR generation parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate QR code'
      },
      { status: 500 }
    );
  }
}
