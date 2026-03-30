import { useEffect } from 'react'
import { useAppStore } from '@/store/app'

export function useFullscreenKey() {
  const setFullscreen = useAppStore((s) => s.setFullscreenNote)
  const fullscreen = useAppStore((s) => s.fullscreenNote)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false)
      if ((e.key === 'F11' || (e.key === 'f' && e.metaKey && e.shiftKey))) {
        e.preventDefault()
        setFullscreen(!fullscreen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, setFullscreen])
}
