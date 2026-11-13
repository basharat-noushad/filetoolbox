'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/pdf-to-excel (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/pdf': ['.pdf'] }

export function PdfToExcelClient() {
  return (
    <OfficeConvertTool
      to="xlsx"
      onlineEndpoint="/api/pdf-to-excel"
      accept={ACCEPT}
      label="Drag & drop your PDF here"
      sublabel="Best results with PDFs containing tables — up to 100MB"
      buttonLabel="Convert to Excel"
      successLabel="PDF converted to Excel!"
      emptyError="Please select a PDF file."
    />
  )
}
