import { useState } from 'react'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { AISidebar } from '@/components/ai/AISidebar'
import { Bot, Settings } from 'lucide-react'

export function AITutorView() {
  const { apiKeys } = useAIStore()
  const { setActiveView } = useAppStore()
  const [open, setOpen] = useState(true)

  if (!apiKeys.openai) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="p-4 rounded-2xl bg-[hsl(var(--primary)/0.1)] mb-4">
          <Bot size={36} className="text-[hsl(var(--primary))]" />
        </div>
        <h2 className="text-xl font-bold mb-2">AI Tutor</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">
          Add your OpenAI API key to start chatting with your personal physics tutor.
        </p>
        <button
          onClick={() => setActiveView({ type: 'settings' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(var(--primary))] text-white rounded-xl text-sm"
        >
          <Settings size={15} /> Go to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-[hsl(var(--muted-foreground))]">
        <Bot size={40} className="mb-3 text-[hsl(var(--primary)/0.3)]" />
        <p className="text-sm">Open a note and click the <Bot size={12} className="inline" /> icon to chat with your tutor in context.</p>
        <p className="text-xs mt-2">Or use the panel on the right for a general session.</p>
      </div>
      {open && (
        <AISidebar noteId="global" onClose={() => setOpen(false)} />
      )}
      {!open && (
        <button onClick={() => setOpen(true)} className="m-4 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm">
          Open Tutor
        </button>
      )}
    </div>
  )
}
