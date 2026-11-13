// Analysed model -> .docx bytes with the `docx` package (MIT; runs in Node and browsers).
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, Header, Footer, PageNumber, LevelFormat, HeadingLevel, LineRuleType, HeightRule,
  TableLayoutType, ExternalHyperlink, VerticalMergeType,
} from 'docx';

// the docx package rejects non-integers ("Invalid value 'NaN' specified"); damaged PDFs can produce NaN or
// Infinity geometry, so every number written goes through one of these (non-finite -> fallback)
const int = (v, d = 0) => (Number.isFinite(v) ? Math.round(v) : d);
const tw = (pt) => int(pt * 20);
const hp = (pt) => Math.max(2, int(pt * 2, 22));
const hex = (c) => String(c || '#000000').replace('#', '').toUpperCase();
const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, both: AlignmentType.JUSTIFIED };
const FMT = { decimal: LevelFormat.DECIMAL, lowerLetter: LevelFormat.LOWER_LETTER, upperLetter: LevelFormat.UPPER_LETTER, lowerRoman: LevelFormat.LOWER_ROMAN, upperRoman: LevelFormat.UPPER_ROMAN };

export async function writeDocx(model, { title } = {}) {
  const numbering = [];
  const refs = new Map();
  let instance = 0;
  let lastList = null;

  const runsToChildren = (runs) => runs.map((r) => {
    const base = {
      font: r.family, size: hp(r.size), bold: r.bold || undefined, italics: r.italic || undefined,
      color: hex(r.color) !== '000000' ? hex(r.color) : undefined, underline: r.underline ? {} : undefined, strike: r.strike || undefined,
      characterSpacing: r.charSpacing ? int(r.charSpacing * 20) : undefined,
    };
    if (r.parts) {
      return new TextRun({ ...base, children: r.parts.map((p) => (typeof p === 'string' ? p : p.field === 'PAGE' ? PageNumber.CURRENT : PageNumber.TOTAL_PAGES)) });
    }
    if (r.link) return new ExternalHyperlink({ link: r.link, children: [new TextRun({ ...base, text: r.text })] });
    return new TextRun({ ...base, text: r.text });
  });

  const listRef = (b) => {
    const m = b.marker;
    const key = `${m.kind}|${m.fmt || ''}|${m.suffix || ''}|${m.kind === 'number' ? m.num : ''}|${tw(b.indLeft)}|${tw(-b.firstLine)}`;
    if (!refs.has(key)) {
      const ref = `list${refs.size + 1}`;
      refs.set(key, ref);
      numbering.push({
        reference: ref,
        levels: [{
          level: 0,
          format: m.kind === 'bullet' ? LevelFormat.BULLET : FMT[m.fmt] || LevelFormat.DECIMAL,
          text: m.kind === 'bullet' ? '' : `%1${m.suffix || '.'}`, // Word's own bullet: Symbol U+F0B7
          start: m.kind === 'number' ? m.num : 1,
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: tw(b.indLeft), hanging: tw(-b.firstLine) } },
            run: m.kind === 'bullet' ? { font: 'Symbol' } : undefined,
          },
        }],
      });
    }
    return refs.get(key);
  };

  const para = (b) => {
    const opts = {
      children: runsToChildren(b.runs || []),
      alignment: ALIGN[b.align] || AlignmentType.LEFT,
      spacing: { before: tw(b.before || 0), after: 0, line: int(240 * (b.factor || 1), 240), lineRule: LineRuleType.AUTO },
      pageBreakBefore: b.pageBreakBefore || undefined,
    };
    if (b.marker) {
      const ref = listRef(b);
      const continues = lastList && lastList.ref === ref && lastList.kind === b.marker.kind;
      if (!continues || (b.marker.kind === 'number' && b.marker.num === 1 && lastList.lastNum >= 1)) instance++;
      lastList = { ref, kind: b.marker.kind, lastNum: b.marker.num || 0 };
      opts.numbering = { reference: ref, level: 0, instance };
      opts.indent = { left: tw(b.indLeft), hanging: tw(-b.firstLine) };
    } else {
      if (!b.inCell) lastList = null;
      if (b.indLeft || b.firstLine) {
        opts.indent = { left: tw(b.indLeft || 0) };
        if (b.firstLine > 0) opts.indent.firstLine = tw(b.firstLine);
        if (b.firstLine < 0) opts.indent.hanging = tw(-b.firstLine);
      }
    }
    if (b.heading === 'title') opts.heading = HeadingLevel.TITLE;
    else if (b.heading) opts.heading = HeadingLevel[`HEADING_${b.heading}`];
    if (b.borderBottom) {
      opts.border = { bottom: { style: BorderStyle.SINGLE, size: Math.max(2, int(b.borderBottom.w * 8, 2)), color: hex(b.borderBottom.color), space: int(b.borderBottom.space || 0) } };
    }
    return new Paragraph(opts);
  };

  const image = (b) => {
    const w = b.im.x1 - b.im.x0;
    const h = b.im.y1 - b.im.y0;
    const mid = (b.im.x0 + b.im.x1) / 2;
    const colMid = (model.margins.left + model.page.width - model.margins.right) / 2;
    const centered = Math.abs(mid - colMid) < 4;
    lastList = null;
    return new Paragraph({
      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      indent: centered ? undefined : { left: tw(Math.max(0, b.im.x0 - model.margins.left)) },
      spacing: { before: tw(b.before || 0), after: 0, line: 240, lineRule: LineRuleType.AUTO },
      pageBreakBefore: b.pageBreakBefore || undefined,
      children: [new ImageRun({ type: b.im.format === 'jpg' ? 'jpg' : 'png', data: b.im.png, transformation: { width: Math.max(1, int((w * 96) / 72, 1)), height: Math.max(1, int((h * 96) / 72, 1)) } })],
    });
  };

  const border = (s) => (s ? { style: BorderStyle.SINGLE, size: Math.max(2, int(s.w * 8, 2)), color: hex(s.color) } : { style: BorderStyle.NONE, size: 0, color: 'auto' });
  const table = (t) => {
    lastList = null;
    const total = t.colWidths.reduce((a, b) => a + b, 0);
    return new Table({
      width: { size: tw(total), type: WidthType.DXA },
      columnWidths: t.colWidths.map(tw),
      layout: TableLayoutType.FIXED,
      indent: { size: tw(t.indent), type: WidthType.DXA },
      margins: { left: tw(t.pad), right: tw(t.pad), top: 0, bottom: 0 },
      rows: t.rows.map((row) => new TableRow({
        height: { value: tw(row.height), rule: HeightRule.ATLEAST },
        children: row.cells.map((c) => new TableCell({
          width: { size: tw(c.x1 - c.x0), type: WidthType.DXA },
          columnSpan: c.span > 1 ? c.span : undefined,
          verticalMerge: c.vMerge === 'restart' ? VerticalMergeType.RESTART : c.vMerge === 'continue' ? VerticalMergeType.CONTINUE : undefined,
          shading: c.fill ? { fill: hex(c.fill), type: ShadingType.CLEAR, color: 'auto' } : undefined,
          borders: { top: border(c.borders.top), bottom: border(c.borders.bottom), left: border(c.borders.left), right: border(c.borders.right) },
          children: c.paras.length ? c.paras.map((p) => para({ ...p, inCell: true })) : [new Paragraph({ spacing: { after: 0 } })],
        })),
      })),
    });
  };

  const children = [];
  for (const b of model.blocks) {
    if (b.type === 'p') children.push(para(b));
    else if (b.type === 'image') children.push(image(b));
    else if (b.type === 'table') {
      // Word needs a paragraph to carry a page break before a table that starts a page
      if (b.firstOnPage && b.page > 0) children.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 0, line: 20, lineRule: LineRuleType.EXACT } }));
      else if (b.before > 1) children.push(new Paragraph({ spacing: { after: 0, line: tw(b.before), lineRule: LineRuleType.EXACT } }));
      children.push(table(b));
    }
  }
  if (!children.length || model.blocks[model.blocks.length - 1].type === 'table') children.push(new Paragraph({ spacing: { after: 0 } }));

  const M = model.margins;
  const doc = new Document({
    title: title || 'Converted document', creator: 'doc-convert spike',
    compatibility: { version: model.compatMode || 15 },
    styles: { default: { document: { run: { font: model.bodyFont.family, size: hp(model.bodyFont.size) } } } },
    numbering: { config: numbering },
    sections: [{
      properties: {
        page: {
          size: { width: tw(model.page.width), height: tw(model.page.height) },
          margin: { top: tw(M.top), right: tw(M.right), bottom: tw(M.bottom), left: tw(M.left), header: tw(M.header), footer: tw(M.footer) },
        },
      },
      headers: model.header.length ? { default: new Header({ children: model.header.map(para) }) } : undefined,
      footers: model.footer.length ? { default: new Footer({ children: model.footer.map(para) }) } : undefined,
      children,
    }],
  });
  return Packer.pack(doc, 'uint8array');
}
