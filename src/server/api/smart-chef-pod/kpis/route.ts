import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const smartChefKpis = {
      dishesCreated: 127,
      recipeOptimizations: 45,
      costSavings: 8500,
      customerSatisfaction: 4.8,
      popularDishes: [
        { name: 'AI-Optimized Pasta', orders: 234 },
        { name: 'Smart Burger', orders: 189 },
        { name: 'Fusion Bowl', orders: 156 }
      ]
    };

    return NextResponse.json(smartChefKpis);
  } catch (error) {
    console.error('Error fetching smart chef KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch smart chef KPIs' },
      { status: 500 }
    );
  }
}