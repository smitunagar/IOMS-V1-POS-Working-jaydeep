import { NextRequest, NextResponse } from 'next/server';
import { subscribeScheduledOrders } from '@/server/lib/mensaOrdersStream';

export const runtime = 'nodejs';

const ALLOWED_ORIGINS = (process.env.MENSA_ORDERS_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
const API_KEY_HEADER = (process.env.MENSA_ORDERS_API_KEY_HEADER || 'x-api-key').toLowerCase();
const API_KEY = process.env.MENSA_ORDERS_API_KEY || '';

const getCorsHeaders = (origin: string | null) => {
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': `${API_KEY_HEADER}, Content-Type`,
    };
  }

  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': `${API_KEY_HEADER}, Content-Type`,
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  return null;
};

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));
  if (!corsHeaders) {
    return new NextResponse('Origin not allowed', { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (!corsHeaders) {
    return NextResponse.json({ success: false, error: 'Origin not allowed' }, { status: 403 });
  }

  if (API_KEY) {
    const url = new URL(request.url);
    const token = url.searchParams.get('apiKey');
    const providedKey = request.headers.get(API_KEY_HEADER) || token;
    if (!providedKey || providedKey !== API_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('event: ready\ndata: {"ready":true}\n\n'));

      const unsubscribe = subscribeScheduledOrders((event) => {
        controller.enqueue(encoder.encode(`event: scheduled-order\ndata: ${JSON.stringify(event)}\n\n`));
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
