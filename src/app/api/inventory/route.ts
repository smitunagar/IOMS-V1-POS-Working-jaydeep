import { NextRequest, NextResponse } from 'next/server';

// Import the server-side inventory API functions directly
import { GET as serverGET, POST as serverPOST, PATCH as serverPATCH } from '@/server/api/inventory/route';

// Proxy to the server-side inventory API
export async function GET(request: NextRequest) {
  try {
    return await serverGET(request);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await serverPOST(request);
  } catch (error) {
    console.error('Error syncing inventory:', error);
    return NextResponse.json({ error: 'Failed to sync inventory' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await serverPATCH(request);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
