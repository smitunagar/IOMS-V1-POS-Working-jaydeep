import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ownerSummary = {
      totalRevenue: 450000,
      totalOrders: 5247,
      activeCustomers: 1890,
      avgOrderValue: 85.67,
      revenueGrowth: 12.5,
      orderGrowth: 8.3,
      customerGrowth: 15.2,
      topProducts: [
        { name: 'Premium Coffee', revenue: 45000 },
        { name: 'Artisan Sandwich', revenue: 38000 },
        { name: 'Fresh Salad Bowl', revenue: 32000 }
      ]
    };

    return NextResponse.json(ownerSummary);
  } catch (error) {
    console.error('Error fetching owner summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner summary' },
      { status: 500 }
    );
  }
}