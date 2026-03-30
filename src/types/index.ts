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

export interface Note {
  id: string
  lectureId: string
  courseId: string
  title: string
  content: string        // Tiptap JSON document
  canvasData?: string    // Excalidraw JSON
  mode: 'document' | 'canvas' | 'split'
  tags: string[]
  createdAt: number
  updatedAt: number
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'note'; noteId: string }
  | { type: 'ai-tutor' }
  | { type: 'research' }
  | { type: 'simulations' }
