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

  // Navigation
  setActiveView: (view: ActiveView) => void
  setSelectedCourse: (id: string | null) => void
  setSelectedLecture: (id: string | null) => void
  toggleSidebar: () => void

  // CRUD
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Course
  addLecture: (lecture: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>) => Lecture
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  deleteLecture: (id: string) => void
  deleteCourse: (id: string) => void
}

function uid() {
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

      setActiveView: (view) => set({ activeView: view }),
      setSelectedCourse: (id) => set({ selectedCourseId: id, selectedLectureId: null }),
      setSelectedLecture: (id) => set({ selectedLectureId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      addCourse: (data) => {
        const course: Course = {
          ...data,
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ courses: [...s.courses, course] }))
        return course
      },

      addLecture: (data) => {
        const lecture: Lecture = {
          ...data,
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ lectures: [...s.lectures, lecture] }))
        return lecture
      },

      addNote: (data) => {
        const note: Note = {
          ...data,
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ notes: [...s.notes, note] }))
        return note
      },

      updateNote: (id, patch) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        }))
      },

      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
        const { activeView } = get()
        if (activeView.type === 'note' && activeView.noteId === id) {
          set({ activeView: { type: 'home' } })
        }
      },

      deleteLecture: (id) => {
        const { notes } = get()
        const noteIds = notes.filter((n) => n.lectureId === id).map((n) => n.id)
        set((s) => ({
          lectures: s.lectures.filter((l) => l.id !== id),
          notes: s.notes.filter((n) => n.lectureId !== id),
        }))
        const { activeView } = get()
        if (activeView.type === 'note' && noteIds.includes(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
      },

      deleteCourse: (id) => {
        const { lectures, notes } = get()
        const lectureIds = lectures.filter((l) => l.courseId === id).map((l) => l.id)
        const noteIds = notes.filter((n) => n.courseId === id).map((n) => n.id)
        set((s) => ({
          courses: s.courses.filter((c) => c.id !== id),
          lectures: s.lectures.filter((l) => l.courseId !== id),
          notes: s.notes.filter((n) => n.courseId !== id),
        }))
        const { activeView } = get()
        if (activeView.type === 'note' && noteIds.includes(activeView.noteId)) {
          set({ activeView: { type: 'home' } })
        }
        // Clear selection if deleted
        if (get().selectedCourseId === id) {
          set({ selectedCourseId: null, selectedLectureId: null })
        }
        void lectureIds // used implicitly
      },
    }),
    { name: 'physics-study-app' }
  )
)
