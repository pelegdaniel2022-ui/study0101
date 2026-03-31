import { useEffect, useRef } from 'react'

interface Props {
  radius: number        // metres
  speed: number         // m/s tangential
  mass: number          // kg
  onParam?: (k: string, v: number) => void
}

export function CircularSim({ radius, speed, mass, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0)
  const animRef = useRef<number>(0)

  void onParam

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2 - 20
    const pxRadius = Math.min(W, H) * 0.32 * Math.min(radius, 5) / 5
    const angularVelocity = speed / Math.max(radius, 0.1)  // ω = v/r
    const centripetal = mass * speed * speed / Math.max(radius, 0.1)

    let lastTime = 0
    function draw(ts: number) {
      const elapsed = Math.min((ts - lastTime) / 1000, 0.05)
      lastTime = ts
      angleRef.current += angularVelocity * elapsed

      ctx.clearRect(0, 0, W, H)

      // Orbit ring
      ctx.beginPath()
      ctx.arc(cx, cy, pxRadius, 0, Math.PI * 2)
      ctx.strokeStyle = 'hsl(240 12% 30%)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // String
      const bx = cx + pxRadius * Math.cos(angleRef.current)
      const by = cy + pxRadius * Math.sin(angleRef.current)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(bx, by)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()

      // Centre pivot
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#64748b'
      ctx.fill()

      // Ball
      ctx.beginPath()
      ctx.arc(bx, by, 13, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      // Centripetal force arrow (pointing inward)
      const fx = cx - bx, fy = cy - by
      const fLen = Math.sqrt(fx * fx + fy * fy)
      const arrowLen = Math.min(30, centripetal * 2)
      const ax = bx + (fx / fLen) * arrowLen
      const ay = by + (fy / fLen) * arrowLen
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(ax, ay)
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.stroke()
      // arrowhead
      const headAngle = Math.atan2(ay - by, ax - bx)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 8 * Math.cos(headAngle - 0.4), ay - 8 * Math.sin(headAngle - 0.4))
      ctx.lineTo(ax - 8 * Math.cos(headAngle + 0.4), ay - 8 * Math.sin(headAngle + 0.4))
      ctx.closePath()
      ctx.fillStyle = '#f59e0b'
      ctx.fill()

      // Labels
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px Inter, system-ui'
      ctx.fillText(`Fc = ${centripetal.toFixed(1)} N`, 8, H - 32)
      ctx.fillText(`ω = ${angularVelocity.toFixed(2)} rad/s`, 8, H - 18)
      ctx.fillText(`v = ${speed.toFixed(1)} m/s`, 8, H - 4)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [radius, speed, mass])

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={340} height={320} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]" />
      <div className="grid grid-cols-3 gap-3 w-full">
        <Slider label="Radius (m)" min={0.5} max={5} step={0.1} value={radius} onChange={(v) => onParam?.('radius', v)} />
        <Slider label="Speed (m/s)" min={0.5} max={10} step={0.5} value={speed} onChange={(v) => onParam?.('speed', v)} />
        <Slider label="Mass (kg)" min={0.1} max={5} step={0.1} value={mass} onChange={(v) => onParam?.('mass', v)} />
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
