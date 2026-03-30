import type { Editor } from '@tiptap/react'
import type { Note } from '@/types'
import { useAppStore } from '@/store/app'
import { useState } from 'react'
import { Tag, X, Plus } from 'lucide-react'

interface Props {
  note: Note
  editor: Editor | null
}

export function NoteMetaBar({ note, editor }: Props) {
  const { updateNote } = useAppStore()
  const [addingTag, setAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length ?? 0
  const charCount = editor?.getText().length ?? 0

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
    <div className="flex items-center gap-3 px-6 py-1.5 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
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
  )
}
