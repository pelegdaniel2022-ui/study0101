import { useEffect, useRef } from 'react'
import { SimSlider } from './PendulumSim'

interface Props {
  v0: number
  angle: number
  gravity: number
  airResistance: number
  onParam?: (k: string, v: number) => void
}

export function ProjectileSim({ v0, angle, gravity, airResistance, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    const rad = (angle * Math.PI) / 180
    const vx0 = v0 * Math.cos(rad)
    const vy0 = v0 * Math.sin(rad)

    // Simulate trajectory
    const points: [number, number][] = []
    let x = 0, y = 0, vx = vx0, vy = vy0
    const dt = 0.02
    let maxX = 0
    for (let i = 0; i < 5000; i++) {
      const speed = Math.sqrt(vx * vx + vy * vy)
      const dragAccel = airResistance * speed  // F_drag/m = k*v², coefficient k = airResistance
      if (speed > 0) {
        vx -= (dragAccel * vx / speed) * dt
        vy -= (dragAccel * vy / speed) * dt
      }
      vy -= gravity * dt
      x += vx * dt
      y += vy * dt
      if (y < 0 && i > 0) break
      points.push([x, -y])
      if (x > maxX) maxX = x
    }

    ctx.clearRect(0, 0, W, H)
    const scaleX = (W - 20) / (maxX || 1)
    const maxY = Math.max(...points.map(([, py]) => py))
    const scaleY = (H - 30) / (maxY || 1)
    const scale = Math.min(scaleX, scaleY)

    // Ground
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(10, H - 15)
    ctx.lineTo(W - 10, H - 15)
    ctx.stroke()

    // Trajectory
    ctx.beginPath()
    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 2
    for (let i = 0; i < points.length; i++) {
      const px = 10 + points[i][0] * scale
      const py = H - 15 - points[i][1] * scale
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Start dot
    ctx.beginPath()
    ctx.arc(10, H - 15, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#7c3aed'
    ctx.fill()

    // Stats
    const range = points[points.length - 1]?.[0] ?? 0
    const peak = maxY
    ctx.fillStyle = '#64748b'
    ctx.font = '11px system-ui'
    ctx.fillText(`Range: ${range.toFixed(1)} m  Peak: ${peak.toFixed(1)} m`, 8, H - 1)
  }, [v0, angle, gravity, airResistance])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={200} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <SimSlider label="v₀ (m/s)" value={v0} min={5} max={50} step={1} onChange={(v) => onParam?.('v0', v)} />
      <SimSlider label="Angle (°)" value={angle} min={5} max={85} step={1} onChange={(v) => onParam?.('angle', v)} />
      <SimSlider label="Gravity (m/s²)" value={gravity} min={1} max={25} step={0.1} onChange={(v) => onParam?.('gravity', v)} />
      <SimSlider label="Air resistance k (m⁻¹)" value={airResistance} min={0} max={0.3} step={0.01} onChange={(v) => onParam?.('airResistance', v)} />
    </div>
  )
}
