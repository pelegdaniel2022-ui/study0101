import { useState } from 'react'
import OpenAI from 'openai'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { LibraryBig, Loader2, Check, Wand2 } from 'lucide-react'

interface Suggestion {
  noteId: string
  suggestedTags: string[]
  summary: string
  relatedNoteIds: string[]
}

export function LibrarianPanel() {
  const { apiKeys } = useAIStore()
  const { notes, courses, lectures, updateNote } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [applied, setApplied] = useState<Set<string>>(new Set())

  function extractText(content: string): string {
    try {
      const doc = JSON.parse(content)
      const texts: string[] = []
      function walk(node: { type?: string; text?: string; content?: unknown[] }) {
        if (node.text) texts.push(node.text)
        if (node.content) node.content.forEach((c) => walk(c as typeof node))
      }
      walk(doc)
      return texts.join(' ').slice(0, 600)
    } catch { return '' }
  }

  async function organize() {
    if (!apiKeys.openai || notes.length === 0) return
    setLoading(true)
    setSuggestions([])

    const client = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true })

    const noteSummaries = notes.map((n) => ({
      id: n.id,
      title: n.title,
      excerpt: extractText(n.content ?? '').slice(0, 200),
    }))

    try {
      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `You are a knowledge librarian. Analyze these physics notes and return a JSON array of suggestions.

Notes:
${JSON.stringify(noteSummaries, null, 2)}

Return ONLY valid JSON array:
[{"noteId":"...","suggestedTags":["tag1","tag2"],"summary":"1 sentence summary","relatedNoteIds":["id1"]}]

Max 3 tags per note. Identify physics topics: mechanics, thermodynamics, electromagnetism, optics, quantum, etc.`,
        }],
      })

      const content = resp.choices[0]?.message?.content ?? '[]'
      const json = content.replace(/```json|```/g, '').trim()
      setSuggestions(JSON.parse(json))
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function applyTags(noteId: string, tags: string[]) {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    const merged = [...new Set([...note.tags, ...tags])]
    updateNote(noteId, { tags: merged })
    setApplied((a) => new Set([...a, noteId]))
  }

  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]))
  void courses
  void lectures

  return (
    <div className="h-full overflow-y-auto px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LibraryBig size={20} className="text-[hsl(var(--primary))]" />
          <h1 className="text-xl font-bold">AI Librarian</h1>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Automatically tags and connects your notes using AI.
        </p>
      </div>

      <button
        onClick={organize}
        disabled={loading || !apiKeys.openai || notes.length === 0}
        className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-medium disabled:opacity-50 mb-6"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
        {loading ? 'Analyzing notes…' : 'Organize My Notes'}
      </button>

      {!apiKeys.openai && (
        <p className="text-amber-600 text-sm mb-4">Add your OpenAI API key in Settings.</p>
      )}

      {notes.length === 0 && (
        <p className="text-[hsl(var(--muted-foreground))] text-sm">No notes yet to organize.</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Suggestions ({suggestions.length})
          </p>
          {suggestions.map((s) => {
            const note = noteMap[s.noteId]
            if (!note) return null
            const isApplied = applied.has(s.noteId)

            return (
              <div key={s.noteId} className="border border-[hsl(var(--border))] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{note.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.suggestedTags.map((tag) => (
                        <span key={tag} className="bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-2 py-0.5 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {s.relatedNoteIds.length > 0 && (
                      <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        Related: {s.relatedNoteIds.map((id) => noteMap[id]?.title ?? id).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => applyTags(s.noteId, s.suggestedTags)}
                    disabled={isApplied}
                    className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${isApplied ? 'bg-emerald-100 text-emerald-700' : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]'}`}
                  >
                    <Check size={12} /> {isApplied ? 'Applied' : 'Apply tags'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
