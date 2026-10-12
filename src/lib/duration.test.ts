import { describe, expect, it } from 'vitest'
import { formatElapsed } from '@/lib/duration'

describe('formatElapsed', () => {
  it('shows seconds below one minute', () => {
    expect(formatElapsed(0)).toBe('0 s')
    expect(formatElapsed(12)).toBe('12 s')
    expect(formatElapsed(59)).toBe('59 s')
  })

  it('shows minutes and padded seconds from one minute on', () => {
    expect(formatElapsed(60)).toBe('1 min 00 s')
    expect(formatElapsed(65)).toBe('1 min 05 s')
    expect(formatElapsed(125)).toBe('2 min 05 s')
  })

  it('drops fractions and never goes negative', () => {
    expect(formatElapsed(12.9)).toBe('12 s')
    expect(formatElapsed(-4)).toBe('0 s')
  })
})
