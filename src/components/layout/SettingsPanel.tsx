import { useState } from 'react'
import JSZip from 'jszip'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { LOCAL_MODELS, isWebGPUSupported } from '@/lib/webllm'
import { Eye, EyeOff, Key, Moon, Sun, Smartphone, Download, Loader2, Cpu, Cloud } from 'lucide-react'
import { notesToObsidianVault } from '@/lib/tiptapToMarkdown'

export function SettingsPanel() {
  const { apiKeys, setAPIKeys, aiMode, setAIMode, localModel, setLocalModel } = useAIStore()
  const { darkMode, toggleDarkMode, notes, courses, lectures } = useAppStore()
  const [show, setShow] = useState({ openai: false, perplexity: false, anthropic: false })
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'done'>('idle')

  async function exportObsidian() {
    if (notes.length === 0) return
    setExportStatus('exporting')

    try {
      const zip = new JSZip()
      const vault = notesToObsidianVault(notes)

      // Build per-note path: CourseName/LectureName/NoteTitle.md
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        const exported = vault[i]
        const course = courses.find((c) => c.id === note.courseId)
        const lecture = lectures.find((l) => l.id === note.lectureId)

        const safeCourse = (course?.name ?? 'Uncategorised').replace(/[/\\?%*:|"<>]/g, '-')
        const safeLecture = (lecture?.title ?? 'Notes').replace(/[/\\?%*:|"<>]/g, '-')
        const path = `${safeCourse}/${safeLecture}/${exported.filename}`

        zip.file(path, exported.content)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'PhysicsStudy-Obsidian-Vault.zip'
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('done')
      setTimeout(() => setExportStatus('idle'), 4000)
    } catch {
      setExportStatus('idle')
    }
  }

  function input(key: keyof typeof apiKeys) {
    return (
      <div className="flex items-center gap-2 relative">
        <input
          type={show[key] ? 'text' : 'password'}
          className="flex-1 px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none focus:border-[hsl(var(--primary))] font-mono"
          placeholder="sk-…"
          value={apiKeys[key]}
          onChange={(e) => setAPIKeys({ [key]: e.target.value })}
        />
        <button
          onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          className="absolute right-3 text-[hsl(var(--muted-foreground))]"
        >
          {show[key] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      {/* AI Mode */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-[hsl(var(--primary))]" />
          <h2 className="font-semibold">AI Mode</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
          Cloud uses OpenAI GPT-4o (requires API key). Local runs a language model on-device via WebGPU — fully offline, no key needed. First use downloads the model to your device.
        </p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAIMode('cloud')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              aiMode === 'cloud'
                ? 'bg-[hsl(var(--primary))] text-white border-transparent'
                : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            <Cloud size={14} /> Cloud (GPT-4o)
          </button>
          <button
            onClick={() => setAIMode('local')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              aiMode === 'local'
                ? 'bg-[hsl(var(--primary))] text-white border-transparent'
                : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            <Cpu size={14} /> Local (offline)
          </button>
        </div>
        {aiMode === 'local' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model</label>
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none focus:border-[hsl(var(--primary))]"
              >
                {LOCAL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            {!isWebGPUSupported() && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-3 py-2">
                WebGPU is not available in this browser. Local mode requires Chrome 113+ or Edge 113+.
              </p>
            )}
            {isWebGPUSupported() && (
              <p className="text-xs text-emerald-600 bg-emerald-500/10 rounded-xl px-3 py-2">
                ✓ WebGPU is available. Open the AI Tutor in any note to load the model.
              </p>
            )}
          </div>
        )}
      </section>

      {/* API Keys */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-[hsl(var(--primary))]" />
          <h2 className="font-semibold">API Keys</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
          Keys are stored locally in your browser and never sent to any server except the respective AI providers.
        </p>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">OpenAI API Key</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Used for AI Tutor, Study Tools, Scan OCR, and Librarian</p>
            {input('openai')}
            {apiKeys.openai && <p className="text-xs text-emerald-600 mt-1">✓ Key set</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Perplexity API Key</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Used for the Research Workspace</p>
            {input('perplexity')}
            {apiKeys.perplexity && <p className="text-xs text-emerald-600 mt-1">✓ Key set</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Anthropic API Key</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Used for writing assistance and explanations</p>
            {input('anthropic')}
            {apiKeys.anthropic && <p className="text-xs text-emerald-600 mt-1">✓ Key set</p>}
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          <h2 className="font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))]">
          <span className="text-sm">Dark mode</span>
          <button
            onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </section>

      {/* Export */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Download size={16} className="text-[hsl(var(--primary))]" />
          <h2 className="font-semibold">Export</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Export all {notes.length} note{notes.length !== 1 ? 's' : ''} as an Obsidian-compatible vault. Each note becomes a
          Markdown file with YAML frontmatter, [[wikilinks]], and LaTeX equations. Organized as <code className="text-xs bg-[hsl(var(--muted))] px-1 rounded">Course/Lecture/Note.md</code>.
        </p>
        <button
          onClick={exportObsidian}
          disabled={notes.length === 0 || exportStatus === 'exporting'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {exportStatus === 'exporting'
            ? <><Loader2 size={14} className="animate-spin" /> Building zip…</>
            : exportStatus === 'done'
            ? '✓ Downloaded!'
            : <><Download size={14} /> Export as Obsidian Vault (.zip)</>}
        </button>
      </section>

      {/* Android */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={16} />
          <h2 className="font-semibold">Android / Samsung Tab</h2>
        </div>
        <div className="p-4 bg-[hsl(var(--muted)/0.5)] rounded-xl text-sm text-[hsl(var(--muted-foreground))]">
          <p>To build the Android APK:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-xs font-mono">
            <li>npm run build</li>
            <li>npx cap add android</li>
            <li>npx cap sync</li>
            <li>npx cap run android</li>
          </ol>
          <p className="mt-2 text-xs">Requires Android Studio installed with an emulator or connected Samsung Tab.</p>
        </div>
      </section>
    </div>
  )
}
