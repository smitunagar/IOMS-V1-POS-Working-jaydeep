import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Sample KPI data - in production this would come from your database
    const kpis = {
      revenue: {
        current: 125000,
        previous: 118000,
        change: 5.9
      },
      orders: {
        current: 1247,
        previous: 1180,
        change: 5.7
      },
      customers: {
        current: 890,
        previous: 850,
        change: 4.7
      },
      avgOrderValue: {
        current: 100.24,
        previous: 100.00,
        change: 0.24
      }
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}