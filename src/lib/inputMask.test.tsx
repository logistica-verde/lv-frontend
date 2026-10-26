import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isValidPlate, maskPlate, numericInputProps, sanitizeNumeric } from '@/lib/inputMask'
import type { NumericOptions } from '@/lib/inputMask'

describe('sanitizeNumeric', () => {
  it('keeps only digits for integers', () => {
    expect(sanitizeNumeric('12a3.4-5')).toBe('12345')
  })

  it('keeps a single decimal separator and accepts the comma', () => {
    expect(sanitizeNumeric('1,5', { decimal: true })).toBe('1.5')
    expect(sanitizeNumeric('1.2.3', { decimal: true })).toBe('1.23')
    expect(sanitizeNumeric('abc', { decimal: true })).toBe('')
  })

  it('keeps the minus sign only at the start and only when negative numbers are allowed', () => {
    expect(sanitizeNumeric('-23.5', { decimal: true, negative: true })).toBe('-23.5')
    expect(sanitizeNumeric('2-3', { negative: true })).toBe('23')
    expect(sanitizeNumeric('-23', {})).toBe('23')
  })
})

describe('maskPlate', () => {
  it('uppercases, drops symbols and limits to seven characters', () => {
    expect(maskPlate('abc-1d23')).toBe('ABC1D23')
    expect(maskPlate('abc1234567')).toBe('ABC1234')
    expect(maskPlate(' a b c ')).toBe('ABC')
  })

  it('validates the old and the Mercosul formats', () => {
    expect(isValidPlate('ABC1234')).toBe(true)
    expect(isValidPlate('ABC1D23')).toBe(true)
    expect(isValidPlate('AB12345')).toBe(false)
    expect(isValidPlate('ABC12')).toBe(false)
  })
})

describe('numericInputProps', () => {
  function field(options: NumericOptions = {}) {
    render(<input aria-label="numero" {...numericInputProps(options)} />)
    return screen.getByLabelText('numero')
  }

  it('blocks letters and the exponent sign', () => {
    const input = field({ decimal: true })

    expect(fireEvent.keyDown(input, { key: 'a' })).toBe(false)
    expect(fireEvent.keyDown(input, { key: 'e' })).toBe(false)
    expect(fireEvent.keyDown(input, { key: '+' })).toBe(false)
  })

  it('lets digits, editing keys and shortcuts through', () => {
    const input = field()

    expect(fireEvent.keyDown(input, { key: '7' })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'a', ctrlKey: true })).toBe(true)
  })

  it('allows the decimal separator and the minus sign only when configured', () => {
    const plain = field()
    expect(fireEvent.keyDown(plain, { key: '.' })).toBe(false)
    expect(fireEvent.keyDown(plain, { key: '-' })).toBe(false)
    cleanup()

    const rich = field({ decimal: true, negative: true })
    expect(fireEvent.keyDown(rich, { key: ',' })).toBe(true)
    expect(fireEvent.keyDown(rich, { key: '-' })).toBe(true)
  })

  it('rejects pasted text that is not a number', () => {
    const input = field({ decimal: true })

    expect(fireEvent.paste(input, { clipboardData: { getData: () => '12abc' } })).toBe(false)
    expect(fireEvent.paste(input, { clipboardData: { getData: () => ' 12,5 ' } })).toBe(true)
  })
})
