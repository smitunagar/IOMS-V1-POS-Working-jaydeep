import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event = {
      id: Date.now().toString(),
      amountKg: body.amountKg ?? 0,
      type: body.type ?? 'food',
      station: body.station ?? 'kitchen',
      confidence: body.confidence ?? 0,
      notes: body.notes ?? '',
      timestamp: new Date().toISOString(),
    };

    console.log('[waste/events] Logged:', event);

    return NextResponse.json({
      success: true,
      message: 'Waste event logged successfully',
      event,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log waste event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    return NextResponse.json({
      success: true,
      data: { events: [], total: 0, limit, offset },
    });
  } catch (error) {
    console.error('Events fetch API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
