import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { SearchModal } from '@/components/layout/SearchModal'
import { QuickCapture } from '@/components/layout/QuickCapture'
import { useAppStore } from '@/store/app'
import { useFullscreenKey } from '@/hooks/useFullscreen'

function App() {
  const { darkMode, setActiveView, courses, lectures, addCourse, addLecture, addNote } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  useFullscreenKey()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setActiveView({ type: 'settings' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setActiveView])

  function handleQuickCapture() {
    // Create a new Fleeting note in the first available course, or create an Inbox
    let courseId: string
    let lectureId: string

    const inboxCourse = courses.find((c) => c.name === 'Inbox') ?? courses[0]
    if (!inboxCourse) {
      const c = addCourse({ name: 'Inbox', color: '#64748b' })
      courseId = c.id
      const l = addLecture({ courseId, title: 'Quick Notes', date: Date.now() })
      lectureId = l.id
    } else {
      courseId = inboxCourse.id
      const existing = lectures.find((l) => l.courseId === courseId)
      if (existing) {
        lectureId = existing.id
      } else {
        const l = addLecture({ courseId, title: 'Quick Notes', date: Date.now() })
        lectureId = l.id
      }
    }

    const note = addNote({
      lectureId,
      courseId,
      title: 'Quick Note',
      content: '',
      mode: 'document',
      tags: [],
      noteType: 'fleeting',
    })
    setActiveView({ type: 'note', noteId: note.id })
  }

  return (
    <>
      <Sidebar />
      <MainContent />
      <QuickCapture />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Quick Capture — always-visible floating button */}
      <button
        onClick={handleQuickCapture}
        title="Quick capture (new fleeting note)"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[hsl(var(--primary))] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px hsl(263 69% 50% / 0.4)' }}
      >
        <Plus size={22} />
      </button>
    </>
  )
}

export default App
