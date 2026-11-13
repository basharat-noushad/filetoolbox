// PowerPoint 97-2003 (.ppt) -> PDF through the same slide renderer as .pptx
import { loadPpt } from './model.js';
import { slidesToPdf } from '../pptx2pdf/index.js';

export async function pptToPdf(bytes, { fontProvider, title, limits } = {}) {
  return slidesToPdf(loadPpt(bytes, { limits }), { fontProvider, title, limits });
}
export { loadPpt };
