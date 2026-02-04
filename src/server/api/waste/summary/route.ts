import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const wasteSummary = {
      totalWasteToday: 12.7,
      totalWasteWeek: 89.4,
      totalWasteMonth: 356.8,
      reductionTarget: 25,
      currentReduction: 18.5,
      costImpact: {
        daily: 78.50,
        weekly: 549.25,
        monthly: 2197.00
      },
      trends: [
        { date: '2024-01-10', amount: 14.2 },
        { date: '2024-01-11', amount: 13.8 },
        { date: '2024-01-12', amount: 12.9 },
        { date: '2024-01-13', amount: 11.5 },
        { date: '2024-01-14', amount: 12.7 }
      ]
    };

    return NextResponse.json(wasteSummary);
  } catch (error) {
    console.error('Error fetching waste summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste summary' },
      { status: 500 }
    );
  }
}