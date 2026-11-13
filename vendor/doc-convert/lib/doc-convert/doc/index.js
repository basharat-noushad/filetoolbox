// Word 97-2003 (.doc) -> .docx (a real Word file) and -> PDF (via the .docx renderer)
import {
  Document, Packer, Paragraph, TextRun, Tab, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, LineRuleType, TableLayoutType,
  SectionType, PageOrientation, TabStopType, HeightRule,
} from 'docx';
import { loadDoc } from './model.js';
import { docxToPdf } from '../docx2pdf/index.js';

const HIGHLIGHT = {
  '#FFFF00': 'yellow', '#00FF00': 'green', '#00FFFF': 'cyan', '#FF00FF': 'magenta', '#0000FF': 'blue', '#FF0000': 'red', '#000080': 'darkBlue',
  '#008080': 'darkCyan', '#008000': 'darkGreen', '#800080': 'darkMagenta', '#800000': 'darkRed', '#808000': 'darkYellow', '#808080': 'darkGray',
  '#C0C0C0': 'lightGray', '#000000': 'black',
};

function runs(p) {
  const out = [];
  const base = (r) => ({
    bold: r.bold, italics: r.italic, strike: r.strike, size: Math.round(r.size * 2), font: r.font, allCaps: r.caps || undefined,
    color: r.color ? r.color.slice(1) : undefined, underline: r.underline ? {} : undefined,
    highlight: r.highlight ? HIGHLIGHT[r.highlight] : undefined, superScript: r.vert === 'super' || undefined, subScript: r.vert === 'sub' || undefined,
  });
  if (p.marker) {
    const r0 = p.runs[0] || { size: 10, font: 'Times New Roman' };
    out.push(new TextRun({ ...base({ ...r0, bold: false, italic: false, underline: false, strike: false, highlight: null }), children: [p.marker, new Tab()] }));
  }
  for (const r of p.runs) {
    r.text.split('\n').forEach((line, i) => {
      const parts = line.split('\t');
      const children = [];
      parts.forEach((t, k) => { if (k) children.push(new Tab()); if (t) children.push(t); });
      out.push(new TextRun({ ...base(r), break: i ? 1 : undefined, children }));
    });
  }
  return out;
}

function paragraph(p, inCell = false) {
  const spacing = { before: p.before, after: p.after };
  if (p.line) {
    if (p.line.mult) spacing.line = Math.max(1, p.line.dya), (spacing.lineRule = LineRuleType.AUTO);
    else if (p.line.dya < 0) spacing.line = -p.line.dya, (spacing.lineRule = LineRuleType.EXACT);
    else if (p.line.dya > 0) spacing.line = p.line.dya, (spacing.lineRule = LineRuleType.AT_LEAST);
  }
  const indent = { left: Math.max(0, p.left), right: Math.max(0, p.right) };
  if (p.first > 0) indent.firstLine = p.first; else if (p.first < 0) indent.hanging = -p.first;
  const size = Math.round((p.runs[0]?.size || 10) * 2);
  return new Paragraph({
    alignment: { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, both: AlignmentType.JUSTIFIED }[p.align],
    spacing, indent, pageBreakBefore: !inCell && p.pageBreak ? true : undefined,
    tabStops: p.tabs?.length ? p.tabs.filter((t) => t.pos > 0).map((t) => ({ type: TabStopType[t.jc.toUpperCase()] || TabStopType.LEFT, position: t.pos, leader: t.leader || undefined })) : undefined,
    run: { size, font: p.runs[0]?.font },
    children: runs(p),
  });
}

// BRC80 line types -> docx border styles (the common ones; anything else draws as a single line)
const BRC = { 1: BorderStyle.SINGLE, 2: BorderStyle.THICK, 3: BorderStyle.DOUBLE, 6: BorderStyle.DOTTED, 7: BorderStyle.DASHED, 8: BorderStyle.DOT_DASH, 9: BorderStyle.DOT_DOT_DASH, 10: BorderStyle.TRIPLE };
function cellBorders(cb, none) {
  const one = (b) => (b ? { style: BRC[b.type] || BorderStyle.SINGLE, size: b.w, color: b.color.slice(1) } : none); // docx sizes are eighths of a point too
  return { top: one(cb.top), left: one(cb.left), bottom: one(cb.bottom), right: one(cb.right) };
}

