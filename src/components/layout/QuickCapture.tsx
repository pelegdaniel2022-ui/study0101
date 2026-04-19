import { Plus } from 'lucide-react'
import { useAppStore } from '@/store/app'

export function QuickCapture() {
  const { activeView, courses, lectures, addCourse, addLecture, addNote, setActiveView } = useAppStore()

  // Only show when not already editing a note
  if (activeView.type === 'note') return null

  function handleQuickCapture() {
    // Find or create the "Inbox" course
    let course = courses.find((c) => c.name === 'Inbox')
    if (!course) {
      course = addCourse({ name: 'Inbox', color: '#6366f1' })
    }

    // Find or create the "Quick Captures" lecture inside Inbox
    let lecture = lectures.find((l) => l.courseId === course!.id && l.title === 'Quick Captures')
    if (!lecture) {
      lecture = addLecture({ courseId: course.id, title: 'Quick Captures', date: Date.now() })
    }

    // Create new fleeting note and open it immediately
    const note = addNote({
      lectureId: lecture.id,
      courseId: course.id,
      title: 'Quick Capture',
      content: '',
      mode: 'document',
      tags: [],
      noteType: 'fleeting',
    })
    setActiveView({ type: 'note', noteId: note.id })
  }

  return (
    <button
      onClick={handleQuickCapture}
      title="Quick capture (new fleeting note)"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}
      className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all"
    >
      <Plus size={20} />
    </button>
  )
}
