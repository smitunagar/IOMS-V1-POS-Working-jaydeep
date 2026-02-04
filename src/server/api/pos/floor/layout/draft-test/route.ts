import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const floorId = searchParams.get('floorId');
  
  return NextResponse.json({ 
    message: 'Draft layout API is working',
    floorId,
    timestamp: new Date().toISOString()
  });
}
