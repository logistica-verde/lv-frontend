import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentFix, LocationError } from '@/lib/geolocation'
import type { LocationFailure, LocationFix } from '@/lib/geolocation'

export type CurrentLocation =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; fix: LocationFix }
  | { status: 'failed'; reason: LocationFailure }

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation>({ status: 'idle' })
  const active = useRef(true)
  const attempt = useRef(0)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  const locate = useCallback(() => {
    attempt.current += 1
    const current = attempt.current
    setLocation({ status: 'locating' })
    getCurrentFix().then(
      (fix) => {
        if (active.current && attempt.current === current) {
          setLocation({ status: 'ready', fix })
        }
      },
      (error: Error) => {
        if (active.current && attempt.current === current) {
          const reason = error instanceof LocationError ? error.reason : 'unavailable'
          setLocation({ status: 'failed', reason })
        }
      },
    )
  }, [])

  const clear = useCallback(() => {
    attempt.current += 1
    setLocation({ status: 'idle' })
  }, [])

  return { location, locate, clear }
}
