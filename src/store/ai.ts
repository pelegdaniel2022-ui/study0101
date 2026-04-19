import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, APIKeys } from '@/types'
import { uid } from './app'

export type AIMode = 'cloud' | 'local'
export type LocalModelId = 'Phi-3.5-mini-instruct-q4f16_1-MLC' | 'gemma-2-2b-it-q4f16_1-MLC'

interface AIState {
  apiKeys: APIKeys
  chatHistory: Record<string, ChatMessage[]>   // noteId → messages
  globalChatHistory: ChatMessage[]              // for standalone tutor
  isThinking: boolean
  researchHistory: Array<{ query: string; result: string; timestamp: number }>
  aiMode: AIMode
  localModelId: LocalModelId

  setAPIKeys: (keys: Partial<APIKeys>) => void
  addMessage: (noteId: string | null, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat: (noteId: string | null) => void
  setThinking: (v: boolean) => void
  addResearch: (query: string, result: string) => void
  setAIMode: (mode: AIMode) => void
  setLocalModelId: (id: LocalModelId) => void
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      apiKeys: { openai: '', perplexity: '', anthropic: '' },
      chatHistory: {},
      globalChatHistory: [],
      isThinking: false,
      researchHistory: [],
      aiMode: 'cloud' as AIMode,
      localModelId: 'Phi-3.5-mini-instruct-q4f16_1-MLC' as LocalModelId,

      setAPIKeys: (keys) => set((s) => ({ apiKeys: { ...s.apiKeys, ...keys } })),
      setAIMode: (mode) => set({ aiMode: mode }),
      setLocalModelId: (id) => set({ localModelId: id }),

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
        aiMode: s.aiMode,
        localModelId: s.localModelId,
      }),
    }
  )
)
