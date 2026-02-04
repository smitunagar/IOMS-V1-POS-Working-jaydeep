import { NextRequest, NextResponse } from 'next/server';

const mockKpis = {
  today: {
    totalWasteKg: 12.4,
    costEUR: 96.8,
    co2Kg: 31.0,
    reductionPct: 4.2
  },
  week: {
    totalWasteKg: 84.1,
    costEUR: 682.0,
    co2Kg: 210.4,
    reductionPct: 6.8
  },
  month: {
    totalWasteKg: 332.7,
    costEUR: 2724.5,
    co2Kg: 831.6,
    reductionPct: 8.1
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const window = searchParams.get('window') || 'week';
  const key = window in mockKpis ? window : 'week';

  return NextResponse.json({
    success: true,
    window: key,
    kpis: mockKpis[key as keyof typeof mockKpis]
  });
}
