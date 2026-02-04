import { NextRequest, NextResponse } from 'next/server';
import { CreateScanSessionRequestSchema } from '@/server/lib/schemas/table-management';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Helper function to get tenant ID
function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default';
}

// Helper function to get user ID
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'system';
}

// POST - Create new scanning session
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    
    // Validate request
    const validatedData = CreateScanSessionRequestSchema.parse(body);
    const { floorId, mode, metadata } = validatedData;
    
    // Create scanning session
    const session = await prisma.scanningSession.create({
      data: {
        tenantId,
        floorId,
        mode: mode as any,
        status: 'INITIATED',
        meta: {
          ...metadata,
          createdBy: userId,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      }
    });
    
    // Generate upload URLs based on scan mode
    const uploadUrls: any = {};
    
    switch (mode) {
      case 'ROOMPLAN':
        // iOS RoomPlan scanning
        uploadUrls.roomplan = `/api/pos/scan/${session.id}/upload/roomplan`;
        uploadUrls.preview = `/api/pos/scan/${session.id}/upload/preview`;
        break;
        
      case 'WEBXR':
        // WebXR-based scanning
        uploadUrls.webxr = `/api/pos/scan/${session.id}/upload/webxr`;
        uploadUrls.pointcloud = `/api/pos/scan/${session.id}/upload/pointcloud`;
        break;
        
      case 'PHOTOGRAM':
        // Photogrammetry-based scanning
        uploadUrls.photos = `/api/pos/scan/${session.id}/upload/photos`;
        uploadUrls.batch = `/api/pos/scan/${session.id}/upload/batch`;
        break;
    }
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'SCAN_SESSION_CREATED',
        entityType: 'SCAN_SESSION',
        entityId: session.id,
        metadata: {
          floorId,
          mode,
          sessionId: session.id
        }
      }
    });
    
    return NextResponse.json({
      sessionId: session.id,
      mode,
      status: session.status,
      floorId,
      uploadUrls,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: getSupportedFormats(mode),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      instructions: getInstructions(mode),
      createdAt: session.createdAt.toISOString()
    });
    
  } catch (error) {
    console.error('Error creating scan session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'INVALID_REQUEST',
          message: 'Invalid scan session parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to create scan session'
      },
      { status: 500 }
    );
  }
}

// GET - Get scan session status
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        {
          error: 'Missing sessionId parameter',
          code: 'MISSING_RESOURCE',
          message: 'sessionId is required'
        },
        { status: 400 }
      );
    }
    
    const session = await prisma.scanningSession.findFirst({
      where: {
        id: sessionId,
        tenantId
      }
    });
    
    if (!session) {
      return NextResponse.json(
        {
          error: 'Session not found',
          code: 'MISSING_RESOURCE',
          message: 'Scanning session not found'
        },
        { status: 404 }
      );
    }
    
    // Get associated asset if available
    let asset = null;
    if (session.assetId) {
      asset = await prisma.asset.findUnique({
        where: { id: session.assetId },
        select: {
          id: true,
          type: true,
          url: true,
          meta: true,
          createdAt: true
        }
      });
    }
    
    const response: any = {
      sessionId: session.id,
      mode: session.mode,
      status: session.status,
      floorId: session.floorId,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      metadata: session.meta
    };
    
    if (asset) {
      response.asset = {
        id: asset.id,
        type: asset.type,
        downloadUrl: `/api/pos/assets/${asset.id}`,
        metadata: asset.meta,
        createdAt: asset.createdAt.toISOString()
      };
    }
    
    // Add progress information based on status
    switch (session.status) {
      case 'INITIATED':
        response.progress = { step: 'waiting_for_upload', percentage: 0 };
        break;
      case 'UPLOADED':
        response.progress = { step: 'processing', percentage: 25 };
        break;
      case 'PROCESSING':
        response.progress = { step: 'analyzing', percentage: 75 };
        break;
      case 'READY':
        response.progress = { step: 'complete', percentage: 100 };
        break;
      case 'FAILED':
        response.progress = { step: 'failed', percentage: 0 };
        response.error = (session.meta as any)?.error || 'Processing failed';
        break;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching scan session:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch scan session'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getSupportedFormats(mode: string): string[] {
  switch (mode) {
    case 'ROOMPLAN':
      return ['.usdz', '.reality'];
    case 'WEBXR':
      return ['.gltf', '.glb', '.ply'];
    case 'PHOTOGRAM':
      return ['.jpg', '.jpeg', '.png', '.heic'];
    default:
      return [];
  }
}

function getInstructions(mode: string): string[] {
  switch (mode) {
    case 'ROOMPLAN':
      return [
        '1. Open the Camera app on your iOS device',
        '2. Point the camera at the floor and walls',
        '3. Move slowly around the room to capture all areas',
        '4. Tap to place room boundaries and furniture',
        '5. Export the scan as USDZ when complete'
      ];
    case 'WEBXR':
      return [
        '1. Allow camera and motion permissions',
        '2. Hold your device steady and move slowly',
        '3. Capture overlapping views of the space',
        '4. Focus on furniture and fixtures',
        '5. Submit when scan quality is sufficient'
      ];
    case 'PHOTOGRAM':
      return [
        '1. Take 20-50 photos from different angles',
        '2. Ensure good lighting and sharp focus',
        '3. Overlap photos by 60-80%',
        '4. Include table and chair details',
        '5. Upload all photos in a single batch'
      ];
    default:
      return ['Follow the on-screen instructions'];
  }
}
