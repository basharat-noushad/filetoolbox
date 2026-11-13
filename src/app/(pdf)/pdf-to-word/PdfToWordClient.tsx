'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/pdf-to-word (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/pdf': ['.pdf'] }

export function PdfToWordClient() {
  return (
    <OfficeConvertTool
      to="docx"
      onlineEndpoint="/api/pdf-to-word"
      accept={ACCEPT}
      label="Drag & drop your PDF here"
      sublabel="Converts to editable .docx — up to 100MB"
      buttonLabel="Convert to Word"
      successLabel="PDF converted to Word successfully!"
      emptyError="Please select a PDF file."
    />
  )
}
