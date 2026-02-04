import { NextRequest, NextResponse } from 'next/server';
import { POST as serverUploadMenu } from '@/server/api/uploadMenu/route';

export const runtime = 'nodejs';

/**
 * Next.js API Route that proxies to server-side uploadMenu logic
 * This follows the pattern of separating client-side API routes from server-side business logic
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API-PROXY] /api/uploadMenu - Proxying to server-side logic');
    
    // Forward the request to the server-side implementation
    const response = await serverUploadMenu(request);
    
    console.log('✅ [API-PROXY] /api/uploadMenu - Response received from server');
    return response;
    
  } catch (error) {
    console.error('❌ [API-PROXY] /api/uploadMenu - Error:', error);
    return NextResponse.json({
      success: false,
      error: 'API proxy failed',
      quotaStatus: 'ERROR'
    }, { status: 500 });
  }
}
