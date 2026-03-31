import { useState } from 'react'
import {
  BookOpen, ChevronDown, ChevronRight, Plus, Trash2, FlaskConical,
  Bot, Search, GraduationCap, FileText, PanelLeftClose, PanelLeftOpen,
  Settings, LibraryBig, Microscope, Moon, Sun, Brain, Network, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import type { Course, Lecture } from '@/types'

const COURSE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#db2777', '#64748b',
]

export function Sidebar() {
  const {
    courses, lectures, notes,
    sidebarOpen, activeView, darkMode,
    setActiveView, setSelectedCourse, setSelectedLecture,
    toggleSidebar, toggleDarkMode,
    addCourse, addLecture, addNote,
    deleteCourse, deleteLecture, deleteNote,
  } = useAppStore()

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set())
  const [newCourseName, setNewCourseName] = useState('')
  const [addingCourse, setAddingCourse] = useState(false)
  const [newLectureName, setNewLectureName] = useState('')
  const [addingLectureFor, setAddingLectureFor] = useState<string | null>(null)

  function toggleCourse(id: string) {
    setExpandedCourses((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleLecture(id: string) {
    setExpandedLectures((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleAddCourse() {
    const name = newCourseName.trim()
    if (!name) return
    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length]
    const course = addCourse({ name, color })
    setExpandedCourses((p) => new Set([...p, course.id]))
    setNewCourseName('')
    setAddingCourse(false)
    setSelectedCourse(course.id)
  }

  function handleAddLecture(courseId: string) {
    const title = newLectureName.trim()
    if (!title) return
    const lecture = addLecture({ courseId, title, date: Date.now() })
    setExpandedLectures((p) => new Set([...p, lecture.id]))
    setNewLectureName('')
    setAddingLectureFor(null)
    setSelectedLecture(lecture.id)
  }

  function handleAddNote(lectureId: string, courseId: string) {
    const note = addNote({ lectureId, courseId, title: 'Untitled Note', content: '', mode: 'document', tags: [] })
    setActiveView({ type: 'note', noteId: note.id })
  }

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1.5 h-full border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] w-11 gap-2">
        <button onClick={toggleSidebar} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Open sidebar">
          <PanelLeftOpen size={16} />
        </button>
        <button onClick={() => setActiveView({ type: 'ai-tutor' })} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="AI Tutor">
          <Bot size={16} />
        </button>
        <button onClick={() => setActiveView({ type: 'simulations' })} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Simulations">
          <FlaskConical size={16} />
        </button>
        <button onClick={() => setActiveView({ type: 'daily-notes' })} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Today's Journal">
          <CalendarDays size={16} />
        </button>
        <button onClick={() => setActiveView({ type: 'knowledge-graph' })} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Graph">
          <Network size={16} />
        </button>
        <div className="mt-auto">
          <button onClick={toggleDarkMode} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => setActiveView({ type: 'settings' })} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Settings">
            <Settings size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] w-[var(--sidebar-width)] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-[hsl(var(--primary))]" />
          <span className="font-semibold text-sm">PhysicsStudy</span>
        </div>
        <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Top nav */}
      <div className="px-2 py-1.5 border-b border-[hsl(var(--border))]">
        <NavItem icon={<Search size={14} />} label="Search" active={false} onClick={() => setActiveView({ type: 'home' })} />
        <NavItem icon={<Bot size={14} />} label="AI Tutor" active={activeView.type === 'ai-tutor'} onClick={() => setActiveView({ type: 'ai-tutor' })} />
        <NavItem icon={<FlaskConical size={14} />} label="Simulations" active={activeView.type === 'simulations'} onClick={() => setActiveView({ type: 'simulations' })} />
        <NavItem icon={<Microscope size={14} />} label="Research" active={activeView.type === 'research'} onClick={() => setActiveView({ type: 'research' })} />
        <NavItem icon={<LibraryBig size={14} />} label="Librarian" active={activeView.type === 'study-coach'} onClick={() => setActiveView({ type: 'study-coach', noteId: '' })} />
        <NavItem icon={<CalendarDays size={14} />} label="Today" active={activeView.type === 'daily-notes'} onClick={() => setActiveView({ type: 'daily-notes' })} />
        <NavItem icon={<Brain size={14} />} label="Daily Review" active={activeView.type === 'daily-review'} onClick={() => setActiveView({ type: 'daily-review' })} />
        <NavItem icon={<Network size={14} />} label="Graph" active={activeView.type === 'knowledge-graph'} onClick={() => setActiveView({ type: 'knowledge-graph' })} />
      </div>

      {/* Courses tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Courses</span>
          <button onClick={() => setAddingCourse(true)} className="p-0.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="New course">
            <Plus size={13} />
          </button>
        </div>

        {addingCourse && (
          <div className="mb-1 px-1">
            <input
              autoFocus
              className="w-full text-sm px-2 py-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:border-[hsl(var(--primary))]"
              placeholder="Course name…"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCourse()
                if (e.key === 'Escape') { setAddingCourse(false); setNewCourseName('') }
              }}
              onBlur={() => { if (!newCourseName.trim()) setAddingCourse(false) }}
            />
          </div>
        )}

        {courses.map((course) => (
          <CourseNode
            key={course.id}
            course={course}
            lectures={lectures.filter((l) => l.courseId === course.id)}
            notes={notes}
            expanded={expandedCourses.has(course.id)}
            expandedLectures={expandedLectures}
            activeView={activeView}
            onToggle={() => toggleCourse(course.id)}
            onToggleLecture={toggleLecture}
            onSelectNote={(id) => setActiveView({ type: 'note', noteId: id })}
            onAddLecture={() => { setExpandedCourses((p) => new Set([...p, course.id])); setAddingLectureFor(course.id) }}
            addingLectureFor={addingLectureFor}
            newLectureName={newLectureName}
            setNewLectureName={setNewLectureName}
            onConfirmLecture={() => handleAddLecture(course.id)}
            onCancelLecture={() => { setAddingLectureFor(null); setNewLectureName('') }}
            onAddNote={handleAddNote}
            onDeleteCourse={() => deleteCourse(course.id)}
            onDeleteLecture={deleteLecture}
            onDeleteNote={deleteNote}
          />
        ))}

        {courses.length === 0 && !addingCourse && (
          <div className="px-2 py-5 text-center text-xs text-[hsl(var(--muted-foreground))]">
            <button onClick={() => setAddingCourse(true)} className="text-[hsl(var(--primary))] underline">Add your first course</button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-2 py-2 border-t border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <NavItem icon={<Settings size={14} />} label="Settings" active={activeView.type === 'settings'} onClick={() => setActiveView({ type: 'settings' })} />
          <button onClick={toggleDarkMode} className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" title="Toggle dark mode">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm', active ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium' : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]')}
    >
      {icon} {label}
    </button>
  )
}

function CourseNode({ course, lectures, notes, expanded, expandedLectures, activeView, onToggle, onToggleLecture, onSelectNote, onAddLecture, addingLectureFor, newLectureName, setNewLectureName, onConfirmLecture, onCancelLecture, onAddNote, onDeleteCourse, onDeleteLecture, onDeleteNote }: {
  course: Course; lectures: Lecture[]
  notes: ReturnType<typeof useAppStore.getState>['notes']
  expanded: boolean; expandedLectures: Set<string>
  activeView: ReturnType<typeof useAppStore.getState>['activeView']
  onToggle: () => void; onToggleLecture: (id: string) => void; onSelectNote: (id: string) => void
  onAddLecture: () => void; addingLectureFor: string | null; newLectureName: string; setNewLectureName: (v: string) => void
  onConfirmLecture: () => void; onCancelLecture: () => void; onAddNote: (lid: string, cid: string) => void
  onDeleteCourse: () => void; onDeleteLecture: (id: string) => void; onDeleteNote: (id: string) => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1 px-1 py-1 rounded-md hover:bg-[hsl(var(--muted))] cursor-pointer" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onToggle}>
        <span style={{ color: course.color }}>{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <BookOpen size={13} style={{ color: course.color }} className="shrink-0" />
        <span className="text-sm truncate flex-1 font-medium">{course.name}</span>
        {hov && (
          <div className="flex gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={onAddLecture} className="p-0.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"><Plus size={11} /></button>
            <button onClick={onDeleteCourse} className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 text-[hsl(var(--muted-foreground))]"><Trash2 size={11} /></button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="ml-4 border-l border-[hsl(var(--border))] pl-2">
          {addingLectureFor === course.id && (
            <input autoFocus className="w-full text-xs px-2 py-1 mb-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:border-[hsl(var(--primary))]" placeholder="Lecture title…" value={newLectureName} onChange={(e) => setNewLectureName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onConfirmLecture(); if (e.key === 'Escape') onCancelLecture() }} onBlur={() => { if (!newLectureName.trim()) onCancelLecture() }} />
          )}
          {lectures.map((lec) => (
            <LectureNode key={lec.id} lecture={lec} courseId={course.id} notes={notes.filter((n) => n.lectureId === lec.id)} expanded={expandedLectures.has(lec.id)} activeView={activeView} onToggle={() => onToggleLecture(lec.id)} onSelectNote={onSelectNote} onAddNote={() => onAddNote(lec.id, course.id)} onDeleteLecture={() => onDeleteLecture(lec.id)} onDeleteNote={onDeleteNote} />
          ))}
          {lectures.length === 0 && addingLectureFor !== course.id && (
            <button onClick={onAddLecture} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] px-1 py-1">+ Add lecture</button>
          )}
        </div>
      )}
    </div>
  )
}

function LectureNode({ lecture, courseId, notes, expanded, activeView, onToggle, onSelectNote, onAddNote, onDeleteLecture, onDeleteNote }: {
  lecture: Lecture; courseId: string
  notes: ReturnType<typeof useAppStore.getState>['notes']
  expanded: boolean; activeView: ReturnType<typeof useAppStore.getState>['activeView']
  onToggle: () => void; onSelectNote: (id: string) => void; onAddNote: () => void; onDeleteLecture: () => void; onDeleteNote: (id: string) => void
}) {
  void courseId
  const [hov, setHov] = useState(false)
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1 px-1 py-1 rounded-md hover:bg-[hsl(var(--muted))] cursor-pointer" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onToggle}>
        {expanded ? <ChevronDown size={12} className="text-[hsl(var(--muted-foreground))] shrink-0" /> : <ChevronRight size={12} className="text-[hsl(var(--muted-foreground))] shrink-0" />}
        <span className="text-xs truncate flex-1">{lecture.title}</span>
        {hov && (
          <div className="flex gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={onAddNote} className="p-0.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"><Plus size={10} /></button>
            <button onClick={onDeleteLecture} className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 text-[hsl(var(--muted-foreground))]"><Trash2 size={10} /></button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
          {notes.map((note) => (
            <NoteItem key={note.id} title={note.title} active={activeView.type === 'note' && activeView.noteId === note.id} onClick={() => onSelectNote(note.id)} onDelete={() => onDeleteNote(note.id)} />
          ))}
          <button onClick={onAddNote} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] px-1 py-0.5">+ New note</button>
        </div>
      )}
    </div>
  )
}

function NoteItem({ title, active, onClick, onDelete }: { title: string; active: boolean; onClick: () => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className={cn('flex items-center gap-1 px-1 py-1 rounded-md cursor-pointer text-xs', active ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]')}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
    >
      <FileText size={10} className="shrink-0" />
      <span className="truncate flex-1">{title || 'Untitled'}</span>
      {hov && <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-0.5 rounded hover:bg-red-100 hover:text-red-600"><Trash2 size={9} /></button>}
    </div>
  )
}
