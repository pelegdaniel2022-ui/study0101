import { useEffect, useRef } from 'react'
import { SimSlider } from './PendulumSim'

interface Props {
  frequency: number
  amplitude: number
  speed: number
  sources: number
  onParam?: (k: string, v: number) => void
}

export function WaveSim({ frequency, amplitude, speed, sources, onParam }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const dt = 0.016

    function draw() {
      tRef.current += dt
      const t = tRef.current
      ctx.clearRect(0, 0, W, H)

      if (sources === 1) {
        // Single wave
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const k = (2 * Math.PI * frequency) / speed
          const omega = 2 * Math.PI * frequency
          const y = H / 2 + amplitude * 50 * Math.sin(k * x * 0.1 - omega * t)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = '#7c3aed'
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        // 2D interference pattern
        const src1 = { x: W * 0.3, y: H / 2 }
        const src2 = { x: W * 0.7, y: H / 2 }
        const imageData = ctx.createImageData(W, H)
        const omega = 2 * Math.PI * frequency

        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const r1 = Math.sqrt((x - src1.x) ** 2 + (y - src1.y) ** 2)
            const r2 = Math.sqrt((x - src2.x) ** 2 + (y - src2.y) ** 2)
            const k = (2 * Math.PI * frequency) / (speed * 20)
            const v = amplitude * (Math.sin(k * r1 - omega * t) + Math.sin(k * r2 - omega * t))
            const norm = Math.max(0, Math.min(255, 128 + v * 50))
            const i = (y * W + x) * 4
            imageData.data[i] = 100 + norm * 0.3
            imageData.data[i + 1] = 50
            imageData.data[i + 2] = 200 + norm * 0.2
            imageData.data[i + 3] = 200
          }
        }
        ctx.putImageData(imageData, 0, 0)

        // Sources
        for (const src of [src1, src2]) {
          ctx.beginPath()
          ctx.arc(src.x, src.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = '#fbbf24'
          ctx.fill()
        }
      }

      const lambda = speed / frequency
      ctx.fillStyle = '#64748b'
      ctx.font = '11px system-ui'
      ctx.fillText(`λ = ${lambda.toFixed(2)} m   f = ${frequency} Hz`, 8, H - 4)

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [frequency, amplitude, speed, sources])

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={280} height={200} className="rounded-lg bg-[hsl(var(--muted)/0.4)]" />
      <SimSlider label="Frequency (Hz)" value={frequency} min={0.5} max={5} step={0.1} onChange={(v) => onParam?.('frequency', v)} />
      <SimSlider label="Amplitude" value={amplitude} min={0.1} max={2} step={0.1} onChange={(v) => onParam?.('amplitude', v)} />
      <SimSlider label="Speed (m/s)" value={speed} min={0.5} max={10} step={0.5} onChange={(v) => onParam?.('speed', v)} />
      <SimSlider
        label="Sources"
        value={sources}
        min={1} max={2} step={1}
        onChange={(v) => onParam?.('sources', v)}
      />
    </div>
  )
}
