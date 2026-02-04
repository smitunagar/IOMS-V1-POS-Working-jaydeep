import { NextRequest, NextResponse } from 'next/server';
import { enqueueWaste, listWasteQueue } from '@/server/lib/wasteQueue';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 20);

  const items = listWasteQueue(Number.isNaN(limit) ? 20 : limit);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, weightKg } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const weight = typeof weightKg === 'number' ? weightKg : null;
    const id = enqueueWaste(image, weight);

    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Queue enqueue failed' }, { status: 500 });
  }
}
