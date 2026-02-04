// Text-layer extraction from PDFs using pdfjs-dist in Node
// Use dynamic import to the ESM entrypoint which exists in v5+

type TextItem = { str: string; transform: number[]; width?: number; height?: number };

export async function extractTextLinesFromPdf(buffer: Buffer): Promise<string[]> {
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];
    // Group by approximate Y (within tolerance)
    const buckets: { y: number; items: { x: number; str: string }[] }[] = [];
    const tol = 2; // pixels tolerance for same line
    for (const it of items) {
      const t = (it as any).transform as number[]; // [a,b,c,d,e,f] where e=x, f=y
      const x = t[4];
      const y = Math.round(t[5]);
      const str = (it as any).str as string;
      if (!str || !str.trim()) continue;
      // find bucket
      let bucket = buckets.find(b => Math.abs(b.y - y) <= tol);
      if (!bucket) { bucket = { y, items: [] }; buckets.push(bucket); }
      bucket.items.push({ x, str });
    }
    // Sort buckets top-to-bottom (y desc), items left-to-right (x asc)
    buckets.sort((a, b) => b.y - a.y);
    for (const b of buckets) {
      b.items.sort((a, c) => a.x - c.x);
      const line = b.items.map(i => i.str).join(' ').replace(/\s{2,}/g, ' ').trim();
      if (line) lines.push(line);
    }
  }

  const totalLen = lines.reduce((n, s) => n + s.length, 0);
  if (totalLen < 50) return [];
  return lines;
}

export default { extractTextLinesFromPdf };