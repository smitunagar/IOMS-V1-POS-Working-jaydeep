import { NextRequest, NextResponse } from 'next/server';
import { getCompliance, ComplianceQuerySchema } from '@/server/services/wasteService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const range = searchParams.get('range') || '30d';
    
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
        daysAgo = 30;
    }
    
    const from = new Date(now);
    from.setDate(from.getDate() - daysAgo);
    
    // Validate with schema
    const query = ComplianceQuerySchema.parse({
      from,
      to: now
    });
    
    const compliance = await getCompliance(query);
    
    return NextResponse.json({
      success: true,
      data: compliance,
      range
    });
    
  } catch (error) {
    console.error('Compliance API error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}
