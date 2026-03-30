/**
 * HandwritingCanvas — HTML5 Canvas with Pointer Events for S Pen / stylus support.
 *
 * Samsung S Pen (and other styluses) expose:
 *   - event.pressure  → line width variation (0.5 – 4 px)
 *   - event.tiltX / event.tiltY → brush angle
 *
 * We use setPointerCapture so strokes are never dropped when the stylus moves fast.
 * Smooth lines are drawn with quadratic Bezier curves between sampled points.
 *
 * Features:
 *   - Pen colours: black, red, blue, green
 *   - Eraser mode
 *   - Clear canvas
 *   - Undo / redo (up to 20 snapshots)
 *   - Export as PNG base64
 *   - Persists to note.handwritingData via updateNote
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { Trash2, Undo2, Redo2, Download } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { cn } from '@/lib/utils'

interface Props {
  noteId: string
}

type PenColor = 'black' | 'red' | 'blue' | 'green' | 'white'

const PEN_COLORS: { label: string; value: PenColor; display: string }[] = [
  { label: 'Black', value: 'black', display: '#18181b' },
  { label: 'Red',   value: 'red',   display: '#ef4444' },
  { label: 'Blue',  value: 'blue',  display: '#3b82f6' },
  { label: 'Green', value: 'green', display: '#22c55e' },
]

const MAX_HISTORY = 20

export function HandwritingCanvas({ noteId }: Props) {
  const { notes, updateNote } = useAppStore()
  const note = notes.find((n) => n.id === noteId)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Drawing state (kept in refs to avoid re-renders during stroke)
  const isDrawing = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const midX = useRef(0)
  const midY = useRef(0)
  const isFirstPoint = useRef(true)

  // Undo/redo stacks — each entry is a full canvas ImageData snapshot
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])

  const [penColor, setPenColor] = useState<PenColor>('black')
  const [isEraser, setIsEraser] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Initialise canvas size and load persisted data
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width || 800
    canvas.height = rect.height || 600

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Load persisted image if available
    if (note?.handwritingData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = note.handwritingData
    }

    // Push initial state onto undo stack
    undoStack.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)]
    redoStack.current = []
  }, [noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recolour background when dark mode toggles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    // We can't change the stored strokes — just update the bg for new sessions
    // (If there's persisted data we leave it as-is)
    if (!note?.handwritingData) {
      ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [isDark]) // eslint-disable-line react-hooks/exhaustive-deps

  const getContext = (): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d') ?? null
  }

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current = [...undoStack.current.slice(-MAX_HISTORY), snapshot]
    redoStack.current = [] // clear redo on new stroke
  }, [])

  const persistCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    updateNote(noteId, { handwritingData: dataUrl })
  }, [noteId, updateNote])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pushUndo()

    const rect = canvasRef.current!.getBoundingClientRect()
    lastX.current = e.clientX - rect.left
    lastY.current = e.clientY - rect.top
    midX.current = lastX.current
    midY.current = lastY.current
    isFirstPoint.current = true
    isDrawing.current = true
  }, [pushUndo])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const ctx = getContext()
    if (!ctx) return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Pressure: clamp 0.5–4, default 0.5 if API not supported
    const pressure = e.pressure > 0 ? e.pressure : 0.5
    const lineWidth = isEraser ? 20 : Math.max(0.5, Math.min(4, pressure * 4))

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, lineWidth, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      lastX.current = x
      lastY.current = y
      return
    }

    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Map pen color to actual CSS color
    const colorMap: Record<PenColor, string> = {
      black: isDark ? '#f4f4f5' : '#18181b',
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      white: isDark ? '#18181b' : '#f4f4f5',
    }
    ctx.strokeStyle = colorMap[penColor]

    if (isFirstPoint.current) {
      isFirstPoint.current = false
      ctx.beginPath()
      ctx.moveTo(lastX.current, lastY.current)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      // Smooth bezier: mid-point between last and current
      const newMidX = (lastX.current + x) / 2
      const newMidY = (lastY.current + y) / 2

      ctx.beginPath()
      ctx.moveTo(midX.current, midY.current)
      ctx.quadraticCurveTo(lastX.current, lastY.current, newMidX, newMidY)
      ctx.stroke()

      midX.current = newMidX
      midY.current = newMidY
    }

    lastX.current = x
    lastY.current = y
  }, [isEraser, penColor, isDark])

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    persistCanvas()
  }, [persistCanvas])

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx || undoStack.current.length <= 1) return

    const current = undoStack.current[undoStack.current.length - 1]
    redoStack.current = [...redoStack.current, current]
    undoStack.current = undoStack.current.slice(0, -1)

    const prev = undoStack.current[undoStack.current.length - 1]
    ctx.putImageData(prev, 0, 0)
    persistCanvas()
  }, [persistCanvas])

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx || redoStack.current.length === 0) return

    const next = redoStack.current[redoStack.current.length - 1]
    redoStack.current = redoStack.current.slice(0, -1)
    undoStack.current = [...undoStack.current, next]

    ctx.putImageData(next, 0, 0)
    persistCanvas()
  }, [persistCanvas])

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    pushUndo()
    ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    persistCanvas()
  }, [isDark, pushUndo, persistCanvas])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `handwriting-${noteId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [noteId])

  const canUndo = undoStack.current.length > 1
  const canRedo = redoStack.current.length > 0

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.8)] backdrop-blur-sm flex-wrap">
        {/* Pen colors */}
        {PEN_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => { setPenColor(c.value); setIsEraser(false) }}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all',
              penColor === c.value && !isEraser
                ? 'border-[hsl(var(--primary))] scale-110'
                : 'border-transparent hover:scale-110'
            )}
            style={{ backgroundColor: c.display }}
          />
        ))}

        <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />

        {/* Eraser */}
        <button
          title="Eraser"
          onClick={() => setIsEraser((v) => !v)}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-colors',
            isEraser
              ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          )}
        >
          Eraser
        </button>

        <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />

        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 size={13} />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo2 size={13} />
        </button>

        <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />

        {/* Clear */}
        <button
          onClick={handleClear}
          title="Clear canvas"
          className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive))]"
        >
          <Trash2 size={13} />
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          title="Export as PNG"
          className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <Download size={13} />
        </button>

        <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">
          S Pen / stylus supported
        </span>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none', cursor: isEraser ? 'cell' : 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
    </div>
  )
}
