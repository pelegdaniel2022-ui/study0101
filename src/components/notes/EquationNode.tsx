import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { ReactNodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import katex from 'katex'
import { detectSimulation } from '@/lib/physics-parser'
import { useAppStore } from '@/store/app'
import { FlaskConical, X, Check } from 'lucide-react'

// ─── Inline equation ───────────────────────────────────────────────────────

const InlineEquationView = (props: ReactNodeViewProps) => {
  const latex = (props.node.attrs.latex as string) ?? ''
  const [editing, setEditing] = useState(!latex)
  const [draft, setDraft] = useState(latex)

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="inline-block align-middle">
        <span className="inline-flex items-center gap-1 bg-[hsl(var(--muted))] rounded px-1 py-0.5">
          <input
            autoFocus
            className="w-32 text-xs bg-transparent outline-none font-mono"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { props.updateAttributes({ latex: draft }); setEditing(false) }
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="LaTeX…"
          />
          <button onClick={() => { props.updateAttributes({ latex: draft }); setEditing(false) }}>
            <Check size={12} className="text-green-600" />
          </button>
          <button onClick={() => setEditing(false)}><X size={12} className="text-red-500" /></button>
        </span>
      </NodeViewWrapper>
    )
  }

  let html = ''
  try { html = katex.renderToString(latex, { throwOnError: false }) }
  catch { html = latex }

  return (
    <NodeViewWrapper as="span" className="inline-block align-middle cursor-pointer" onClick={() => setEditing(true)}>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  )
}

export const InlineEquation = Node.create({
  name: 'inlineEquation',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() { return { latex: { default: '' } } },
  parseHTML() { return [{ tag: 'span[data-eq]' }] },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes, { 'data-eq': '' })] },
  addNodeView() { return ReactNodeViewRenderer(InlineEquationView) },
})

// ─── Block equation ──────────────────────────────────────────────────────────

const BlockEquationView = (props: ReactNodeViewProps) => {
  const latex = (props.node.attrs.latex as string) ?? ''
  const [editing, setEditing] = useState(!latex)
  const [draft, setDraft] = useState(latex)
  const { setActiveView } = useAppStore()
  const sim = detectSimulation(latex)

  if (editing) {
    return (
      <NodeViewWrapper>
        <div className="my-4 p-3 border border-[hsl(var(--primary)/0.3)] rounded-xl bg-[hsl(var(--muted)/0.4)]">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">LaTeX equation</div>
          <textarea
            autoFocus
            className="w-full font-mono text-sm bg-transparent outline-none resize-none"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                props.updateAttributes({ latex: draft })
                setEditing(false)
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="e.g. E = mc^2"
          />
          <div className="flex gap-2 mt-2">
            <button className="text-xs px-3 py-1 bg-[hsl(var(--primary))] text-white rounded-lg" onClick={() => { props.updateAttributes({ latex: draft }); setEditing(false) }}>Done</button>
            <button className="text-xs px-3 py-1 text-[hsl(var(--muted-foreground))]" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  let html = ''
  try { html = katex.renderToString(latex, { throwOnError: false, displayMode: true }) }
  catch { html = latex }

  return (
    <NodeViewWrapper>
      <div className="my-4 p-3 text-center border border-[hsl(var(--border))] rounded-xl hover:border-[hsl(var(--primary)/0.4)] group cursor-pointer select-none" onClick={() => setEditing(true)}>
        <span dangerouslySetInnerHTML={{ __html: html }} />
        <div className="flex items-center justify-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Click to edit</span>
          {sim && (
            <button className="flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full" onClick={(e) => { e.stopPropagation(); setActiveView({ type: 'simulations' }) }}>
              <FlaskConical size={11} /> {sim.label}
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const BlockEquation = Node.create({
  name: 'blockEquation',
  group: 'block',
  atom: true,
  addAttributes() { return { latex: { default: '' } } },
  parseHTML() { return [{ tag: 'div[data-block-eq]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-block-eq': '' })] },
  addNodeView() { return ReactNodeViewRenderer(BlockEquationView) },
})
