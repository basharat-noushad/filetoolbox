// Excel 97-2003 (.xls) -> PDF through the same print layout as .xlsx
import { loadXls } from './model.js';
import { workbookToPdf } from '../xlsx2pdf/index.js';

export async function xlsToPdf(bytes, { fontProvider, title, filename, limits } = {}) {
  return workbookToPdf(loadXls(bytes, { limits }), { fontProvider, title, filename, limits });
}
export { loadXls };
