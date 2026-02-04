import { NextRequest, NextResponse } from 'next/server';
import ImprovedDataExtractor from '@/server/lib/improvedDataExtractor';
import { PrismaClient } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';

const prisma = new PrismaClient();
import { extractMenuItemsFromPdfWithGemini } from '@/server/lib/aiMenuExtractor';
import { normalizeBufferToUtf8 } from '@/server/lib/text/normalize';
import { addExtractionJob } from '@/jobs/queue';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
  const formData = await request.formData();
  const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type and safely extract text/content
    const filename = (file as any).name?.toString() || '';
    const mimeType = (file as any).type?.toString() || '';

    const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
    const isCsv = mimeType.includes('csv') || filename.toLowerCase().endsWith('.csv');

  let text = '';
  let csvItems: any[] | null = null;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isPdf) {
      // Try Genkit PDF extraction first (previous working path)
      try {
        const aiItems = await extractMenuItemsFromPdfWithGemini(buffer);
        if (Array.isArray(aiItems) && aiItems.length > 0) {
          csvItems = aiItems; // reuse downstream path
        } else {
          // Fallback to PDF-to-text path
          const pdfParseMod = await import('pdf-parse');
          const pdfParse = (pdfParseMod as any).default || (pdfParseMod as any);
          const pdfData = await pdfParse(buffer);
          text = sanitizeText(pdfData.text || '');
        }
      } catch (e) {
        console.warn('⚠️ Genkit PDF extraction failed, using pdf-parse fallback. Error:', e);
        try {
          const pdfParseMod = await import('pdf-parse');
          const pdfParse = (pdfParseMod as any).default || (pdfParseMod as any);
          const pdfData = await pdfParse(buffer);
          text = sanitizeText(pdfData.text || '');
        } catch (e2) {
          console.warn('⚠️ pdf-parse also failed, falling back to naive decode. Error:', e2);
          text = sanitizeText(buffer.toString('utf-8'));
        }
      }
    } else if (isCsv) {
      // Parse CSV into items directly
      const csvText = buffer.toString('utf-8');
  const options = { columns: true, skip_empty_lines: true } as any;
      try {
        const rows = csvParse(csvText, options) as any[];
        csvItems = rows.map((row) => normalizeCsvRow(row));
      } catch (e) {
        return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 400 });
      }
    } else {
      // Treat as UTF-8 text with normalization
      text = sanitizeText(normalizeBufferToUtf8(buffer));
    }

    console.log('🔄 Processing menu with improved AI extraction...');

    // Non-blocking: if CSV was uploaded, process inline to keep parity; otherwise enqueue job
    if (csvItems) {
      const job = await addExtractionJob(JSON.stringify(csvItems));
      return NextResponse.json({ status: 'processing', jobId: job.id }, { status: 202 });
    } else {
      const job = await addExtractionJob(text);
      return NextResponse.json({ status: 'processing', jobId: job.id }, { status: 202 });
    }

  } catch (error) {
    console.error('❌ Error in improved menu upload:', error);
    return NextResponse.json(
      { error: 'Failed to process menu file' },
      { status: 500 }
    );
  }
}

// Helpers
function sanitizeText(input: string): string {
  if (!input) return '';
  // Remove nulls and non-printables, normalize whitespace
  const noBinary = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return noBinary.replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n\n');
}

