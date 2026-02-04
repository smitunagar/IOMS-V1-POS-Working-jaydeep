import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const recentWaste = [
      {
        id: 1,
        date: '2024-01-15',
        item: 'Fresh Vegetables',
        amount: 2.5,
        reason: 'Expired',
        cost: 15.60
      },
      {
        id: 2,
        date: '2024-01-15',
        item: 'Bread Rolls',
        amount: 1.2,
        reason: 'Over-production',
        cost: 8.40
      },
      {
        id: 3,
        date: '2024-01-14',
        item: 'Dairy Products',
        amount: 3.1,
        reason: 'Damaged',
        cost: 22.80
      }
    ];

    return NextResponse.json(recentWaste);
  } catch (error) {
    console.error('Error fetching recent waste:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent waste' },
      { status: 500 }
    );
  }
}