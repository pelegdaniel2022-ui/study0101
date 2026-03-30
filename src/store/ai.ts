import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, APIKeys } from '@/types'
import { uid } from './app'

interface AIState {
  apiKeys: APIKeys
  chatHistory: Record<string, ChatMessage[]>   // noteId → messages
  globalChatHistory: ChatMessage[]              // for standalone tutor
  isThinking: boolean
  researchHistory: Array<{ query: string; result: string; timestamp: number }>

  setAPIKeys: (keys: Partial<APIKeys>) => void
  addMessage: (noteId: string | null, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat: (noteId: string | null) => void
  setThinking: (v: boolean) => void
  addResearch: (query: string, result: string) => void
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      apiKeys: { openai: '', perplexity: '', anthropic: '' },
      chatHistory: {},
      globalChatHistory: [],
      isThinking: false,
      researchHistory: [],

      setAPIKeys: (keys) => set((s) => ({ apiKeys: { ...s.apiKeys, ...keys } })),

      addMessage: (noteId, message) => {
        const msg: ChatMessage = { ...message, id: uid(), timestamp: Date.now() }
        if (noteId === null) {
          set((s) => ({ globalChatHistory: [...s.globalChatHistory, msg] }))
        } else {
          set((s) => ({
            chatHistory: {
              ...s.chatHistory,
              [noteId]: [...(s.chatHistory[noteId] ?? []), msg],
            },
          }))
        }
      },

      clearChat: (noteId) => {
        if (noteId === null) {
          set({ globalChatHistory: [] })
        } else {
          set((s) => ({
            chatHistory: { ...s.chatHistory, [noteId]: [] },
          }))
        }
      },

      setThinking: (v) => set({ isThinking: v }),

      addResearch: (query, result) => set((s) => ({
        researchHistory: [
          { query, result, timestamp: Date.now() },
          ...s.researchHistory.slice(0, 49),
        ],
      })),
    }),
    {
      name: 'physics-study-ai',
      partialize: (s) => ({
        apiKeys: s.apiKeys,
        chatHistory: s.chatHistory,
        globalChatHistory: s.globalChatHistory,
        researchHistory: s.researchHistory,
      }),
    }
  )
)
