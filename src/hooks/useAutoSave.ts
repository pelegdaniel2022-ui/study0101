import { useEffect, useRef, useCallback } from 'react'

export function useAutoSave(fn: () => void, delay = 600) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(fn, delay)
  }, [fn, delay])

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [])

  return schedule
}
