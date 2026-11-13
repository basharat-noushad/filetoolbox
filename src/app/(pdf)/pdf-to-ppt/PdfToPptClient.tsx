'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/pdf-to-ppt (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/pdf': ['.pdf'] }

export function PdfToPptClient() {
  return (
    <OfficeConvertTool
      to="pptx"
      onlineEndpoint="/api/pdf-to-ppt"
      accept={ACCEPT}
      label="Drag & drop your PDF here"
      sublabel="Each page becomes a slide — up to 100MB"
      buttonLabel="Convert to PowerPoint"
      successLabel="PDF converted to PowerPoint!"
      emptyError="Please select a PDF file."
    />
  )
}
