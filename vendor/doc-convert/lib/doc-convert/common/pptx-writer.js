// Minimal .pptx writer (PresentationML) on fflate: one blank master/layout, absolutely positioned text
// boxes, pictures, rectangles and freeform (custom geometry) shapes. Positions are in points.
//
// writePptx({ width, height, title, slides: [{ items: [...] }] })
//   { t: 'text', x, y, w, h, rot? (degrees clockwise about the centre), anchor?, paras: [{ algn?, lnPct?, spcBefPts?, tabs?: [pt from box left], runs: [{ text (may contain \t), font?, size, bold?, italic?, u?, color?, link? }] }] }
//   { t: 'image', x, y, w, h, data (png/jpeg bytes), format: 'png'|'jpg' }
//   { t: 'path', d: [['M',x,y],['L',x,y],['C',x1,y1,x2,y2,x,y],['Q',x1,y1,x,y],['Z']], fill?, stroke?, lw?, evenOdd? }
//   { t: 'rect', x, y, w, h, fill?, stroke?, lw? }
import { zipSync, strToU8 } from 'fflate';

const EMU = 12700;
const emu = (v) => Math.round(v * EMU);
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');
const hex = (c) => String(c || '#000000').replace('#', '').toUpperCase().slice(0, 6).padEnd(6, '0');
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const rels = (list) => `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id, type, target, ext]) => `<Relationship Id="${id}" Type="${type.startsWith('http') ? type : `${REL}/${type}`}" Target="${esc(target)}"${ext ? ' TargetMode="External"' : ''}/>`).join('')}</Relationships>`;

const THEME = `${XML}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements>`
  + '<a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
  + '<a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2>'
  + '<a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6>'
  + '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'
  + '<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
  + '<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst>'
  + '<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
  + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
  + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst>'
  + '</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';

const GROUP = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const lvl = (n) => Array.from({ length: 9 }, (_, i) => `<a:lvl${i + 1}pPr marL="${i * 457200}" algn="l" defTabSz="914400"><a:defRPr sz="${n}"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${i + 1}pPr>`).join('');
const MASTER = `${XML}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GROUP}</p:spTree></p:cSld>`
  + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
  + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
  + `<p:txStyles><p:titleStyle>${lvl(4400)}</p:titleStyle><p:bodyStyle>${lvl(2800)}</p:bodyStyle><p:otherStyle>${lvl(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`;
const LAYOUT = `${XML}<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${GROUP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

function xfrm(x, y, w, h, rot = 0) {
  const r = Math.round((((rot % 360) + 360) % 360) * 60000);
  return `<a:xfrm${r ? ` rot="${r}"` : ''}><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${Math.max(1, emu(w))}" cy="${Math.max(1, emu(h))}"/></a:xfrm>`;
}
const solid = (c) => `<a:solidFill><a:srgbClr val="${hex(c)}"/></a:solidFill>`;
const lineXml = (stroke, lw) => (stroke ? `<a:ln w="${Math.max(1, emu(lw || 0.75))}">${solid(stroke)}</a:ln>` : '<a:ln><a:noFill/></a:ln>');

function runXml(r, linkId) {
  const attrs = [`lang="en-US"`, `sz="${Math.max(100, Math.min(400000, Math.round((r.size || 18) * 100)))}"`];
  if (r.bold) attrs.push('b="1"');
  if (r.italic) attrs.push('i="1"');
  if (r.u) attrs.push('u="sng"');
  if (r.baseline) attrs.push(`baseline="${Math.round(r.baseline * 100000)}"`);
  attrs.push('dirty="0"');
  const font = r.font ? `<a:latin typeface="${esc(r.font)}"/><a:cs typeface="${esc(r.font)}"/>` : '';
  const link = linkId ? `<a:hlinkClick r:id="${linkId}"/>` : '';
  return `<a:r><a:rPr ${attrs.join(' ')}>${solid(r.color)}${font}${link}</a:rPr><a:t>${esc(r.text)}</a:t></a:r>`;
}

