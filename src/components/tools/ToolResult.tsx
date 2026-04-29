'use client'
import { CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdBanner } from '@/components/ads/AdBanner'
import { saveAs } from 'file-saver'

interface ToolResultProps {
  blob: Blob
  filename: string
  label?: string
}

export function ToolResult({ blob, filename, label }: ToolResultProps) {
  const handleDownload = () => saveAs(blob, filename)

  return (
    <div className="mt-6 border border-green-200 bg-green-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        <span className="font-semibold text-green-800">{label || 'Processing complete!'}</span>
      </div>
      <div className="my-4 flex justify-center">
        <AdBanner slot="in-result" format="rectangle" />
      </div>
      <Button onClick={handleDownload} size="lg" className="w-full gap-2 cursor-pointer">
        <Download className="w-5 h-5" />
        Download {filename} ({(blob.size / 1024).toFixed(1)} KB)
      </Button>
    </div>
  )
}
