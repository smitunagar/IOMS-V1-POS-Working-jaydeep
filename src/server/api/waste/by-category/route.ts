import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const wasteByCategory = [
      { category: 'Food Waste', amount: 45.2, percentage: 38 },
      { category: 'Packaging', amount: 23.8, percentage: 20 },
      { category: 'Paper', amount: 19.1, percentage: 16 },
      { category: 'Plastic', amount: 15.9, percentage: 13 },
      { category: 'Other', amount: 15.5, percentage: 13 }
    ];

    return NextResponse.json(wasteByCategory);
  } catch (error) {
    console.error('Error fetching waste by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste by category' },
      { status: 500 }
    );
  }
}