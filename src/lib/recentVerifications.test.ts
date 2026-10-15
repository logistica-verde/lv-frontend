import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearRecentVerifications,
  getRecentVerifications,
  recordVerification,
  subscribeRecentVerifications,
} from '@/lib/recentVerifications'

afterEach(() => {
  window.localStorage.clear()
})

function entry(operationId: number) {
  return { operationId, status: 'VALID' as const, checkedAt: '2026-10-05T12:00:00Z' }
}

describe('recent verifications', () => {
  it('starts empty and keeps the same list until something changes', () => {
    expect(getRecentVerifications(1)).toEqual([])
    expect(getRecentVerifications(1)).toBe(getRecentVerifications(1))
  })

  it('puts the latest first and does not repeat an operation', () => {
    recordVerification(1, entry(7))
    recordVerification(1, entry(8))
    recordVerification(1, entry(7))

    expect(getRecentVerifications(1).map((item) => item.operationId)).toEqual([7, 8])
  })

  it('keeps only the five latest', () => {
    for (let id = 1; id <= 7; id += 1) {
      recordVerification(1, entry(id))
    }

    expect(getRecentVerifications(1).map((item) => item.operationId)).toEqual([7, 6, 5, 4, 3])
  })

  it('keeps each user list apart', () => {
    recordVerification(1, entry(7))

    expect(getRecentVerifications(2)).toEqual([])
  })

  it('ignores stored data it does not understand', () => {
    window.localStorage.setItem('lv.recentVerifications.1', '{"oops":true}')

    expect(getRecentVerifications(1)).toEqual([])
  })

  it('notifies subscribers and can be cleared', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRecentVerifications(listener)

    recordVerification(1, entry(7))
    clearRecentVerifications(1)
    unsubscribe()

    expect(listener).toHaveBeenCalledTimes(2)
    expect(getRecentVerifications(1)).toEqual([])
  })
})
