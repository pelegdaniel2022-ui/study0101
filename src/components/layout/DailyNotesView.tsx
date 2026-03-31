import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/app'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { CalendarDays, ChevronRight } from 'lucide-react'

export function DailyNotesView() {
  const { getOrCreateDailyNote, notes, setActiveView } = useAppStore()

  // Get or create today's note — run once on mount
  const todayNote = useMemo(() => getOrCreateDailyNote(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Past journal entries (excluding today), most recent first
  const pastEntries = useMemo(() => {
    return notes
      .filter((n) => n.isJournal && n.id !== todayNote.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30)
  }, [notes, todayNote.id])

  // Navigate straight to the note editor view (embedded below)
  // We keep the journal sidebar on the left, editor on the right
  useEffect(() => {
    // Pre-open today's note in the store so NoteEditor gets the right id
    // but we render the editor inline here, not via setActiveView
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: journal calendar / past entries */}
      <div className="w-56 shrink-0 border-r border-[hsl(var(--border))] flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[hsl(var(--primary))]" />
            <span className="text-sm font-semibold">Journal</span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Today badge */}
        <div className="px-2 pt-2">
          <div className="px-2 py-1.5 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium">
            Today
          </div>
        </div>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="text-xs text-[hsl(var(--muted-foreground))] px-1 mb-1.5 uppercase tracking-wider font-medium">
              Past entries
            </div>
            {pastEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setActiveView({ type: 'note', noteId: entry.id })}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-left group"
              >
                <span className="flex-1 text-xs text-[hsl(var(--foreground))] truncate">{entry.title}</span>
                <ChevronRight size={11} className="text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {pastEntries.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-3 pb-8">
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
              Past journal entries will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Right panel: today's note editor */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor noteId={todayNote.id} />
      </div>
    </div>
  )
}
