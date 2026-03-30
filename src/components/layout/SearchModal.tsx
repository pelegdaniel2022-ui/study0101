import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app'
import { Search, FileText, X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function SearchModal({ onClose }: Props) {
  const { notes, setActiveView } = useAppStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function extractText(content: string): string {
    try {
      const doc = JSON.parse(content)
      const texts: string[] = []
      function walk(node: { type?: string; text?: string; content?: unknown[] }) {
        if (node.text) texts.push(node.text)
        if (node.content) node.content.forEach((c) => walk(c as typeof node))
      }
      walk(doc)
      return texts.join(' ')
    } catch { return '' }
  }

  const results = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase()
        const text = extractText(n.content).toLowerCase()
        return (
          n.title.toLowerCase().includes(q) ||
          text.includes(q) ||
          n.tags.some((t) => t.includes(q))
        )
      }).slice(0, 10)
    : []

  function highlight(text: string, q: string): string {
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text.slice(0, 80)
    const start = Math.max(0, idx - 30)
    const snippet = text.slice(start, start + 100)
    return snippet.replace(new RegExp(q, 'gi'), (m) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${m}</mark>`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20" onClick={onClose}>
      <div
        className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
          <Search size={18} className="text-[hsl(var(--muted-foreground))] shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 text-sm bg-transparent outline-none"
            placeholder="Search notes, titles, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-[hsl(var(--muted-foreground))]" /></button>}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && query && (
            <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No results for "{query}"</div>
          )}
          {results.length === 0 && !query && (
            <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">Type to search your notes</div>
          )}
          {results.map((note) => {
            const text = extractText(note.content)
            return (
              <button
                key={note.id}
                onClick={() => { setActiveView({ type: 'note', noteId: note.id }); onClose() }}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[hsl(var(--muted))] text-left"
              >
                <FileText size={15} className="text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{note.title}</div>
                  {text && (
                    <div
                      className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5"
                      dangerouslySetInnerHTML={{ __html: highlight(text, query) + '…' }}
                    />
                  )}
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {note.tags.map((t) => (
                        <span key={t} className="text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-[hsl(var(--border))] flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>↑↓ navigate</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}
