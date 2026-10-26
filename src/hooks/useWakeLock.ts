import { useEffect } from 'react'

type WakeLockSentinelLike = {
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const api = (navigator as WakeLockNavigator).wakeLock
    if (!active || !api) {
      return
    }
    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = () => {
      api
        .request('screen')
        .then((lock) => {
          if (cancelled) {
            void lock.release()
          } else {
            sentinel = lock
          }
        })
        .catch(() => undefined)
    }
    const reacquire = () => {
      if (document.visibilityState === 'visible') {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', reacquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', reacquire)
      void sentinel?.release()
    }
  }, [active])
}
