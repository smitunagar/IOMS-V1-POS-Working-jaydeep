import { ai } from '@/ai/genkit';
import { AIGenerateParams, AIGenerateResult, AIProvider } from '@/server/lib/ai/types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';

  async generate(p: AIGenerateParams): Promise<AIGenerateResult> {
    // genkit ai.generate accepts an array of parts; optionally include media
    const parts: any[] = [{ text: p.prompt }];
    if (p.mediaDataUri) parts.push({ media: { url: p.mediaDataUri } });
    try {
      const result = await ai.generate(parts);
      const text = typeof result.text === 'string' ? result.text : '';
      return { text };
    } catch (e: any) {
      const msg = e?.message || 'Gemini error';
      // Try to extract status code if present
      const status = e?.status || (msg.includes('429') ? 429 : undefined);
      const err: any = new Error(msg);
      err.status = status;
      throw err;
    }
  }
}

export default new GeminiProvider();