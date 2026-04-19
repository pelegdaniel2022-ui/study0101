import { useAppStore } from '@/store/app'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { HomeView } from './HomeView'
import { AITutorView } from './AITutorView'
import { SimulationsView } from './SimulationsView'
import { SettingsPanel } from './SettingsPanel'
import { ResearchPanel } from '@/components/ai/ResearchPanel'
import { LibrarianPanel } from '@/components/ai/LibrarianPanel'
import { DailyReviewView } from './DailyReviewView'
import { DailyNotesView } from './DailyNotesView'
import { KnowledgeGraphView } from './KnowledgeGraphView'
import { DailyNoteView } from './DailyNoteView'

export function MainContent() {
  const { activeView } = useAppStore()

  return (
    <div className="flex-1 h-full overflow-hidden bg-[hsl(var(--background))]">
      {activeView.type === 'home' && <HomeView />}
      {activeView.type === 'note' && <NoteEditor noteId={activeView.noteId} />}
      {activeView.type === 'ai-tutor' && <AITutorView />}
      {activeView.type === 'simulations' && <SimulationsView />}
      {activeView.type === 'settings' && <SettingsPanel />}
      {activeView.type === 'research' && <ResearchPanel />}
      {activeView.type === 'study-coach' && <LibrarianPanel />}
      {activeView.type === 'daily-review' && <DailyReviewView />}
      {activeView.type === 'daily-notes' && <DailyNotesView />}
      {activeView.type === 'knowledge-graph' && <KnowledgeGraphView />}
      {activeView.type === 'daily-note' && <DailyNoteView />}
    </div>
  )
}
