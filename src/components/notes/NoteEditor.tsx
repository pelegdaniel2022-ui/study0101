import { useEffect, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useAppStore } from '@/store/app'
import { NoteToolbar } from './NoteToolbar'
import { BubbleMenuBar } from './BubbleMenu'
import { SlashCommands } from './SlashMenu'
import { InlineEquation, BlockEquation } from './EquationNode'
import { SimWidgetNode } from '@/components/simulation/SimWidget'
import { CanvasEditor } from '@/components/canvas/CanvasEditor'
import { NoteMetaBar } from './NoteMetaBar'
import { AISidebar } from '@/components/ai/AISidebar'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAIStore } from '@/store/ai'
import { embedNote } from '@/lib/rag'
import {
  Maximize2, Minimize2, FileText, PenLine, Columns2, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

const lowlight = createLowlight(common)

type NoteMode = 'document' | 'canvas' | 'split'

interface Props {
  noteId: string
}

export function NoteEditor({ noteId }: Props) {
  const { notes, updateNote, fullscreenNote, setFullscreenNote } = useAppStore()
  const { apiKeys } = useAIStore()
  const note = notes.find((n) => n.id === noteId)
  const [aiOpen, setAiOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start typing, or press / for commands…' }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      InlineEquation,
      BlockEquation,
      SimWidgetNode,
      SlashCommands,
    ],
    content: note?.content ? JSON.parse(note.content) : '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-slate dark:prose-invert max-w-none focus:outline-none min-h-full px-8 py-4',
      },
    },
    onUpdate: () => {
      setSaveStatus('unsaved')
      scheduleSave()
    },
  })

  const doSave = useCallback(() => {
    if (!editor || !note) return
    setSaveStatus('saving')
    const json = JSON.stringify(editor.getJSON())
    updateNote(noteId, { content: json })
    setSaveStatus('saved')
    // Background embed for RAG
    if (apiKeys.openai) {
      const text = editor.getText()
      embedNote(apiKeys.openai, noteId, text).catch(() => {})
    }
  }, [editor, note, noteId, updateNote, apiKeys.openai])

  const scheduleSave = useAutoSave(doSave, 700)

  // Reload content when noteId changes
  useEffect(() => {
    if (!editor) return
    const stored = note?.content
    try {
      editor.commands.setContent(stored ? JSON.parse(stored) : '')
    } catch {
      editor.commands.setContent('')
    }
    setSaveStatus('saved')
  }, [noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!note) return null

  const mode: NoteMode = note.mode

  return (
    <div className={cn('flex h-full', fullscreenNote && 'fixed inset-0 z-50 bg-[hsl(var(--background))]')}>
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Note header */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-0 border-b border-[hsl(var(--border))]">
          <input
            className="flex-1 text-xl font-bold bg-transparent outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            placeholder="Note title"
            value={note.title}
            onChange={(e) => updateNote(noteId, { title: e.target.value })}
          />
          {/* Mode switcher */}
          <div className="flex items-center gap-0.5 bg-[hsl(var(--muted))] rounded-lg p-0.5">
            <ModeBtn active={mode === 'document'} onClick={() => updateNote(noteId, { mode: 'document' })} title="Document">
              <FileText size={14} />
            </ModeBtn>
            <ModeBtn active={mode === 'canvas'} onClick={() => updateNote(noteId, { mode: 'canvas' })} title="Canvas">
              <PenLine size={14} />
            </ModeBtn>
            <ModeBtn active={mode === 'split'} onClick={() => updateNote(noteId, { mode: 'split' })} title="Split">
              <Columns2 size={14} />
            </ModeBtn>
          </div>
          {/* AI toggle */}
          <button
            onClick={() => setAiOpen((o) => !o)}
            className={cn('p-1.5 rounded-lg transition-colors', aiOpen ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]')}
            title="AI Tutor"
          >
            <Bot size={16} />
          </button>
          {/* Fullscreen */}
          <button
            onClick={() => setFullscreenNote(!fullscreenNote)}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            title={fullscreenNote ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          >
            {fullscreenNote ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        {/* Toolbar (doc mode) */}
        {(mode === 'document' || mode === 'split') && editor && (
          <NoteToolbar editor={editor} saveStatus={saveStatus} />
        )}

        {/* Content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Document editor */}
          {(mode === 'document' || mode === 'split') && (
            <div className={cn('flex flex-col overflow-y-auto', mode === 'split' ? 'w-1/2 border-r border-[hsl(var(--border))]' : 'flex-1')}>
              {editor && <BubbleMenuBar editor={editor} />}
              <EditorContent editor={editor} className="flex-1" />
            </div>
          )}

          {/* Canvas */}
          {(mode === 'canvas' || mode === 'split') && (
            <div className={cn(mode === 'split' ? 'w-1/2' : 'flex-1')}>
              <CanvasEditor noteId={noteId} />
            </div>
          )}
        </div>

        {/* Meta bar */}
        <NoteMetaBar note={note} editor={editor} />
      </div>

      {/* AI sidebar */}
      {aiOpen && <AISidebar noteId={noteId} onClose={() => setAiOpen(false)} />}
    </div>
  )
}

function ModeBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-md text-xs transition-colors',
        active ? 'bg-[hsl(var(--background))] shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
      )}
    >
      {children}
    </button>
  )
}
