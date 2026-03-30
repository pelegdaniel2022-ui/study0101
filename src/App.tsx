import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { SearchModal } from '@/components/layout/SearchModal'
import { useAppStore } from '@/store/app'
import { useFullscreenKey } from '@/hooks/useFullscreen'

function App() {
  const { darkMode, setActiveView } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  useFullscreenKey()

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Global keyboard shortcuts
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

  return (
    <>
      <Sidebar />
      <MainContent />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}

export default App
