'use client'
import { OfficeConvertTool } from '@/components/tools/OfficeConvertTool'

// Converted in the visitor's browser; /api/excel-to-pdf (Adobe PDF Services) is the fallback.
const ACCEPT = { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }

export function ExcelToPdfClient() {
  return (
    <OfficeConvertTool
      to="pdf"
      onlineEndpoint="/api/excel-to-pdf"
      accept={ACCEPT}
      label="Drag & drop your Excel file here"
      sublabel="Supports .xlsx and .xls — up to 100MB"
      buttonLabel="Convert to PDF"
      successLabel="Excel converted to PDF!"
      emptyError="Please select an Excel file."
    />
  )
}
