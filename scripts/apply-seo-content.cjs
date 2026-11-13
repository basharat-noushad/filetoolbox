// One-time, syntax-aware migration; preserves unrelated objects and user edits.
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }
function write(p, s) { fs.writeFileSync(path.join(root, p), s) }
function replace(p, from, to) { const s = read(p); if (!s.includes(from)) throw new Error(`Missing text in ${p}: ${from.slice(0,60)}`); write(p, s.replace(from,to)) }
const profiles = {
  'add-watermark-pdf': {
    title: 'Add Watermark to PDF Free — Draft & Confidential Text',
    description: 'Add a text watermark to every PDF page for free. Mark drafts or confidential copies, adjust opacity and rotation, then download. No file upload needed.',
    intro: 'Add a watermark to PDF pages with your own text. Mark a draft or confidential copy, choose opacity, font size and rotation, and download a new PDF.',
    keywords: ['add watermark pdf', 'add watermark to pdf', 'watermark pdf', 'add draft watermark pdf'],
    steps: ['Select one PDF up to 50 MB. Keep the original if it is signed or needs to remain unchanged.', 'Enter short text such as DRAFT or CONFIDENTIAL. Adjust opacity, font size and rotation; the text is added to every page.', 'Click Add Watermark, then use Download to save watermarked.pdf. Open the result and check every page.'],
    faqs: [
      ['How do I add a draft watermark to a PDF?', 'Select your PDF, replace the text with DRAFT, and choose a low opacity so the content remains readable. Click Add Watermark and download the new copy.'],
      ['Can I watermark only selected pages or upload a logo?', 'This tool adds text to every page. It does not support a logo watermark or page selection. Use short text; long labels can run outside the page.'],
      ['Does a watermark stop someone editing or copying my PDF?', 'No. A watermark is a visible label, not an access control or a digital signature. A PDF editor may remove it. Editing an already signed PDF can affect its signature validity.'],
      ['Is my PDF uploaded, and what is the file limit?', 'Watermarking runs in your browser without uploading the PDF for processing. Select one file up to 50 MB; large documents may also be limited by device memory.'],
      ['Which watermark characters can I use?', 'Use short text supported by the built-in Helvetica font, such as DRAFT, CONFIDENTIAL or a Latin-script name. Some scripts and emoji are not supported.'],
    ],
  },
  'add-watermark-image': {
    title: 'Add Watermark to JPG, PNG & WebP Online Free',
    description: 'Add a text watermark to JPG, PNG or WebP photos free in your browser. Choose a corner or center position and adjust opacity. One image up to 50 MB.',
    intro: 'Add a watermark to JPG, PNG or WebP images using your name, copyright notice or brand text. Choose one of five positions and adjust transparency.',
    keywords: ['add watermark to jpg', 'add watermark photo', 'add watermark to photo', 'photo watermark online', 'image watermark text'],
    steps: ['Select one JPG, PNG or WebP image up to 50 MB.', 'Enter your watermark text, choose the center or a corner, and adjust opacity from 10% to 90%.', 'Click Add Watermark, then Download to save a copy. Check that the text fits and remains legible.'],
    faqs: [
      ['How do I add a watermark to a JPG?', 'Select your JPG, type your name or copyright text, choose its position and opacity, then click Add Watermark. Download the result; your original file is unchanged.'],
      ['Can I add a logo or watermark photos in bulk?', 'This tool adds text to one image at a time. It does not upload logo files or apply watermarks to a batch. Font size is selected automatically from the image width.'],
      ['Does adding a watermark reduce image quality?', 'The image keeps its pixel dimensions, but it is re-encoded when exported. JPG and WebP output may lose some detail. Compare the downloaded copy with the original before publishing.'],
      ['Are my photos uploaded to a server?', 'No file upload is needed for this tool. Watermarking happens in your browser. The site separately uses analytics and advertising as described in the privacy policy.'],
      ['Can someone remove the watermark?', 'A visible watermark can help identify your work, but it cannot prevent cropping, retouching or copying. Keep the original and avoid putting the mark over important detail.'],
    ],
  },
  'heic-to-jpg': {
    title: 'HEIC to JPG Converter Free — Convert iPhone Photos',
    description: 'Convert a HEIC or HEIF photo to JPG free in your browser. Make iPhone photos easier to share on Windows and other devices. One file up to 50 MB.',
    intro: 'Convert HEIC to JPG to make iPhone photos easier to share, attach and open on other devices. Select one HEIC or HEIF file and download a JPEG copy.',
    keywords: ['heic to jpg', 'heic to jpg converter', 'convert heic to jpg online', 'heic to jpg windows'],
    steps: ['Select one .heic or .heif file up to 50 MB. Use the original file rather than a screenshot or a renamed extension.', 'Click Convert to JPG. Keep this tab open while your browser decodes the photo.', 'Click Download to save converted.jpg. Check orientation and quality before deleting or replacing any original.'],
    faqs: [
      ['How can I convert HEIC to JPG on Windows?', 'Open this converter in a current browser on Windows, select the HEIC file, click Convert to JPG and download the result. You do not need a separate desktop converter for this workflow.'],
      ['Does this converter upload my iPhone photos?', 'The HEIC decoder runs in your browser. Your selected file is not uploaded for conversion. Large photos can take more time and memory on mobile devices.'],
      ['Can I batch convert HEIC files to JPG?', 'The current tool converts one file at a time, up to 50 MB. For a file containing multiple images, it returns the first converted image. It does not create a batch ZIP.'],
      ['Will my photo lose quality or metadata?', 'JPG is lossy and this tool exports at a quality setting of 92%. Do not rely on preservation of EXIF, camera metadata, HDR information or auxiliary images. Keep the HEIC original.'],
      ['Why does my HEIC file fail to convert?', 'It may be damaged, use an unsupported encoding, or exceed your browser memory. Try a smaller original file in a current desktop browser. Changing the extension to .jpg does not convert the image.'],
    ],
  },
  'compress-pdf': {
    title: 'Compress PDF Online Free — Reduce PDF File Size',
    description: 'Try lossless PDF structure compression online for free. Keep text and images intact, compare file sizes and download the smaller result. Up to 50 MB.',
    intro: 'Compress PDF file structure in your browser without downsampling images. Size savings depend on the original; already optimized or scanned PDFs may not get smaller.',
    keywords: ['compress pdf', 'compress pdf file size', 'compress pdf for email', 'compress pdf lossless'],
    steps: ['Select one PDF up to 50 MB. Keep your original document, especially if it contains signatures.', 'Click Compress PDF to rewrite the PDF structure using object streams. Text and images are not rasterized or downsampled.', 'Check the reported size change and download the result. If there is no reduction, the tool returns your original file.'],
    faqs: [
      ['Can I compress a PDF to 200 KB, 500 KB or 1 MB?', 'This tool cannot guarantee a target size. It optimizes PDF structure rather than resizing embedded images. For a strict upload limit, remove unnecessary pages or split the document if the recipient allows separate files.'],
      ['Does this PDF compressor reduce image quality?', 'It does not downsample images or turn text into pictures. It rewrites the PDF structure with object streams. Keep the original: rewriting a PDF may affect digital signatures or specialized document features.'],
      ['Why is my PDF not getting smaller?', 'Many PDFs already use compressed structures, and scans are often dominated by image data. The tool keeps the original if rewriting does not reduce its size. There is no fixed percentage saving.'],
      ['What is the file size limit?', 'You can select one PDF up to 50 MB. Browser memory can impose a practical limit on complex files. Processing happens locally without uploading the PDF.'],
      ['Can I compress a password-protected PDF?', 'Unlock a PDF you own and are authorized to modify before compressing it. The Unlock PDF tool uses a processing server, unlike this browser-based compressor.'],
    ],
  },
}
for (const [slug,p] of Object.entries(profiles)) {
  const category = ['heic-to-jpg','add-watermark-image'].includes(slug) ? 'image' : 'pdf'
  const file = `src/app/(${category})/${slug}/page.tsx`
  const original = read(file)
  const client = original.match(/import \{ (\w+Client) \}/)[1]
  write(file, `import type { Metadata } from 'next'\nimport { getToolBySlug } from '@/lib/toolsRegistry'\nimport { withSocialMetadata } from '@/lib/seo'\nimport { ToolLayout } from '@/components/tools/ToolLayout'\nimport { ${client} } from './${client}'\n\nconst tool = getToolBySlug('${slug}')!\n\nexport async function generateMetadata(): Promise<Metadata> {\n  return withSocialMetadata({\n    title: ${JSON.stringify(p.title)},\n    description: ${JSON.stringify(p.description)},\n    keywords: tool.keywords,\n    alternates: { canonical: '/${slug}' },\n  }, '/${slug}')\n}\n\nconst HOW_TO_STEPS = ${JSON.stringify(p.steps,null,2)}\nconst FAQS = ${JSON.stringify(p.faqs.map(([q,a])=>({q,a})),null,2)}\n\nexport default function Page() {\n  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><${client} /></ToolLayout>\n}\n`)
}
// Update exact registry object property values with the TypeScript parser.
let registry = read('src/lib/toolsRegistry.ts')
const ast = ts.createSourceFile('registry.ts',registry,ts.ScriptTarget.Latest,true)
const edits=[]
function visit(n) {
  if(ts.isObjectLiteralExpression(n)) {
    const slugProp=n.properties.find(p=>p.name?.getText(ast)==='slug')
    const slug=slugProp?.initializer?.text
    if(profiles[slug]) for(const p of n.properties) {
      const key=p.name?.getText(ast)
      if(key==='description'||key==='keywords') edits.push([p.initializer.getStart(ast),p.initializer.end,JSON.stringify(key==='description'?profiles[slug].intro:profiles[slug].keywords)])
    }
  }
  ts.forEachChild(n,visit)
}
visit(ast)
for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0])) registry=registry.slice(0,start)+text+registry.slice(end)
write('src/lib/toolsRegistry.ts',registry)
// Fill shared preview fields without discarding existing per-page metadata.
for(const category of ['pdf','image']) for(const slug of fs.readdirSync(path.join(root,`src/app/(${category})`))) {
  const file=`src/app/(${category})/${slug}/page.tsx`
  if(!fs.existsSync(path.join(root,file))) continue
  let s=read(file)
  if(s.includes('withSocialMetadata')) continue
  const ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='generateMetadata')
  const ret=fn?.body?.statements.find(ts.isReturnStatement)
  if(!ret?.expression || !ts.isObjectLiteralExpression(ret.expression)) throw new Error(`Unexpected metadata: ${file}`)
  const e=ret.expression
  s=s.slice(0,e.getStart(ast))+`withSocialMetadata(${s.slice(e.getStart(ast),e.end)}, '/${slug}')`+s.slice(e.end)
  write(file,`import { withSocialMetadata } from '@/lib/seo'\n`+s)
}
replace('src/components/tools/ToolLayout.tsx', "import Link from 'next/link'", "import Link from 'next/link'\nimport { BLOG_POSTS } from '@/lib/blogPosts'\nimport { usesProcessingServer } from '@/lib/seo'")
replace('src/components/tools/ToolLayout.tsx', '  return (', "  const serverProcessing = usesProcessingServer(tool.slug)\n  const guides = BLOG_POSTS.filter(post => post.relatedTool === tool.slug || post.relatedTools.includes(tool.slug))\n    .sort((a, b) => Number(b.relatedTool === tool.slug) - Number(a.relatedTool === tool.slug)).slice(0, 3)\n  return (")
replace('src/components/tools/ToolLayout.tsx', "['No registration required', 'Files processed in browser', 'Free forever', '100% secure']", "['No registration required', serverProcessing ? 'Server processing' : 'Browser processing', 'Free to use']")
replace('src/components/tools/ToolLayout.tsx', '              {children}', `              {serverProcessing && <p className="mb-6 text-sm text-gray-600 leading-relaxed">This tool uploads your selected file to a processing service. Only submit files you are comfortable sending. <Link href="/privacy" className="text-brand-700 underline">Read how files are handled</Link>.</p>}
              {children}`)
