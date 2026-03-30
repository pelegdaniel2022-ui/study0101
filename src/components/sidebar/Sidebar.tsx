import { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FlaskConical,
  Bot,
  Search,
  GraduationCap,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import type { Course, Lecture } from '@/types'

const COURSE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#7c3aed', '#db2777',
]

export function Sidebar() {
  const {
    courses, lectures, notes,
    sidebarOpen, activeView,
    setActiveView, setSelectedCourse, setSelectedLecture,
    toggleSidebar, addCourse, addLecture, addNote,
    deleteCourse, deleteLecture, deleteNote,
  } = useAppStore()

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set())
  const [newCourseName, setNewCourseName] = useState('')
  const [addingCourse, setAddingCourse] = useState(false)
  const [newLectureName, setNewLectureName] = useState('')
  const [addingLectureFor, setAddingLectureFor] = useState<string | null>(null)

  function toggleCourse(id: string) {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleLecture(id: string) {
    setExpandedLectures((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAddCourse() {
    const name = newCourseName.trim()
    if (!name) return
    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length]
    const course = addCourse({ name, color })
    setExpandedCourses((prev) => new Set([...prev, course.id]))
    setNewCourseName('')
    setAddingCourse(false)
    setSelectedCourse(course.id)
  }

  function handleAddLecture(courseId: string) {
    const title = newLectureName.trim()
    if (!title) return
    const lecture = addLecture({ courseId, title, date: Date.now() })
    setExpandedLectures((prev) => new Set([...prev, lecture.id]))
    setNewLectureName('')
    setAddingLectureFor(null)
    setSelectedLecture(lecture.id)
  }

  function handleAddNote(lectureId: string, courseId: string) {
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

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-2 h-full border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] w-12 gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          title="Open sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] w-[var(--sidebar-width)] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-[hsl(var(--primary))]" />
          <span className="font-semibold text-sm">PhysicsStudy</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Nav items */}
      <div className="px-2 py-2 border-b border-[hsl(var(--border))]">
        <NavItem
          icon={<Search size={15} />}
          label="Search"
          active={false}
          onClick={() => {}}
        />
        <NavItem
          icon={<Bot size={15} />}
          label="AI Tutor"
          active={activeView.type === 'ai-tutor'}
          onClick={() => setActiveView({ type: 'ai-tutor' })}
        />
        <NavItem
          icon={<FlaskConical size={15} />}
          label="Simulations"
          active={activeView.type === 'simulations'}
          onClick={() => setActiveView({ type: 'simulations' })}
        />
      </div>

      {/* Courses tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Courses
          </span>
          <button
            onClick={() => setAddingCourse(true)}
            className="p-0.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            title="New course"
          >
            <Plus size={14} />
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
            onAddLecture={() => {
              setExpandedCourses((p) => new Set([...p, course.id]))
              setAddingLectureFor(course.id)
            }}
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
          <div className="px-2 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            No courses yet.<br />
            <button onClick={() => setAddingCourse(true)} className="text-[hsl(var(--primary))] underline mt-1">
              Add your first course
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NavItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm',
        active
          ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium'
          : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function CourseNode({
  course, lectures, notes, expanded, expandedLectures, activeView,
  onToggle, onToggleLecture, onSelectNote, onAddLecture,
  addingLectureFor, newLectureName, setNewLectureName,
  onConfirmLecture, onCancelLecture, onAddNote,
  onDeleteCourse, onDeleteLecture, onDeleteNote,
}: {
  course: Course
  lectures: Lecture[]
  notes: ReturnType<typeof useAppStore.getState>['notes']
  expanded: boolean
  expandedLectures: Set<string>
  activeView: ReturnType<typeof useAppStore.getState>['activeView']
  onToggle: () => void
  onToggleLecture: (id: string) => void
  onSelectNote: (id: string) => void
  onAddLecture: () => void
  addingLectureFor: string | null
  newLectureName: string
  setNewLectureName: (v: string) => void
  onConfirmLecture: () => void
  onCancelLecture: () => void
  onAddNote: (lectureId: string, courseId: string) => void
  onDeleteCourse: () => void
  onDeleteLecture: (id: string) => void
  onDeleteNote: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="mb-0.5">
      <div
        className="flex items-center gap-1 px-1 py-1 rounded-md hover:bg-[hsl(var(--muted))] group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
      >
        <span style={{ color: course.color }} className="shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <BookOpen size={14} style={{ color: course.color }} className="shrink-0" />
        <span className="text-sm truncate flex-1 font-medium">{course.name}</span>
        {hovered && (
          <div className="flex items-center gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAddLecture}
              className="p-0.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
              title="Add lecture"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={onDeleteCourse}
              className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 text-[hsl(var(--muted-foreground))]"
              title="Delete course"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="ml-4 border-l border-[hsl(var(--border))] pl-2">
          {addingLectureFor === course.id && (
            <div className="mb-1">
              <input
                autoFocus
                className="w-full text-sm px-2 py-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:border-[hsl(var(--primary))]"
                placeholder="Lecture title…"
                value={newLectureName}
                onChange={(e) => setNewLectureName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmLecture()
                  if (e.key === 'Escape') onCancelLecture()
                }}
                onBlur={() => { if (!newLectureName.trim()) onCancelLecture() }}
              />
            </div>
          )}

          {lectures.map((lecture) => {
            const lectureNotes = notes.filter((n) => n.lectureId === lecture.id)
            const lExpanded = expandedLectures.has(lecture.id)
            return (
              <LectureNode
                key={lecture.id}
                lecture={lecture}
                courseId={course.id}
                notes={lectureNotes}
                expanded={lExpanded}
                activeView={activeView}
                onToggle={() => onToggleLecture(lecture.id)}
                onSelectNote={onSelectNote}
                onAddNote={() => onAddNote(lecture.id, course.id)}
                onDeleteLecture={() => onDeleteLecture(lecture.id)}
                onDeleteNote={onDeleteNote}
              />
            )
          })}

          {lectures.length === 0 && addingLectureFor !== course.id && (
            <button
              onClick={onAddLecture}
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] px-1 py-1"
            >
              + Add lecture
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LectureNode({
  lecture, courseId, notes, expanded, activeView,
  onToggle, onSelectNote, onAddNote, onDeleteLecture, onDeleteNote,
}: {
  lecture: Lecture
  courseId: string
  notes: ReturnType<typeof useAppStore.getState>['notes']
  expanded: boolean
  activeView: ReturnType<typeof useAppStore.getState>['activeView']
  onToggle: () => void
  onSelectNote: (id: string) => void
  onAddNote: () => void
  onDeleteLecture: () => void
  onDeleteNote: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  void courseId

  return (
    <div className="mb-0.5">
      <div
        className="flex items-center gap-1 px-1 py-1 rounded-md hover:bg-[hsl(var(--muted))] group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
      >
        {expanded ? <ChevronDown size={13} className="shrink-0 text-[hsl(var(--muted-foreground))]" /> : <ChevronRight size={13} className="shrink-0 text-[hsl(var(--muted-foreground))]" />}
        <span className="text-xs truncate flex-1 text-[hsl(var(--foreground))]">{lecture.title}</span>
        {hovered && (
          <div className="flex items-center gap-0.5 ml-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAddNote}
              className="p-0.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
              title="Add note"
            >
              <Plus size={11} />
            </button>
            <button
              onClick={onDeleteLecture}
              className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 text-[hsl(var(--muted-foreground))]"
              title="Delete lecture"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-2">
          {notes.map((note) => {
            const isActive = activeView.type === 'note' && activeView.noteId === note.id
            return (
              <NoteItem
                key={note.id}
                title={note.title}
                active={isActive}
                onClick={() => onSelectNote(note.id)}
                onDelete={() => onDeleteNote(note.id)}
              />
            )
          })}
          <button
            onClick={onAddNote}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] px-1 py-0.5"
          >
            + New note
          </button>
        </div>
      )}
    </div>
  )
}

function NoteItem({
  title, active, onClick, onDelete,
}: {
  title: string
  active: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1 py-1 rounded-md cursor-pointer text-xs',
        active
          ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
          : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <FileText size={11} className="shrink-0" />
      <span className="truncate flex-1">{title}</span>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 shrink-0"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  )
}
