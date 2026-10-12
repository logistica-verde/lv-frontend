import { describe, expect, it } from 'vitest'
import { formatDateTime, formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'

describe('formatSignedPercent', () => {
  it('marks growth with a plus sign', () => {
    expect(formatSignedPercent(12.3456)).toBe('+12,35%')
  })

  it('marks a reduction with a proper minus sign', () => {
    expect(formatSignedPercent(-29.375)).toBe('−29,38%')
  })

  it('shows zero without a sign, even when it rounds to zero', () => {
    expect(formatSignedPercent(0)).toBe('0%')
    expect(formatSignedPercent(0.001)).toBe('0%')
  })

  it('shows a dash when there is no value', () => {
    expect(formatSignedPercent(null)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('shows the Brasília time of a UTC instant, day first', () => {
    expect(formatDateTime('2026-10-05T12:00:05Z')).toMatch(/^05\/10\/2026.*09:00:05$/)
  })

  it('rolls over to the previous day when the UTC time is early in the morning', () => {
    expect(formatDateTime('2026-10-05T01:30:00Z')).toMatch(/^04\/10\/2026.*22:30:00$/)
  })
})

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
