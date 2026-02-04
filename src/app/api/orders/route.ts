import { NextRequest, NextResponse } from 'next/server';

// Import the server-side orders API functions directly
import { GET as serverGET, POST as serverPOST, PATCH as serverPATCH } from '@/server/api/orders/route';

// Proxy to the server-side orders API
export async function GET() {
  try {
    return await serverGET();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await serverPOST(request);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await serverPATCH(request);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
