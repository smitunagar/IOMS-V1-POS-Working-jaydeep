import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const smartPosKpis = {
      dailyTransactions: 542,
      totalRevenue: 34500,
      avgTransactionTime: 2.3,
      successRate: 99.8,
      paymentMethods: [
        { method: 'Card', percentage: 65 },
        { method: 'Cash', percentage: 25 },
        { method: 'Digital', percentage: 10 }
      ],
      peakHours: [
        { hour: '12:00', transactions: 89 },
        { hour: '18:00', transactions: 76 },
        { hour: '19:00', transactions: 72 }
      ]
    };

    return NextResponse.json(smartPosKpis);
  } catch (error) {
    console.error('Error fetching smart POS KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch smart POS KPIs' },
      { status: 500 }
    );
  }
}