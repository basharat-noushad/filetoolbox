// Public API: xlsxToPdf(bytes, { fontProvider }) -> { pdf, pages }
// workbookToPdf() is shared with the .xls and .csv readers, which produce the same workbook model.
import { loadXlsx } from './model.js';
import { collectFonts, layoutWorkbook } from './layout.js';
import { FontBook } from '../common/fonts.js';
import { renderPdf } from '../common/render.js';

export async function xlsxToPdf(bytes, opts = {}) {
  return workbookToPdf(loadXlsx(bytes, { limits: opts.limits }), opts);
}

export async function workbookToPdf(model, { fontProvider, title, filename, limits } = {}) {
  if (!fontProvider) throw new Error('xlsxToPdf: a fontProvider(family, bold, italic) is required');
  const fonts = new FontBook(fontProvider);
  const { keys, chars } = collectFonts(model);
  await fonts.prepare(keys, chars);
  const layout = layoutWorkbook(model, fonts, { filename });
  if (!layout.pages.length) layout.pages.push({ width: 595.28, height: 841.89, items: [] }); // empty workbook -> one blank page
  const pdf = await renderPdf(layout, fonts, { title, limits });
  return { pdf, pages: layout.pages.length, sheets: model.sheets.filter((s) => !s.hidden).length };
}
