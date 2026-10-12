import { useEffect, useState } from 'react'

const TICK_MS = 1000

export function useElapsedSeconds(startedAt: number | null, running: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || !running) {
      return
    }
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [startedAt, running])

  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / TICK_MS))
}
