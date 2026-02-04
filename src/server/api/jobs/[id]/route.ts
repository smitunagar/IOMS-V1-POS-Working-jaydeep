import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/jobs/queue';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ state: 'not_found' }, { status: 404 });
  return NextResponse.json(job);
}
