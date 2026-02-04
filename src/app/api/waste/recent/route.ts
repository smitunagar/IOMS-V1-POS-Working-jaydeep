import { NextRequest, NextResponse } from 'next/server';

const mockRecent = [
  {
    id: 'waste-001',
    item: 'Käsespätzle mit Röstzwiebeln',
    amountKg: 1.4,
    costEUR: 8.6,
    station: 'kitchen',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'waste-002',
    item: 'Gemüsecurry mit Jasminreis',
    amountKg: 0.9,
    costEUR: 5.1,
    station: 'kitchen',
    timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString()
  },
  {
    id: 'waste-003',
    item: 'Gemischter Salat',
    amountKg: 0.4,
    costEUR: 2.2,
    station: 'dining',
    timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || '5');
  return NextResponse.json({
    success: true,
    items: mockRecent.slice(0, Math.max(1, limit))
  });
}
