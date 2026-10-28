import { useEffect, useMemo, useState } from 'react'
import { torontoClock, type Clock } from '../lib/time'

const TICK_MS = 30_000

/** Current Toronto time, refreshed every 30 s, or the preview time while one is set. */
export function useNow(preview: Clock | null): Clock & { isPreview: boolean } {
  const [now, setNow] = useState(() => torontoClock(new Date()))

  useEffect(() => {
    const tick = () => setNow(torontoClock(new Date()))
    const timer = setInterval(tick, TICK_MS)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return useMemo(() => (preview ? { ...preview, isPreview: true } : { ...now, isPreview: false }), [preview, now])
}
