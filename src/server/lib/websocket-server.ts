import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { TableEvent } from './schemas/table-management';

// Global WebSocket server instance
let wss: WebSocketServer | null = null;

// Connection management
const connections = new Map<string, Set<WebSocket>>();
const connectionMeta = new WeakMap<WebSocket, { tenantId: string; userId?: string; role?: string }>();

// Initialize WebSocket server
export function initializeWebSocketServer() {
  if (wss) return wss;
  
  wss = new WebSocketServer({ 
    port: 3001,
    path: '/api/pos/table-events'
  });
  
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    console.log('New WebSocket connection established');
    
    // Parse connection parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const tenantId = url.searchParams.get('tenantId') || 'default';
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role') || 'guest';
    
    // Store connection metadata
    connectionMeta.set(ws, { tenantId, userId: userId || undefined, role });
    
    // Add to tenant connection pool
    if (!connections.has(tenantId)) {
      connections.set(tenantId, new Set());
    }
    connections.get(tenantId)!.add(ws);
    
    // Send connection acknowledgment
    ws.send(JSON.stringify({
      type: 'CONNECTION_ACK',
      tenantId,
      userId,
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      const meta = connectionMeta.get(ws);
      if (meta) {
        const tenantConnections = connections.get(meta.tenantId);
        if (tenantConnections) {
          tenantConnections.delete(ws);
          if (tenantConnections.size === 0) {
            connections.delete(meta.tenantId);
          }
        }
        connectionMeta.delete(ws);
      }
      console.log('WebSocket connection closed');
    });
    
    // Handle errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return wss;
}

// Handle messages from clients
function handleClientMessage(ws: WebSocket, message: any) {
  const meta = connectionMeta.get(ws);
  if (!meta) return;
  
  switch (message.type) {
    case 'PING':
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'SUBSCRIBE_TABLE':
      // Subscribe to specific table events
      if (message.tableId) {
        // Add table-specific subscription logic here
        ws.send(JSON.stringify({
          type: 'SUBSCRIBED',
          tableId: message.tableId,
          timestamp: new Date().toISOString()
        }));
      }
      break;
      
    case 'UNSUBSCRIBE_TABLE':
      // Unsubscribe from specific table events
      if (message.tableId) {
        ws.send(JSON.stringify({
          type: 'UNSUBSCRIBED',
          tableId: message.tableId,
          timestamp: new Date().toISOString()
        }));
      }
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Unknown message type'
      }));
  }
}

// Broadcast event to all connected clients in a tenant
export function broadcastTableEvent(tenantId: string, event: TableEvent) {
  const tenantConnections = connections.get(tenantId);
  if (!tenantConnections) return;
  
  const message = JSON.stringify(event);
  
  tenantConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      const meta = connectionMeta.get(ws);
      
      // Apply role-based filtering
      if (meta?.role === 'waiter') {
        // Waiters only get status change events
        if (event.type === 'TABLE_STATUS_CHANGED' || event.type === 'RESERVATION_ASSIGNED') {
          ws.send(message);
        }
      } else if (meta?.role === 'manager' || meta?.role === 'owner') {
        // Managers and owners get all events
        ws.send(message);
      }
    }
  });
}

// Broadcast to specific table subscribers
export function broadcastToTableSubscribers(tenantId: string, tableId: string, event: TableEvent) {
  const tenantConnections = connections.get(tenantId);
  if (!tenantConnections) return;
  
  const message = JSON.stringify({
    ...event,
    tableId
  });
  
  tenantConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      // In production, check if client is subscribed to this specific table
      ws.send(message);
    }
  });
}

// Get connection status
export function getConnectionStatus(tenantId: string) {
  const tenantConnections = connections.get(tenantId);
  
  return {
    connected: !!tenantConnections && tenantConnections.size > 0,
    connectionCount: tenantConnections?.size || 0,
    totalTenants: connections.size,
    serverStatus: wss ? 'running' : 'stopped'
  };
}

// Initialize WebSocket server on module load
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializeWebSocketServer();
}
