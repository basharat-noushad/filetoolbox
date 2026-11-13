// Minimal .xlsx writer (SpreadsheetML) on fflate: typed cells, shared strings, styles, widths, merges.
//
// writeXlsx({ sheets: [{ name, cols: [widthInChars], rows: [{ height?, cells: [{ c, v, style? }] }], merges: [{r1,c1,r2,c2}] }] })
// style: { bold, italic, size, color, fill, border: {top,bottom,left,right: {w,color}}, h: 'left'|'center'|'right', wrap, numFmt }
import { zipSync, strToU8 } from 'fflate';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
  // XML 1.0 forbids most control characters
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colName = (c) => { let s = ''; c += 1; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
const argb = (hex) => 'FF' + String(hex || '#000000').replace('#', '').toUpperCase();

export function writeXlsx({ sheets, creator = 'doc-convert' }) {
  const fonts = ['<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>'];
  const fontIdx = new Map([['', 0]]);
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  const fillIdx = new Map();
  const borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  const borderIdx = new Map([['', 0]]);
  const numFmts = new Map();
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  const xfIdx = new Map([['{}', 0]]);
  const strings = [];
  const strIdx = new Map();

  const fontId = (st) => {
    if (!st.bold && !st.italic && !st.size && !st.color && !st.underline) return 0;
    const key = `${st.bold ? 1 : 0}${st.italic ? 1 : 0}${st.underline ? 1 : 0}|${st.size || 11}|${st.color || ''}|${st.font || ''}`;
    if (!fontIdx.has(key)) {
      fontIdx.set(key, fonts.length);
      fonts.push(`<font>${st.bold ? '<b/>' : ''}${st.italic ? '<i/>' : ''}${st.underline ? '<u/>' : ''}<sz val="${Math.round((st.size || 11) * 2) / 2}"/>${st.color ? `<color rgb="${argb(st.color)}"/>` : ''}<name val="${esc(st.font || 'Calibri')}"/><family val="2"/></font>`);
    }
    return fontIdx.get(key);
  };
  const fillId = (color) => {
    if (!color) return 0;
    if (!fillIdx.has(color)) {
      fillIdx.set(color, fills.length);
      fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="${argb(color)}"/><bgColor indexed="64"/></patternFill></fill>`);
    }
    return fillIdx.get(color);
  };
  const borderId = (b) => {
    if (!b) return 0;
    const side = (n) => {
      const s = b[n];
      if (!s) return `<${n}/>`;
      const style = s.w >= 1.4 ? 'thick' : s.w >= 0.9 ? 'medium' : 'thin';
      return `<${n} style="${style}"><color rgb="${argb(s.color)}"/></${n}>`;
    };
    const xml = `<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>`;
    if (!borderIdx.has(xml)) { borderIdx.set(xml, borders.length); borders.push(xml); }
    return borderIdx.get(xml);
  };
  const numFmtId = (code) => {
    if (!code || code === 'General') return 0;
    const builtin = { '0': 1, '0.00': 2, '#,##0': 3, '#,##0.00': 4, '0%': 9, '0.00%': 10, '@': 49 };
    if (builtin[code] != null) return builtin[code];
    if (!numFmts.has(code)) numFmts.set(code, 164 + numFmts.size);
    return numFmts.get(code);
  };
  const styleId = (st) => {
    if (!st) return 0;
    const key = JSON.stringify(st);
    if (xfIdx.has(key)) return xfIdx.get(key);
    const f = fontId(st);
    const fl = fillId(st.fill);
    const b = borderId(st.border);
    const n = numFmtId(st.numFmt);
    const align = st.h || st.wrap || st.v ? `<alignment${st.h ? ` horizontal="${st.h}"` : ''}${st.v ? ` vertical="${st.v}"` : ''}${st.wrap ? ' wrapText="1"' : ''}/>` : '';
    const xml = `<xf numFmtId="${n}" fontId="${f}" fillId="${fl}" borderId="${b}" xfId="0"${n ? ' applyNumberFormat="1"' : ''}${f ? ' applyFont="1"' : ''}${fl ? ' applyFill="1"' : ''}${b ? ' applyBorder="1"' : ''}${align ? ' applyAlignment="1">' + align + '</xf>' : '/>'}`;
    xfIdx.set(key, xfs.length);
    xfs.push(xml);
    return xfIdx.get(key);
  };
  const sst = (s) => {
    if (!strIdx.has(s)) { strIdx.set(s, strings.length); strings.push(s); }
    return strIdx.get(s);
  };

  const sheetXml = sheets.map((sh) => {
    const cols = (sh.cols || []).map((w, i) => (w ? `<col min="${i + 1}" max="${i + 1}" width="${Math.round(w * 100) / 100}" customWidth="1"/>` : '')).join('');
    const rows = sh.rows.map((row, r) => {
      if (!row || !row.cells?.length) return row?.height ? `<row r="${r + 1}" ht="${row.height}" customHeight="1"/>` : '';
      const cells = row.cells.slice().sort((a, b) => a.c - b.c).map((cell) => {
        const ref = colName(cell.c) + (r + 1);
        const s = styleId(cell.style);
        const sAttr = s ? ` s="${s}"` : '';
        if (cell.v == null || cell.v === '') return `<c r="${ref}"${sAttr}/>`;
        if (typeof cell.v === 'number' && Number.isFinite(cell.v)) return `<c r="${ref}"${sAttr}><v>${cell.v}</v></c>`;
        if (typeof cell.v === 'boolean') return `<c r="${ref}"${sAttr} t="b"><v>${cell.v ? 1 : 0}</v></c>`;
        return `<c r="${ref}"${sAttr} t="s"><v>${sst(String(cell.v))}</v></c>`;
      }).join('');
      return `<row r="${r + 1}"${row.height ? ` ht="${row.height}" customHeight="1"` : ''}>${cells}</row>`;
    }).join('');
    const merges = (sh.merges || []).filter((m) => m.r2 > m.r1 || m.c2 > m.c1);
    const mergeXml = merges.length ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${colName(m.c1)}${m.r1 + 1}:${colName(m.c2)}${m.r2 + 1}"/>`).join('')}</mergeCells>` : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${rows}</sheetData>${mergeXml}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
  });

  const names = uniqueNames(sheets.map((s) => s.name));
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>${esc(creator)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>`,
    'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>${esc(creator)}</Application></Properties>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
  };
  sheetXml.forEach((x, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = x; });
  files['xl/sharedStrings.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${strings.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`;
  const nf = [...numFmts.entries()].map(([code, id]) => `<numFmt numFmtId="${id}" formatCode="${esc(code)}"/>`).join('');
  files['xl/styles.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${nf ? `<numFmts count="${numFmts.size}">${nf}</numFmts>` : ''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const enc = {};
  for (const [k, v] of Object.entries(files)) enc[k] = strToU8(v);
  return zipSync(enc, { level: 6 });
}

function uniqueNames(names) {
  const used = new Set();
  return names.map((n, i) => {
    let base = String(n || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31).trim() || `Sheet${i + 1}`;
    let name = base;
    let k = 2;
    while (used.has(name.toLowerCase())) name = `${base.slice(0, 28)} (${k++})`;
    used.add(name.toLowerCase());
    return name;
  });
}
