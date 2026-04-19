import { useEffect, useRef } from 'react'
import { SimSlider } from './PendulumSim'

interface Props {
  height: number   // initial height in metres (1–10)
  mass: number     // kg (0.1–5)
  onParam?: (k: string, v: number) => void
}

const G = 9.81

export function EnergySim({ height, mass, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef  = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    const totalE = mass * G * height   // J — conserved
    let t = 0
    const dt = 0.016

    // Parabolic track geometry
    // y(x) = height * (1 - (x/xMax)²) — ball starts at x=0, h=height, rolls to x=xMax, h=0
    // We'll map to canvas pixels
    const leftMargin = 12
    const rightMargin = 80   // space for bar chart
    const bottomPad = 32
    const topPad = 20
    const trackW = W - leftMargin - rightMargin
    const trackH = H - topPad - bottomPad

    // Period for oscillation: use pendulum-like period for visual variety
    const period = 2.5   // seconds for one sweep across the track

    function hAtT(time: number): number {
      // ball sweeps back and forth — use |cos(ωt)| so h goes 0→height→0→height…
      const phase = (time % period) / period   // 0…1
      const pos = Math.abs(Math.cos(Math.PI * phase))  // 1→0→1 half period
      return height * pos * pos  // squared for parabolic feel
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      const h = hAtT(t)
      const v = Math.sqrt(2 * G * Math.max(height - h, 0))
      const ke = 0.5 * mass * v * v
      const pe = mass * G * h

      // ── Track curve ──────────────────────────────────────────────────────
      ctx.beginPath()
      ctx.moveTo(leftMargin, topPad)
      for (let px = 0; px <= trackW; px++) {
        const xFrac = px / trackW
        const hFrac = 1 - xFrac * xFrac
        const py = topPad + trackH * (1 - hFrac * (height / (height || 1)))
        if (px === 0) ctx.moveTo(leftMargin + px, py)
        else ctx.lineTo(leftMargin + px, py)
      }
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()

      // Baseline
      ctx.beginPath()
      ctx.moveTo(leftMargin, topPad + trackH)
      ctx.lineTo(leftMargin + trackW, topPad + trackH)
      ctx.stroke()

      // ── Ball position ─────────────────────────────────────────────────────
      // x fraction: ball sweeps from left to right, mirroring hAtT
      const phase = (t % period) / period
      const xFrac = Math.abs(1 - 2 * (phase % 1))  // 0→1→0
      const hFrac = h / (height || 1)
      const bx = leftMargin + xFrac * trackW
      const by = topPad + trackH * (1 - hFrac * (height / (height || 1)))

      ctx.beginPath()
      ctx.arc(bx, by, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#7c3aed'
      ctx.fill()

      // ── Bar chart ─────────────────────────────────────────────────────────
      const barX = W - rightMargin + 8
      const barW = 20
      const maxBarH = trackH
      const barBottom = topPad + trackH

      const peBarH = totalE > 0 ? (pe / totalE) * maxBarH : 0
      const keBarH = totalE > 0 ? (ke / totalE) * maxBarH : 0

      // PE bar (green)
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(barX, barBottom - peBarH, barW, peBarH)

      // KE bar (blue) stacked on top of PE
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(barX, barBottom - peBarH - keBarH, barW, keBarH)

      // Bar border
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, topPad, barW, maxBarH)

      // Legend
      ctx.font = '9px system-ui'
      ctx.fillStyle = '#3b82f6'
      ctx.fillText('KE', barX + 2, topPad - 3)
      ctx.fillStyle = '#22c55e'
      ctx.fillText('PE', barX + 2, topPad + 10)

      // ── Formula display ───────────────────────────────────────────────────
      ctx.font = '10px system-ui'
      ctx.fillStyle = '#64748b'
      ctx.fillText(`KE = ${ke.toFixed(1)} J`, 8, H - 20)
      ctx.fillText(`PE = ${pe.toFixed(1)} J`, 8, H - 8)
      ctx.fillStyle = '#7c3aed'
      ctx.font = 'bold 10px system-ui'
      ctx.fillText(`E = ${totalE.toFixed(1)} J`, trackW / 2 - 20, H - 8)

      t += dt
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [height, mass])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={240} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <div className="flex gap-4 text-xs justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />KE = ½mv²</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />PE = mgh</span>
      </div>
      <SimSlider label="Height (m)" value={height} min={1}   max={10}  step={0.5} onChange={(v) => onParam?.('height', v)} />
      <SimSlider label="Mass (kg)"  value={mass}   min={0.1} max={5}   step={0.1} onChange={(v) => onParam?.('mass', v)} />
    </div>
  )
}
