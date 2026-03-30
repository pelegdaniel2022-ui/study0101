import { useState } from 'react'
import { PendulumSim } from '@/components/simulation/PendulumSim'
import { ProjectileSim } from '@/components/simulation/ProjectileSim'
import { HarmonicSim } from '@/components/simulation/HarmonicSim'
import { WaveSim } from '@/components/simulation/WaveSim'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'pendulum' | 'projectile' | 'harmonic' | 'wave'

const TABS: Array<{ key: Tab; label: string; formula: string }> = [
  { key: 'pendulum', label: 'Pendulum', formula: 'T = 2π√(L/g)' },
  { key: 'projectile', label: 'Projectile', formula: 'y = v₀t − ½gt²' },
  { key: 'harmonic', label: 'SHO', formula: 'F = −kx' },
  { key: 'wave', label: 'Waves', formula: 'v = fλ' },
]

export function SimulationsView() {
  const [tab, setTab] = useState<Tab>('pendulum')
  const [pendulumP, setPendulumP] = useState({ length: 1.0, gravity: 9.81, angle: 20 })
  const [projectileP, setProjectileP] = useState({ v0: 20, angle: 45, gravity: 9.81, airResistance: 0 })
  const [harmonicP, setHarmonicP] = useState({ mass: 1.0, springK: 10, amplitude: 0.5, damping: 0.1 })
  const [waveP, setWaveP] = useState({ frequency: 1, amplitude: 1, speed: 2, sources: 1 })

  function patchParam(setter: React.Dispatch<React.SetStateAction<Record<string, number>>>) {
    return (k: string, v: number) => setter((p) => ({ ...p, [k]: v }))
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FlaskConical size={20} className="text-[hsl(var(--primary))]" />
        <h1 className="text-xl font-bold">Physics Simulations</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[hsl(var(--muted))] p-1 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-sm transition-all',
              tab === t.key
                ? 'bg-[hsl(var(--background))] shadow text-[hsl(var(--foreground))] font-medium'
                : 'text-[hsl(var(--muted-foreground))]'
            )}
          >
            <div>{t.label}</div>
            <div className="text-xs opacity-60 font-mono">{t.formula}</div>
          </button>
        ))}
      </div>

      {/* Sim */}
      <div className="flex justify-center">
        {tab === 'pendulum' && (
          <PendulumSim {...pendulumP} onParam={patchParam(setPendulumP as React.Dispatch<React.SetStateAction<Record<string, number>>>)} />
        )}
        {tab === 'projectile' && (
          <ProjectileSim {...projectileP} onParam={patchParam(setProjectileP as React.Dispatch<React.SetStateAction<Record<string, number>>>)} />
        )}
        {tab === 'harmonic' && (
          <HarmonicSim {...harmonicP} onParam={patchParam(setHarmonicP as React.Dispatch<React.SetStateAction<Record<string, number>>>)} />
        )}
        {tab === 'wave' && (
          <WaveSim {...waveP} onParam={patchParam(setWaveP as React.Dispatch<React.SetStateAction<Record<string, number>>>)} />
        )}
      </div>
    </div>
  )
}
