import { safeLabel } from '@/server/lib/text/normalize';

export type DeterministicItem = { name: string; price?: number; category?: string };

function isPdfJunkLine(s: string): boolean {
  if (!s) return true;
  const l = s.trim();
  if (!l) return true;
  if (l.startsWith('%') || l.startsWith('/')) return true; // %PDF-1.7, /Type /Page, etc.
  const junkTokens = [
    'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer',
    'Type', 'Page', 'Pages', 'ProcSet', 'MediaBox', 'Kids', 'Producer', 'OpenAction', 'FitH', 'Catalog'
  ];
  const lower = l.toLowerCase();
  // Drop PDF version headers like 'PDF-1.3' or 'PDF 1.7'
  if (/^pdf[\s\-]*\d(\.\d)?$/i.test(l)) return true;
  // Drop common generator metadata lines
  if (lower.includes('pypdf') || lower.includes('ghostscript') || lower.includes('adobe') || lower.includes('googlecode') || lower.includes('producer')) return true;
  if (junkTokens.some(tok => lower.includes(tok.toLowerCase()))) return true;
  // Symbol/letters ratio heuristic
  const total = l.length;
  const allowedMatches = l.match(/[\p{L}\p{N} \-–—&|'"().,:/]/gu) || [];
  const allowedRatio = allowedMatches.length / total;
  if (allowedRatio < 0.6) return true;
  // Require at least a few letters
  const letters = (l.match(/[\p{L}]/gu) || []).length;
  if (letters < Math.min(3, Math.ceil(total * 0.1))) return true;
  return false;
}

export function parseMenuLines(text: string): { items: DeterministicItem[] } {
  if (!text) return { items: [] };
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter(l => !isPdfJunkLine(l));

  const items: DeterministicItem[] = [];
  let currentCategory = 'Uncategorized';

  const priceTail = /^(.*?)\s*[\.\-–—\s]+\s*(\d+[.,]\d{2})\s*(€|EUR)?$/i;
  const headerHeuristic = (s: string) => {
    const hasPrice = /(€|EUR|\d+[.,]\d{1,2})/.test(s);
    if (hasPrice) return false;
    const tokens = s.split(' ');
    return tokens.length <= 5 || s === s.toUpperCase();
  };

  for (const raw of lines) {
  const line = safeLabel(raw);
    if (!line) continue;

    if (headerHeuristic(line)) {
      currentCategory = safeLabel(line) || 'Uncategorized';
      continue;
    }

    const m = line.match(priceTail);
    if (m) {
      const name = safeLabel(m[1]);
      const price = parseFloat((m[2] || '').replace(',', '.'));
      if (name && isFinite(price)) {
        items.push({ name, price, category: currentCategory });
        continue;
      }
    }

    // No price; accept long-ish lines as names
    if (line.length >= 6 && !/(€|EUR)/.test(line)) {
      items.push({ name: line, category: currentCategory });
    }
  }

  // Dedupe
  const seen = new Set<string>();
  const out: DeterministicItem[] = [];
  for (const it of items) {
    const key = `${it.name}||${it.category || ''}||${it.price ?? ''}`;
    if (!seen.has(key)) { seen.add(key); out.push(it); }
  }
  return { items: out };
}

export default { parseMenuLines };