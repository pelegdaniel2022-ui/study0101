import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/app'
import { sm2, defaultReviewData } from '@/lib/sm2'
import { Brain, CreditCard, FileText } from 'lucide-react'
import type { Note, FlashCard } from '@/types'

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

type ReviewItem =
  | { kind: 'note'; note: Note }
  | { kind: 'card'; card: FlashCard; noteId: string; noteTitle: string }

export function DailyReviewView() {
  const { getDueNotes, getDueFlashcards, notes, updateReviewData, updateFlashcardReviewData, recordReviewSession, studyStreak } = useAppStore()

  const reviewQueue = useMemo<ReviewItem[]>(() => {
    // Due notes
    const dueNotes = getDueNotes().map<ReviewItem>((n) => ({ kind: 'note', note: n }))

    // Never-reviewed notes (up to 5 to avoid overwhelming)
    const seen = new Set(getDueNotes().map((n) => n.id))
    const newNotes = notes
      .filter((n) => !n.reviewData && !seen.has(n.id) && !n.isJournal)
      .slice(0, 5)
      .map<ReviewItem>((n) => ({ kind: 'note', note: n }))

    // Due flashcards
    const dueCards = getDueFlashcards().map<ReviewItem>((fc) => ({
      kind: 'card',
      card: fc.card,
      noteId: fc.noteId,
      noteTitle: fc.noteTitle,
    }))

    return [...dueNotes, ...newNotes, ...dueCards]
  }, [getDueNotes, getDueFlashcards, notes])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const total = reviewQueue.length
  const item = reviewQueue[currentIndex]
  const isDone = currentIndex >= total

  function handleRate(quality: 0 | 2 | 3 | 5) {
    if (!item) return
    if (item.kind === 'note') {
      const prev = item.note.reviewData ?? defaultReviewData()
      updateReviewData(item.note.id, sm2(quality, prev))
    } else {
      const prev = item.card.reviewData ?? defaultReviewData()
      updateFlashcardReviewData(item.noteId, item.card.id, sm2(quality, prev))
    }
    setReviewedCount((c) => c + 1)
    setRevealed(false)
    setCurrentIndex((i) => i + 1)
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">No reviews due!</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm text-sm">
          Add notes, use Study Tools to generate flashcards, and enable spaced repetition to start review sessions.
        </p>
      </div>
    )
  }

  // ── Done state ───────────────────────────────────────────────────────────

  if (isDone) {
    recordReviewSession()
    const nextDueNotes = notes.filter((n) => n.reviewData && n.reviewData.nextReview > Date.now()).length
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">All caught up!</h2>
        {studyStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-sm font-medium">
            🔥 {studyStreak}-day streak!
          </div>
        )}
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm text-sm">
          You reviewed {reviewedCount} item{reviewedCount !== 1 ? 's' : ''} today.
          {nextDueNotes > 0 && ` ${nextDueNotes} note${nextDueNotes !== 1 ? 's' : ''} scheduled for future review.`}
        </p>
      </div>
    )
  }

  // ── Review card ──────────────────────────────────────────────────────────

  const isNote = item.kind === 'note'
  const isCard = item.kind === 'card'

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      {/* Progress */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))] mb-2">
          <span>{reviewedCount} / {total} reviewed today</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><FileText size={11} /> Notes</span>
            <span className="flex items-center gap-1"><CreditCard size={11} /> Flashcards</span>
          </div>
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
        {/* Header */}
        <div className="px-8 py-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            {isNote ? <FileText size={12} /> : <CreditCard size={12} />}
            {isNote
              ? (item.note.reviewData ? 'Note due for review' : 'New note')
              : `Flashcard · ${item.noteTitle}`}
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            {isNote ? (item.note.title || 'Untitled Note') : item.card.front}
          </h2>
        </div>

        {/* Content / answer */}
        <div className="px-8 py-6 min-h-[120px]">
          {revealed ? (
            isNote ? (
              <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">
                {stripJson(item.note.content).slice(0, 300) || <span className="text-[hsl(var(--muted-foreground))] italic">No content yet</span>}
              </p>
            ) : (
              <div>
                <div className="text-xs text-emerald-500 mb-2">Answer</div>
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{isCard ? item.card.back : ''}</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-20">
              <button
                onClick={() => setRevealed(true)}
                className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                {isCard ? 'Show Answer' : 'Reveal'}
              </button>
            </div>
          )}
        </div>

        {/* Rating */}
        {revealed && (
          <div className="px-8 py-5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-3">How well did you recall this?</p>
            <div className="grid grid-cols-4 gap-2">
              <RateButton label="Again" color="bg-red-500 hover:bg-red-600" onClick={() => handleRate(0)} />
              <RateButton label="Hard" color="bg-orange-500 hover:bg-orange-600" onClick={() => handleRate(2)} />
              <RateButton label="Good" color="bg-blue-500 hover:bg-blue-600" onClick={() => handleRate(3)} />
              <RateButton label="Easy" color="bg-green-500 hover:bg-green-600" onClick={() => handleRate(5)} />
            </div>
          </div>
        )}
      </div>

      {/* Note tags */}
      {isNote && item.note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {item.note.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Queue summary */}
      <div className="mt-6 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="flex items-center gap-1">
          <Brain size={11} />
          {reviewQueue.filter((r) => r.kind === 'note').length} note{reviewQueue.filter((r) => r.kind === 'note').length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <CreditCard size={11} />
          {reviewQueue.filter((r) => r.kind === 'card').length} flashcard{reviewQueue.filter((r) => r.kind === 'card').length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

function RateButton({ label, color, onClick }: {
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white text-sm font-medium py-2 rounded-lg transition-colors`}
    >
      {label}
    </button>
  )
}

