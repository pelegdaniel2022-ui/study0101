import { useEffect, useRef, useState } from 'react'
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu'
import type { Editor } from '@tiptap/core'
import { Bold, Italic, Underline, Strikethrough, Code, Highlighter, Link, FunctionSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

// Export the extension for use in editor setup
export { BubbleMenuExtension }

export function BubbleMenuBar({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      const { from, to } = editor.state.selection
      if (from === to) { setVisible(false); return }
      const view = editor.view
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      const top = Math.min(start.top, end.top) - 48 + window.scrollY
      const left = (start.left + end.right) / 2 - 100
      setPos({ top, left: Math.max(8, left) })
      setVisible(true)
    }

    editor.on('selectionUpdate', update)
    editor.on('blur', () => setVisible(false))
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', () => setVisible(false))
    }
  }, [editor])

  if (!visible) return null

  function insertInlineEq() {
    editor.chain().focus().insertContent({ type: 'inlineEquation', attrs: { latex: '' } }).run()
  }

  function setLink() {
    const url = prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return createPortal(
    <div
      ref={containerRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 100 }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-0.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg shadow-lg px-1 py-1"
    >
      <BBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></BBtn>
      <BBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></BBtn>
      <BBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={14} /></BBtn>
      <BBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike"><Strikethrough size={14} /></BBtn>
      <BBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter size={14} /></BBtn>
      <BBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code"><Code size={14} /></BBtn>
      <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />
      <BBtn active={editor.isActive('link')} onClick={setLink} title="Link"><Link size={14} /></BBtn>
      <BBtn active={false} onClick={insertInlineEq} title="Inline equation"><FunctionSquare size={14} /></BBtn>
    </div>,
    document.body
  )
}

function BBtn({ children, active, onClick, title }: {
  children: React.ReactNode; active: boolean; onClick: () => void; title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
      )}
    >
      {children}
    </button>
  )
}
