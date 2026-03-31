import { useEffect, useRef } from 'react'

interface Props {
  mass: number       // kg
  height: number     // m initial drop height
  gravity: number    // m/s²
  onParam?: (k: string, v: number) => void
}

export function EnergySim({ mass, height, gravity, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ y: 0, vy: 0, bouncing: false })
  const animRef = useRef<number>(0)

  void onParam

  useEffect(() => {
    stateRef.current = { y: 0, vy: 0, bouncing: false }
  }, [mass, height, gravity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const groundY = H - 60
    const maxPxH = groundY - 40
    const pxPerMetre = Math.min(maxPxH / Math.max(height, 0.5), 60)
    const ballR = 14
    const dt = 0.016

    // Reset
    stateRef.current = { y: 0, vy: 0, bouncing: false }

    function draw() {
      const s = stateRef.current
      s.vy += gravity * dt
      s.y += s.vy * dt
      const maxY = height
      if (s.y >= maxY) { s.y = maxY; s.vy = -Math.abs(s.vy) * 0.85 }

      const ballPxY = groundY - (maxY - s.y) * pxPerMetre - ballR

      const KE = 0.5 * mass * s.vy * s.vy
      const PE = mass * gravity * (maxY - s.y)
      const totalE = mass * gravity * maxY
      const barMaxH = 80
      const barW = 24

      ctx.clearRect(0, 0, W, H)

      // Ground
      ctx.fillStyle = 'hsl(240 12% 22%)'
      ctx.fillRect(0, groundY, W, 4)

      // Height reference line
      ctx.strokeStyle = 'hsl(240 12% 30%)'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(20, groundY - maxY * pxPerMetre)
      ctx.lineTo(W - 20, groundY - maxY * pxPerMetre)
      ctx.stroke()
      ctx.setLineDash([])

      // Ball
      ctx.beginPath()
      ctx.arc(W / 2, ballPxY, ballR, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      // Energy bars (right side)
      const barX = W - 90
      const barBaseY = groundY - 10
      const peH = totalE > 0 ? (PE / totalE) * barMaxH : 0
      const keH = totalE > 0 ? (KE / totalE) * barMaxH : 0

      // PE bar
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(barX, barBaseY - peH, barW, peH)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px Inter, system-ui'
      ctx.fillText('PE', barX + 4, barBaseY + 12)

      // KE bar
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(barX + barW + 8, barBaseY - keH, barW, keH)
      ctx.fillText('KE', barX + barW + 12, barBaseY + 12)

      // Labels
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px Inter, system-ui'
      ctx.fillText(`KE = ${KE.toFixed(1)} J`, 8, H - 32)
      ctx.fillText(`PE = ${PE.toFixed(1)} J`, 8, H - 18)
      ctx.fillText(`E  = ${(KE + PE).toFixed(1)} J`, 8, H - 4)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [mass, height, gravity])

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={340} height={320} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]" />
      <div className="grid grid-cols-3 gap-3 w-full">
        <Slider label="Mass (kg)" min={0.1} max={10} step={0.1} value={mass} onChange={(v) => onParam?.('mass', v)} />
        <Slider label="Height (m)" min={0.5} max={8} step={0.5} value={height} onChange={(v) => onParam?.('height', v)} />
        <Slider label="g (m/s²)" min={1} max={20} step={0.5} value={gravity} onChange={(v) => onParam?.('gravity', v)} />
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
