import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { searchNotes } from '@/lib/rag'
import OpenAI from 'openai'
import { X, Send, Trash2, Sparkles, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import katex from 'katex'

const SYSTEM_PROMPT = `You are an expert physics tutor. You help university students understand physics concepts clearly and intuitively. When relevant, use the student's own notes as context.

Rules:
- Always explain the physics conceptually first, then mathematically
- Use analogies to make abstract concepts concrete
- When writing equations, use LaTeX notation wrapped in $ for inline (e.g. $F=ma$) or $$ for display
- Break down complex problems step-by-step
- Ask clarifying questions when the question is ambiguous
- Reference the student's notes when they are relevant`

interface Props {
  noteId: string
  onClose: () => void
}

export function AISidebar({ noteId, onClose }: Props) {
  const { apiKeys, chatHistory, addMessage, clearChat, isThinking, setThinking } = useAIStore()
  const { notes } = useAppStore()
  const messages = chatHistory[noteId] ?? []
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  async function send() {
    const text = input.trim()
    if (!text || !apiKeys.openai || isThinking) return
    setInput('')
    addMessage(noteId, { role: 'user', content: text })
    setThinking(true)

    try {
      const client = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true })

      // RAG: find relevant note chunks
      let context = ''
      try {
        const hits = await searchNotes(apiKeys.openai, text, 4)
        if (hits.length) {
          const noteMap = Object.fromEntries(notes.map((n) => [n.id, n.title]))
          context = '\n\nRelevant excerpts from your notes:\n' +
            hits.map((h) => `[${noteMap[h.noteId] ?? 'Note'}]: ${h.text}`).join('\n\n')
        }
      } catch { /* RAG optional */ }

      // Current note context
      const currentNote = notes.find((n) => n.id === noteId)
      const noteCtx = currentNote?.content
        ? `\n\nCurrent note "${currentNote.title}":\n${extractText(currentNote.content)}`
        : ''

      const history = messages.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + noteCtx + context },
          ...history,
          { role: 'user', content: text },
        ],
      })

      const reply = resp.choices[0]?.message?.content ?? 'No response.'
      addMessage(noteId, { role: 'assistant', content: reply })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      addMessage(noteId, { role: 'assistant', content: `Error: ${msg}` })
    } finally {
      setThinking(false)
    }
  }

  function extractText(contentJson: string): string {
    try {
      const doc = JSON.parse(contentJson)
      const texts: string[] = []
      function walk(node: { type?: string; text?: string; content?: unknown[] }) {
        if (node.text) texts.push(node.text)
        if (node.content) node.content.forEach((c) => walk(c as typeof node))
      }
      walk(doc)
      return texts.join(' ').slice(0, 2000)
    } catch { return '' }
  }

  return (
    <div className="flex flex-col w-80 border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[hsl(var(--border))]">
        <Bot size={15} className="text-[hsl(var(--primary))]" />
        <span className="text-sm font-semibold flex-1">AI Tutor</span>
        {!apiKeys.openai && (
          <span className="text-xs text-amber-500 mr-1">No API key</span>
        )}
        <button onClick={() => clearChat(noteId)} className="p-1 hover:text-red-500 text-[hsl(var(--muted-foreground))]" title="Clear chat">
          <Trash2 size={13} />
        </button>
        <button onClick={onClose} className="p-1 hover:text-[hsl(var(--foreground))] text-[hsl(var(--muted-foreground))]">
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={24} className="mx-auto mb-2 text-[hsl(var(--primary)/0.5)]" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Ask me anything about physics!<br />I can see your current note.</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isThinking && (
          <div className="flex gap-2 items-center text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-[hsl(var(--border))]">
        {!apiKeys.openai && (
          <p className="text-xs text-amber-600 mb-2 text-center">
            Add your OpenAI API key in Settings to use the tutor.
          </p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 text-sm bg-[hsl(var(--muted))] rounded-xl px-3 py-2 outline-none resize-none min-h-[40px] max-h-32"
            placeholder="Ask a physics question…"
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || !apiKeys.openai || isThinking}
            className={cn(
              'p-2 rounded-xl transition-colors shrink-0',
              input.trim() && apiKeys.openai && !isThinking
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            )}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const rendered = renderMarkdownWithMath(content)
  return (
    <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[95%] rounded-2xl px-3 py-2 text-sm',
          role === 'user'
            ? 'bg-[hsl(var(--primary))] text-white rounded-br-sm'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-sm'
        )}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}

function renderMarkdownWithMath(text: string): string {
  // Render display math $$...$$
  let result = text.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
    try { return katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false }) }
    catch { return latex }
  })
  // Render inline math $...$
  result = result.replace(/\$([^$\n]+)\$/g, (_, latex) => {
    try { return katex.renderToString(latex.trim(), { throwOnError: false }) }
    catch { return latex }
  })
  // Basic markdown: **bold**, *italic*, `code`, newlines
  result = result
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/10 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br>')
  return result
}
