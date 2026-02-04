// OCR fallback using pdfjs-dist render + node-canvas + tesseract.js
// Dynamic imports keep optional deps from breaking builds when unused.

function runtimeImport(moduleName: string): Promise<any> {
  // Use new Function to avoid bundler static analysis of module specifiers
  // eslint-disable-next-line no-new-func
  const importer = new Function('n', 'return import(n)');
  return importer(moduleName);
}

export async function ocrPdfImages(buffer: Buffer, opts?: { maxPages?: number; scale?: number; lang?: string }): Promise<string[]> {
  const maxPages = Math.max(1, Math.min(20, opts?.maxPages ?? 5));
  const scale = opts?.scale ?? 2.0; // higher scale -> better OCR but slower
  const lang = opts?.lang ?? 'eng';

  // Lazy-load heavy deps
  let pdfjsLib: any, createCanvas: any, createWorker: any;
  try {
    // Build names to further avoid static resolution
    const pdfMod = ['pdfjs-dist', 'legacy', 'build', 'pdf.mjs'].join('/');
    const canvMod = ['can', 'vas'].join('');
    const tessMod = ['tesseract', '.js'].join('');
    pdfjsLib = await runtimeImport(pdfMod);
    ({ createCanvas } = await runtimeImport(canvMod));
    ({ createWorker } = await runtimeImport(tessMod));
  } catch (e) {
    // Optional deps not available; skip OCR
    return [];
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const worker = await createWorker(lang);
  const lines: string[] = [];
  try {
    const pageCount = Math.min(pdf.numPages || 0, maxPages);
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');
      // Render PDF page to canvas
      await page.render({ canvasContext: ctx, viewport }).promise;
      const pngBuffer: Buffer = canvas.toBuffer('image/png');
      const { data } = await worker.recognize(pngBuffer);
      if (data && data.text) {
        const pageLines = (data.text as string)
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        lines.push(...pageLines);
      }
    }
  } finally {
    try { await worker.terminate(); } catch {}
  }
  return lines;
}

export default { ocrPdfImages };