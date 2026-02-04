import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supplySyncKpis = {
      suppliers: 23,
      activeOrders: 45,
      onTimeDelivery: 94.2,
      costOptimization: 15.7,
      qualityScore: 4.6,
      totalSpend: 78500,
      topSuppliers: [
        { name: 'FreshCorp Ltd', rating: 4.9 },
        { name: 'Quality Foods Inc', rating: 4.7 },
        { name: 'Premium Supplies', rating: 4.5 }
      ]
    };

    return NextResponse.json(supplySyncKpis);
  } catch (error) {
    console.error('Error fetching supply sync KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply sync KPIs' },
      { status: 500 }
    );
  }
}