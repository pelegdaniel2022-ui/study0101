import { useState } from 'react'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { Search, Loader2, BookmarkPlus, Clock, ExternalLink } from 'lucide-react'
import katex from 'katex'

export function ResearchPanel() {
  const { apiKeys, researchHistory, addResearch } = useAIStore()
  const { notes, activeView, addNote, lectures, courses, setActiveView } = useAppStore()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [sources, setSources] = useState<Array<{ title: string; url: string }>>([])
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!query.trim() || !apiKeys.perplexity) return
    setLoading(true)
    setResult('')
    setSources([])

    try {
      const resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.perplexity}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a physics research assistant. Provide detailed, accurate physics explanations with equations in LaTeX ($...$). Include relevant formulas and derivations.',
            },
            { role: 'user', content: query },
          ],
          return_citations: true,
        }),
      })

      const data = await resp.json()
      const content = data.choices?.[0]?.message?.content ?? 'No result'
      const citations = data.citations ?? []
      setResult(content)
      setSources(citations.map((url: string, i: number) => ({ title: `Source ${i + 1}`, url })))
      addResearch(query, content)
    } catch (err: unknown) {
      setResult(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function saveToNote() {
    if (!result) return
    // Find or create a Research course/lecture
    let courseId = courses.find((c) => c.name === 'Research')?.id
    if (!courseId) {
      const c = useAppStore.getState().addCourse({ name: 'Research', color: '#2563eb' })
      courseId = c.id
    }
    let lectureId = lectures.find((l) => l.courseId === courseId && l.title === 'Research Notes')?.id
    if (!lectureId) {
      const l = useAppStore.getState().addLecture({ courseId, title: 'Research Notes', date: Date.now() })
      lectureId = l.id
    }

    const paragraphs = result.split('\n').filter(Boolean).map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    }))
    const note = addNote({
      lectureId,
      courseId,
      title: query.slice(0, 60),
      content: JSON.stringify({ type: 'doc', content: paragraphs }),
      mode: 'document',
      tags: ['research'],
    })
    setActiveView({ type: 'note', noteId: note.id })
    void notes
    void activeView
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
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">Research Workspace</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Deep physics research powered by Perplexity AI</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:border-[hsl(var(--primary))] text-sm"
          placeholder="Search any physics concept…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search() }}
        />
        <button
          onClick={search}
          disabled={loading || !apiKeys.perplexity || !query.trim()}
          className="px-4 py-2.5 bg-[hsl(var(--primary))] text-white rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search
        </button>
      </div>

      {!apiKeys.perplexity && (
        <div className="text-center py-4 text-amber-600 text-sm">
          Add your Perplexity API key in Settings to use research.
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{query}</h3>
            <button
              onClick={saveToNote}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))] rounded-lg transition-colors"
            >
              <BookmarkPlus size={13} /> Save to note
            </button>
          </div>
          <div
            className="text-sm leading-relaxed bg-[hsl(var(--muted)/0.4)] rounded-xl p-4"
            dangerouslySetInnerHTML={{ __html: renderMath(result) }}
          />
          {sources.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Sources</p>
              {sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] hover:underline">
                  <ExternalLink size={11} /> {s.title || s.url}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {!result && researchHistory.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock size={12} /> Recent searches
          </p>
          <div className="space-y-1">
            {researchHistory.slice(0, 8).map((r, i) => (
              <button
                key={i}
                onClick={() => { setQuery(r.query); setResult(r.result) }}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              >
                {r.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
