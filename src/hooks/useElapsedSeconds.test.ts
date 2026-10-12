import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-11T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useElapsedSeconds', () => {
  it('is zero before anything started', () => {
    const { result } = renderHook(() => useElapsedSeconds(null, true))

    expect(result.current).toBe(0)
  })

  it('counts the seconds since the start while running', () => {
    const startedAt = Date.now()
    const { result } = renderHook(() => useElapsedSeconds(startedAt, true))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current).toBe(3)
  })

  it('stops counting when it is no longer running and keeps the last value', () => {
    const startedAt = Date.now()
    const { result, rerender } = renderHook(
      ({ running }) => useElapsedSeconds(startedAt, running),
      { initialProps: { running: true } },
    )
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    rerender({ running: false })
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current).toBe(4)
  })

  it('restarts from zero for a new start time', () => {
    const { result, rerender } = renderHook(({ startedAt }) => useElapsedSeconds(startedAt, true), {
      initialProps: { startedAt: Date.now() },
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    rerender({ startedAt: Date.now() })

    expect(result.current).toBe(0)
  })
})