function slideXml(items, addMedia, addLink) {
  let id = 2;
  const sp = [];
  for (const it of items) {
    const n = id++;
    if (it.t === 'text') {
      const paras = it.paras.map((p) => {
        const ppr = [];
        if (p.lnPct && Math.abs(p.lnPct - 1) > 0.001) ppr.push(`<a:lnSpc><a:spcPct val="${Math.round(p.lnPct * 100000)}"/></a:lnSpc>`);
        if (p.spcBefPts) ppr.push(`<a:spcBef><a:spcPts val="${Math.round(p.spcBefPts * 100)}"/></a:spcBef>`);
        if (p.bullet) {
          const b = p.bullet;
          if (b.color) ppr.push(`<a:buClr><a:srgbClr val="${hex(b.color)}"/></a:buClr>`);
          if (b.sizePct) ppr.push(`<a:buSzPct val="${Math.round(b.sizePct * 100000)}"/>`);
          if (b.font) ppr.push(`<a:buFont typeface="${esc(b.font)}"/>`);
          ppr.push(`<a:buChar char="${esc(b.char)}"/>`);
        } else ppr.push('<a:buNone/>');
        if (p.tabs?.length) ppr.push(`<a:tabLst>${p.tabs.map((x) => `<a:tab pos="${Math.max(0, emu(x))}" algn="l"/>`).join('')}</a:tabLst>`);
        const runs = p.runs.filter((r) => r.text).map((r) => runXml(r, r.link ? addLink(r.link) : null)).join('');
        const end = p.runs[p.runs.length - 1];
        return `<a:p><a:pPr marL="${emu(p.marL || 0)}" indent="${emu(p.indent || 0)}" algn="${p.algn || 'l'}">${ppr.join('')}</a:pPr>${runs}<a:endParaRPr lang="en-US" sz="${Math.round((end?.size || 18) * 100)}" dirty="0"/></a:p>`;
      }).join('');
      sp.push(`<p:sp><p:nvSpPr><p:cNvPr id="${n}" name="TextBox ${n}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>`
        + `<p:spPr>${xfrm(it.x, it.y, it.w, it.h, it.rot)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>`
        + `<p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="${it.anchor || 't'}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`);
    } else if (it.t === 'image') {
      const rid = addMedia(it.data, it.format === 'jpg' || it.format === 'jpeg' ? 'jpeg' : 'png');
      sp.push(`<p:pic><p:nvPicPr><p:cNvPr id="${n}" name="Picture ${n}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`
        + `<p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>`
        + `<p:spPr>${xfrm(it.x, it.y, it.w, it.h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
    } else if (it.t === 'rect') {
      sp.push(`<p:sp><p:nvSpPr><p:cNvPr id="${n}" name="Rectangle ${n}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>`
        + `<p:spPr>${xfrm(it.x, it.y, it.w, it.h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${it.fill ? solid(it.fill) : '<a:noFill/>'}${lineXml(it.stroke, it.lw)}</p:spPr></p:sp>`);
    } else if (it.t === 'path') {
      let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
      for (const c of it.d) for (let i = 1; i + 1 < c.length; i += 2) { x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]); y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]); }
      if (!Number.isFinite(x0)) { id--; continue; }
      const W = Math.max(1, emu(x1 - x0));
      const H = Math.max(1, emu(y1 - y0));
      const P = (x, y) => `<a:pt x="${emu(x - x0)}" y="${emu(y - y0)}"/>`;
      const cmds = it.d.map((c) => {
        if (c[0] === 'M') return `<a:moveTo>${P(c[1], c[2])}</a:moveTo>`;
        if (c[0] === 'L') return `<a:lnTo>${P(c[1], c[2])}</a:lnTo>`;
        if (c[0] === 'C') return `<a:cubicBezTo>${P(c[1], c[2])}${P(c[3], c[4])}${P(c[5], c[6])}</a:cubicBezTo>`;
        if (c[0] === 'Q') return `<a:quadBezTo>${P(c[1], c[2])}${P(c[3], c[4])}</a:quadBezTo>`;
        return '<a:close/>';
      }).join('');
      const pathAttrs = `w="${W}" h="${H}"${it.fill ? '' : ' fill="none"'}${it.stroke ? '' : ' stroke="0"'}`;
      sp.push(`<p:sp><p:nvSpPr><p:cNvPr id="${n}" name="Freeform ${n}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>`
        + `<p:spPr>${xfrm(x0, y0, x1 - x0, y1 - y0)}<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/>`
        + `<a:pathLst><a:path ${pathAttrs}>${cmds}</a:path></a:pathLst></a:custGeom>`
        + `${it.fill ? solid(it.fill) : '<a:noFill/>'}${lineXml(it.stroke, it.lw)}</p:spPr></p:sp>`);
    }
  }
  return `${XML}<p:sld ${NS}><p:cSld><p:spTree>${GROUP}${sp.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

export function writePptx({ width, height, slides, title = '', creator = 'doc-convert' }) {
  const files = {};
  const put = (path, text) => { files[path] = strToU8(text); };
  // PowerPoint accepts slide sizes from 1 to 56 inches
  const cx = Math.max(914400, Math.min(51206400, emu(width)));
  const cy = Math.max(914400, Math.min(51206400, emu(height)));
  let mediaNo = 0;
  const mediaTypes = new Set();
  const mediaFiles = new Map(); // bytes -> file name, shared by all slides
  slides.forEach((s, i) => {
    const relList = [['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']];
    const media = new Map();
    const links = new Map();
    const addMedia = (data, ext) => {
      if (media.has(data)) return media.get(data);
      let name = mediaFiles.get(data);
      if (!name) {
        name = `image${++mediaNo}.${ext}`;
        files[`ppt/media/${name}`] = data;
        mediaTypes.add(ext);
        mediaFiles.set(data, name);
      }
      const rid = `rId${relList.length + 1}`;
      relList.push([rid, 'image', `../media/${name}`]);
      media.set(data, rid);
      return rid;
    };
    const addLink = (url) => {
      if (links.has(url)) return links.get(url);
      const rid = `rId${relList.length + 1}`;
      relList.push([rid, 'hyperlink', url, true]);
      links.set(url, rid);
      return rid;
    };
    put(`ppt/slides/slide${i + 1}.xml`, slideXml(s.items, addMedia, addLink));
    put(`ppt/slides/_rels/slide${i + 1}.xml.rels`, rels(relList));
  });
  const n = slides.length;
  put('[Content_Types].xml', `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
    + (mediaTypes.has('png') ? '<Default Extension="png" ContentType="image/png"/>' : '')
    + (mediaTypes.has('jpeg') ? '<Default Extension="jpeg" ContentType="image/jpeg"/>' : '')
    + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
    + '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    + '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>'
    + '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>'
    + '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>'
    + Array.from({ length: n }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  put('_rels/.rels', rels([['rId1', 'officeDocument', 'ppt/presentation.xml'], ['rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml'], ['rId3', 'extended-properties', 'docProps/app.xml']]));
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  put('docProps/core.xml', `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>${esc(creator)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  put('docProps/app.xml', `${XML}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>${esc(creator)}</Application><Slides>${n}</Slides></Properties>`);
  const sldIds = Array.from({ length: n }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`).join('');
  put('ppt/presentation.xml', `${XML}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>`
    + `${n ? `<p:sldIdLst>${sldIds}</p:sldIdLst>` : ''}<p:sldSz cx="${cx}" cy="${cy}"/><p:notesSz cx="6858000" cy="9144000"/>`
    + `<p:defaultTextStyle>${lvl(1800)}</p:defaultTextStyle></p:presentation>`);
  put('ppt/_rels/presentation.xml.rels', rels([
    ['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rId2', 'theme', 'theme/theme1.xml'],
    ...Array.from({ length: n }, (_, i) => [`rId${i + 3}`, 'slide', `slides/slide${i + 1}.xml`]),
    [`rId${n + 3}`, 'presProps', 'presProps.xml'], [`rId${n + 4}`, 'viewProps', 'viewProps.xml'], [`rId${n + 5}`, 'tableStyles', 'tableStyles.xml'],
  ]));
  put('ppt/presProps.xml', `${XML}<p:presentationPr ${NS}/>`);
  put('ppt/viewProps.xml', `${XML}<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`);
  put('ppt/tableStyles.xml', `${XML}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`);
  put('ppt/slideMasters/slideMaster1.xml', MASTER);
  put('ppt/slideMasters/_rels/slideMaster1.xml.rels', rels([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']]));
  put('ppt/slideLayouts/slideLayout1.xml', LAYOUT);
  put('ppt/slideLayouts/_rels/slideLayout1.xml.rels', rels([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]));
  put('ppt/theme/theme1.xml', THEME);
  // images are already compressed; deflating them again only costs time
  const zipped = {};
  for (const [k, v] of Object.entries(files)) zipped[k] = k.startsWith('ppt/media/') ? [v, { level: 0 }] : v;
  return zipSync(zipped, { level: 6 });
}
