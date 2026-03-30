import { useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useAppStore } from '@/store/app'

interface Props {
  noteId: string
}

export function CanvasEditor({ noteId }: Props) {
  const { notes, updateNote } = useAppStore()
  const note = notes.find((n) => n.id === noteId)

  const initialData = note?.canvasData
    ? JSON.parse(note.canvasData)
    : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    const data = JSON.stringify({ elements, appState: { ...appState, collaborators: [] }, files })
    updateNote(noteId, { canvasData: data })
  }, [noteId, updateNote])

  return (
    <div className="h-full w-full">
      <Excalidraw
        initialData={initialData}
        onChange={onChange}
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: true },
            loadScene: true,
          },
        }}
      />
    </div>
  )
}
