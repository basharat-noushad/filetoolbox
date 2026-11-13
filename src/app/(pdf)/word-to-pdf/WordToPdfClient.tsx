'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/word-to-pdf (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] }

export function WordToPdfClient() {
  return (
    <OfficeConvertTool
      to="pdf"
      onlineEndpoint="/api/word-to-pdf"
      accept={ACCEPT}
      label="Drag & drop your Word document here"
      sublabel="Supports .docx and .doc formats — up to 100MB"
      buttonLabel="Convert to PDF"
      successLabel="Word document converted to PDF!"
      emptyError="Please select a Word document first."
    />
  )
}
