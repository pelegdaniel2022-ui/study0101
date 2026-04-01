import type { MLCEngine } from '@mlc-ai/web-llm'

let engine: MLCEngine | null = null
let loadedModel = ''

export interface ProgressReport {
  progress: number   // 0–1
  text: string
}

export const LOCAL_MODELS = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B (fast, ~800 MB)' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B (~2 GB)' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', label: 'Phi-3.5 Mini (~2.4 GB)' },
]

export async function getWebLLMEngine(
  modelId: string,
  onProgress?: (r: ProgressReport) => void,
): Promise<MLCEngine> {
  if (engine && loadedModel === modelId) return engine

  // Unload previous model to free VRAM
  if (engine) {
    await engine.unload()
    engine = null
    loadedModel = ''
  }

  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      onProgress?.({ progress: report.progress, text: report.text })
    },
  })
  loadedModel = modelId
  return engine
}

export function unloadWebLLM() {
  engine?.unload()
  engine = null
  loadedModel = ''
}

export function isWebGPUSupported(): boolean {
  // WebGPU is NOT available in Android WebView (as of Android 14)
  // even on devices with capable GPUs like Snapdragon 8 Gen 3
  const isAndroidWebView = /Android/i.test(navigator.userAgent)
  if (isAndroidWebView) return false
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}
