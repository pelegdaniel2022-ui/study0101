import { useRef, useState } from 'react'
import OpenAI from 'openai'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { Camera, X, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  noteId: string
  onClose: () => void
}

export function ScanUpload({ noteId, onClose }: Props) {
  const { apiKeys } = useAIStore()
  const { notes, updateNote } = useAppStore()
  const note = notes.find((n) => n.id === noteId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setDone(false)
    setAnswer('')
  }

  async function extract() {
    if (!preview || !apiKeys.openai) return
    setLoading(true)
    try {
      const client = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true })
      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text and equations from this handwritten physics page. Preserve LaTeX equations using $...$ notation. Format neatly.',
            },
            { type: 'image_url', image_url: { url: preview } },
          ],
        }],
      })
      const extracted = resp.choices[0]?.message?.content ?? ''

      // Append to note content
      if (note) {
        const currentContent = note.content ? JSON.parse(note.content) : { type: 'doc', content: [] }
        const newParagraphs = extracted.split('\n').filter(Boolean).map((line) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: line }],
        }))
        currentContent.content = [...(currentContent.content ?? []), ...newParagraphs]
        updateNote(noteId, { content: JSON.stringify(currentContent) })
      }
      setDone(true)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error extracting text')
    } finally {
      setLoading(false)
    }
  }

  async function askAboutScan() {
    if (!preview || !question.trim() || !apiKeys.openai) return
    setLoading(true)
    try {
      const client = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true })
      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `Looking at this physics page, answer: ${question}` },
            { type: 'image_url', image_url: { url: preview } },
          ],
        }],
      })
      setAnswer(resp.choices[0]?.message?.content ?? '')
    } catch (err: unknown) {
      setAnswer(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[hsl(var(--border))]">
          <Camera size={16} className="text-[hsl(var(--primary))]" />
          <span className="font-semibold text-sm flex-1">Scan Handwritten Page</span>
          <button onClick={onClose}><X size={16} className="text-[hsl(var(--muted-foreground))]" /></button>
        </div>

        <div className="p-5 space-y-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[hsl(var(--border))] rounded-xl py-12 text-center hover:border-[hsl(var(--primary)/0.5)] transition-colors"
            >
              <Camera size={32} className="mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Tap to upload photo of handwritten notes</p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img src={preview} className="w-full rounded-xl max-h-48 object-contain bg-[hsl(var(--muted))]" />
                <button
                  onClick={() => { setPreview(null); setDone(false); setAnswer('') }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>

              {!done && (
                <button
                  onClick={extract}
                  disabled={loading || !apiKeys.openai}
                  className="w-full py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Extracting…</> : 'Extract text & equations'}
                </button>
              )}

              {done && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle size={16} /> Extracted and added to note!
                </div>
              )}

              {/* Ask question about scan */}
              <div className="border-t border-[hsl(var(--border))] pt-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Ask a question about this page:</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm bg-[hsl(var(--muted))] rounded-lg px-3 py-1.5 outline-none"
                    placeholder="What does this equation mean?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') askAboutScan() }}
                  />
                  <button
                    onClick={askAboutScan}
                    disabled={loading || !question.trim() || !apiKeys.openai}
                    className="px-3 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Ask
                  </button>
                </div>
                {answer && <p className="mt-2 text-sm bg-[hsl(var(--muted))] rounded-xl p-3">{answer}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