function table(t) {
  const line = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const rows0 = t.rows.filter((r) => r.cells.length);
  // .doc rows each carry their own cell edges (rgdxaCenter); a docx table has one grid, so the grid is every edge
  // of every row and each cell spans the grid columns between its own edges
  const good = (r) => r.bounds?.length === r.cells.length + 1 && r.bounds.every((v, k) => !k || v > r.bounds[k - 1]);
  let edges = [...new Set(rows0.filter(good).flatMap((r) => r.bounds))].sort((a, b) => a - b);
  // edges a few twips apart are the same edge drawn twice
  edges = edges.filter((v, k) => !k || v - edges[k - 1] > 20);
  const snap = (v) => edges.reduce((best, e, k) => (Math.abs(e - v) < Math.abs(edges[best] - v) ? k : best), 0);
  if (edges.length < 2) {
    const cols = Math.max(...rows0.map((r) => r.cells.length), 1);
    edges = Array.from({ length: cols + 1 }, (_, k) => Math.round((k * 9000) / cols));
  }
  const grid = edges.slice(1).map((v, k) => v - edges[k]);
  const gap = rows0.find(good)?.gapHalf ?? 108;
  const rows = rows0.map((r) => {
    const ok = good(r);
    return new TableRow({
      height: r.height ? { value: Math.abs(r.height), rule: r.height < 0 ? HeightRule.EXACT : HeightRule.ATLEAST } : undefined,
      children: r.cells.map((cell, i) => {
        // cells of a row without usable edges share the grid evenly
        const a = ok ? snap(r.bounds[i]) : Math.round((i * grid.length) / r.cells.length);
        const b = ok ? snap(r.bounds[i + 1]) : Math.round(((i + 1) * grid.length) / r.cells.length);
        const span = Math.max(1, b - a);
        return new TableCell({
          width: { size: Math.max(200, edges[Math.min(a + span, edges.length - 1)] - edges[a]), type: WidthType.DXA },
          columnSpan: span > 1 ? span : undefined,
          borders: r.cellBorders?.[i] ? cellBorders(r.cellBorders[i], none) : r.borders ? { top: line, bottom: line, left: line, right: line } : { top: none, bottom: none, left: none, right: none },
          children: cell.length ? cell.map((p) => paragraph(p, true)) : [new Paragraph({})],
        });
      }),
    });
  });
  return new Table({
    rows, columnWidths: grid.map((w) => Math.max(1, w)), layout: TableLayoutType.FIXED,
    width: { size: edges[edges.length - 1] - edges[0], type: WidthType.DXA },
    // rgdxaCenter[0] is the first cell's edge relative to the margin; dxaGapHalf is each cell's text inset
    indent: { size: edges[0], type: WidthType.DXA }, margins: { left: gap, right: gap, marginUnitType: WidthType.DXA },
  });
}

/** .doc bytes -> .docx bytes */
export async function docToDocx(bytes, { limits } = {}) {
  const model = loadDoc(bytes, { limits });
  // one docx section per .doc section: each has its own page size and margins
  const secs = (model.sections || [model.page]).map(() => []);
  model.blocks.forEach((b, i) => {
    const children = secs[Math.min(b.sec || 0, secs.length - 1)];
    if (b.type !== 'table') { children.push(paragraph(b)); return; }
    if (!b.rows.some((r) => r.cells.length)) return;
    children.push(table(b));
    // two tables in a row would merge into one in the docx: keep them apart with an empty paragraph (Word has
    // one there too); otherwise the table's following paragraph comes straight after it, as in Word
    const next = model.blocks[i + 1];
    if (!next || next.type === 'table' || (next.sec || 0) !== (b.sec || 0)) children.push(new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
  });
  const BRK = [SectionType.CONTINUOUS, SectionType.NEXT_COLUMN, SectionType.NEXT_PAGE, SectionType.EVEN_PAGE, SectionType.ODD_PAGE];
  const sections = [];
  secs.forEach((children, i) => {
    if (!children.length && i) return; // empty section (e.g. a trailing mark): nothing to lay out
    if (!children.length) children.push(new Paragraph({}));
    const pg = (model.sections || [model.page])[i];
    sections.push({
      properties: {
        type: i ? BRK[pg.brk] ?? SectionType.NEXT_PAGE : undefined,
        // the docx library swaps width/height itself for landscape, so give it the portrait pair
        page: { size: pg.landscape && pg.w > pg.h ? { width: pg.h, height: pg.w, orientation: PageOrientation.LANDSCAPE } : { width: pg.w, height: pg.h }, margin: { top: pg.top, bottom: pg.bottom, left: pg.left, right: pg.right } },
      },
      children,
    });
  });
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 20 }, paragraph: { spacing: { after: 0, line: 240 } } } } },
    sections,
  });
  return Packer.pack(doc, 'uint8array');
}

/** .doc bytes -> PDF */
export async function docToPdf(bytes, opts = {}) {
  return docxToPdf(await docToDocx(bytes, opts), opts);
}
export { loadDoc };
