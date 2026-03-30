import { useEffect, useRef } from 'react'

interface Props {
  length: number
  gravity: number
  angle: number      // degrees
  onParam?: (k: string, v: number) => void
}

export function PendulumSim({ length, gravity, angle, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ theta: (angle * Math.PI) / 180, omega: 0 })
  const animRef = useRef<number>(0)

  useEffect(() => {
    stateRef.current = { theta: (angle * Math.PI) / 180, omega: 0 }
  }, [angle, length, gravity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = 40
    const dt = 0.016
    const pxLen = Math.min(W, H - 60) * 0.7 * Math.min(length, 3) / 3

    function draw() {
      const s = stateRef.current
      const alpha = -(gravity / length) * Math.sin(s.theta)
      s.omega += alpha * dt
      s.theta += s.omega * dt

      ctx.clearRect(0, 0, W, H)

      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#64748b'
      ctx.fill()

      const bx = cx + pxLen * Math.sin(s.theta)
      const by = cy + pxLen * Math.cos(s.theta)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(bx, by)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(bx, by, 14, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      const T = 2 * Math.PI * Math.sqrt(length / gravity)
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.fillText(`T = ${T.toFixed(2)} s`, 8, H - 8)

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [length, gravity])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={220} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <SimSlider label="Length (m)" value={length} min={0.2} max={3} step={0.1} onChange={(v) => onParam?.('length', v)} />
      <SimSlider label="Gravity (m/s²)" value={gravity} min={1} max={25} step={0.1} onChange={(v) => onParam?.('gravity', v)} />
      <SimSlider label="Angle (°)" value={angle} min={5} max={85} step={1} onChange={(v) => onParam?.('angle', v)} />
    </div>
  )
}

export function SimSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-[hsl(var(--muted-foreground))] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[hsl(var(--primary))]" />
      <span className="w-10 text-right font-mono">{value}</span>
    </div>
  )
}
