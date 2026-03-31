import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Course, Lecture, Note, NoteAttachment, InkStroke, ReviewData, ActiveView, FlashCard } from '@/types'

interface AppState {
  courses:           Course[]
  lectures:          Lecture[]
  notes:             Note[]
  activeView:        ActiveView
  selectedCourseId:  string | null
  selectedLectureId: string | null
  sidebarOpen:       boolean
  darkMode:          boolean
  fullscreenNote:    boolean

  // Navigation
  setActiveView:       (view: ActiveView) => void
  setSelectedCourse:   (id: string | null) => void
  setSelectedLecture:  (id: string | null) => void
  toggleSidebar:       () => void
  toggleDarkMode:      () => void
  setFullscreenNote:   (v: boolean) => void

  // Courses
  addCourse:    (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Course
  updateCourse: (id: string, patch: Partial<Course>) => void
  deleteCourse: (id: string) => void

  // Lectures
  addLecture:    (data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>) => Lecture
  updateLecture: (id: string, patch: Partial<Lecture>) => void
  deleteLecture: (id: string) => void

  // Notes
  addNote:    (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void

  // Attachments
  addAttachment:    (noteId: string, attachment: NoteAttachment) => void
  removeAttachment: (noteId: string, attachmentId: string) => void

  // Handwriting (stroke model)
  updateStrokes: (noteId: string, strokes: InkStroke[]) => void

  // PKM — bidirectional links
  linkNotes:   (noteId: string, targetId: string) => void
  unlinkNotes: (noteId: string, targetId: string) => void

  // PKM — spaced repetition
  updateReviewData: (noteId: string, data: ReviewData) => void

  // PKM — favorites
  toggleFavorite: (noteId: string) => void

  // Flashcards
  updateFlashcards:           (noteId: string, cards: FlashCard[]) => void
  updateFlashcardReviewData:  (noteId: string, cardId: string, data: ReviewData) => void

  // Daily journal
  getOrCreateDailyNote: () => Note

  // PKM — derived helpers (non-mutating)
  getLinkedNotes:  (noteId: string) => Note[]
  getDueNotes:     () => Note[]
  getDueFlashcards: () => Array<{ card: FlashCard; noteId: string; noteTitle: string }>
  getFavorites:    () => Note[]
  searchNotes:     (query: string) => Note[]
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      courses:           [],
      lectures:          [],
      notes:             [],
      activeView:        { type: 'home' },
      selectedCourseId:  null,
      selectedLectureId: null,
      sidebarOpen:       true,
      darkMode:          false,
      fullscreenNote:    false,

      // ── Navigation ──────────────────────────────────────────────────────

      setActiveView:      (view) => set({ activeView: view }),
      setSelectedCourse:  (id)   => set({ selectedCourseId: id, selectedLectureId: null }),
      setSelectedLecture: (id)   => set({ selectedLectureId: id }),
      toggleSidebar:      ()     => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleDarkMode:     ()     => set((s) => ({ darkMode: !s.darkMode })),
      setFullscreenNote:  (v)    => set({ fullscreenNote: v }),

      // ── Courses ──────────────────────────────────────────────────────────

      addCourse: (data) => {
        const course: Course = { ...data, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ courses: [...s.courses, course] }))
        return course
      },
      updateCourse: (id, patch) => set((s) => ({
        courses: s.courses.map((c) => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c),
      })),
      deleteCourse: (id) => {
        const { lectures, notes, activeView } = get()
        const lectureIds = new Set(lectures.filter((l) => l.courseId === id).map((l) => l.id))
        const noteIds    = new Set(notes.filter((n) => n.courseId === id).map((n) => n.id))
        set((s) => ({
          courses:  s.courses.filter((c) => c.id !== id),
          lectures: s.lectures.filter((l) => !lectureIds.has(l.id)),
          notes:    s.notes.filter((n) => !noteIds.has(n.id)),
          selectedCourseId: s.selectedCourseId === id ? null : s.selectedCourseId,
        }))
        if (activeView.type === 'note' && noteIds.has(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
      },

      // ── Lectures ─────────────────────────────────────────────────────────

      addLecture: (data) => {
        const lecture: Lecture = { ...data, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ lectures: [...s.lectures, lecture] }))
        return lecture
      },
      updateLecture: (id, patch) => set((s) => ({
        lectures: s.lectures.map((l) => l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l),
      })),
      deleteLecture: (id) => {
        const { notes, activeView } = get()
        const noteIds = new Set(notes.filter((n) => n.lectureId === id).map((n) => n.id))
        set((s) => ({
          lectures: s.lectures.filter((l) => l.id !== id),
          notes:    s.notes.filter((n) => n.lectureId !== id),
        }))
        if (activeView.type === 'note' && noteIds.has(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
      },

      // ── Notes ─────────────────────────────────────────────────────────────

      addNote: (data) => {
        const note: Note = { ...data, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ notes: [...s.notes, note] }))
        return note
      },
      updateNote: (id, patch) => set((s) => ({
        notes: s.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n),
      })),
      deleteNote: (id) => {
        const { activeView, notes } = get()
        // Remove this note from any other note's linkedNoteIds
        const updated = notes
          .filter((n) => n.id !== id)
          .map((n) =>
            n.linkedNoteIds?.includes(id)
              ? { ...n, linkedNoteIds: n.linkedNoteIds.filter((lid) => lid !== id) }
              : n
          )
        set({ notes: updated })
        if (activeView.type === 'note' && activeView.noteId === id) {
          set({ activeView: { type: 'home' } })
        }
      },

      // ── Attachments ───────────────────────────────────────────────────────

      addAttachment: (noteId, attachment) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId
            ? { ...n, attachments: [...(n.attachments ?? []), attachment], updatedAt: Date.now() }
            : n
        ),
      })),
      removeAttachment: (noteId, attachmentId) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId
            ? { ...n, attachments: (n.attachments ?? []).filter((a) => a.id !== attachmentId), updatedAt: Date.now() }
            : n
        ),
      })),

      // ── Handwriting ───────────────────────────────────────────────────────

      // Stores strokes WITHOUT bumping updatedAt on every move event
      // (caller should debounce and call once per stroke-end)
      updateStrokes: (noteId, strokes) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, handwritingStrokes: strokes, updatedAt: Date.now() } : n
        ),
      })),

      // ── PKM — bidirectional links ─────────────────────────────────────────

      linkNotes: (noteId, targetId) => {
        if (noteId === targetId) return
        set((s) => ({
          notes: s.notes.map((n) => {
            if (n.id === noteId) {
              const ids = new Set(n.linkedNoteIds ?? [])
              ids.add(targetId)
              return { ...n, linkedNoteIds: [...ids] }
            }
            if (n.id === targetId) {
              const ids = new Set(n.linkedNoteIds ?? [])
              ids.add(noteId)
              return { ...n, linkedNoteIds: [...ids] }
            }
            return n
          }),
        }))
      },
      unlinkNotes: (noteId, targetId) => set((s) => ({
        notes: s.notes.map((n) => {
          if (n.id === noteId || n.id === targetId) {
            const other = n.id === noteId ? targetId : noteId
            return { ...n, linkedNoteIds: (n.linkedNoteIds ?? []).filter((id) => id !== other) }
          }
          return n
        }),
      })),

      // ── PKM — spaced repetition ───────────────────────────────────────────

      updateReviewData: (noteId, data) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, reviewData: data, updatedAt: Date.now() } : n
        ),
      })),

      // ── PKM — favorites ───────────────────────────────────────────────────

      toggleFavorite: (noteId) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, isFavorite: !n.isFavorite, updatedAt: Date.now() } : n
        ),
      })),

      // ── Flashcards ────────────────────────────────────────────────────────

      updateFlashcards: (noteId, cards) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, flashcards: cards, updatedAt: Date.now() } : n
        ),
      })),

      updateFlashcardReviewData: (noteId, cardId, data) => set((s) => ({
        notes: s.notes.map((n) =>
          n.id === noteId
            ? {
                ...n,
                flashcards: (n.flashcards ?? []).map((c) =>
                  c.id === cardId ? { ...c, reviewData: data } : c
                ),
                updatedAt: Date.now(),
              }
            : n
        ),
      })),

      // ── Daily journal ─────────────────────────────────────────────────────

      getOrCreateDailyNote: () => {
        const { courses, lectures, notes, addCourse, addLecture, addNote } = get()
        const today = new Date()
        const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        const dateKey = today.toISOString().slice(0, 10) // YYYY-MM-DD

        // Find or create "Journal" course
        let journalCourse = courses.find((c) => c.name === 'Journal')
        if (!journalCourse) {
          journalCourse = addCourse({ name: 'Journal', color: '#0891b2' })
        }

        // Find or create "Daily Notes" lecture
        let journalLecture = lectures.find((l) => l.courseId === journalCourse!.id && l.title === 'Daily Notes')
        if (!journalLecture) {
          journalLecture = addLecture({ courseId: journalCourse.id, title: 'Daily Notes', date: Date.now() })
        }

        // Find or create today's note
        const existing = notes.find((n) => n.lectureId === journalLecture!.id && n.title === dateStr)
        if (existing) return existing

        return addNote({
          lectureId: journalLecture.id,
          courseId: journalCourse.id,
          title: dateStr,
          content: JSON.stringify({
            type: 'doc',
            content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: dateStr }] }, { type: 'paragraph' }],
          }),
          mode: 'document',
          tags: ['journal', dateKey],
          isJournal: true,
        })
      },

      // ── Derived helpers ───────────────────────────────────────────────────

      getLinkedNotes: (noteId) => {
        const { notes } = get()
        const note = notes.find((n) => n.id === noteId)
        if (!note?.linkedNoteIds?.length) return []
        return notes.filter((n) => note.linkedNoteIds!.includes(n.id))
      },

      getDueNotes: () => {
        const { notes } = get()
        const now = Date.now()
        return notes.filter((n) => n.reviewData && n.reviewData.nextReview <= now)
      },

      getDueFlashcards: () => {
        const { notes } = get()
        const now = Date.now()
        const result: Array<{ card: FlashCard; noteId: string; noteTitle: string }> = []
        for (const note of notes) {
          if (!note.flashcards?.length) continue
          for (const card of note.flashcards) {
            if (!card.reviewData || card.reviewData.nextReview <= now) {
              result.push({ card, noteId: note.id, noteTitle: note.title })
            }
          }
        }
        return result
      },

      getFavorites: () => get().notes.filter((n) => n.isFavorite),

      searchNotes: (query) => {
        const { notes } = get()
        const q = query.toLowerCase().trim()
        if (!q) return []
        return notes.filter((n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        )
      },
    }),
    { name: 'physics-study-app' }
  )
)
