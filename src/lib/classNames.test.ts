import { describe, expect, it } from 'vitest'
import { classNames } from '@/lib/classNames'

describe('classNames', () => {
  it('joins the names that are set', () => {
    expect(classNames('a', 'b')).toBe('a b')
  })

  it('skips falsy values', () => {
    expect(classNames('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('returns an empty string when nothing is set', () => {
    expect(classNames(false, undefined)).toBe('')
  })
})
