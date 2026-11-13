const fs = require('node:fs')
const ts = require('typescript')
const file = 'src/lib/blogPosts.ts'
let source = fs.readFileSync(file, 'utf8')
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
const section = (heading, paragraphs, extra = {}) => ({ heading, paragraphs, ...extra })
const faq = (q, a) => ({ q, a })
const updates = {
  'how-to-compress-pdf-without-losing-quality': {
    title: 'How to Compress a PDF: Lossless Options and Size Limits',
    metaTitle: 'How to Compress a PDF Without Downsampling Images',
    metaDescription: 'Learn how lossless PDF structure compression works, why scanned PDFs may not shrink, and what to try when a file exceeds an email or upload limit.',
    excerpt: 'Start with a lossless attempt, compare the actual file sizes, and keep your original. A smaller PDF is useful only if it still meets your document requirements.',
    sections: [
      section('What this compressor changes', ['PDF and Image + rewrites PDF structure with compressed object streams. It does not resize the images inside a PDF, rasterize pages or offer a target file size. A document that already uses efficient structures may show no reduction. The tool keeps the original when the rewritten file is not smaller.']),
      section('Compress your PDF and check the result', [], {steps:['Open Compress PDF and select one file up to 50 MB.', 'Click Compress PDF. Keep the browser tab open while processing finishes.', 'Read the size comparison and download the result. If no reduction was possible, the download contains the original.', 'Open the downloaded file and check page count, text, diagrams and any interactive content before sharing.']}),
      section('Can I compress a PDF to 200 KB or 1 MB?', ['There is no guaranteed target size. A 20 MB scanned document is mostly image data, so structure compression alone is unlikely to make it fit a 1 MB portal limit. If you have the source document, export it with appropriate image dimensions. Otherwise, ask whether the recipient accepts separate files and use Split PDF or remove pages that are not required.']),
      section('Keep a signed original', ['Rewriting a PDF can affect digital signatures and specialized document features. Keep the source file, and do not replace an official signed copy with an optimized one without checking the recipient requirements. Password-protected PDFs need to be unlocked first by someone authorized to modify them.']),
      section('For email attachments', ['Check the attachment limit used by both sender and recipient. Compare the downloaded size against that actual limit rather than assuming every mail service accepts the same size. If the document still does not fit, use an approved file-sharing method or split it only when that is acceptable.']),
    ],
    faqs: [faq('Why did my PDF not get smaller?', 'It may already use compressed structures, or most of its size may be image data. This tool does not downsample those images.'),faq('Are there Low, Medium and High settings?', 'No. This compressor uses a single structure-optimization method; it does not offer image-quality levels.'),faq('Is the PDF uploaded?', 'Compression happens in your browser. The current file picker accepts one PDF up to 50 MB.')],
  },
  'how-to-add-watermark-to-photos': {
    title: 'How to Add a Text Watermark to JPG, PNG and WebP Photos',
    metaTitle: 'How to Add a Watermark to JPG and PNG Photos',
    metaDescription: 'Add a text watermark to a JPG, PNG or WebP photo. Choose position and opacity, check the export, and understand the limits of a visible watermark.',
    excerpt: 'Put your name or copyright text on a photo without uploading it for processing. This guide matches the controls in the image watermark tool.',
    sections: [
      section('Choose text that fits the photo', ['Use a short name, website or copyright notice. This tool uses text rather than a logo file and selects the font size automatically from the image width. Long phrases can extend beyond the edge, especially on narrow photos.']),
      section('Add a watermark to a JPG', [], {steps:['Open Add Watermark to Image and select one JPG, PNG or WebP file up to 50 MB.', 'Enter your text and select Bottom Right, Bottom Left, Center, Top Right or Top Left.', 'Adjust opacity between 10% and 90%, then click Add Watermark.', 'Click Download and inspect the exported copy. Keep your original photo.']}),
      section('Pick a readable position and opacity', ['Try a corner for a discreet credit, or the center when you want the mark to be harder to crop away. Start near the middle of the opacity range and inspect both light and dark parts of the photo. The best position depends on the image; avoid covering a face, label or other essential detail.']),
      section('What happens to the file?', ['The image retains its pixel dimensions and is re-encoded in its supported source format. JPG and WebP export can change detail because those formats may be lossy. A PNG export also becomes a newly rendered image, so do not assume original metadata is retained. Processing happens in the browser.']),
      section('Know the limits', ['There is no batch or logo-watermark option in this tool. A visible mark can identify your work, but it cannot stop copying, cropping or retouching. For a document, use Add Watermark to PDF instead; that tool labels every page with text.']),
    ],
    faqs: [faq('Can I add a watermark to JPG for free?', 'Yes. Select a JPG, enter your text, set position and opacity, process it and download a copy without registration.'),faq('Can I watermark multiple photos at once?', 'The current tool works on one image at a time.'),faq('Can the tool remove someone else’s watermark?', 'No. It adds a text overlay; it does not remove an existing watermark.')],
  },
  'heic-to-jpg-convert-iphone-photos': {
    title: 'How to Convert HEIC to JPG for Sharing iPhone Photos',
    metaTitle: 'How to Convert HEIC to JPG on Windows or in a Browser',
    metaDescription: 'Convert an original HEIC or HEIF photo to JPG in your browser. Follow the steps, check orientation and quality, and keep your original iPhone file.',
    excerpt: 'A JPG copy is easier to share with software that cannot decode your HEIC photo. Convert the actual file, then check the result before discarding anything.',
    sections: [
      section('Use the original HEIC file', ['A file extension is only a label. Renaming photo.heic to photo.jpg does not convert its contents. Transfer or save the original .heic or .heif file, then choose it in the converter. Some sharing apps already create a JPG copy, so check which file you have before converting.']),
      section('Convert HEIC to JPG step by step', [], {steps:['Open HEIC to JPG in a current browser on your computer or phone.', 'Select one .heic or .heif file up to 50 MB.', 'Click Convert to JPG and keep the tab open while decoding runs.', 'Download converted.jpg and check its orientation, color and detail.']}),
      section('Using a Windows computer', ['If your usual photo viewer cannot open HEIC, the browser converter offers another workflow. Select the original photo from your computer and download the JPG. You do not need to install a separate desktop converter for this path, although unsupported encodings can still fail.']),
      section('Quality, metadata and multiple images', ['This converter exports JPEG at a quality setting of 92%. JPEG is lossy, so the output is not identical to the original. Do not rely on preservation of EXIF, HDR information or camera metadata. The tool returns the first image when decoding produces multiple images; it is not a Live Photo or batch archive converter.']),
      section('If conversion fails', ['Try a smaller original file in a current desktop browser with other heavy tabs closed. The file may be damaged or use an unsupported encoding. Keep the HEIC original and use a trusted local photo application if the browser cannot decode it.']),
    ],
    faqs: [faq('Can I batch convert HEIC to JPG?', 'This tool accepts one file at a time. It does not export a batch ZIP.'),faq('Are my photos uploaded?', 'The conversion library runs in the browser; the selected photo is not sent to a conversion server.'),faq('Should I delete the original?', 'Keep it if original quality, metadata or future editing matter. Review the JPG before replacing any files.')],
  },
  'how-to-merge-pdf-files-online-free': {
    title: 'How to Merge PDF Files Online: Order, Limits and Checks',
    metaTitle: 'How to Merge PDF Files Online for Free',
    metaDescription: 'Combine up to 20 PDF files in your browser. Check file order, mixed page sizes and the downloaded result, with practical advice for signed documents.',
    excerpt: 'Combine reports, forms or attachments into one PDF. Check the selected order before merging and review the output before sending it.',
    sections: [
      section('Before you start', ['Gather at least two PDFs. The tool accepts up to 20 files, each up to 50 MB, but your browser may run out of memory with large collections. Keep copies of the originals. If a PDF is encrypted, unlock it only if you are authorized to do so.']),
      section('Merge PDF files', [], {steps:['Open Merge PDF and select your files together.', 'Review the file list. Pages are copied in the displayed file order; there is no drag-to-reorder control in this merger.', 'Click Merge PDFs and wait for the result.', 'Download merged.pdf and check page count and transitions between documents.']}),
      section('A simple order example', ['If a two-page cover document appears before a three-page report, the output should have five pages: the two cover pages followed by the three report pages. If the order is wrong, adjust your selection or use Reorder PDF Pages after merging. This is an illustrative workflow, not a claimed compression benchmark.']),
      section('Mixed page sizes and document features', ['Each copied page keeps its dimensions, so a landscape chart can sit beside portrait pages. Merging is not a way to validate signatures or preserve every document-level feature. Check bookmarks, forms and signatures separately if your workflow depends on them.']),
      section('After merging', ['Use Delete PDF Pages to remove an unwanted cover, or Split PDF if the recipient needs separate sections. Compression may help structural overhead but cannot guarantee a particular attachment size. Merging itself runs in the browser without sending PDFs to a processing server.']),
    ],
    faqs: [faq('How many PDFs can I merge?', 'Select 2–20 files, with a 50 MB limit for each file. Available browser memory may limit large jobs.'),faq('Does it change page dimensions?', 'Copied pages keep their original dimensions; the merge operation does not normalize page sizes.'),faq('Does downloading replace my originals?', 'No. The result is a separate merged.pdf file.')],
  },
  'pdf-to-word-conversion-tips': {
    title: 'PDF to Word Conversion: Check Layout and Editable Text',
    metaTitle: 'PDF to Word Conversion Tips for Editable DOCX Files',
    metaDescription: 'Convert PDF to Word with realistic expectations. Learn what to check in DOCX output, how scans differ, and when server processing is required.',
    excerpt: 'PDF and Word store page content differently. Treat conversion as a starting point for editing and review the result against your original.',
    sections: [
      section('Check whether the PDF contains text', ['Try selecting a sentence in a PDF viewer. A page that is only a scanned picture usually needs optical character recognition before its words can become editable. Selection is a useful first check, although it does not prove that all text or reading order will convert correctly.']),
      section('Convert PDF to Word', [], {steps:['Open PDF to Word and select a PDF within the displayed file limit.', 'Only continue if you are comfortable sending the document to the processing service. This conversion is not performed entirely in your browser.', 'Click Convert to Word. The configured conversion service must be available.', 'Download the DOCX and compare it with the PDF in your word processor.']}),
      section('Review these details before editing', [], {bullets:['Check headers, footers and page breaks.', 'Inspect tables cell by cell, especially merged cells and multi-page tables.', 'Compare columns, reading order, symbols and font substitutions.', 'Check that text is editable rather than an inserted image.']}),
      section('Scans and complex layouts', ['The conversion route does not promise an OCR step. For scans, use an appropriate OCR workflow first and proofread the recognized text. Multi-column pages, forms and image-heavy designs can need substantial manual reconstruction in Word.']),
      section('If conversion is unavailable', ['This feature depends on a configured server. A service error does not mean your PDF is corrupt. Keep the original and try again later, or use a trusted local converter for files you cannot send to a processing service. Do not assume a retention or deletion policy that has not been confirmed for the deployed service.']),
    ],
    faqs: [faq('Is PDF to Word a local browser tool?', 'No. It sends the selected PDF to a conversion service and returns a DOCX file.'),faq('Will formatting be identical?', 'Not necessarily. Review tables, fonts, columns and page breaks; a PDF is not the same document model as Word.'),faq('Does it make scanned text editable automatically?', 'Do not rely on that. Scanned pages may require OCR followed by proofreading.')],
  },
  'webp-vs-jpg-vs-png-which-format': {
    title: 'WebP vs JPG vs PNG: Choose an Image Format by Task',
    metaTitle: 'WebP vs JPG vs PNG: Photos, Transparency and Exports',
    metaDescription: 'Compare JPG, PNG and WebP for photos, transparent graphics and web uploads. Understand lossy conversion and test your actual exported image.',
    excerpt: 'Choose based on the image and where it will be used. There is no universal smallest format or quality setting for every file.',
    sections: [
      section('JPG for photos and compatibility', ['JPG is useful for photographs and services that ask specifically for JPEG. It uses lossy compression and does not support transparency. The PNG to JPG tool fills transparent areas with white, so inspect logos and cut-out images before using the result.']),
      section('PNG for transparency and sharp graphics', ['PNG supports transparency and lossless image encoding. It is often useful for screenshots, interface graphics and logos. A photo saved as PNG can be much larger than a JPEG. Converting an already compressed JPEG to PNG does not recover detail that was previously lost.']),
      section('WebP for web delivery', ['WebP supports transparency and both lossy and lossless encoding. The current Convert to WebP tool exposes a quality control for browser export; do not assume that every export is lossless. Check that your destination accepts WebP before choosing it.']),
      section('Compare a real export', [], {steps:['Keep the original and make a copy in the proposed format.', 'Compare pixel dimensions and file sizes.', 'Inspect text, edges, gradients and transparent areas at the size people will see.', 'Upload the result to your destination only after checking its accepted formats and dimensions.']}),
      section('Choose the matching tool', ['Use PNG to JPG for JPEG-only destinations, WebP to PNG when you need a PNG file, or Convert to WebP for a web export. Resize an oversized source before compression if you do not need its full dimensions. Avoid repeated lossy conversions between formats.']),
    ],
    faqs: [faq('Is WebP always smaller?', 'No. File size depends on content, dimensions and export settings. Compare your own files.'),faq('Does JPG to PNG restore quality?', 'No. It changes the container and encoding, but cannot reconstruct lost detail.'),faq('Why did my transparent background become white?', 'JPEG has no alpha transparency. The PNG to JPG tool composites transparent pixels onto white.')],
  },
  'compress-images-for-web-without-losing-quality': {
    title: 'How to Compress Images for the Web and Check Quality',
    metaTitle: 'How to Compress Images for the Web: Quality Checks',
    metaDescription: 'Reduce JPG, PNG or WebP file sizes with practical quality checks. Understand resizing, compression settings and why file-size savings vary.',
    excerpt: 'Compression trades storage and detail differently for each format. Compare the downloaded image instead of relying on a promised saving percentage.',
    sections: [
      section('Check the dimensions first', ['An image can be too large in pixels as well as bytes. The current Compress Image tool caps the longest side at 1920 pixels, so it can resize a larger source. Keep the original for printing, archiving or any workflow that needs full resolution.']),
      section('Compress one image', [], {steps:['Select one JPG, PNG or WebP file within the 50 MB picker limit.', 'Set the quality slider. The default is 80%; this is an encoder setting, not a measured percentage of preserved detail.', 'Click Compress Image and compare the displayed file sizes.', 'Download and inspect the image, especially small text, gradients and edges.']}),
      section('What the quality setting means', ['The tool uses browser-image-compression with the input MIME type and an initial quality value. Results differ between formats and browser encoders; PNG does not behave like lossy JPEG. The single-image tool targets at most 10 MB, but that is not a guarantee for every input or device.']),
      section('When the output is still too large', ['Reduce dimensions to the size actually needed, choose an appropriate format, or try a lower quality setting where supported. For multiple files, use Bulk Image Compressor, which has its own size settings. Do not repeatedly recompress the same JPEG when you still have the original.']),
      section('Make a useful comparison', ['View the original and export at the intended display size. Compare file size and dimensions together: a smaller export may also contain fewer pixels. There is no universal 80% saving and no promise of zero visible change.']),
    ],
    faqs: [faq('Will this keep my original dimensions?', 'Images with a longest side above 1920 pixels may be resized by this tool.'),faq('Does compression upload my image?', 'This tool processes the selected file in your browser.'),faq('Can I compress without any quality loss?', 'It depends on the format and settings. JPEG and lossy WebP can lose detail; always keep and compare the original.')],
  },
  'how-to-upscale-image-without-losing-quality': {
    title: 'How to Upscale an Image: Larger Dimensions, Realistic Detail',
    metaTitle: 'How to Upscale an Image to 2x, 3x or 4x',
    metaDescription: 'Enlarge an image to 2x, 3x or 4x in your browser and export PNG. Learn how interpolation differs from AI upscaling and what to check before use.',
    excerpt: 'Increasing pixel dimensions can help a layout, but it does not recreate missing detail. This tool uses browser interpolation, not an AI model.',
    sections: [section('Choose a suitable source', ['Start with the largest clean original you have. A blurry thumbnail stays limited by its source detail even when its pixel dimensions increase.']),section('Enlarge your image',[],{steps:['Select a JPG, PNG or WebP image.', 'Choose 2x, 3x or 4x and click Upscale Image.', 'Download the PNG and check its edges and detail at the intended display size.']}),section('What the scale means',['A 2x setting doubles width and height, creating four times as many pixels. A 4x setting creates sixteen times as many pixels. File size and memory use vary; they do not follow a guaranteed byte-size multiplier.']),section('Interpolation is not AI reconstruction',['This tool uses the browser canvas with high-quality smoothing. The browser chooses the interpolation implementation. There is no configured AI reconstruction path in this tool, and it cannot promise to restore faces, text or other missing detail.'])],
    faqs:[faq('Is this an AI upscaler?','No. It enlarges images using browser interpolation.'),faq('What format is the output?','The enlarged image is exported as PNG.'),faq('Will it sharpen a blurry photo?','Larger dimensions do not recover missing detail. Compare the result before using it.')],
  },
}
const edits=[]
function visit(n) {
  if(ts.isObjectLiteralExpression(n)) {
    const prop=n.properties.find(p=>p.name?.getText(ast)==='slug')
    const slug=prop?.initializer?.text
    if(updates[slug]) {
      const update={...updates[slug],dateModified:'2026-09-29',readTime:'3 min read'}
      for(const p of n.properties) if(p.name && Object.hasOwn(update,p.name.getText(ast))) edits.push([p.initializer.getStart(ast),p.initializer.end,JSON.stringify(update[p.name.getText(ast)],null,2)])
    }
  }
  ts.forEachChild(n,visit)
}
visit(ast)
for(const [a,b,s] of edits.sort((a,b)=>b[0]-a[0])) source=source.slice(0,a)+s+source.slice(b)
fs.writeFileSync(file,source)
console.log(`Refreshed ${Object.keys(updates).length} existing guides without changing their URLs.`)
