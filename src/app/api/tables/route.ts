import { NextRequest, NextResponse } from 'next/server';

// Import the server-side tables API functions directly
import { GET as serverGET, POST as serverPOST } from '@/server/api/tables/route';

// Proxy to the server-side tables API
export async function GET(request: NextRequest) {
  try {
    return await serverGET(request);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await serverPOST(request);
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}

// PATCH method not available in server-side tables API
export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: 'PATCH method not supported for tables' }, { status: 405 });
}
