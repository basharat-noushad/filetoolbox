const fs=require('node:fs'), ts=require('typescript')
const handling='Most tools process files in your browser. Server-based tools send files to a processing service and show a notice before submission. File-size and device limits apply.'
const about='PDF and Image + offers free PDF and image tools for merging, converting, compressing and editing files. No registration is required. Most tools process files locally; server-based tools are labeled.'
const free='The tools are free to use without registration. File-size, browser-memory and service limits apply. Output files have no automatic site branding.'
const alt='You can use PDF and Image + for common PDF and image tasks without registration. Check the selected tool for supported formats, file limits and whether it requires server processing.'
for(const file of ['src/app/about/page.tsx','src/app/help/page.tsx']) {
 let s=fs.readFileSync(file,'utf8'), ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[]
 function visit(n) {
  if(ts.isObjectLiteralExpression(n)) {
   const props=n.properties, q=props.find(p=>['q','name'].includes(p.name?.getText(ast)))?.initializer
   const question=q && ts.isStringLiteral(q)?q.text:''
   let answer
   if(question==='What is PDF and Image +?') answer=about
   else if(/^Is PDF and Image \+.*free/.test(question)) answer=free
   else if(/alternative to (ILovePDF|Smallpdf)/.test(question)) answer=alt
   else if(/files private and secure|protect user privacy/.test(question)) answer=handling
   if(answer) {
    const a=props.find(p=>p.name?.getText(ast)==='a')
    const accepted=props.find(p=>p.name?.getText(ast)==='acceptedAnswer')?.initializer
    const text=accepted && ts.isObjectLiteralExpression(accepted)?accepted.properties.find(p=>p.name?.getText(ast)==='text'):undefined
    const target=a?.initializer||text?.initializer
    if(target) edits.push([target.getStart(ast),target.end,JSON.stringify(answer)])
    if(question.includes('with file and device limits apply')) edits.push([q.getStart(ast),q.end,JSON.stringify('Is PDF and Image + free to use?')])
   }
  }
  ts.forEachChild(n,visit)
 }
 visit(ast)
 for(const[a,b,v]of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,a)+v+s.slice(b)
 s=s.replaceAll('with file and device limits apply','with stated file and device limits').replaceAll('no paywalls, no usage limits','no registration, with stated file limits')
 fs.writeFileSync(file,s)
}
for(const slug of ['excel-to-pdf','ppt-to-pdf']) {
 const file=`src/app/(pdf)/${slug}/page.tsx`
 let s=fs.readFileSync(file,'utf8'), ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[]
 function visit(n){if(ts.isStringLiteral(n)&&/immediately deleted/.test(n.text))edits.push([n.getStart(ast),n.end,JSON.stringify('Your file is sent to a processing service. Temporary storage and retention depend on the configured service. Review the privacy policy before uploading sensitive files.')]);ts.forEachChild(n,visit)}
 visit(ast); for(const[a,b,v]of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,a)+v+s.slice(b);fs.writeFileSync(file,s)
}
// Preserve the existing reference files, correcting specific outdated claims.
for(const file of ['public/llms.txt','public/llms-full.txt']) {
 let s=fs.readFileSync(file,'utf8')
 s=s.replace('Last updated: 2026-08-31','Last updated: 2026-09-29')
 s=s.replace('All tools run client-side in the browser — files never leave the user\'s device.','Most tools run locally in the browser; tools labeled Server processing upload files to a processing service.')
 s=s.replace('All processing happens in the browser. Files are never uploaded to any server (except for server-side tools like PDF-to-Word conversion, where files are immediately deleted after processing).',handling)
 s=s.replace('PDF and Image + is a browser-based tool platform that lets anyone process PDF and image files for free, without creating an account or uploading files to a server. All tools run using client-side JavaScript (pdf-lib, PDF.js, Canvas API, Tesseract.js), meaning:',about)
 s=s.replace('2. No user data is stored or collected','2. Analytics and advertising are described in the privacy policy').replace('3. No file size limits are imposed by the platform','3. File-size and device limits apply; most pickers accept files up to 50 MB').replace('4. No watermarks are added to output files','4. No automatic site branding is added to output files')
 const a=s.indexOf('## Differentiators vs. Competitors'), b=s.indexOf('## Complete Tool List with Descriptions')
 if(a>=0&&b>a)s=s.slice(0,a)+'## File handling\n\n'+handling+' Competitor limits are not maintained in this reference.\n\n'+s.slice(b)
 s=s.replace('Reduces PDF file size by resampling embedded images. Offers Low, Medium, and High compression levels. Text and vector content is never affected. Typical reduction: 40–80% for image-heavy PDFs.','Rewrites PDF structure using object streams without downsampling images. Savings vary. Returns the original if optimization does not reduce file size. One PDF up to 50 MB.')
 s=s.replace('AI-powered image upscaler — increases resolution up to 4x. Uses Real-ESRGAN.','Enlarges image dimensions up to 4x using browser interpolation. No AI reconstruction or recovery of missing detail.').replace('AI image upscaler (up to 4x)','Browser image enlargement (up to 4x)').replace('How to Upscale an Image Without Losing Quality (Free AI Upscaler)','How to Upscale an Image: Larger Dimensions, Realistic Detail')
 s=s.replace('processed immediately and never stored','sent to the configured processing service; retention depends on that service').replace('processed, and immediately deleted — never stored','handled by the configured service; no immediate-deletion claim is made here')
 s=s.replace('AI-powered background removal. Detects the subject (person, product, animal) and removes the background, outputting a transparent PNG. Browser-based.','Background removal sends the image through the site API to remove.bg and returns a PNG. Requires a configured service key.')
 fs.writeFileSync(file,s)
}
let privacy=fs.readFileSync('src/app/privacy/page.tsx','utf8').replace('Server tools include PDF to Word','Remove Background forwards the image to remove.bg through our API. Other server tools use the configured document-processing services. Server tools include PDF to Word')
fs.writeFileSync('src/app/privacy/page.tsx',privacy)
// Keep automated content work grounded in the implementation and existing keyword map.
let workflow=fs.readFileSync('.github/workflows/blog-post.yml','utf8')
workflow=workflow.replace('1,200–2,000 words of genuinely useful content targeting the keyword.','Use only the length needed to explain the task accurately. No minimum word count.\n               - Read seo/KEYWORD_RESEARCH_2026-09-29.md and seo/keyword-map.csv first. Improve an existing page when it already satisfies the intent; do not create near-duplicate keyword pages.\n               - Verify every capability, file limit, processing location and download step against the tool client and processing code. Never invent test results or savings percentages.\n               - Do not claim AI upscaling, batch support, immediate server deletion or unlimited files unless the implementation and deployment evidence support it.')
fs.writeFileSync('.github/workflows/blog-post.yml',workflow)
console.log('Polished claims and aligned existing crawler reference files.')
