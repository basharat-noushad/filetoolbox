const fs = require('node:fs')
const ts = require('typescript')
function edit(file, pairs) {
  let s=fs.readFileSync(file,'utf8')
  for(const [a,b] of pairs) { if(!s.includes(a)) throw new Error(`Missing ${file}: ${a.slice(0,55)}`); s=s.split(a).join(b) }
  fs.writeFileSync(file,s)
}
edit('src/lib/toolsRegistry.ts', [
  ['Upscale Image (AI)','Upscale Image'],
  ['Upscale images up to 4x using AI. Enhance resolution without losing quality.','Enlarge image dimensions by 2x, 3x or 4x using browser interpolation. Export PNG; enlargement does not recover missing detail.'],
  ["'ai image upscaler'","'enlarge image online'"],
  ['Preserves formatting perfectly.','Review the converted layout before sharing.'],
])
edit('src/app/(image)/upscale-image/page.tsx', [
  ['Upscale Image Online Free — AI Image Upscaler 4x','Upscale Image Online Free — Enlarge to 2x, 3x or 4x'],
  ['Increase image size without losing quality using high-quality interpolation.','Enlarge pixel dimensions using browser interpolation; missing detail cannot be recovered.'],
  ['high-quality bicubic interpolation','browser interpolation'],
  ['High-quality bicubic interpolation.','Browser interpolation; no AI reconstruction.'],
  ['File size increases proportionally.','File size depends on image content and encoding.'],
])
edit('src/app/(image)/upscale-image/UpscaleImageClient.tsx', [['Uses high-quality bicubic interpolation. AI upscaling (Real-ESRGAN) requires API configuration.','Enlarges pixel dimensions using browser interpolation. This does not reconstruct missing detail or use an AI model.']])
edit('src/app/(pdf)/merge-pdf/page.tsx', [
  ['No registration, no file size limit.','No registration. Up to 20 files, 50 MB each.'],
  ['no file size limits.','up to 50 MB per file, subject to device memory.'],
  ['your combined PDF will download automatically.','then click Download to save your combined PDF.'],
  ['Yes, completely safe.','Merging happens locally.'],
  ['No. Merging preserves all content, formatting, images, fonts, and quality exactly as in the original files.','Copied pages keep their dimensions and content. Check forms, bookmarks and signatures separately; merging may affect document-level features.'],
])
edit('src/app/page.tsx', [
  ['Files processed in your browser.','Most tools process files in your browser; some use a server.'],
  ['Your files never leave your browser. No sign-up required.','Most tools process files locally; some conversions use a server. No sign-up required.'],
  ["label: 'Secure & Private', sub: 'Files never uploaded'","label: 'Clear file handling', sub: 'Processing details on each tool'"],
  ['with no registration and no file size limits.','with no registration. File and device limits apply.'],
  ['Your files never leave your device — there are no server uploads,','These tools keep files on your device. Server-based tools are labeled separately;'],
  ['No account. No credit card. No limits. Just pick a tool and go.','No account. No credit card. Pick a tool and check its file requirements.'],
])
edit('src/components/layout/Footer.tsx', [
  ["{ value: '100%', label: 'Browser-based', Icon: Cpu }","{ value: 'Most', label: 'Tools run locally', Icon: Cpu }"],
  ['Files never leave your device','Processing details on each tool'],
  ['No watermarks added ever','No automatic branding on output'],
])
edit('src/app/layout.tsx', [
  ['Free online PDF and image tools. No sign-up, no watermarks, 100% private.','Free PDF and image tools without registration. Most run locally; server tools show a processing notice.'],
  ["'No watermarks on output files'","'No automatic branding on output files'"],
].filter(([a])=>fs.readFileSync('src/app/layout.tsx','utf8').includes(a)))
edit('src/components/seo/StructuredData.tsx', [["'No watermarks on output files'","'No automatic branding on output files'"]])
// Remove unverified absolute claims from informational copy and its matching schema.
const handling='Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files.'
for(const file of ['src/app/about/page.tsx','src/app/help/page.tsx']) {
  let s=fs.readFileSync(file,'utf8')
  const ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  const changes=[]
  function visit(n) {
    if(ts.isStringLiteral(n) && /all tools run in your browser|every tool runs in your browser|immediately deleted|never stored|never viewed by any person|delete your file from memory|files are never uploaded to any server|no file uploads|all browser-based tools process/i.test(n.text)) {
      changes.push([n.getStart(ast),n.end,JSON.stringify(handling)])
    } else if(ts.isStringLiteral(n) && /no usage limits|no task limits|no daily limits|no limits/.test(n.text)) {
      changes.push([n.getStart(ast),n.end,JSON.stringify(n.text.replace(/no usage limits|no task limits|no daily limits|no limits/g,'file and device limits apply').replace('Smallpdf limits free users to 2 tasks per day; PDF and Image + has no such restrictions.','Check current tool requirements before processing.'))])
    }
    ts.forEachChild(n,visit)
  }
  visit(ast)
  for(const [a,b,v] of changes.sort((a,b)=>b[0]-a[0])) s=s.slice(0,a)+v+s.slice(b)
  fs.writeFileSync(file,s)
}
edit('src/app/about/page.tsx', [
  ['No accounts. No uploads. No limits.','No account required. File-handling details and limits are shown on each tool.'],
  ["{ value: '0',    label: 'Files uploaded to servers' }","{ value: 'Clear', label: 'Processing notices' }"],
  ["{ value: '100%', label: 'Browser-based processing' }","{ value: 'Most', label: 'Tools run locally' }"],
  ['no file size caps, and no watermarks on downloaded files.','visible file requirements, and no automatic branding on downloaded files.'],
  ['immediately and permanently deleted — never stored, never accessed by humans.','handled by the configured service. Review file-handling information before sending sensitive documents.'],
])
edit('src/app/privacy/page.tsx', [
  ['Your files never leave your browser. We collect no personal information. Full details on data handling and analytics.','Learn which tools process files locally, which use a server, and how analytics and advertising are used.'],
  ['Your files never leave your browser. PDF and Image + collects no personal information. Full privacy policy.','File processing, server-based tools, analytics and advertising on PDF and Image +.'],
  ['Files are processed locally in the browser. No personal data collected.','Information about local and server file processing, analytics and advertising.'],
  ['The short version: your files never leave your device. We do not collect, store, or process any of the documents or images you work with on this site.','Most tools process selected files in your browser. Some tools send files to a processing service. The site also uses analytics and advertising services described below.'],
  ['All PDF and image processing on PDF and Image + happens locally in your browser using JavaScript. When you upload a file to a tool, it is loaded into your browser\'s memory and processed there. No file data is transmitted to our servers.','Tools labeled Browser processing load the selected file into browser memory and process it locally. Tools labeled Server processing send the selected file to a processing service.'],
  ['Exception: a small number of tools that require server-side conversion (such as PDF to Word, Word to PDF, PDF to Excel, and PDF to PowerPoint) send your file to a self-hosted processing server. In these cases:','Server tools include PDF to Word, Word to PDF, PDF to Excel, Excel to PDF, PDF to PowerPoint, PowerPoint to PDF, PDF to PDF/A, Protect PDF, Unlock PDF and Remove Background. In these cases:'],
  ['• The file is never stored on disk and is deleted from server memory immediately after conversion.\n• No logs of the file content are kept.','• Temporary storage, retention and logging depend on the deployed processing service; this page does not promise immediate deletion or memory-only handling.\n• Do not submit sensitive files unless the processing arrangement meets your requirements.'],
])
// Every non-blog page that defines its own Open Graph object gets a fallback image.
for(const route of ['', 'about','contact','help','privacy','terms','blog']) {
  const file=`src/app/${route ? route+'/' : ''}page.tsx`
  let s=fs.readFileSync(file,'utf8')
  const ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  let target
  for(const n of ast.statements) if(ts.isVariableStatement(n)) for(const d of n.declarationList.declarations) if(d.name.getText(ast)==='metadata') target=d.initializer
  if(!target || !ts.isObjectLiteralExpression(target)) throw new Error(`Unexpected static metadata ${file}`)
  s=s.slice(0,target.getStart(ast))+`withSocialMetadata(${s.slice(target.getStart(ast),target.end)}, '/${route}')`+s.slice(target.end)
  fs.writeFileSync(file,"import { withSocialMetadata } from '@/lib/seo'\n"+s)
}
edit('src/app/blog/[slug]/page.tsx', [
  ["  const relatedPosts = BLOG_POSTS\n    .filter(p => p.slug !== slug && p.category === post.category)\n    .slice(0, 3)","  const relatedPosts = BLOG_POSTS\n    .filter(p => p.slug !== slug && p.category === post.category)\n    .sort((a, b) => {\n      const score = (p: typeof post) => Number(p.relatedTool === post.relatedTool) * 3 + Number(post.relatedTools.includes(p.relatedTool)) * 2 + Number(p.relatedTools.includes(post.relatedTool))\n      return score(b) - score(a)\n    })\n    .slice(0, 3)"],
  ['dateTime={post.datePublished}','dateTime={post.dateModified}'],
  ["{new Date(post.datePublished).toLocaleDateString", "Updated {new Date(post.dateModified).toLocaleDateString"],
  ["    articleSection: post.category,", "    articleSection: post.category,\n    image: `${postUrl}/opengraph-image`,"],
])
// Apply a consistent API crawl exclusion to existing explicit crawler rules.
edit('src/app/robots.ts', [["        allow: '/',\n      },", "        allow: '/',\n        disallow: ['/api/'],\n      },"]])
console.log('Updated shared claims, static previews, article links and crawler rules.')
