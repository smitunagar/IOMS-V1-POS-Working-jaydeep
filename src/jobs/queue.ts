// Minimal queue stub; replace with BullMQ when Redis is available
import { contentHash } from '@/server/lib/cache/hash';
import { getCachedExtraction, setCachedExtraction } from '@/server/lib/cache/resultCache';
import { parseMenuLines } from '@/server/lib/parse/deterministicMenu';
import { generateWithBroker } from '@/server/lib/ai/broker';

type JobState = 'queued' | 'active' | 'completed' | 'failed';

const memQueue: Record<string, { state: JobState; result?: any; error?: string }> = {};

export async function addExtractionJob(text: string) {
  const id = contentHash(text + Date.now());
  memQueue[id] = { state: 'queued' };
  // Fire and forget process
  process.nextTick(() => processJob(id, text));
  return { id };
}

async function processJob(id: string, text: string) {
  memQueue[id].state = 'active';
  try {
    const hash = contentHash(text);
    const cached = getCachedExtraction(hash);
    if (cached) {
      memQueue[id] = { state: 'completed', result: cached };
      return;
    }

    // Deterministic first
    const det = parseMenuLines(text);
    if (det.items && det.items.length >= 5) {
      const result = { items: det.items, quality: 'deterministic' };
      setCachedExtraction(hash, result);
      memQueue[id] = { state: 'completed', result };
      return;
    }

    // AI broker
    try {
      const prompt = `Extract menu items as JSON array with fields {name, price, category}. Keep language as-is. Respond JSON only.`;
      const res = await generateWithBroker({ prompt: `${prompt}\n\n${text}` });
      const jsonText = (res.text || '').replace(/```(json)?/g, '').trim();
      let items: any[] = [];
      try { items = JSON.parse(jsonText); } catch { items = []; }
      const result = { items, quality: 'ai' };
      setCachedExtraction(hash, result);
      memQueue[id] = { state: 'completed', result };
    } catch (e: any) {
      const result = { items: det.items || [], quality: 'degraded' };
      setCachedExtraction(hash, result);
      memQueue[id] = { state: 'completed', result };
    }
  } catch (e: any) {
    memQueue[id] = { state: 'failed', error: e?.message || 'processing error' };
  }
}

export function getJob(id: string) {
  return memQueue[id] || null;
}

export default { addExtractionJob, getJob };