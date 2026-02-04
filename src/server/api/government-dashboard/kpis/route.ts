import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Sample government dashboard KPI data
    const governmentKpis = {
      compliance: {
        current: 98.5,
        previous: 97.2,
        change: 1.3
      },
      inspections: {
        current: 45,
        previous: 42,
        change: 7.1
      },
      violations: {
        current: 2,
        previous: 5,
        change: -60
      },
      permits: {
        current: 12,
        previous: 11,
        change: 9.1
      }
    };

    return NextResponse.json(governmentKpis);
  } catch (error) {
    console.error('Error fetching government KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch government KPIs' },
      { status: 500 }
    );
  }
}