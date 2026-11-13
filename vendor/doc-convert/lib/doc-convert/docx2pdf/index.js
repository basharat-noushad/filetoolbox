// Public API: docxToPdf(bytes, { fontProvider }) -> Promise<Uint8Array>
import { loadDocx } from './model.js';
import { FontBook } from '../common/fonts.js';
import { layoutDocument } from './layout.js';
import { renderPdf } from '../common/render.js';

export async function docxToPdf(bytes, { fontProvider, title, limits } = {}) {
  if (!fontProvider) throw new Error('docxToPdf: a fontProvider(family, bold, italic) is required');
  const model = loadDocx(bytes, { limits });
  const fonts = new FontBook(fontProvider);
  await fonts.prepare(model.fontsUsed, model.charsByFont);
  const layout = layoutDocument(model, fonts);
  const pdf = await renderPdf(layout, fonts, { title, limits });
  return { pdf, pages: layout.pages.length };
}
