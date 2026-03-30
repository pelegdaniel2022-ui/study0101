import { useEffect, useRef } from 'react'
import { SimSlider } from './PendulumSim'

interface Props {
  mass: number
  springK: number
  amplitude: number
  damping: number
  onParam?: (k: string, v: number) => void
}

export function HarmonicSim({ mass, springK, amplitude, damping, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef({ x: amplitude, v: 0 })

  useEffect(() => {
    stateRef.current = { x: amplitude, v: 0 }
  }, [amplitude, mass, springK, damping])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const dt = 0.016
    const trail: number[] = []

    function draw() {
      const s = stateRef.current
      const a = (-springK * s.x - damping * s.v) / mass
      s.v += a * dt
      s.x += s.v * dt

      trail.push(s.x)
      if (trail.length > W) trail.shift()

      ctx.clearRect(0, 0, W, H)

      // Wall
      ctx.fillStyle = '#64748b'
      ctx.fillRect(0, cy - 30, 8, 60)

      // Spring (zigzag)
      const bobX = cx + (s.x / (amplitude || 0.5)) * (W * 0.25)
      const wallX = 8
      const springLen = bobX - wallX
      const coils = 8
      ctx.beginPath()
      ctx.moveTo(wallX, cy)
      for (let i = 0; i <= coils * 2; i++) {
        const px = wallX + (springLen * i) / (coils * 2)
        const py = cy + (i % 2 === 0 ? 0 : (i % 4 === 1 ? -10 : 10))
        ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()

      // Bob
      ctx.beginPath()
      ctx.rect(bobX - 15, cy - 15, 30, 30)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      // Trail graph (bottom strip)
      const graphY = H - 35
      ctx.fillStyle = 'rgba(124,58,237,0.1)'
      ctx.fillRect(0, graphY - 25, W, 25)
      ctx.beginPath()
      const scale = 20 / (amplitude || 0.5)
      for (let i = 0; i < trail.length; i++) {
        const px = i
        const py = graphY - 12 - trail[i] * scale
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const omega = Math.sqrt(springK / mass)
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.fillText(`ω = ${omega.toFixed(2)} rad/s   T = ${(2 * Math.PI / omega).toFixed(2)} s`, 8, H - 4)

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [mass, springK, amplitude, damping])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={200} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <SimSlider label="Mass (kg)" value={mass} min={0.1} max={5} step={0.1} onChange={(v) => onParam?.('mass', v)} />
      <SimSlider label="Spring k" value={springK} min={1} max={50} step={0.5} onChange={(v) => onParam?.('springK', v)} />
      <SimSlider label="Amplitude (m)" value={amplitude} min={0.05} max={1} step={0.05} onChange={(v) => onParam?.('amplitude', v)} />
      <SimSlider label="Damping" value={damping} min={0} max={2} step={0.05} onChange={(v) => onParam?.('damping', v)} />
    </div>
  )
}
