import type { Editor } from '@tiptap/react'
import type { Note } from '@/types'
import { useAppStore } from '@/store/app'
import { useState } from 'react'
import { Tag, X, Plus, Link2 } from 'lucide-react'

interface Props {
  note: Note
  editor: Editor | null
}

const NOTE_TYPES: { value: 'fleeting' | 'literature' | 'permanent'; label: string; emoji: string }[] = [
  { value: 'fleeting', label: 'Fleeting', emoji: '📋' },
  { value: 'literature', label: 'Literature', emoji: '📖' },
  { value: 'permanent', label: 'Permanent', emoji: '🌿' },
]

export function NoteMetaBar({ note, editor }: Props) {
  const { updateNote, notes, setActiveView } = useAppStore()
  const [addingTag, setAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length ?? 0
  const charCount = editor?.getText().length ?? 0

  // Backlinks: notes that link TO this note
  const backlinks = notes.filter((n) => n.linkedNoteIds?.includes(note.id))
  const outgoingCount = note.linkedNoteIds?.length ?? 0

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || note.tags.includes(tag)) { setAddingTag(false); setTagInput(''); return }
    updateNote(note.id, { tags: [...note.tags, tag] })
    setTagInput('')
    setAddingTag(false)
  }

  function removeTag(tag: string) {
    updateNote(note.id, { tags: note.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
      {/* Tags row */}
      <div className="flex items-center gap-3 px-6 py-1.5 flex-wrap">
        <Tag size={12} />
        {note.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
          </span>
        ))}
        {addingTag ? (
          <input
            autoFocus
            className="w-20 bg-[hsl(var(--muted))] rounded-full px-2 py-0.5 outline-none text-xs"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setAddingTag(false); setTagInput('') } }}
            onBlur={addTag}
            placeholder="tag…"
          />
        ) : (
          <button onClick={() => setAddingTag(true)} className="flex items-center gap-0.5 hover:text-[hsl(var(--foreground))]">
            <Plus size={11} /> Add tag
          </button>
        )}
        <div className="ml-auto flex gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span>Updated {new Date(note.updatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Note type selector */}
      <div className="flex items-center gap-2 px-6 py-1.5 border-t border-[hsl(var(--border))]">
        <span className="text-[hsl(var(--muted-foreground))] shrink-0">Type:</span>
        <div className="flex gap-1">
          {NOTE_TYPES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => updateNote(note.id, { noteType: value })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                note.noteType === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Links & Backlinks */}
      <div className="flex items-start gap-4 px-6 py-1.5 border-t border-[hsl(var(--border))] flex-wrap">
        {/* Outgoing links count */}
        <div className="flex items-center gap-1 shrink-0">
          <Link2 size={11} />
          <span>{outgoingCount} link{outgoingCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Backlinks */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="shrink-0 font-medium text-[hsl(var(--foreground)/0.6)]">Backlinks:</span>
          {backlinks.length > 0 ? (
            backlinks.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveView({ type: 'note', noteId: n.id })}
                className="px-2 py-0.5 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] rounded-full transition-colors"
              >
                {n.title || 'Untitled'}
              </button>
            ))
          ) : (
            <span className="opacity-40 italic">No backlinks yet</span>
          )}
        </div>
      </div>
    </div>
  )
}
