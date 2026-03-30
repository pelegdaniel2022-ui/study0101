import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { useAppStore } from '@/store/app'
import { NoteToolbar } from './NoteToolbar'
import 'katex/dist/katex.min.css'

interface NoteEditorProps {
  noteId: string
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const { notes, updateNote } = useAppStore()
  const note = notes.find((n) => n.id === noteId)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your notes…' }),
      Highlight,
      Typography,
    ],
    content: note?.content ? JSON.parse(note.content) : '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full px-8 py-6',
      },
    },
  })

  // Save on change with debounce
  const save = useCallback(() => {
    if (!editor || !note) return
    const json = JSON.stringify(editor.getJSON())
    updateNote(noteId, { content: json })
  }, [editor, note, noteId, updateNote])

  useEffect(() => {
    if (!editor) return
    editor.on('update', save)
    return () => { editor.off('update', save) }
  }, [editor, save])

  // Load note content when note changes
  useEffect(() => {
    if (!editor || !note) return
    const current = JSON.stringify(editor.getJSON())
    if (current !== note.content && note.content) {
      editor.commands.setContent(JSON.parse(note.content))
    }
  }, [noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!note) return null

  return (
    <div className="flex flex-col h-full">
      {/* Note title */}
      <div className="px-8 pt-6 pb-0">
        <input
          className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-[hsl(var(--muted-foreground))] text-[hsl(var(--foreground))]"
          placeholder="Note title"
          value={note.title}
          onChange={(e) => updateNote(noteId, { title: e.target.value })}
        />
      </div>

      {/* Toolbar */}
      {editor && <NoteToolbar editor={editor} />}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}