replace('src/components/tools/ToolLayout.tsx', '              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">', `              {guides.length > 0 && (
                <nav aria-label="Related guides" className="mt-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Guides for this task</h2>
                  <ul className="space-y-2">{guides.map(post => <li key={post.slug}><Link href={\`/blog/\${post.slug}\`} className="inline-block py-2 text-brand-700 underline underline-offset-4 leading-relaxed">{post.title}</Link></li>)}</ul>
                </nav>
              )}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">`)
// Correct the output extension to match the actual image MIME type.
replace('src/app/(image)/add-watermark-image/AddWatermarkImageClient.tsx', 'filename="watermarked.jpg"', "filename={`watermarked.${result.type === 'image/png' ? 'png' : result.type === 'image/webp' ? 'webp' : 'jpg'}`}" )
replace('src/app/(pdf)/add-watermark-pdf/AddWatermarkPdfClient.tsx', 'parseInt(e.target.value, 10) || 45', 'Number(e.target.value)')
// Load PDF processing only after the visitor clicks the action.
for (const [slug, fn, mod] of [['merge-pdf','mergePdfs','merge'],['add-watermark-pdf','addWatermarkToPdf','watermark']]) {
  const dir=`src/app/(pdf)/${slug}`
  const client=fs.readdirSync(path.join(root,dir)).find(f=>f.endsWith('Client.tsx'))
  replace(`${dir}/${client}`,`import { ${fn} } from '@/lib/tools/pdf/${mod}'\n`,'')
  replace(`${dir}/${client}`,'    try {',`    try {\n      const { ${fn} } = await import('@/lib/tools/pdf/${mod}')`)
}
console.log('Updated four researched tool pages, registry content, all tool previews, guide links and two PDF loading paths.')
