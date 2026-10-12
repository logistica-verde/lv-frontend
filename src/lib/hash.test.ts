import { describe, expect, it } from 'vitest'
import { truncateMiddle } from '@/lib/hash'

describe('truncateMiddle', () => {
  it('keeps the start and the end of a long hash', () => {
    expect(truncateMiddle(`0x3f9a${'0'.repeat(52)}b21c`)).toBe('0x3f9a…b21c')
  })

  it('leaves short values untouched', () => {
    expect(truncateMiddle('0x3f9ab21c')).toBe('0x3f9ab21c')
  })

  it('accepts custom lengths', () => {
    expect(truncateMiddle('abcdefghijklmnop', 3, 2)).toBe('abc…op')
  })

  it('does not lengthen a value that is barely longer than what it keeps', () => {
    expect(truncateMiddle('abcdefghijk')).toBe('abcdefghijk')
  })
})
