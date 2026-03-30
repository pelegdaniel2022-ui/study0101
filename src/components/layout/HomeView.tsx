import { BookOpen, Bot, FlaskConical, FileText, Plus } from 'lucide-react'
import { useAppStore } from '@/store/app'

export function HomeView() {
  const { courses, notes, setActiveView, addCourse, addLecture, addNote } = useAppStore()

  const recentNotes = [...notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)

  function handleQuickNote() {
    let courseId: string
    let lectureId: string

    if (courses.length === 0) {
      const course = addCourse({ name: 'General', color: '#7c3aed' })
      courseId = course.id
      const lecture = addLecture({ courseId, title: 'Notes', date: Date.now() })
      lectureId = lecture.id
    } else {
      const { lectures } = useAppStore.getState()
      courseId = courses[0].id
      const existingLecture = lectures.find((l) => l.courseId === courseId)
      if (existingLecture) {
        lectureId = existingLecture.id
      } else {
        const lecture = addLecture({ courseId, title: 'Notes', date: Date.now() })
        lectureId = lecture.id
      }
    }

    const note = addNote({
      lectureId,
      courseId,
      title: 'Untitled Note',
      content: '',
      mode: 'document',
      tags: [],
    })
    setActiveView({ type: 'note', noteId: note.id })
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8 max-w-3xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Physics Study Workspace
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm">
          Your notes, simulations, and AI tutor — all in one place.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <QuickAction
          icon={<FileText size={18} />}
          title="New Note"
          description="Start writing"
          color="#7c3aed"
          onClick={handleQuickNote}
        />
        <QuickAction
          icon={<Bot size={18} />}
          title="AI Tutor"
          description="Ask physics questions"
          color="#2563eb"
          onClick={() => setActiveView({ type: 'ai-tutor' })}
        />
        <QuickAction
          icon={<FlaskConical size={18} />}
          title="Simulations"
          description="Visualize physics"
          color="#059669"
          onClick={() => setActiveView({ type: 'simulations' })}
        />
        <QuickAction
          icon={<Plus size={18} />}
          title="New Course"
          description="Organize your studies"
          color="#d97706"
          onClick={() => {}}
        />
      </div>

      {/* Recent notes */}
      {recentNotes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
            Recent Notes
          </h2>
          <div className="space-y-2">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveView({ type: 'note', noteId: note.id })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-left transition-colors"
              >
                <FileText size={15} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{note.title || 'Untitled'}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Add a course in the sidebar to get started.</p>
        </div>
      )}
    </div>
  )
}

function QuickAction({
  icon, title, description, color, onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--muted)/0.5)] text-left transition-all"
    >
      <div
        className="p-2 rounded-lg shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-[hsl(var(--foreground))]">{title}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">{description}</div>
      </div>
    </button>
  )
}
