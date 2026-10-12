import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string, serverFallback = true): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') {
        return () => undefined
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () =>
      typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : serverFallback,
    [query, serverFallback],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => serverFallback)
}
