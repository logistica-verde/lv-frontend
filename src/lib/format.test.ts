import { describe, expect, it } from 'vitest'
import { formatNumber } from '@/lib/format'

describe('formatNumber', () => {
  it('uses the Brazilian thousands and decimal separators', () => {
    expect(formatNumber(7500)).toBe('7.500')
    expect(formatNumber(1234.5)).toBe('1.234,5')
  })

  it('keeps at most two decimal places', () => {
    expect(formatNumber(1.236)).toBe('1,24')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })
})
