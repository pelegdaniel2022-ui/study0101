import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2,
  List, ListOrdered, Quote, Minus, Undo, Redo, Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteToolbarProps {
  editor: Editor
}

export function NoteToolbar({ editor }: NoteToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-6 py-1.5 border-b border-[hsl(var(--border))] flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        <Code size={14} />
      </ToolbarButton>

      <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>

      <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Divider"
      >
        <Minus size={14} />
      </ToolbarButton>

      <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        active={false}
        title="Undo"
        disabled={!editor.can().undo()}
      >
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        active={false}
        title="Redo"
        disabled={!editor.can().redo()}
      >
        <Redo size={14} />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  children, onClick, active, title, disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}
