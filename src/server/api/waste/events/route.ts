import { NextRequest, NextResponse } from 'next/server';
import { logEvent, WasteEventInputSchema } from '@/server/services/wasteService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with schema
    const validatedInput = WasteEventInputSchema.parse(body);
    
    await logEvent(validatedInput);
    
    return NextResponse.json({
      success: true,
      message: 'Waste event logged successfully'
    });
    
  } catch (error) {
    console.error('Events API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    
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
    
    // This would be implemented to fetch recent events for real-time monitoring
    return NextResponse.json({
      success: true,
      data: {
        events: [],
        total: 0,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Events fetch API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
