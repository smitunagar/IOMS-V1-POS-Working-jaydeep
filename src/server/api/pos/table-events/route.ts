import { NextRequest } from 'next/server';
import { broadcastTableEvent, getConnectionStatus } from '@/server/lib/websocket-server';
import { TableEventSchema } from '@/server/lib/schemas/table-management';

// REST API endpoint for triggering events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default';
    
    // Validate event data
    const event = TableEventSchema.parse({
      ...body,
      tenantId,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all relevant clients
    broadcastTableEvent(tenantId, event);
    
    return new Response(JSON.stringify({
      success: true,
      eventType: event.type,
      timestamp: event.timestamp
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error broadcasting table event:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to broadcast event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for connection status
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const status = getConnectionStatus(tenantId);
  
  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}


