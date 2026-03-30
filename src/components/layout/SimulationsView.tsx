import { FlaskConical, Sparkles } from 'lucide-react'

export function SimulationsView() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="p-4 rounded-2xl bg-[#05966918] mb-4">
        <FlaskConical size={36} className="text-[#059669]" />
      </div>
      <h2 className="text-xl font-bold mb-2">Physics Simulations</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">
        Interactive physics widgets: pendulum, projectile motion, harmonic oscillator,
        and more — embeddable directly into your notes.
      </p>
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-4 py-2 rounded-full">
        <Sparkles size={12} />
        Coming in Phase 4 — Physics Depth
      </div>
    </div>
  )
}
