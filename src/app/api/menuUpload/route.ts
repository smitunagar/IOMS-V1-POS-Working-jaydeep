import { NextRequest, NextResponse } from 'next/server';
import { POST as serverMenuUpload } from '@/server/api/menuUpload/route';

export const runtime = 'nodejs';

/**
 * Next.js API Route that proxies to server-side menuUpload logic
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API-PROXY] /api/menuUpload - Proxying to server-side logic');
    
    // Forward the request to the server-side implementation
    const response = await serverMenuUpload(request);
    
    console.log('✅ [API-PROXY] /api/menuUpload - Response received from server');
    return response;
    
  } catch (error) {
    console.error('❌ [API-PROXY] /api/menuUpload - Error:', error);
    return NextResponse.json({
      success: false,
      error: 'API proxy failed',
      quotaStatus: 'ERROR'
    }, { status: 500 });
  }
}
