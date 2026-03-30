/**
 * HandwritingCanvas — Stroke-based ink engine for Samsung Tab S10 S Pen
 *
 * Architecture (consultant-aligned):
 * ─ Stores InkStroke[] (normalised coords) instead of a PNG blob
 * ─ Canvas is a "view" that re-renders from strokes on every change
 * ─ Survives resize / orientation change without pixel corruption
 * ─ Enables future: lasso-select, AI recognition, search inside ink
 *
 * Key Samsung S Pen improvements:
 * ─ getCoalescedEvents() — captures every hardware sample, not just JS frames
 * ─ Pen-only mode — ignores touch so palm doesn't draw (crucial for S Pen)
 * ─ devicePixelRatio via ResizeObserver — pixel-perfect on 2560×1600 display
 * ─ Normalised coordinates — x/y stored as 0–1 fractions of canvas size
 * ─ Variable-width segments — pressure maps to per-segment lineWidth
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { Trash2, Undo2, Redo2, Download, Hand } from 'lucide-react'
import { useAppStore, uid } from '@/store/app'
import type { InkStroke, InkPoint } from '@/types'
import { cn } from '@/lib/utils'

// ── Constants ────────────────────────────────────────────────────────────────

const PEN_COLORS = [
  { label: 'Black',    hex: '#18181b' },
  { label: 'Red',      hex: '#ef4444' },
  { label: 'Blue',     hex: '#3b82f6' },
  { label: 'Green',    hex: '#22c55e' },
  { label: 'Purple',   hex: '#8b5cf6' },
  { label: 'Orange',   hex: '#f59e0b' },
]

type PaperType = 'blank' | 'lined' | 'grid' | 'dots'

const PAPER_TYPES: { label: string; value: PaperType }[] = [
  { label: 'Blank', value: 'blank'  },
  { label: 'Lined', value: 'lined'  },
  { label: 'Grid',  value: 'grid'   },
  { label: 'Dots',  value: 'dots'   },
]

const MAX_UNDO = 30

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  noteId: string
}

type Tool = 'pen' | 'highlighter' | 'eraser'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Draw all strokes onto a canvas context (CSS-coordinate space) */
function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: InkStroke[],
  cssW: number,
  cssH: number
) {
  for (const stroke of strokes) {
    if (stroke.pts.length < 2) {
      // Single dot
      const p = stroke.pts[0]
      ctx.beginPath()
      ctx.arc(p.nx * cssW, p.ny * cssH, stroke.width * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = stroke.color
      ctx.fill()
      continue
    }

    if (stroke.tool === 'highlighter') {
      ctx.globalAlpha = 0.35
      ctx.globalCompositeOperation = 'multiply'
    } else {
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // Draw segment-by-segment with variable width (pressure)
    for (let i = 1; i < stroke.pts.length; i++) {
      const a = stroke.pts[i - 1]
      const b = stroke.pts[i]
      const w = Math.max(0.5, ((a.p + b.p) / 2) * stroke.width * 2)

      ctx.beginPath()
      ctx.lineWidth   = w
      ctx.strokeStyle = stroke.color
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.moveTo(a.nx * cssW, a.ny * cssH)
      ctx.lineTo(b.nx * cssW, b.ny * cssH)
      ctx.stroke()
    }
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/** Draw paper background (lined / grid / dots) */
function renderPaper(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  paper: PaperType,
  dark: boolean
) {
  // Background fill
  ctx.fillStyle = dark ? '#1a1a24' : '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  const lineColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const dotColor  = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)'
  const spacing   = 28   // px between lines/dots

  ctx.strokeStyle = lineColor
  ctx.lineWidth   = 1

  if (paper === 'lined') {
    for (let y = spacing; y < cssH; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(cssW, y)
      ctx.stroke()
    }
  } else if (paper === 'grid') {
    for (let x = spacing; x < cssW; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke()
    }
    for (let y = spacing; y < cssH; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke()
    }
  } else if (paper === 'dots') {
    ctx.fillStyle = dotColor
    for (let x = spacing; x < cssW; x += spacing) {
      for (let y = spacing; y < cssH; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HandwritingCanvas({ noteId }: Props) {
  const { notes, updateStrokes } = useAppStore()
  const note = notes.find((n) => n.id === noteId)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current CSS dimensions (kept in ref, not state, to avoid re-renders)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dprRef  = useRef(1)

  // Active strokes (committed) — mirrors note.handwritingStrokes
  const strokesRef = useRef<InkStroke[]>(note?.handwritingStrokes ?? [])
  // Undo/redo stacks of full stroke arrays
  const undoRef = useRef<InkStroke[][]>([])
  const redoRef = useRef<InkStroke[][]>([])

  // In-progress stroke (not yet committed)
  const currentPts     = useRef<InkPoint[]>([])
  const isDrawing      = useRef(false)
  const activePenId    = useRef<number | null>(null)  // pointer id of active pen

  // UI state
  const [color,     setColor    ] = useState(PEN_COLORS[0].hex)
  const [tool,      setTool     ] = useState<Tool>('pen')
  const [penSize,   setPenSize  ] = useState(3)
  const [paper,     setPaper    ] = useState<PaperType>('blank')
  const [penOnly,   setPenOnly  ] = useState(true)   // ignore touch when pen present
  const [canUndo,   setCanUndo  ] = useState(false)
  const [canRedo,   setCanRedo  ] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')

  // ── Full canvas redraw from strokes ───────────────────────────────────────

  const redraw = useCallback((strokes: InkStroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { w, h } = sizeRef.current
    if (w <= 0 || h <= 0) return
    renderPaper(ctx, w, h, paper, isDark)
    renderStrokes(ctx, strokes, w, h)
  }, [paper, isDark])

  // ── Canvas sizing (ResizeObserver + DPR) ──────────────────────────────────

  const applySize = useCallback((cssW: number, cssH: number) => {
    const canvas = canvasRef.current
    if (!canvas || cssW <= 0 || cssH <= 0) return

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    sizeRef.current = { w: cssW, h: cssH }

    // Physical pixels
    canvas.width  = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width  = `${cssW}px`
    canvas.style.height = `${cssH}px`

    // Scale context once — everything else is in CSS-pixel space
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    redraw(strokesRef.current)
  }, [redraw])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      applySize(width, height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [applySize])

  // Reset when noteId changes
  useEffect(() => {
    const saved = notes.find((n) => n.id === noteId)?.handwritingStrokes ?? []
    strokesRef.current = saved
    undoRef.current    = []
    redoRef.current    = []
    setCanUndo(false)
    setCanRedo(false)
    const { w, h } = sizeRef.current
    if (w > 0 && h > 0) redraw(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  // ── Persistence (debounced — called once per stroke-end) ──────────────────

  const persist = useCallback((strokes: InkStroke[]) => {
    updateStrokes(noteId, strokes)
  }, [noteId, updateStrokes])

  // ── Undo / Redo ───────────────────────────────────────────────────────────

  const commitSnapshot = useCallback(() => {
    undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), [...strokesRef.current]]
    redoRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const handleUndo = useCallback(() => {
    if (!undoRef.current.length) return
    redoRef.current = [...redoRef.current, [...strokesRef.current]]
    const prev = undoRef.current[undoRef.current.length - 1]
    undoRef.current = undoRef.current.slice(0, -1)
    strokesRef.current = prev
    redraw(prev)
    persist(prev)
    setCanUndo(undoRef.current.length > 0)
    setCanRedo(true)
  }, [redraw, persist])

  const handleRedo = useCallback(() => {
    if (!redoRef.current.length) return
    undoRef.current = [...undoRef.current, [...strokesRef.current]]
    const next = redoRef.current[redoRef.current.length - 1]
    redoRef.current = redoRef.current.slice(0, -1)
    strokesRef.current = next
    redraw(next)
    persist(next)
    setCanUndo(true)
    setCanRedo(redoRef.current.length > 0)
  }, [redraw, persist])

  const handleClear = useCallback(() => {
    commitSnapshot()
    strokesRef.current = []
    redraw([])
    persist([])
  }, [commitSnapshot, redraw, persist])

  // ── Coordinate helpers ────────────────────────────────────────────────────

  const toNorm = (clientX: number, clientY: number): { nx: number; ny: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const { w, h } = sizeRef.current
    return {
      nx: (clientX - rect.left)  / w,
      ny: (clientY - rect.top)   / h,
    }
  }

  // ── Pointer event handlers ────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Pen-only mode: reject touch if stylus is in range
    if (penOnly && e.pointerType === 'touch' && activePenId.current !== null) return
    if (penOnly && e.pointerType === 'touch' && navigator.maxTouchPoints > 0) {
      // Allow only pen/mouse in pen-only mode
      if (e.pointerType !== 'pen' && e.pointerType !== 'mouse') return
    }

    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    activePenId.current = e.pointerId

    commitSnapshot()
    currentPts.current = []
    isDrawing.current  = true

    // Add first point using coalesced events if available
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events) {
      const { nx, ny } = toNorm(ev.clientX, ev.clientY)
      currentPts.current.push({ nx, ny, p: ev.pressure > 0 ? ev.pressure : 0.5 })
    }
  }, [penOnly, commitSnapshot])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || e.pointerId !== activePenId.current) return
    e.preventDefault()

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const { w, h } = sizeRef.current

    // getCoalescedEvents: captures every hardware sample between JS frames
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]

    for (const ev of events) {
      const { nx, ny } = toNorm(ev.clientX, ev.clientY)
      const p = ev.pressure > 0 ? ev.pressure : 0.5
      const pt: InkPoint = { nx, ny, p }
      currentPts.current.push(pt)

      if (tool === 'eraser') {
        // Erase strokes whose points fall within eraser radius
        const ex = nx * w
        const ey = ny * h
        const r  = penSize * 6  // eraser radius in CSS px
        const before = strokesRef.current.length
        strokesRef.current = strokesRef.current.filter((s) =>
          !s.pts.some((sp) => {
            const dx = sp.nx * w - ex
            const dy = sp.ny * h - ey
            return Math.sqrt(dx * dx + dy * dy) < r
          })
        )
        if (strokesRef.current.length !== before) redraw(strokesRef.current)
        continue
      }

      // Incremental draw — only the new segment (fast, no full redraw)
      const pts = currentPts.current
      if (pts.length < 2) continue

      const prev = pts[pts.length - 2]
      const lineW = Math.max(0.5, ((prev.p + p) / 2) * penSize * 2)

      if (tool === 'highlighter') {
        ctx.globalAlpha = 0.35
        ctx.globalCompositeOperation = 'multiply'
      } else {
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.beginPath()
      ctx.lineWidth   = lineW
      ctx.strokeStyle = color
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.moveTo(prev.nx * w, prev.ny * h)
      ctx.lineTo(pt.nx   * w, pt.ny   * h)
      ctx.stroke()

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
  }, [tool, color, penSize, redraw])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || e.pointerId !== activePenId.current) return
    e.preventDefault()
    isDrawing.current   = false
    activePenId.current = null

    if (tool !== 'eraser' && currentPts.current.length > 0) {
      const newStroke: InkStroke = {
        id:    uid(),
        pts:   [...currentPts.current],
        color,
        width: penSize,
        tool:  tool === 'highlighter' ? 'highlighter' : 'pen',
      }
      strokesRef.current = [...strokesRef.current, newStroke]
    }

    currentPts.current = []
    persist(strokesRef.current)
  }, [tool, color, penSize, persist])

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `handwriting-${noteId}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }, [noteId])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  // ── Redraw when paper type changes ────────────────────────────────────────

  useEffect(() => {
    const { w, h } = sizeRef.current
    if (w > 0 && h > 0) redraw(strokesRef.current)
  }, [paper, isDark, redraw])

  // ── Derived cursor ────────────────────────────────────────────────────────

  const cursor = useMemo(() => {
    if (tool === 'eraser') return 'cell'
    return 'crosshair'
  }, [tool])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full select-none" style={{ userSelect: 'none' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] flex-wrap shrink-0 text-[hsl(var(--foreground))]">

        {/* Tool selector */}
        <div className="flex items-center rounded overflow-hidden border border-[hsl(var(--border))]">
          {(['pen', 'highlighter', 'eraser'] as Tool[]).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                tool === t
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              )}
            >
              {t === 'pen' ? '✒ Pen' : t === 'highlighter' ? '🖊 Highlight' : '◻ Eraser'}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        {/* Colours */}
        {PEN_COLORS.map((c) => (
          <button
            key={c.hex}
            title={c.label}
            onClick={() => { setColor(c.hex); if (tool === 'eraser') setTool('pen') }}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all flex-shrink-0',
              color === c.hex && tool !== 'eraser'
                ? 'border-[hsl(var(--primary))] scale-110 shadow'
                : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        {/* Pen size */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Size</span>
          <input
            type="range" min={1} max={7} value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            className="w-16 h-1 accent-[hsl(var(--primary))] cursor-pointer"
          />
          <span className="text-[10px] w-3 text-[hsl(var(--muted-foreground))]">{penSize}</span>
        </div>

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        {/* Paper type */}
        <select
          value={paper}
          onChange={(e) => setPaper(e.target.value as PaperType)}
          className="text-xs px-1.5 py-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] cursor-pointer"
        >
          {PAPER_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        {/* Pen-only toggle */}
        <button
          onClick={() => setPenOnly((v) => !v)}
          title={penOnly ? 'Pen-only mode ON (touch ignored)' : 'Pen-only mode OFF'}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            penOnly
              ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          )}
        >
          <Hand size={12} />
          <span>{penOnly ? 'Pen only' : 'Touch on'}</span>
        </button>

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        {/* Undo / Redo */}
        <button onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-[hsl(var(--muted))] disabled:opacity-25 disabled:cursor-not-allowed">
          <Undo2 size={14} />
        </button>
        <button onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-[hsl(var(--muted))] disabled:opacity-25 disabled:cursor-not-allowed">
          <Redo2 size={14} />
        </button>

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-0.5" />

        <button onClick={handleClear} title="Clear"
          className="p-1.5 rounded hover:text-red-500 hover:bg-[hsl(var(--muted))]">
          <Trash2 size={14} />
        </button>
        <button onClick={handleExport} title="Export PNG"
          className="p-1.5 rounded hover:bg-[hsl(var(--muted))]">
          <Download size={14} />
        </button>

        <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))] font-medium pr-1 hidden sm:inline">
          ✒ S Pen · {strokesRef.current.length} strokes
        </span>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: isDark ? '#1a1a24' : '#ffffff' }}
      >
        <canvas
          ref={canvasRef}
          style={{
            touchAction: 'none',      // prevent browser scroll hijacking stylus
            cursor,
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  )
}
