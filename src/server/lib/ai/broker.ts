import { AIGenerateParams, AIGenerateResult } from '@/server/lib/ai/types';
import { isOpen, reportFailure, reportSuccess } from '@/server/lib/ai/rate';
import gemini from '@/server/lib/ai/providers/gemini';

const registry = {
  gemini,
};

export async function generateWithBroker(p: AIGenerateParams): Promise<AIGenerateResult> {
  const order = (process.env.AI_PREFERENCE || 'gemini').split(',').map(s => s.trim()).filter(Boolean);
  const errors: any[] = [];
  for (const name of order) {
    const provider = (registry as any)[name];
    if (!provider) continue;
    if (isOpen(name)) { errors.push(new Error(`${name} breaker open`)); continue; }
    try {
      const res = await provider.generate(p);
      reportSuccess(name);
      return res;
    } catch (e: any) {
      reportFailure(name, e?.status);
      errors.push(e);
      continue;
    }
  }
  const err = new Error('All AI providers failed');
  (err as any).causes = errors.map(e => e?.message || String(e));
  throw err;
}

export default { generateWithBroker };