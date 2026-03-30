import { Bot, Sparkles } from 'lucide-react'

export function AITutorView() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="p-4 rounded-2xl bg-[hsl(var(--primary)/0.1)] mb-4">
        <Bot size={36} className="text-[hsl(var(--primary))]" />
      </div>
      <h2 className="text-xl font-bold mb-2">AI Physics Tutor</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">
        Your personal tutor that knows your notes, explains concepts step-by-step,
        and generates practice problems.
      </p>
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-4 py-2 rounded-full">
        <Sparkles size={12} />
        Coming in Phase 3 — AI Integration
      </div>
    </div>
  )
}
