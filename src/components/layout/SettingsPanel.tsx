import { useState } from 'react'
import { useAIStore } from '@/store/ai'
import { useAppStore } from '@/store/app'
import { Eye, EyeOff, Key, Moon, Sun, Smartphone, Download } from 'lucide-react'
import { notesToObsidianVault } from '@/lib/tiptapToMarkdown'

export function SettingsPanel() {
  const { apiKeys, setAPIKeys } = useAIStore()
  const { darkMode, toggleDarkMode, notes } = useAppStore()
  const [show, setShow] = useState({ openai: false, perplexity: false, anthropic: false })
  const [exportStatus, setExportStatus] = useState<'idle' | 'done'>('idle')

  function exportObsidian() {
    const vault = notesToObsidianVault(notes)
    // Build a simple zip-like structure: one .md file per note concatenated
    // For a full vault, we create individual file downloads.
    // Since we're in a browser (no JSZip), we export all notes as a single
    // Markdown file with --- separators, or download one-by-one via a JSON bundle.
    const bundle = vault
      .map((f) => `<!-- FILE: ${f.filename} -->\n${f.content}`)
      .join('\n\n---\n\n')
    const blob = new Blob([bundle], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PhysicsStudy-Obsidian-Export.md'
    a.click()
    URL.revokeObjectURL(url)
    setExportStatus('done')
    setTimeout(() => setExportStatus('idle'), 3000)
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
        <div className="space-y-3">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
              Export all {notes.length} note{notes.length !== 1 ? 's' : ''} as Obsidian-compatible Markdown with YAML frontmatter and [[wikilinks]].
            </p>
            <button
              onClick={exportObsidian}
              disabled={notes.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Download size={14} />
              {exportStatus === 'done' ? 'Downloaded!' : 'Export as Obsidian Vault'}
            </button>
          </div>
        </div>
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
