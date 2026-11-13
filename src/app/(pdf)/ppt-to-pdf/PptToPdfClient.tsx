'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/ppt-to-pdf (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'application/vnd.ms-powerpoint': ['.ppt'] }

export function PptToPdfClient() {
  return (
    <OfficeConvertTool
      to="pdf"
      onlineEndpoint="/api/ppt-to-pdf"
      accept={ACCEPT}
      label="Drag & drop your PowerPoint file here"
      sublabel="Supports .pptx and .ppt — up to 100MB"
      buttonLabel="Convert to PDF"
      successLabel="PowerPoint converted to PDF!"
      emptyError="Please select a PowerPoint file."
    />
  )
}
