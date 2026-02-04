import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, AnalyticsQuerySchema } from '@/server/services/wasteService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const range = searchParams.get('range') || '7d';
    const metric = searchParams.get('metric') || 'weight';
    
    // Convert range to dates
    const now = new Date();
    let daysAgo: number;
    
    switch (range) {
      case '7d':
        daysAgo = 7;
        break;
      case '30d':
        daysAgo = 30;
        break;
      case '90d':
        daysAgo = 90;
        break;
      default:
        daysAgo = 7;
    }
    
    const from = new Date(now);
    from.setDate(from.getDate() - daysAgo);
    
    // Validate with schema
    const query = AnalyticsQuerySchema.parse({
      from,
      to: now,
      metric: metric === 'weight' || metric === 'cost' || metric === 'co2' ? metric : 'weight'
    });
    
    const analytics = await getAnalytics(query);
    
    return NextResponse.json({
      success: true,
      data: analytics,
      range,
      metric
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
