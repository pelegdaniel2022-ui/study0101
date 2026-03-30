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
  content: string        // Tiptap JSON stringified
  canvasData?: string    // Excalidraw JSON stringified
  mode: 'document' | 'canvas' | 'split'
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface FlashCard {
  front: string
  back: string
}

export interface SimConfig {
  type: 'pendulum' | 'projectile' | 'harmonic' | 'wave'
  params: Record<string, number>
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'note'; noteId: string }
  | { type: 'ai-tutor' }
  | { type: 'research' }
  | { type: 'simulations' }
  | { type: 'settings' }
  | { type: 'study-coach'; noteId: string }

export interface APIKeys {
  openai: string
  perplexity: string
  anthropic: string
}
