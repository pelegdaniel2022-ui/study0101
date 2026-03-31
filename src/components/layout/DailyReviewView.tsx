import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/app'
import { sm2, defaultReviewData } from '@/lib/sm2'
import type { Note } from '@/types'

type TiptapNode = { text?: string; content?: TiptapNode[] }

function extractText(node: TiptapNode): string {
  if (node.text) return node.text
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join(' ')
  }
  return ''
}

function stripJson(content: string): string {
  try {
    const parsed = JSON.parse(content) as TiptapNode
    return extractText(parsed)
  } catch {
    return content
  }
}

export function DailyReviewView() {
  const { getDueNotes, notes, updateReviewData } = useAppStore()

  const reviewQueue = useMemo<Note[]>(() => {
    const due = getDueNotes()
    const neverReviewed = notes
      .filter((n) => !n.reviewData)
      .slice(0, 10)

    // Deduplicate
    const seen = new Set(due.map((n) => n.id))
    const extras = neverReviewed.filter((n) => !seen.has(n.id))
    return [...due, ...extras]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const total = reviewQueue.length
  const note = reviewQueue[currentIndex]
  const isDone = currentIndex >= total

  function handleRate(quality: 0 | 2 | 3 | 5) {
    if (!note) return
    const prev = note.reviewData ?? defaultReviewData()
    const result = sm2(quality, prev)
    updateReviewData(note.id, result)
    setReviewedCount((c) => c + 1)
    setRevealed(false)
    setCurrentIndex((i) => i + 1)
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">No notes to review!</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
          Add notes and enable spaced repetition to start your review sessions.
        </p>
      </div>
    )
  }

  if (isDone) {
    const nextDue = notes.filter((n) => n.reviewData && n.reviewData.nextReview > Date.now()).length
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">All caught up!</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
          You reviewed {reviewedCount} note{reviewedCount !== 1 ? 's' : ''} today.
          {nextDue > 0 && ` ${nextDue} note${nextDue !== 1 ? 's' : ''} scheduled for future review.`}
        </p>
      </div>
    )
  }

  const preview = stripJson(note.content).slice(0, 200)

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      {/* Progress */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))] mb-2">
          <span>{reviewedCount} / {total} reviewed today</span>
          <span>{total - currentIndex} remaining</span>
        </div>
        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--primary))] transition-all duration-300"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-md overflow-hidden">
        {/* Title */}
        <div className="px-8 py-6 border-b border-[hsl(var(--border))]">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            {note.reviewData ? 'Due for review' : 'New note'}
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            {note.title || 'Untitled Note'}
          </h2>
        </div>

        {/* Content preview */}
        <div className="px-8 py-6 min-h-[120px]">
          {revealed ? (
            <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">
              {preview || <span className="text-[hsl(var(--muted-foreground))] italic">No content yet</span>}
            </p>
          ) : (
            <div className="flex items-center justify-center h-20">
              <button
                onClick={() => setRevealed(true)}
                className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Reveal
              </button>
            </div>
          )}
        </div>

        {/* Rating buttons */}
        {revealed && (
          <div className="px-8 py-5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-3">How well did you recall this?</p>
            <div className="grid grid-cols-4 gap-2">
              <RateButton label="Again" quality={0} color="bg-red-500 hover:bg-red-600" onClick={() => handleRate(0)} />
              <RateButton label="Hard" quality={2} color="bg-orange-500 hover:bg-orange-600" onClick={() => handleRate(2)} />
              <RateButton label="Good" quality={3} color="bg-blue-500 hover:bg-blue-600" onClick={() => handleRate(3)} />
              <RateButton label="Easy" quality={5} color="bg-green-500 hover:bg-green-600" onClick={() => handleRate(5)} />
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {note.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function RateButton({ label, quality, color, onClick }: {
  label: string
  quality: number
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white text-sm font-medium py-2 rounded-lg transition-colors`}
    >
      {label} <span className="text-white/70 text-xs">({quality})</span>
    </button>
  )
}
