import { describe, expect, it } from 'vitest'
import { pageItems } from '@/components/Pagination/pageItems'

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('shows the first pages, a gap and the last page near the start', () => {
    expect(pageItems(1, 13)).toEqual([1, 2, { gapAfter: 2 }, 13])
    expect(pageItems(2, 13)).toEqual([1, 2, 3, { gapAfter: 3 }, 13])
  })

  it('shows gaps on both sides in the middle', () => {
    expect(pageItems(7, 13)).toEqual([1, { gapAfter: 1 }, 6, 7, 8, { gapAfter: 8 }, 13])
  })

  it('shows the last pages near the end', () => {
    expect(pageItems(13, 13)).toEqual([1, { gapAfter: 1 }, 12, 13])
  })

  it('fills a gap of a single page with the page itself', () => {
    expect(pageItems(4, 6)).toEqual([1, 2, 3, 4, 5, 6])
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, { gapAfter: 4 }, 7])
  })

  it('has just one page for a single page', () => {
    expect(pageItems(1, 1)).toEqual([1])
  })
})
