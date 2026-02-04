import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Sample smart tips data - in production this would come from AI analysis
    const smartTips = [
      {
        id: 1,
        title: 'Optimize Inventory Levels',
        description: 'Consider reducing stock of seasonal items by 15% based on historical data.',
        priority: 'high',
        category: 'inventory',
        impact: 'Cost reduction of $2,400/month'
      },
      {
        id: 2,
        title: 'Peak Hours Staffing',
        description: 'Add 2 more staff during 6-8 PM peak hours to reduce wait times.',
        priority: 'medium',
        category: 'staffing',
        impact: 'Customer satisfaction increase'
      },
      {
        id: 3,
        title: 'Menu Item Performance',
        description: 'Promote high-margin dishes during lunch hours for better profitability.',
        priority: 'medium',
        category: 'sales',
        impact: 'Revenue increase of $800/week'
      }
    ];

    return NextResponse.json(smartTips);
  } catch (error) {
    console.error('Error fetching smart tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch smart tips' },
      { status: 500 }
    );
  }
}