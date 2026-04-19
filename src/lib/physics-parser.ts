import type { SimConfig } from '@/types'

// Extend SimConfig to include the two new simulation types
type ExtendedSimType = SimConfig['type'] | 'circular' | 'energy'

interface PatternMatch {
  sim: { type: ExtendedSimType; params: Record<string, number> }
  label: string
}

const PATTERNS: Array<{ regex: RegExp; build: (m: RegExpMatchArray) => PatternMatch }> = [
  {
    // pendulum: T = 2π√(L/g)
    regex: /T\s*=\s*2\s*\\?pi\s*\\?sqrt\s*\{?\s*[Ll]\s*\/?\s*g\s*\}?/i,
    build: () => ({
      label: 'Pendulum (T = 2π√(L/g))',
      sim: { type: 'pendulum', params: { length: 1.0, gravity: 9.81, angle: 20 } },
    }),
  },
  {
    // projectile: y = v0*t - 0.5*g*t^2
    regex: /y\s*=\s*v_?0?\s*t|v_?[x0]\s*=\s*v_?0\s*\\?cos/i,
    build: () => ({
      label: 'Projectile Motion',
      sim: { type: 'projectile', params: { v0: 20, angle: 45, gravity: 9.81, airResistance: 0 } },
    }),
  },
  {
    // SHM: x = A*cos(ωt)
    regex: /x\s*=\s*A\s*\\?cos|F\s*=\s*-k\s*x|\\?omega\s*=\s*\\?sqrt\s*\{?\s*k\s*\/?\s*m/i,
    build: () => ({
      label: 'Simple Harmonic Oscillator',
      sim: { type: 'harmonic', params: { mass: 1.0, springK: 10, amplitude: 0.5, damping: 0.1 } },
    }),
  },
  {
    // Wave: y = A*sin(kx - ωt)
    regex: /y\s*=\s*A\s*\\?sin\s*\(?\s*k\s*x|\\?lambda\s*f\s*=\s*v/i,
    build: () => ({
      label: 'Wave Interference',
      sim: { type: 'wave', params: { frequency: 1, amplitude: 1, speed: 2, sources: 2 } },
    }),
  },
]

export function detectSimulation(latex: string): PatternMatch | null {
  for (const p of PATTERNS) {
    const m = latex.match(p.regex)
    if (m) return p.build(m)
  }
  return null
}
