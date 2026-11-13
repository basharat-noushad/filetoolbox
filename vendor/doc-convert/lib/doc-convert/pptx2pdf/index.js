// Public API: pptxToPdf(bytes, { fontProvider }) -> { pdf, pages, slides }
// Hidden slides are skipped (as PowerPoint's PDF export does) unless includeHidden is set.
import { loadPptx, buildSlide } from './model.js';
import { collectFonts, SlideRenderer } from './layout.js';
import { FontBook } from '../common/fonts.js';
import { renderPdf } from '../common/render.js';

export async function pptxToPdf(bytes, { fontProvider, title, includeHidden = false, maxSlides, limits } = {}) {
  if (!fontProvider) throw new Error('pptxToPdf: a fontProvider(family, bold, italic) is required');
  const model = loadPptx(bytes, { maxSlides, limits });
  return slidesToPdf(model, { fontProvider, title, includeHidden, limits });
}

/** shared with the legacy .ppt reader, which produces the same model shape */
export async function slidesToPdf(model, { fontProvider, title, includeHidden = false, limits }) {
  const scenes = [];
  model.slides.forEach((s, i) => {
    if (s.hidden && !includeHidden) return;
    scenes.push(model.build ? model.build(s, model.firstNum + i) : buildSlide(model, s, model.firstNum + i));
  });
  const fonts = new FontBook(fontProvider);
  const { keys, chars } = collectFonts(scenes);
  await fonts.prepare(keys, chars);
  const renderer = new SlideRenderer(fonts);
  const layout = { width: model.width, height: model.height, pages: scenes.map((s) => renderer.page(s)) };
  if (!layout.pages.length) layout.pages.push({ width: model.width, height: model.height, items: [] });
  const pdf = await renderPdf(layout, fonts, { title, limits });
  return { pdf, pages: layout.pages.length, slides: model.slides.length };
}
