import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const smartInventoryKpis = {
      itemsTracked: 1247,
      wasteReduction: 23.5,
      stockOptimization: 89.2,
      costSavings: 12000,
      expiryAlerts: 15,
      lowStockAlerts: 8,
      topPerformers: [
        { item: 'Fresh Vegetables', efficiency: 95.2 },
        { item: 'Dairy Products', efficiency: 92.8 },
        { item: 'Meat & Poultry', efficiency: 88.9 }
      ]
    };

    return NextResponse.json(smartInventoryKpis);
  } catch (error) {
    console.error('Error fetching smart inventory KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch smart inventory KPIs' },
      { status: 500 }
    );
  }
}