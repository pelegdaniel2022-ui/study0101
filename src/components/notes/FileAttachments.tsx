import { useRef, useState } from 'react'
import { Paperclip, X, FileText, Image, File, FileCode } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { saveAttachmentData, getAttachmentData, deleteAttachmentData } from '@/lib/attachments'
import type { NoteAttachment } from '@/types'

interface Props {
  noteId: string
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function detectType(file: File): NoteAttachment['type'] {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'text/plain' || file.name.endsWith('.md')) return 'text'
  return 'other'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function TypeIcon({ type }: { type: NoteAttachment['type'] }) {
  const cls = 'shrink-0'
  if (type === 'pdf') return <FileText size={14} className={cls} />
  if (type === 'image') return <Image size={14} className={cls} />
  if (type === 'text') return <FileCode size={14} className={cls} />
  return <File size={14} className={cls} />
}

// Preview state holds metadata + lazily-loaded dataUrl
interface PreviewState {
  att: NoteAttachment
  dataUrl: string | null
  loading: boolean
}

export function FileAttachments({ noteId }: Props) {
  const { notes, addAttachment, removeAttachment } = useAppStore()
  const note = notes.find((n) => n.id === noteId)
  const attachments = note?.attachments ?? []

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setSizeWarning(null)

    for (const file of files) {
      if (file.size > MAX_SIZE_BYTES) {
        setSizeWarning(`"${file.name}" is ${formatBytes(file.size)} — larger than the 10 MB recommended limit. It will still be attached.`)
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (evt) => resolve(evt.target?.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      const id = uid()

      // Save binary data to IndexedDB — keep stub (no dataUrl) in Zustand
      await saveAttachmentData(id, dataUrl)

      const stub: NoteAttachment = {
        id,
        name: file.name,
        type: detectType(file),
        size: file.size,
        addedAt: Date.now(),
      }
      addAttachment(noteId, stub)
    }

    // Reset input so the same file can be re-attached
    e.target.value = ''
  }

  const handleChipClick = async (att: NoteAttachment) => {
    if (att.type !== 'image' && att.type !== 'pdf') return

    // Open modal immediately with loading state, then fetch from IndexedDB
    setPreview({ att, dataUrl: null, loading: true })
    const dataUrl = await getAttachmentData(att.id)
    setPreview({ att, dataUrl, loading: false })
  }

  const handleRemove = async (att: NoteAttachment) => {
    await deleteAttachmentData(att.id)
    removeAttachment(noteId, att.id)
  }

  if (attachments.length === 0 && !sizeWarning) {
    return (
      <div className="mb-3 max-w-[740px]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-1"
        >
          <Paperclip size={12} />
          Attach file
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 max-w-[740px]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {sizeWarning && (
          <p className="text-xs text-amber-500 mb-2">{sizeWarning}</p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-xs text-[hsl(var(--foreground))] group"
            >
              <button
                onClick={() => handleChipClick(att)}
                className="flex items-center gap-1.5 hover:text-[hsl(var(--primary))] transition-colors"
                title={att.type === 'image' || att.type === 'pdf' ? 'Click to preview' : att.name}
              >
                <TypeIcon type={att.type} />
                <span className="max-w-[140px] truncate">{att.name}</span>
                <span className="text-[hsl(var(--muted-foreground))]">{formatBytes(att.size)}</span>
              </button>
              <button
                onClick={() => handleRemove(att)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors ml-0.5"
                title="Remove attachment"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-1 px-1"
            title="Attach another file"
          >
            <Paperclip size={12} />
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative bg-[hsl(var(--background))] rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            >
              <X size={16} />
            </button>
            <p className="text-sm font-medium mb-3 pr-8">{preview.att.name}</p>

            {preview.loading && (
              <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))] text-sm">
                Loading…
              </div>
            )}

            {!preview.loading && preview.dataUrl === null && (
              <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))] text-sm">
                File data not found.
              </div>
            )}

            {!preview.loading && preview.dataUrl && preview.att.type === 'image' && (
              <img
                src={preview.dataUrl}
                alt={preview.att.name}
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            )}

            {!preview.loading && preview.dataUrl && preview.att.type === 'pdf' && (
              <iframe
                src={preview.dataUrl}
                title={preview.att.name}
                className="w-[720px] max-w-full h-[75vh] rounded border border-[hsl(var(--border))]"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
