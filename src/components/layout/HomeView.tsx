import { useState } from 'react'
import { BookOpen, Bot, FlaskConical, FileText, Plus, Search, Settings, LibraryBig } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { SearchModal } from './SearchModal'
import { StudyTools } from '@/components/ai/StudyTools'
import { ScanUpload } from '@/components/ai/ScanUpload'

export function HomeView() {
  const { courses, notes, lectures, setActiveView, addCourse, addLecture, addNote } = useAppStore()
  const [showSearch, setShowSearch] = useState(false)
  const [studyToolsNote, setStudyToolsNote] = useState<string | null>(null)
  const [scanNote, setScanNote] = useState<string | null>(null)

  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)

  function handleQuickNote() {
    let courseId: string
    let lectureId: string

    if (courses.length === 0) {
      const course = addCourse({ name: 'General', color: '#7c3aed' })
      courseId = course.id
      const lecture = addLecture({ courseId, title: 'Notes', date: Date.now() })
      lectureId = lecture.id
    } else {
      courseId = courses[0].id
      const existing = lectures.find((l) => l.courseId === courseId)
      if (existing) {
        lectureId = existing.id
      } else {
        const lecture = addLecture({ courseId, title: 'Notes', date: Date.now() })
        lectureId = lecture.id
      }
    }

    const note = addNote({ lectureId, courseId, title: 'Untitled Note', content: '', mode: 'document', tags: [] })
    setActiveView({ type: 'note', noteId: note.id })
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Physics Study</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{courses.length} courses · {notes.length} notes</p>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.4)] transition-colors"
        >
          <Search size={14} /> Search <span className="text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">⌘K</span>
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 mb-8">
        <QuickAction icon={<Plus size={17} />} title="New Note" description="Start writing" color="#7c3aed" onClick={handleQuickNote} />
        <QuickAction icon={<Bot size={17} />} title="AI Tutor" description="Ask physics questions" color="#2563eb" onClick={() => setActiveView({ type: 'ai-tutor' })} />
        <QuickAction icon={<FlaskConical size={17} />} title="Simulations" description="Pendulum, projectile, waves…" color="#059669" onClick={() => setActiveView({ type: 'simulations' })} />
        <QuickAction icon={<Search size={17} />} title="Research" description="Perplexity-powered deep search" color="#d97706" onClick={() => setActiveView({ type: 'research' })} />
        <QuickAction icon={<LibraryBig size={17} />} title="Librarian" description="Auto-organize notes with AI" color="#0891b2" onClick={() => setActiveView({ type: 'study-coach', noteId: '' })} />
        <QuickAction icon={<Settings size={17} />} title="Settings" description="API keys, dark mode" color="#64748b" onClick={() => setActiveView({ type: 'settings' })} />
      </div>

      {/* Recent notes */}
      {recentNotes.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Recent Notes</h2>
          <div className="space-y-1.5">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.4)] group transition-colors"
              >
                <button
                  className="flex-1 flex items-center gap-3 text-left"
                  onClick={() => setActiveView({ type: 'note', noteId: note.id })}
                >
                  <FileText size={14} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{note.title || 'Untitled'}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(note.updatedAt).toLocaleString()}</div>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </button>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={() => setStudyToolsNote(note.id)}
                    className="text-xs px-2 py-1 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-lg"
                    title="Study tools"
                  >
                    Study
                  </button>
                  <button
                    onClick={() => setScanNote(note.id)}
                    className="text-xs px-2 py-1 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded-lg"
                    title="Scan"
                  >
                    Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">Add a course in the sidebar to get started.</p>
          <button
            onClick={handleQuickNote}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-sm"
          >
            Create first note
          </button>
        </div>
      )}

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {studyToolsNote && <StudyTools noteId={studyToolsNote} onClose={() => setStudyToolsNote(null)} />}
      {scanNote && <ScanUpload noteId={scanNote} onClose={() => setScanNote(null)} />}
    </div>
  )
}

function QuickAction({ icon, title, description, color, onClick }: {
  icon: React.ReactNode; title: string; description: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--muted)/0.4)] text-left transition-all"
    >
      <div className="p-2 rounded-lg shrink-0" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">{description}</div>
      </div>
    </button>
  )
}
