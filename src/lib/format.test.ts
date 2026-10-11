import { describe, expect, it } from 'vitest'
import { formatKilometers, formatNumber } from '@/lib/format'

describe('formatKilometers', () => {
  it('converts meters to kilometers in the Brazilian format', () => {
    expect(formatKilometers(2022.5)).toBe('2,02')
    expect(formatKilometers(12500)).toBe('12,5')
  })

  it('formats zero', () => {
    expect(formatKilometers(0)).toBe('0')
  })
})

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
