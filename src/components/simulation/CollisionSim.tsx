import { useEffect, useRef, useState } from 'react'

interface Props {
  m1: number    // kg
  m2: number    // kg
  v1: number    // m/s (initial velocity of ball 1)
  restitution: number  // 0=perfectly inelastic, 1=elastic
  onParam?: (k: string, v: number) => void
}

export function CollisionSim({ m1, m2, v1, restitution, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ x1: 0, x2: 0, v1: 0, v2: 0, collided: false })
  const animRef = useRef<number>(0)
  const [info, setInfo] = useState({ v1After: 0, v2After: 0, pBefore: 0, pAfter: 0, keBefore: 0, keAfter: 0 })

  void onParam

  useEffect(() => {
    stateRef.current = { x1: 60, x2: 260, v1: v1, v2: 0, collided: false }
  }, [m1, m2, v1, restitution])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const r1 = 8 + m1 * 2
    const r2 = 8 + m2 * 2
    const groundY = H / 2 + 10
    const dt = 0.016
    const scale = 18  // px per m/s display speed

    stateRef.current = { x1: 60, x2: 260, v1: v1, v2: 0, collided: false }

    function draw() {
      const s = stateRef.current

      // Physics step (1D)
      s.x1 += s.v1 * scale * dt
      s.x2 += s.v2 * scale * dt

      // Collision detection
      if (!s.collided && s.x1 + r1 >= s.x2 - r2) {
        s.collided = true
        // 1D collision formulas
        const e = restitution
        const newV1 = ((m1 - e * m2) * s.v1 + (1 + e) * m2 * s.v2) / (m1 + m2)
        const newV2 = ((m2 - e * m1) * s.v2 + (1 + e) * m1 * s.v1) / (m1 + m2)
        const pBefore = m1 * s.v1 + m2 * s.v2
        const keBefore = 0.5 * m1 * s.v1 ** 2 + 0.5 * m2 * s.v2 ** 2
        const pAfter = m1 * newV1 + m2 * newV2
        const keAfter = 0.5 * m1 * newV1 ** 2 + 0.5 * m2 * newV2 ** 2
        setInfo({ v1After: newV1, v2After: newV2, pBefore, pAfter, keBefore, keAfter })
        s.v1 = newV1
        s.v2 = newV2
      }

      // Wall bounces
      if (s.x1 - r1 < 0) { s.x1 = r1; s.v1 = Math.abs(s.v1) }
      if (s.x2 + r2 > W) { s.x2 = W - r2; s.v2 = -Math.abs(s.v2) }
      // Re-enable collision after balls separate
      if (s.collided && s.x2 - r2 > s.x1 + r1 + 2) s.collided = false

      ctx.clearRect(0, 0, W, H)

      // Track line
      ctx.fillStyle = 'hsl(240 12% 22%)'
      ctx.fillRect(0, groundY - 2, W, 4)

      // Ball 1
      ctx.beginPath()
      ctx.arc(s.x1, groundY - r1, r1, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.max(9, r1 - 2)}px Inter, system-ui`
      ctx.textAlign = 'center'
      ctx.fillText('1', s.x1, groundY - r1 + 4)

      // Ball 2
      ctx.beginPath()
      ctx.arc(s.x2, groundY - r2, r2, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.max(9, r2 - 2)}px Inter, system-ui`
      ctx.fillText('2', s.x2, groundY - r2 + 4)
      ctx.textAlign = 'left'

      // Velocity arrows
      drawArrow(ctx, s.x1, groundY - r1 * 2 - 4, s.v1, '#7c3aed')
      drawArrow(ctx, s.x2, groundY - r2 * 2 - 4, s.v2, '#f59e0b')

      // Labels
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px Inter, system-ui'
      ctx.fillText(`m₁=${m1}kg  m₂=${m2}kg  e=${restitution}`, 8, H - 4)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [m1, m2, v1, restitution])

  function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, v: number, color: string) {
    if (Math.abs(v) < 0.05) return
    const len = Math.max(15, Math.min(50, Math.abs(v) * 8))
    const dir = v > 0 ? 1 : -1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dir * len, y)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
    // arrowhead
    ctx.beginPath()
    ctx.moveTo(x + dir * len, y)
    ctx.lineTo(x + dir * (len - 7), y - 4)
    ctx.lineTo(x + dir * (len - 7), y + 4)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={340} height={220} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]" />

      {/* Collision results */}
      {info.pBefore !== 0 && (
        <div className="w-full grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[hsl(var(--muted)/0.5)] rounded-lg p-2">
            <div className="font-medium mb-1 text-[hsl(var(--foreground))]">After collision</div>
            <div className="text-[hsl(var(--muted-foreground))]">v₁ = {info.v1After.toFixed(2)} m/s</div>
            <div className="text-[hsl(var(--muted-foreground))]">v₂ = {info.v2After.toFixed(2)} m/s</div>
          </div>
          <div className="bg-[hsl(var(--muted)/0.5)] rounded-lg p-2">
            <div className="font-medium mb-1 text-[hsl(var(--foreground))]">Conservation</div>
            <div className="text-[hsl(var(--muted-foreground))]">p: {info.pBefore.toFixed(2)} → {info.pAfter.toFixed(2)} kg·m/s</div>
            <div className="text-[hsl(var(--muted-foreground))]">KE: {info.keBefore.toFixed(1)} → {info.keAfter.toFixed(1)} J</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 w-full">
        <Slider label="Mass 1 (kg)" min={0.5} max={5} step={0.5} value={m1} onChange={(v) => onParam?.('m1', v)} />
        <Slider label="Mass 2 (kg)" min={0.5} max={5} step={0.5} value={m2} onChange={(v) => onParam?.('m2', v)} />
        <Slider label="v₁ (m/s)" min={1} max={10} step={0.5} value={v1} onChange={(v) => onParam?.('v1', v)} />
        <Slider label="Restitution (e)" min={0} max={1} step={0.05} value={restitution} onChange={(v) => onParam?.('restitution', v)} />
      </div>
    </div>
  )
}

function Slider({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange?: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1">
        <span>{label}</span><span className="font-mono">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </div>
  )
}
