import { NextRequest, NextResponse } from 'next/server';
import { getAiUsageStats } from '@/server/lib/ai/usageTracker';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || undefined;

  const stats = getAiUsageStats(service || undefined);

  return NextResponse.json({
    service: service || 'all',
    ...stats,
  });
}
