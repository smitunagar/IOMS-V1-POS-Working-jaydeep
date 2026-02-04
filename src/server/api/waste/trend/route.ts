import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const wasteTrend = {
      period: '30 days',
      data: [
        { date: '2024-01-01', amount: 18.5 },
        { date: '2024-01-02', amount: 16.2 },
        { date: '2024-01-03', amount: 19.8 },
        { date: '2024-01-04', amount: 15.1 },
        { date: '2024-01-05', amount: 17.3 },
        { date: '2024-01-06', amount: 14.9 },
        { date: '2024-01-07', amount: 13.7 },
        { date: '2024-01-08', amount: 12.4 },
        { date: '2024-01-09', amount: 11.8 },
        { date: '2024-01-10', amount: 14.2 },
        { date: '2024-01-11', amount: 13.8 },
        { date: '2024-01-12', amount: 12.9 },
        { date: '2024-01-13', amount: 11.5 },
        { date: '2024-01-14', amount: 12.7 },
        { date: '2024-01-15', amount: 10.9 }
      ],
      averageDaily: 14.6,
      trendDirection: 'decreasing',
      improvementRate: 12.3
    };

    return NextResponse.json(wasteTrend);
  } catch (error) {
    console.error('Error fetching waste trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste trend' },
      { status: 500 }
    );
  }
}