import { NextRequest, NextResponse } from 'next/server';
import { getOwnerKPIs, KPIQuerySchema } from '@/server/services/wasteService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const window = searchParams.get('window') || 'week';
    
    // Validate with schema
    const query = KPIQuerySchema.parse({
      window: window === 'today' || window === 'week' || window === 'month' ? window : 'week'
    });
    
    const kpis = await getOwnerKPIs(query);
    
    return NextResponse.json({
      success: true,
      data: kpis,
      window
    });
    
  } catch (error) {
    console.error('KPIs API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}
