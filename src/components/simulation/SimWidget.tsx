import { useState } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { ReactNodeViewProps } from '@tiptap/react'
import { PendulumSim } from './PendulumSim'
import { ProjectileSim } from './ProjectileSim'
import { HarmonicSim } from './HarmonicSim'
import { WaveSim } from './WaveSim'
import { CircularSim } from './CircularSim'
import { EnergySim } from './EnergySim'
import { CollisionSim } from './CollisionSim'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type SimType = 'pendulum' | 'projectile' | 'harmonic' | 'wave' | 'circular' | 'energy' | 'collision'

const SIM_LABELS: Record<SimType, string> = {
  pendulum:   'Pendulum',
  projectile: 'Projectile Motion',
  harmonic:   'Harmonic Oscillator',
  wave:       'Wave Interference',
  circular:   'Circular Motion',
  energy:     'Energy Conservation',
  collision:  'Collision',
}

const DEFAULTS: Record<SimType, Record<string, number>> = {
  pendulum:   { length: 1.0, gravity: 9.81, angle: 20 },
  projectile: { v0: 20, angle: 45, gravity: 9.81, airResistance: 0 },
  harmonic:   { mass: 1.0, springK: 10, amplitude: 0.5, damping: 0.1 },
  wave:       { frequency: 1, amplitude: 1, speed: 2, sources: 1 },
  circular:   { radius: 2, speed: 4, mass: 1 },
  energy:     { mass: 2, height: 4, gravity: 9.81 },
  collision:  { m1: 2, m2: 1, v1: 5, restitution: 1 },
}

const SimWidgetView = (props: ReactNodeViewProps) => {
  const simType = ((props.node.attrs.simType as string) ?? 'pendulum') as SimType
  const paramsStr = props.node.attrs.params as string | null
  const params: Record<string, number> = paramsStr ? JSON.parse(paramsStr) : DEFAULTS[simType]

  const [collapsed, setCollapsed] = useState(false)
  const [type, setType] = useState<SimType>(simType)

  function handleParam(k: string, v: number) {
    props.updateAttributes({ simType: type, params: JSON.stringify({ ...params, [k]: v }) })
  }

  function handleTypeChange(t: SimType) {
    setType(t)
    props.updateAttributes({ simType: t, params: JSON.stringify(DEFAULTS[t]) })
  }

  const p = params

  return (
    <NodeViewWrapper>
      <div className={cn('my-4 border border-[hsl(var(--border))] rounded-xl overflow-hidden bg-[hsl(var(--muted)/0.2)]')}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as SimType)}
            className="text-xs font-medium bg-transparent outline-none cursor-pointer flex-1"
          >
            {(Object.keys(SIM_LABELS) as SimType[]).map((k) => (
              <option key={k} value={k}>{SIM_LABELS[k]}</option>
            ))}
          </select>
          <button onClick={() => setCollapsed((c) => !c)} className="text-[hsl(var(--muted-foreground))] p-0.5">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={props.deleteNode} className="text-[hsl(var(--muted-foreground))] hover:text-red-500 p-0.5">
            <X size={14} />
          </button>
        </div>

        {!collapsed && (
          <div className="p-3">
            {type === 'pendulum'   && <PendulumSim   length={p.length ?? 1}       gravity={p.gravity ?? 9.81} angle={p.angle ?? 20}        onParam={handleParam} />}
            {type === 'projectile' && <ProjectileSim v0={p.v0 ?? 20}              angle={p.angle ?? 45}       gravity={p.gravity ?? 9.81}  airResistance={p.airResistance ?? 0} onParam={handleParam} />}
            {type === 'harmonic'   && <HarmonicSim   mass={p.mass ?? 1}           springK={p.springK ?? 10}   amplitude={p.amplitude ?? 0.5} damping={p.damping ?? 0.1} onParam={handleParam} />}
            {type === 'wave'       && <WaveSim        frequency={p.frequency ?? 1} amplitude={p.amplitude ?? 1} speed={p.speed ?? 2}        sources={p.sources ?? 1} onParam={handleParam} />}
            {type === 'circular'   && <CircularSim   radius={p.radius ?? 2}       speed={p.speed ?? 4}         mass={p.mass ?? 1}          onParam={handleParam} />}
            {type === 'energy'     && <EnergySim     mass={p.mass ?? 2}           height={p.height ?? 4}       gravity={p.gravity ?? 9.81} onParam={handleParam} />}
            {type === 'collision'  && <CollisionSim  m1={p.m1 ?? 2}              m2={p.m2 ?? 1}               v1={p.v1 ?? 5}              restitution={p.restitution ?? 1} onParam={handleParam} />}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const SimWidgetNode = Node.create({
  name: 'simWidget',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      simType: { default: 'pendulum' },
      params:  { default: null },
    }
  },
  parseHTML() { return [{ tag: 'div[data-sim]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-sim': '' })] },
  addNodeView() { return ReactNodeViewRenderer(SimWidgetView) },
})
