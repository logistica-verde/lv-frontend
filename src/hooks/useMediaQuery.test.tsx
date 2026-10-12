import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type Listener = () => void

function stubMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<Listener>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return matches
    },
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
  }))
  return (next: boolean) => {
    matches = next
    listeners.forEach((listener) => listener())
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMediaQuery', () => {
  it('reports whether the query matches', () => {
    stubMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))

    expect(result.current).toBe(true)
  })

  it('follows changes of the query', () => {
    const change = stubMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))
    expect(result.current).toBe(false)

    act(() => change(true))

    expect(result.current).toBe(true)
  })

  it('uses the fallback when the browser cannot match media', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(renderHook(() => useMediaQuery('(min-width: 64rem)', true)).result.current).toBe(true)
    expect(renderHook(() => useMediaQuery('(min-width: 64rem)', false)).result.current).toBe(false)
  })
})
