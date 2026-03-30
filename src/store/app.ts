import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Course, Lecture, Note, ActiveView } from '@/types'

interface AppState {
  courses: Course[]
  lectures: Lecture[]
  notes: Note[]
  activeView: ActiveView
  selectedCourseId: string | null
  selectedLectureId: string | null
  sidebarOpen: boolean
  darkMode: boolean
  fullscreenNote: boolean

  setActiveView: (view: ActiveView) => void
  setSelectedCourse: (id: string | null) => void
  setSelectedLecture: (id: string | null) => void
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setFullscreenNote: (v: boolean) => void

  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Course
  updateCourse: (id: string, patch: Partial<Course>) => void
  deleteCourse: (id: string) => void

  addLecture: (lecture: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>) => Lecture
  updateLecture: (id: string, patch: Partial<Lecture>) => void
  deleteLecture: (id: string) => void

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      courses: [],
      lectures: [],
      notes: [],
      activeView: { type: 'home' },
      selectedCourseId: null,
      selectedLectureId: null,
      sidebarOpen: true,
      darkMode: false,
      fullscreenNote: false,

      setActiveView: (view) => set({ activeView: view }),
      setSelectedCourse: (id) => set({ selectedCourseId: id, selectedLectureId: null }),
      setSelectedLecture: (id) => set({ selectedLectureId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setFullscreenNote: (v) => set({ fullscreenNote: v }),

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
        const noteIds = new Set(notes.filter((n) => n.courseId === id).map((n) => n.id))
        set((s) => ({
          courses: s.courses.filter((c) => c.id !== id),
          lectures: s.lectures.filter((l) => !lectureIds.has(l.id)),
          notes: s.notes.filter((n) => !noteIds.has(n.id)),
          selectedCourseId: s.selectedCourseId === id ? null : s.selectedCourseId,
        }))
        if (activeView.type === 'note' && noteIds.has(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
      },

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
          notes: s.notes.filter((n) => n.lectureId !== id),
        }))
        if (activeView.type === 'note' && noteIds.has(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
      },

      addNote: (data) => {
        const note: Note = { ...data, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ notes: [...s.notes, note] }))
        return note
      },
      updateNote: (id, patch) => set((s) => ({
        notes: s.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n),
      })),
      deleteNote: (id) => {
        const { activeView } = get()
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
        if (activeView.type === 'note' && activeView.noteId === id) {
          set({ activeView: { type: 'home' } })
        }
      },
    }),
    { name: 'physics-study-app' }
  )
)
