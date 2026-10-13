import { describe, expect, it } from 'vitest'
import { sliceForPage } from '@/lib/pagination'

const items = [1, 2, 3, 4, 5, 6, 7]

describe('sliceForPage', () => {
  it('returns the first page', () => {
    expect(sliceForPage(items, 1, 3)).toEqual({
      page: 1,
      pageCount: 3,
      firstIndex: 0,
      visible: [1, 2, 3],
    })
  })

  it('returns a middle page and where it starts', () => {
    expect(sliceForPage(items, 2, 3)).toMatchObject({ page: 2, firstIndex: 3, visible: [4, 5, 6] })
  })

  it('returns the shorter last page', () => {
    expect(sliceForPage(items, 3, 3)).toMatchObject({ page: 3, firstIndex: 6, visible: [7] })
  })

  it('pulls a page that is past the end back to the last one', () => {
    expect(sliceForPage(items, 9, 3)).toMatchObject({ page: 3, pageCount: 3, visible: [7] })
  })

  it('has one empty page when there is nothing to show', () => {
    expect(sliceForPage([], 1, 3)).toEqual({ page: 1, pageCount: 1, firstIndex: 0, visible: [] })
    expect(sliceForPage([], 5, 3).page).toBe(1)
  })

  it('fills exactly the pages when the size divides the total', () => {
    expect(sliceForPage([1, 2, 3, 4], 2, 2)).toMatchObject({ pageCount: 2, visible: [3, 4] })
  })

  it('does not change the original list', () => {
    const original = [1, 2, 3]

    sliceForPage(original, 1, 2)

    expect(original).toEqual([1, 2, 3])
  })
})
