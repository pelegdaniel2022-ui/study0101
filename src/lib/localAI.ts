import type { LocalModelId } from '@/store/ai'

// Singleton engine — persists between component renders
let engineRef: unknown = null
let loadedModelId: string | null = null

export type DownloadProgressCallback = (progress: number, text: string) => void

export async function loadLocalModel(
  modelId: LocalModelId,
  onProgress?: DownloadProgressCallback
): Promise<void> {
  if (loadedModelId === modelId && engineRef !== null) return

  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

  engineRef = await CreateMLCEngine(modelId, {
    initProgressCallback: (report: { progress: number; text: string }) => {
      onProgress?.(report.progress, report.text)
    },
  })
  loadedModelId = modelId
}

export async function localChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  onChunk?: (delta: string) => void
): Promise<string> {
  if (!engineRef) throw new Error('Local model not loaded')

  const engine = engineRef as {
    chat: {
      completions: {
        create: (opts: unknown) => Promise<unknown>
      }
    }
  }

  if (onChunk) {
    const stream = await engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }) as AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>

    let full = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) { full += delta; onChunk(delta) }
    }
    return full
  } else {
    const response = await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }) as { choices: Array<{ message: { content: string } }> }
    return response.choices[0].message.content
  }
}

export function isModelLoaded(modelId: LocalModelId): boolean {
  return loadedModelId === modelId && engineRef !== null
}

export function unloadModel(): void {
  engineRef = null
  loadedModelId = null
}
