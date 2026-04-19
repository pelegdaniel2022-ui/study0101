// Finds or creates today's journal note and opens the editor directly.
// Today's date format: "2026-04-19" (ISO, en-CA locale)

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app'
import { NoteEditor } from '@/components/notes/NoteEditor'

export function DailyNoteView() {
  const { courses, lectures, notes, addCourse, addLecture, addNote, updateNote } = useAppStore()
  const [noteId, setNoteId] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA') // "2026-04-19"
    const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) // "April 2026"

    // 1. Find or create "Journal" course
    let course = courses.find((c) => c.name === 'Journal')
    if (!course) {
      course = addCourse({ name: 'Journal', color: '#6d28d9' })
    }

    // 2. Find or create lecture for current month
    let lecture = lectures.find((l) => l.courseId === course!.id && l.title === monthLabel)
    if (!lecture) {
      lecture = addLecture({ courseId: course.id, title: monthLabel, date: Date.now() })
    }

    // 3. Find or create today's note
    let note = notes.find((n) => n.lectureId === lecture!.id && n.title === today)
    if (!note) {
      note = addNote({
        lectureId: lecture.id,
        courseId: course.id,
        title: today,
        content: '',
        mode: 'document',
        tags: ['journal'],
      })
    } else {
      // Ensure mode and tags are set correctly
      const needsUpdate =
        note.mode !== 'document' || !note.tags.includes('journal')
      if (needsUpdate) {
        updateNote(note.id, {
          mode: 'document',
          tags: Array.from(new Set([...note.tags, 'journal'])),
        })
      }
    }

    setNoteId(note.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!noteId) return null

  return <NoteEditor noteId={noteId} />
}
