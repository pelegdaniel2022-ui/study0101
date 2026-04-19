import { useEffect, useRef } from 'react'
import { SimSlider } from './PendulumSim'

interface Props {
  radius: number      // metres
  mass: number        // kg
  speed: number       // m/s
  onParam?: (k: string, v: number) => void
}

export function CircularMotionSim({ radius, mass, speed, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const angleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    // Physics
    const Fc = (mass * speed * speed) / radius          // N
    const T  = (2 * Math.PI * radius) / speed           // s
    const omega = speed / radius                        // rad/s

    // Scale: fit the circle with margin
    const maxPx = Math.min(W, H) * 0.38
    const pxPerMetre = maxPx / Math.max(radius, 0.5)
    const cx = W / 2
    const cy = H / 2 - 10
    const r = radius * pxPerMetre

    let last = performance.now()

    function draw(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      angleRef.current += omega * dt

      ctx.clearRect(0, 0, W, H)

      // Track circle
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Centre dot
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#64748b'
      ctx.fill()

      const bx = cx + r * Math.cos(angleRef.current)
      const by = cy + r * Math.sin(angleRef.current)

      // Centripetal force arrow (toward centre)
      const arrowLen = 28
      const fcDirX = (cx - bx) / r
      const fcDirY = (cy - by) / r
      drawArrow(ctx, bx, by, bx + fcDirX * arrowLen, by + fcDirY * arrowLen, '#ef4444', 2)

      // Velocity arrow (tangent — 90° ahead of position angle)
      const vx = -Math.sin(angleRef.current)
      const vy =  Math.cos(angleRef.current)
      drawArrow(ctx, bx, by, bx + vx * arrowLen, by + vy * arrowLen, '#22c55e', 2)

      // Ball
      ctx.beginPath()
      ctx.arc(bx, by, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      // Labels
      ctx.font = '11px system-ui'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('Fc', bx + fcDirX * arrowLen + 4, by + fcDirY * arrowLen)
      ctx.fillStyle = '#22c55e'
      ctx.fillText('v', bx + vx * arrowLen + 4, by + vy * arrowLen)

      // Stats
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.fillText(`Fc = mv²/r = ${Fc.toFixed(2)} N`, 8, H - 24)
      ctx.fillText(`T = 2πr/v = ${T.toFixed(2)} s`, 8, H - 8)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [radius, mass, speed])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={240} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <SimSlider label="Radius (m)"  value={radius} min={0.5} max={3}   step={0.1} onChange={(v) => onParam?.('radius', v)} />
      <SimSlider label="Mass (kg)"   value={mass}   min={0.1} max={5}   step={0.1} onChange={(v) => onParam?.('mass', v)} />
      <SimSlider label="Speed (m/s)" value={speed}  min={0.5} max={5}   step={0.1} onChange={(v) => onParam?.('speed', v)} />
    </div>
  )
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  lineWidth: number
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)
  const headLen = 8

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}
