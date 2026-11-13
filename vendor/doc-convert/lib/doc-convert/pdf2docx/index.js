// Public API: pdfToDocx(bytes) -> Promise<{ docx: Uint8Array, stats }>
import { extractPdf, scanStats } from './extract.js';
import { analyze } from './analyze.js';
import { writeDocx } from './write.js';

export async function pdfToDocx(bytes, { pdfjs, title, maxPages, pdfOptions, limits, ocr, onProgress } = {}) {
  const extracted = await extractPdf(bytes, { pdfjs, maxPages, pdfOptions, limits, ocr, onProgress });
  const glyphCount = extracted.pages.reduce((a, p) => a + p.glyphs.length, 0);
  const model = analyze(extracted);
  const docx = await writeDocx(model, { title });
  const count = (t) => model.blocks.filter((b) => b.type === t).length;
  return {
    docx,
    model,
    stats: {
      pages: extracted.pages.length, glyphs: glyphCount, paragraphs: count('p'), tables: count('table'), images: count('image'),
      lists: model.blocks.filter((b) => b.marker).length, headings: model.blocks.filter((b) => b.heading).length,
      ...scanStats(extracted),
    },
  };
}
