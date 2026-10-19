import { describe, expect, it } from 'vitest'
import {
  crossedThreshold,
  defaultScheduleValue,
  describeTimeLeft,
  isInThePast,
  minutesUntil,
  parseLocalInput,
  toLocalInputValue,
} from '@/lib/schedule'

describe('schedule helpers', () => {
  it('formats a date for a datetime-local input in local time', () => {
    expect(toLocalInputValue(new Date(2026, 9, 5, 8, 7))).toBe('2026-10-05T08:07')
  })

  it('suggests a time at least half an hour ahead, on a multiple of five minutes', () => {
    expect(defaultScheduleValue(new Date(2026, 9, 5, 8, 7, 30))).toBe('2026-10-05T08:40')
    expect(defaultScheduleValue(new Date(2026, 9, 5, 23, 40))).toBe('2026-10-06T00:10')
  })

  it('parses a local value and rejects an empty or invalid one', () => {
    expect(parseLocalInput('2026-10-05T08:07')?.getHours()).toBe(8)
    expect(parseLocalInput('')).toBeNull()
    expect(parseLocalInput('não é data')).toBeNull()
  })

  it('tolerates a minute of clock skew before calling a time past', () => {
    const now = new Date(2026, 9, 5, 12, 0, 0)

    expect(isInThePast(new Date(2026, 9, 5, 11, 58), now)).toBe(true)
    expect(isInThePast(new Date(2026, 9, 5, 11, 59, 30), now)).toBe(false)
  })

  it('counts the minutes left, rounding up', () => {
    const now = new Date(2026, 9, 5, 12, 0, 0)

    expect(minutesUntil(new Date(2026, 9, 5, 12, 0, 30), now)).toBe(1)
    expect(minutesUntil(new Date(2026, 9, 5, 12, 10), now)).toBe(10)
  })

  it('describes the time left in the largest sensible unit', () => {
    expect(describeTimeLeft(0)).toBe('agora')
    expect(describeTimeLeft(45)).toBe('45 min')
    expect(describeTimeLeft(60)).toBe('1 h')
    expect(describeTimeLeft(135)).toBe('2 h 15 min')
    expect(describeTimeLeft(24 * 60)).toBe('1 dia')
    expect(describeTimeLeft(3 * 24 * 60 + 90)).toBe('3 dias')
  })

  it('reminds at the smallest threshold already crossed and not yet announced', () => {
    expect(crossedThreshold(90, new Set())).toBeNull()
    expect(crossedThreshold(58, new Set())).toBe(60)
    expect(crossedThreshold(12, new Set())).toBe(15)
    expect(crossedThreshold(12, new Set([60, 30, 15]))).toBeNull()
    expect(crossedThreshold(4, new Set([60, 30, 15]))).toBe(5)
    expect(crossedThreshold(0, new Set([60, 30, 15, 5]))).toBe(1)
  })
})
