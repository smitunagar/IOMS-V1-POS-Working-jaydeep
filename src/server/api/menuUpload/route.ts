import { NextRequest, NextResponse } from 'next/server';
import { extractTextLinesFromPdf } from '@/server/lib/menu/parsePdf';
import { ocrPdfImages } from '@/server/lib/menu/ocr';
import { normalizeBufferToUtf8, safeLabel } from '@/server/lib/text/normalize';
import { parseMenuLines } from '@/server/lib/parse/deterministicMenu';
import { parse as csvParse } from 'csv-parse/sync';
import { extractMenuItemsFromPdfWithGemini } from '@/server/lib/aiMenuExtractor';

export const runtime = 'nodejs';

type UploadResult = {
  items: any[];
  categories: string[];
  source: 'csv' | 'pdf:text' | 'pdf:ocr' | 'pdf:ai' | 'text';
  quality: 'csv' | 'deterministic' | 'ocr' | 'degraded' | 'ai';
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const name = (file as any).name?.toString() || '';
    const type = (file as any).type?.toString() || '';
    const isPdf = type.includes('pdf') || name.toLowerCase().endsWith('.pdf');
    const isCsv = type.includes('csv') || name.toLowerCase().endsWith('.csv');

    const buf = Buffer.from(await file.arrayBuffer());

    if (isCsv) {
      const text = buf.toString('utf8');
      const rows = csvParse(text, { columns: true, skip_empty_lines: true }) as any[];
      const items = rows.map(normalizeCsvRow);
      return NextResponse.json(asPayload({ items, source: 'csv', quality: 'csv' }));
    }

    if (isPdf) {
      // Optional AI-first mode (set AI_FIRST=true and GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY)
      if (process.env.AI_FIRST === 'true') {
        try {
          const aiItems = await extractMenuItemsFromPdfWithGemini(buf);
          if (Array.isArray(aiItems) && aiItems.length > 0) {
            return NextResponse.json(asPayload({ items: aiItems, source: 'pdf:ai', quality: 'ai' }));
          }
        } catch (e: any) {
          // Swallow and continue to offline path on 4xx/5xx or quota errors
          console.warn('AI-first extraction failed, falling back to offline:', e?.message || e);
        }
      }
      // 1) Try text-layer extraction
      let lines: string[] = [];
      let source: UploadResult['source'] = 'pdf:text';
      try {
        lines = await extractTextLinesFromPdf(buf);
      } catch (e) {
        // swallow; fallback to OCR or naive
        lines = [];
      }

      // 2) OCR fallback if text-layer is empty
      if (!lines || lines.length === 0) {
        try {
          const ocrLines = await ocrPdfImages(buf);
          if (ocrLines && ocrLines.length > 0) {
            lines = ocrLines;
            source = 'pdf:ocr';
          }
        } catch {
          // ignore
        }
      }

      // 3) Parse lines if we have them; otherwise return degraded for PDF
      if (lines && lines.length > 0) {
        const text = lines.map(safeLabel).filter(Boolean).join('\n');
        const parsed = parseMenuLines(text);
        const items = parsed.items || [];
        const quality: UploadResult['quality'] = source === 'pdf:ocr' ? 'ocr' : (items.length > 0 ? 'deterministic' : 'degraded');
        return NextResponse.json(asPayload({ items, source, quality }));
      }

      // No lines from PDF: avoid returning binary junk
      return NextResponse.json(asPayload({ items: [], source, quality: 'degraded' }));
    }

    // Treat as plain text
    const text = normalizeBufferToUtf8(buf);
    const parsed = parseMenuLines(text);
    const items = parsed.items || [];
    return NextResponse.json(asPayload({ items, source: 'text', quality: items.length > 0 ? 'deterministic' : 'degraded' }));
  } catch (e) {
    console.error('menuUpload error', e);
    return NextResponse.json({ error: 'Failed to parse menu' }, { status: 500 });
  }
}

function asPayload(input: { items: any[]; source: UploadResult['source']; quality: UploadResult['quality'] }) {
  const categories = Array.from(new Set((input.items || []).map((i: any) => (i.category || 'Uncategorized'))));
  return { items: input.items, categories, source: input.source, quality: input.quality } satisfies UploadResult;
}

function normalizeCsvRow(row: any) {
  const price = parsePrice(row.price ?? row.Price ?? row.cost ?? row.Cost);
  return {
    name: (row.name || row.Name || row.item || row.Item || '').toString().trim(),
    price,
    category: safeLabel((row.category || row.Category || row.section || row.Section || 'Uncategorized').toString()),
    description: (row.description || row.Description || '').toString().trim(),
    ingredients: [],
    preparation_time: 15,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
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
