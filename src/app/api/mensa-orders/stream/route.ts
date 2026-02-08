import { NextRequest, NextResponse } from 'next/server';
import { subscribeScheduledOrders } from '@/server/lib/mensaOrdersStream';

export const runtime = 'nodejs';

// SSE stream for the dashboard — no auth required (same-origin internal endpoint)
export async function GET(request: NextRequest) {
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
