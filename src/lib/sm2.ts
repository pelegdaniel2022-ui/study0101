import type { ReviewData } from '@/types'

export function defaultReviewData(): ReviewData {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: 0,
  }
}

export function sm2(quality: 0 | 1 | 2 | 3 | 4 | 5, prev: ReviewData): ReviewData {
  const q = quality
  const ef = prev.easeFactor

  // Update ease factor
  const newEF = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  let repetitions: number
  let interval: number

  if (q >= 3) {
    // Correct response
    if (prev.repetitions === 0) {
      interval = 1
    } else if (prev.repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(prev.interval * newEF)
    }
    repetitions = prev.repetitions + 1
  } else {
    // Incorrect response — reset
    repetitions = 0
    interval = 1
  }

  const now = Date.now()
  return {
    easeFactor: newEF,
    interval,
    repetitions,
    nextReview: now + interval * 86400000,
    lastReview: now,
  }
}
