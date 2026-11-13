// Built-in PowerPoint table styles that files reference by GUID without embedding a definition
// (python-pptx and other generators use the default "Medium Style 2 - Accent 1"). Files saved by
// PowerPoint carry the definitions of the styles they use in ppt/tableStyles.xml, which takes priority.
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
const ln = (w, clr) => `<a:ln w="${w}" cmpd="sng"><a:solidFill><a:schemeClr val="${clr}"/></a:solidFill></a:ln>`;
const noLn = '<a:ln><a:noFill/></a:ln>';
const tx = (clr, bold) => `<a:tcTxStyle${bold ? ' b="on"' : ''}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${clr}"/></a:tcTxStyle>`;
const fill = (clr, tint) => `<a:fill><a:solidFill><a:schemeClr val="${clr}">${tint ? `<a:tint val="${tint}"/>` : ''}</a:schemeClr></a:solidFill></a:fill>`;

function mediumStyle2(id, accent) {
  const all = ['left', 'right', 'top', 'bottom', 'insideH', 'insideV'].map((k) => `<a:${k}>${ln(12700, 'lt1')}</a:${k}>`).join('');
  const strong = `${tx('lt1', true)}<a:tcStyle><a:tcBdr/>${fill(accent)}</a:tcStyle>`;
  return `<a:tblStyle ${NS} styleId="${id}">`
    + `<a:wholeTbl>${tx('dk1')}<a:tcStyle><a:tcBdr>${all}</a:tcBdr>${fill(accent, 20000)}</a:tcStyle></a:wholeTbl>`
    + `<a:band1H><a:tcStyle><a:tcBdr/>${fill(accent, 40000)}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H>`
    + `<a:band1V><a:tcStyle><a:tcBdr/>${fill(accent, 40000)}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V>`
    + `<a:lastCol>${strong}</a:lastCol><a:firstCol>${strong}</a:firstCol>`
    + `<a:lastRow>${tx('lt1', true)}<a:tcStyle><a:tcBdr><a:top>${ln(38100, 'lt1')}</a:top></a:tcBdr>${fill(accent)}</a:tcStyle></a:lastRow>`
    + `<a:firstRow>${tx('lt1', true)}<a:tcStyle><a:tcBdr><a:bottom>${ln(38100, 'lt1')}</a:bottom></a:tcBdr>${fill(accent)}</a:tcStyle></a:firstRow>`
    + '</a:tblStyle>';
}
function grid(id, withLines) {
  const b = ['left', 'right', 'top', 'bottom', 'insideH', 'insideV'].map((k) => `<a:${k}>${withLines ? ln(12700, 'tx1') : noLn}</a:${k}>`).join('');
  return `<a:tblStyle ${NS} styleId="${id}"><a:wholeTbl>${tx('tx1')}<a:tcStyle><a:tcBdr>${b}</a:tcBdr><a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}

const MEDIUM2 = {
  '{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}': 'dk1',
  '{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}': 'accent1',
  '{21E4AEA4-8DFA-4A89-87EB-49C32662AFE8}': 'accent2',
  '{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}': 'accent3',
  '{00A15C55-8517-42AA-B614-E9B94910E393}': 'accent4',
  '{7DF18680-E054-41AD-8BC1-D1AEF772440D}': 'accent5',
  '{93296810-A885-4BE3-A3E7-6D5BEEA58F35}': 'accent6',
};

/** XML for a built-in style id; unknown ids get a plain thin grid so the table stays readable */
export function builtinTableStyle(id) {
  const key = String(id).toUpperCase();
  if (MEDIUM2[key]) return mediumStyle2(key, MEDIUM2[key]);
  if (key === '{2D5ABB26-0587-4C30-8999-92F81FD0307C}') return grid(key, false);
  return grid(key, true);
}
