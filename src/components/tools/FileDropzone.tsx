'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileDropzoneProps {
  accept: Record<string, string[]>
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  onFilesSelected: (files: File[]) => void
  label?: string
  sublabel?: string
}

export function FileDropzone({
  accept, multiple = false, maxFiles = 1, maxSize = 52_428_800,
  onFilesSelected, label, sublabel,
}: FileDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles)
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple, maxFiles, maxSize })

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updated)
    onFilesSelected(updated)
  }

  const isPdf = Object.keys(accept).includes('application/pdf')

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-brand-600 bg-brand-50 scale-[1.01]'
            : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {isPdf
            ? <FileText className="w-12 h-12 text-gray-400" />
            : <ImageIcon className="w-12 h-12 text-gray-400" />
          }
          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragActive ? 'Drop files here…' : (label || 'Drag & drop your file here')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {sublabel || `or click to browse — max ${Math.round(maxSize / 1_048_576)}MB`}
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" /> Select File{multiple ? 's' : ''}
          </Button>
        </div>
      </div>
      {selectedFiles.length > 0 && (
        <ul className="mt-3 space-y-2">
          {selectedFiles.map((file, i) => (
            <li key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <span className="truncate text-gray-700">{file.name}</span>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