function looksLikePdfJunk(line: string): boolean {
  if (!line) return true;
  const l = line.trim();
  if (!l) return true;
  // Common PDF internals and binary-ish lines
  if (l.startsWith('/') || l.startsWith('%')) return true; // /Type /Page, /ProcSet, %PDF-1.7
  const junkTokens = ['obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'Adobe', 'ICCProfile', '/Type', '/Page', '/Pages', '/ProcSet', '/R'];
  if (junkTokens.some(tok => l.includes(tok))) return true;
  // Too many punctuation/symbols vs letters/digits
  const total = l.length;
  const allowedMatches = l.match(/[A-Za-z\u00C0-\u024F0-9 \-–—&|'"().,:/]/g) || [];
  const allowedRatio = allowedMatches.length / total;
  if (allowedRatio < 0.6) return true;
  // Heuristic: at least some letters
  const letters = (l.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
  if (letters < Math.min(3, Math.ceil(total * 0.1))) return true;
  // Avoid very long gibberish
  if (total > 80 && allowedRatio < 0.8) return true;
  return false;
}

function sanitizeCategory(name: string): string {
  const raw = (name || '').toString().trim();
  if (!raw) return 'Uncategorized';
  // Normalize weird whitespace
  const n = raw.replace(/\s{2,}/g, ' ');
  if (looksLikePdfJunk(n)) return 'Uncategorized';
  // Collapse super long headers
  if (n.length > 60) return n.slice(0, 60).trim();
  // Title-case shouting headers, keep short acronyms
  const words = n.split(' ');
  const allCaps = words.length > 0 && words.every(w => w.length > 1 && w === w.toUpperCase());
  if (allCaps) {
    return words
      .map(w => (w.length <= 4 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
      .join(' ');
  }
  return n;
}

function coerceItem(raw: any) {
  return {
    name: (raw?.name || '').toString().trim().slice(0, 200),
    price: typeof raw?.price === 'number' ? raw.price : parsePrice(raw?.price),
    category: sanitizeCategory(raw?.category || 'Uncategorized'),
    description: (raw?.description || '').toString().trim().slice(0, 500),
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : [],
    preparation_time: Number.isFinite(raw?.preparation_time) ? raw.preparation_time : 15,
    is_vegetarian: Boolean(raw?.is_vegetarian),
    is_vegan: Boolean(raw?.is_vegan),
    is_gluten_free: Boolean(raw?.is_gluten_free),
  };
}

function parsePrice(val: any): number {
  if (typeof val === 'number') return val;
  const s = (val || '').toString();
  const m = s.match(/(\d+[.,]\d{1,2})|(\d+)/);
  if (!m) return 0;
  const num = m[1] || m[2];
  return parseFloat(num.replace(',', '.')) || 0;
}

// Fallback parser for when AI quota is exceeded or for plain text
function parseMenuItemsManually(text: string): any[] {
  const lines = text.split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => !!l && !looksLikePdfJunk(l));

  const items: any[] = [];
  let currentCategory = 'Uncategorized';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Category header heuristic: short lines, title case or ALL CAPS, no price tokens
    const hasPriceToken = /[€$]|\d+[.,]\d{1,2}/.test(trimmed);
    const isLikelyHeader = !hasPriceToken && (trimmed === trimmed.toUpperCase() || trimmed.split(' ').length <= 5);
    if (isLikelyHeader) {
      currentCategory = sanitizeCategory(trimmed);
      continue;
    }

    // Price extraction
    const priceMatch = trimmed.match(/(?:[€$]\s*)?(\d+[.,]\d{1,2})|((\d+)\s*[€$])/);
    if (priceMatch) {
      const price = parsePrice(priceMatch[0]);
      const name = sanitizeName(trimmed.replace(priceMatch[0], '').replace(/[€$]/g, '').trim());
      if (name.length > 2) {
        items.push({
          name,
          price,
          category: currentCategory,
          description: '',
          ingredients: [],
          preparation_time: 15,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        });
      }
    } else if (!/[€$]/.test(trimmed) && trimmed.length >= 5) {
      // Item without visible price
      const name = sanitizeName(trimmed);
      if (name.length > 2) {
        items.push({
          name,
          price: 0,
          category: currentCategory,
          description: '',
          ingredients: [],
          preparation_time: 15,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        });
      }
    }
  }
  return dedupeItems(items);
}

function sanitizeName(name: string): string {
  const n = (name || '').toString().replace(/\s{2,}/g, ' ').trim();
  // Drop lines that still look like junk
  if (looksLikePdfJunk(n)) return '';
  if (n.length > 200) return n.slice(0, 200);
  return n;
}

function dedupeItems(items: any[]): any[] {
  const map = new Map<string, any>();
  for (const it of items) {
    const key = `${it.name}||${it.category}||${it.price}`;
    if (!map.has(key)) map.set(key, it);
  }
  return Array.from(map.values());
}

function normalizeCsvRow(row: any) {
  // Accept common CSV columns: name, price, category, description
  return {
    name: (row.name || row.Name || row.item || row.Item || '').toString().trim(),
    price: parsePrice(row.price ?? row.Price ?? row.cost ?? row.Cost),
    category: sanitizeCategory((row.category || row.Category || row.section || row.Section || 'Uncategorized').toString()),
    description: (row.description || row.Description || '').toString().trim(),
    ingredients: [],
    preparation_time: 15,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
  };
}

function serializeIngredients(ings: any): string {
  if (!Array.isArray(ings)) return '';
  // Support arrays of strings, or objects with name/inventoryItemName/quantity/unit
  const parts: string[] = [];
  for (const ing of ings) {
    if (typeof ing === 'string') {
      const n = ing.trim();
      if (n) parts.push(n);
    } else if (ing && typeof ing === 'object') {
      const name = (ing.name || ing.inventoryItemName || '').toString().trim();
      const qty = ing.quantity ?? ing.quantityPerDish;
      const unit = ing.unit || '';
      if (name) {
        if (qty && unit) parts.push(`${name}:${qty}${unit}`);
        else if (qty) parts.push(`${name}:${qty}`);
        else parts.push(name);
      }
    }
  }
  return parts.join(';');
}

export async function GET() {
  // Legacy info endpoint; keep but simplified
  try {
    const categories: string[] = []; // Mock categories
    return NextResponse.json({ success: true, data: { categories } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch menu data' }, { status: 500 });
  }
} 