import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Highlighter, AlignLeft,
  AlignCenter, AlignRight, CheckSquare, Code2, FunctionSquare, FlaskConical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  editor: Editor
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

export function NoteToolbar({ editor, saveStatus }: Props) {
  function insertBlockEq() {
    editor.chain().focus().insertContent({ type: 'blockEquation', attrs: { latex: '' } }).run()
  }
  function insertSim() {
    editor.chain().focus().insertContent({ type: 'simWidget', attrs: { simType: 'pendulum' } }).run()
  }

  return (
    <div className="flex items-center gap-0.5 px-4 py-1 border-b border-[hsl(var(--border))] flex-wrap bg-[hsl(var(--background)/0.8)] backdrop-blur-sm">
      <TB onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo" disabled={!editor.can().undo()}><Undo size={13} /></TB>
      <TB onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo" disabled={!editor.can().redo()}><Redo size={13} /></TB>
      <Sep />
      <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><Bold size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><Italic size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><Underline size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><Code size={13} /></TB>
      <Sep />
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 size={13} /></TB>
      <Sep />
      <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={13} /></TB>
      <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={13} /></TB>
      <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={13} /></TB>
      <Sep />
      <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list"><ListOrdered size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list"><CheckSquare size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={13} /></TB>
      <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code2 size={13} /></TB>
      <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider"><Minus size={13} /></TB>
      <Sep />
      <TB onClick={insertBlockEq} active={false} title="Block equation"><FunctionSquare size={13} /></TB>
      <TB onClick={insertSim} active={false} title="Physics simulation"><FlaskConical size={13} /></TB>

      {/* Save status */}
      <div className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
        {saveStatus === 'saved' && <span className="text-emerald-500">Saved</span>}
        {saveStatus === 'saving' && <span>Saving…</span>}
        {saveStatus === 'unsaved' && <span className="text-amber-500">Unsaved</span>}
      </div>
    </div>
  )
}

function TB({ children, onClick, active, title, disabled }: {
  children: React.ReactNode; onClick: () => void; active: boolean; title?: string; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded transition-colors',
        active ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />
}
