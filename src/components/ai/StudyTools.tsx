import { useState } from 'react'
import OpenAI from 'openai'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { Sparkles, BookOpen, HelpCircle, CreditCard, FileText, X, Loader2, Download } from 'lucide-react'
import type { FlashCard } from '@/types'
import katex from 'katex'

interface Props {
  noteId: string
  onClose: () => void
}

type ToolMode = 'summarize' | 'explain' | 'flashcards' | 'quiz' | 'outline'

export function StudyTools({ noteId, onClose }: Props) {
  const { apiKeys } = useAIStore()
  const { notes } = useAppStore()
  const note = notes.find((n) => n.id === noteId)
  const [mode, setMode] = useState<ToolMode>('summarize')
  const [result, setResult] = useState('')
  const [flashCards, setFlashCards] = useState<FlashCard[]>([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  function extractText(): string {
    if (!note?.content) return ''
    try {
      const doc = JSON.parse(note.content)
      const texts: string[] = []
      function walk(node: { type?: string; text?: string; content?: unknown[] }) {
        if (node.text) texts.push(node.text)
        if (node.content) node.content.forEach((c) => walk(c as typeof node))
      }
      walk(doc)
      return texts.join(' ').slice(0, 4000)
    } catch { return '' }
  }

  async function run() {
    if (!apiKeys.openai) return
    const text = extractText()
    if (!text.trim()) return
    setLoading(true)
    setResult('')
    setFlashCards([])

    const client = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true })

    const prompts: Record<ToolMode, string> = {
      summarize: `Summarize these physics notes concisely. Highlight key concepts and equations. Notes:\n\n${text}`,
      explain: `Give a deep, intuitive explanation of the key physics concepts in these notes. Use analogies. Notes:\n\n${text}`,
      flashcards: `Create 8 flashcards from these physics notes. Return ONLY a JSON array: [{"front":"question","back":"answer"},...]. Notes:\n\n${text}`,
      quiz: `Create 5 practice physics questions from these notes. Include answers. Notes:\n\n${text}`,
      outline: `Create a detailed study outline/slide structure from these notes. Use bullet points. Notes:\n\n${text}`,
    }

    try {
      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompts[mode] }],
      })
      const content = resp.choices[0]?.message?.content ?? ''

      if (mode === 'flashcards') {
        try {
          const json = content.replace(/```json|```/g, '').trim()
          const cards = JSON.parse(json) as FlashCard[]
          setFlashCards(cards)
        } catch {
          setResult(content)
        }
      } else {
        setResult(content)
      }
    } catch (err: unknown) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function exportAnki() {
    const csv = flashCards.map((c) => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note?.title ?? 'flashcards'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TOOLS: Array<{ key: ToolMode; label: string; icon: React.ReactNode }> = [
    { key: 'summarize', label: 'Summarize', icon: <Sparkles size={14} /> },
    { key: 'explain', label: 'Deep Explain', icon: <BookOpen size={14} /> },
    { key: 'flashcards', label: 'Flashcards', icon: <CreditCard size={14} /> },
    { key: 'quiz', label: 'Quiz Me', icon: <HelpCircle size={14} /> },
    { key: 'outline', label: 'Outline', icon: <FileText size={14} /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[hsl(var(--border))]">
          <Sparkles size={16} className="text-[hsl(var(--primary))]" />
          <span className="font-semibold text-sm flex-1">Study Tools — {note?.title}</span>
          <button onClick={onClose} className="p-1 hover:text-[hsl(var(--foreground))] text-[hsl(var(--muted-foreground))]"><X size={16} /></button>
        </div>

        {/* Tool selector */}
        <div className="flex gap-1 p-3 border-b border-[hsl(var(--border))]">
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${mode === t.key ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Result area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!result && flashCards.length === 0 && !loading && (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <p className="text-sm">Click Generate to create {mode} from your note.</p>
              {!apiKeys.openai && <p className="text-amber-500 text-xs mt-2">Add OpenAI API key in Settings first.</p>}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12 gap-3 text-[hsl(var(--muted-foreground))]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Generating…</span>
            </div>
          )}

          {result && !loading && (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderMath(result) }}
            />
          )}

          {flashCards.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{flashCards.length} cards — click to flip</span>
                <button onClick={exportAnki} className="flex items-center gap-1 text-xs px-2 py-1 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]">
                  <Download size={12} /> Export Anki CSV
                </button>
              </div>
              {flashCards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => setFlipped((f) => { const n = new Set(f); n.has(i) ? n.delete(i) : n.add(i); return n })}
                  className="border border-[hsl(var(--border))] rounded-xl p-4 cursor-pointer hover:border-[hsl(var(--primary)/0.4)] transition-colors min-h-[80px] flex items-center"
                >
                  <div className="w-full">
                    {!flipped.has(i) ? (
                      <div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Question</div>
                        <div className="text-sm font-medium">{card.front}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-emerald-500 mb-1">Answer</div>
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: renderMath(card.back) }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[hsl(var(--border))]">
          <button
            onClick={run}
            disabled={loading || !apiKeys.openai}
            className="w-full py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function renderMath(text: string): string {
  let r = text.replace(/\$\$([^$]+)\$\$/g, (_, l) => {
    try { return katex.renderToString(l.trim(), { displayMode: true, throwOnError: false }) } catch { return l }
  })
  r = r.replace(/\$([^$\n]+)\$/g, (_, l) => {
    try { return katex.renderToString(l.trim(), { throwOnError: false }) } catch { return l }
  })
  return r
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-[hsl(var(--muted))] px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br>')
}
