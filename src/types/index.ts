// ── Core entities ──────────────────────────────────────────────────────────

export interface Course {
  id: string
  name: string
  color: string
  createdAt: number
  updatedAt: number
}

export interface Lecture {
  id: string
  courseId: string
  title: string
  date: number
  createdAt: number
  updatedAt: number
}

export interface NoteAttachment {
  id: string
  name: string
  type: 'pdf' | 'image' | 'text' | 'other'
  dataUrl?: string
  size: number
  addedAt: number
}

// ── Stroke-based handwriting model (replaces PNG blob) ────────────────────
// Coordinates are NORMALISED (0–1) so the canvas survives resize/rotation.

export interface InkPoint {
  nx: number   // x ÷ canvasWidth  (0–1)
  ny: number   // y ÷ canvasHeight (0–1)
  p:  number   // pressure 0–1
}

export interface InkStroke {
  id:    string
  pts:   InkPoint[]
  color: string   // CSS hex/rgb
  width: number   // base width 1–6
  tool:  'pen' | 'highlighter'
}

// ── Spaced-repetition data (SM-2 algorithm) ────────────────────────────────

export interface ReviewData {
  easeFactor:  number   // starts at 2.5
  interval:    number   // days until next review
  repetitions: number   // consecutive correct reviews
  nextReview:  number   // Unix ms timestamp
  lastReview:  number   // Unix ms timestamp
}

// ── Main note type ─────────────────────────────────────────────────────────

export interface Note {
  id:        string
  lectureId: string
  courseId:  string
  title:     string
  content:   string          // Tiptap JSON stringified

  // Drawing / canvas
  canvasData?:        string        // Excalidraw JSON
  handwritingStrokes?: InkStroke[]  // stroke model (new, replaces PNG)
  /** @deprecated use handwritingStrokes */
  handwritingData?:   string        // legacy PNG – kept for migration

  mode: 'document' | 'canvas' | 'split' | 'handwriting'

  // Metadata / PKM
  tags:            string[]
  linkedNoteIds?:  string[]    // bidirectional [[wiki-links]]
  isFavorite?:     boolean
  isRTL?:          boolean
  template?:       'blank' | 'cornell' | 'grid' | 'outline'
  color?:          string      // note accent color for visual grouping
  reviewData?:     ReviewData  // spaced-repetition scheduling
  attachments?:    NoteAttachment[]
  cornellCues?:    string      // Cornell layout — left cues column
  cornellSummary?: string      // Cornell layout — bottom summary row
  noteType?:       'fleeting' | 'literature' | 'permanent'
  flashcards?:     FlashCard[] // AI-generated flashcards stored on note
  isJournal?:      boolean     // true for daily journal notes

  createdAt: number
  updatedAt: number
}

// ── Chat / AI ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: number
}

export interface FlashCard {
  id:            string
  front:         string
  back:          string
  reviewData?:   ReviewData   // per-card SRS tracking
}

// ── Physics simulations ────────────────────────────────────────────────────

export interface SimConfig {
  type:   'pendulum' | 'projectile' | 'harmonic' | 'wave'
  params: Record<string, number>
}

// ── Navigation ────────────────────────────────────────────────────────────

export type ActiveView =
  | { type: 'home' }
  | { type: 'note'; noteId: string }
  | { type: 'ai-tutor' }
  | { type: 'research' }
  | { type: 'simulations' }
  | { type: 'settings' }
  | { type: 'study-coach'; noteId: string }
  | { type: 'daily-review' }
  | { type: 'knowledge-graph' }
  | { type: 'daily-notes' }

// ── API keys ──────────────────────────────────────────────────────────────

export interface APIKeys {
  openai:     string
  perplexity: string
  anthropic:  string
}
