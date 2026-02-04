import fs from 'fs';
import path from 'path';

export interface AiUsageEvent {
  service: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  timestamp?: string;
  meta?: Record<string, unknown>;
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_PATH = path.join(LOG_DIR, 'ai-usage.jsonl');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function recordAiUsage(event: AiUsageEvent) {
  try {
    ensureLogDir();
    const payload = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to record AI usage:', error);
  }
}

export function getAiUsageStats(service?: string) {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return { count: 0, averageInputTokens: 0, averageOutputTokens: 0, averageTotalTokens: 0 };
    }

    const lines = fs.readFileSync(LOG_PATH, 'utf8').split('\n').filter(Boolean);
    const events: AiUsageEvent[] = lines.map((line) => {
      try {
        return JSON.parse(line) as AiUsageEvent;
      } catch {
        return null;
      }
    }).filter(Boolean) as AiUsageEvent[];

    const filtered = service ? events.filter((e) => e.service === service) : events;

    const totals = filtered.reduce(
      (acc, e) => {
        acc.count += 1;
        acc.inputTokens += e.inputTokens || 0;
        acc.outputTokens += e.outputTokens || 0;
        acc.totalTokens += e.totalTokens || 0;
        return acc;
      },
      { count: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    );

    if (totals.count === 0) {
      return { count: 0, averageInputTokens: 0, averageOutputTokens: 0, averageTotalTokens: 0 };
    }

    return {
      count: totals.count,
      averageInputTokens: Number((totals.inputTokens / totals.count).toFixed(2)),
      averageOutputTokens: Number((totals.outputTokens / totals.count).toFixed(2)),
      averageTotalTokens: Number((totals.totalTokens / totals.count).toFixed(2)),
    };
  } catch (error) {
    console.error('Failed to read AI usage stats:', error);
    return { count: 0, averageInputTokens: 0, averageOutputTokens: 0, averageTotalTokens: 0 };
  }
}
