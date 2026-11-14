'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, FileText, ImageIcon, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface FileDropzoneProps {
  accept: Record<string, string[]>
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  onFilesSelected: (files: File[]) => void
  label?: string
  sublabel?: string
  privacyNote?: string
  /** Opt-in: list gets drag / Move up / Move down reordering, and newly added files are appended. */
  reorderable?: boolean
}

function Thumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file.type.startsWith('image/')) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
  return <FileText className="w-10 h-10 p-2 text-gray-400 bg-gray-100 rounded shrink-0" aria-hidden />
}

// Stable keys so thumbnails/object URLs survive reordering.
const ids = new WeakMap<File, number>()
let nextId = 0
const fileKey = (f: File) => {
  if (!ids.has(f)) ids.set(f, nextId++)
  return ids.get(f)!
}

export function FileDropzone({
  accept, multiple = false, maxFiles = 1, maxSize = 52_428_800,
  onFilesSelected, label, sublabel, privacyNote, reorderable = false,
}: FileDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const dragRef = useRef(drag)
  dragRef.current = drag

  const update = useCallback((next: File[]) => {
    setSelectedFiles(next)
    onFilesSelected(next)
  }, [onFilesSelected])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!reorderable || !multiple) { update(acceptedFiles); return }
    const merged = [...selectedFiles, ...acceptedFiles]
    if (merged.length > maxFiles) toast.error(`Only the first ${maxFiles} files were kept — max ${maxFiles}.`)
    update(merged.slice(0, maxFiles))
  }, [reorderable, multiple, selectedFiles, maxFiles, update])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= selectedFiles.length || from === to) return
    const next = [...selectedFiles]
    next.splice(to, 0, next.splice(from, 1)[0])
    update(next)
  }

  const overIndex = (y: number) => {
    const items = Array.from(listRef.current?.children ?? [])
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect()
      if (y < r.top + r.height / 2) return i
    }
    return items.length - 1
  }

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const first = fileRejections[0]
    if (!first) return
    const code = first.errors[0]?.code
    if (code === 'file-too-large') {
      toast.error(`"${first.file.name}" is too large — max ${Math.round(maxSize / 1_048_576)}MB.`)
    } else if (code === 'too-many-files') {
      toast.error(`Too many files selected — max ${maxFiles}.`)
    } else {
      toast.error(`"${first.file.name}" isn't a supported file type for this tool.`)
    }
  }, [maxSize, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, onDropRejected, accept, multiple, maxFiles, maxSize })

  const removeFile = (index: number) => update(selectedFiles.filter((_, i) => i !== index))

  const isPdf = Object.keys(accept).includes('application/pdf')
  const laneIcon = isPdf ? 'text-brand-400' : 'text-emerald-400'
  const laneDragBorder = isPdf ? 'border-brand-600 bg-brand-50' : 'border-emerald-600 bg-emerald-50'
  const laneHoverBorder = isPdf ? 'hover:border-brand-400' : 'hover:border-emerald-400'

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? `${laneDragBorder} scale-[1.01]`
            : `border-gray-300 ${laneHoverBorder} hover:bg-gray-50`
        }`}
      >
        <input {...getInputProps({ 'aria-label': label || 'Choose files to upload' })} />
        <div className="flex flex-col items-center gap-3">
          {isPdf
            ? <FileText className={`w-12 h-12 ${laneIcon}`} />
            : <ImageIcon className={`w-12 h-12 ${laneIcon}`} />
          }
          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragActive ? 'Drop files here…' : (label || 'Drag & drop your file here')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {sublabel || `or click to browse — max ${Math.round(maxSize / 1_048_576)}MB`}
            </p>
            {privacyNote && (
              <p className="text-xs text-emerald-700 mt-2 font-medium">{privacyNote}</p>
            )}
          </div>
          <Button variant="outline" size="sm" type="button" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" /> {reorderable && selectedFiles.length > 0 ? 'Add more files' : `Select File${multiple ? 's' : ''}`}
          </Button>
        </div>
      </div>
      {selectedFiles.length > 0 && (
        <>
          {reorderable && selectedFiles.length > 1 && (
            <p className="mt-3 text-xs text-gray-500">Drag the handle or use the arrows to set the order. Files you add are placed at the end.</p>
          )}
          <ul ref={listRef} className="mt-3 space-y-2">
            {selectedFiles.map((file, i) => (
              <li
                key={reorderable ? fileKey(file) : i}
                className={`flex items-center justify-between bg-white border rounded-lg px-3 py-2 text-sm ${
                  drag && drag.over === i && drag.from !== i
                    ? `border-brand-600 ${drag.from < i ? 'border-b-4' : 'border-t-4'}`
                    : 'border-gray-200'
                } ${drag?.from === i ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {reorderable && (
                    <>
                      <span
                        role="img"
                        aria-label={`Drag ${file.name} to reorder`}
                        style={{ touchAction: 'none' }}
                        className="cursor-grab active:cursor-grabbing text-gray-400 p-1 -ml-1 shrink-0"
                        onPointerDown={e => {
                          e.currentTarget.setPointerCapture(e.pointerId)
                          setDrag({ from: i, over: i })
                        }}
                        onPointerMove={e => {
                          if (dragRef.current) setDrag({ from: dragRef.current.from, over: overIndex(e.clientY) })
                        }}
                        onPointerUp={() => {
                          const d = dragRef.current
                          setDrag(null)
                          if (d) move(d.from, d.over)
                        }}
                        onPointerCancel={() => setDrag(null)}
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="text-xs text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                      <Thumb file={file} />
                    </>
                  )}
                  <span className="truncate text-gray-700">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <span className={`text-gray-400 mr-2 ${reorderable ? "hidden min-[420px]:inline" : ""}`}>{(file.size / 1024).toFixed(0)} KB</span>
                  {reorderable && (
                    <>
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                        aria-label={`Move ${file.name} up`}
                        className="p-1 text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === selectedFiles.length - 1}
                        aria-label={`Move ${file.name} down`}
                        className="p-1 text-gray-500 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                    className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
