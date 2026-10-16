import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, toCsv } from '@/lib/exportCsv'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('toCsv', () => {
  it('starts with a byte order mark so spreadsheets read the accents', () => {
    expect(toCsv(['Nome'], [['Praça']]).startsWith('﻿')).toBe(true)
  })

  it('separates cells with semicolons and lines with CRLF', () => {
    expect(toCsv(['A', 'B'], [['1', '2']])).toBe('﻿A;B\r\n1;2\r\n')
  })

  it('writes numbers with a decimal comma and no thousands separator', () => {
    expect(toCsv(['n'], [[1234.5], [0.25], [-3]])).toBe('﻿n\r\n1234,5\r\n0,25\r\n-3\r\n')
  })

  it('leaves missing values empty', () => {
    expect(toCsv(['a', 'b', 'c'], [[null, undefined, 'x']])).toBe('﻿a;b;c\r\n;;x\r\n')
  })

  it('quotes cells that contain separators, quotes or line breaks', () => {
    expect(toCsv(['t'], [['a;b'], ['diz "oi"'], ['linha\nnova']])).toBe(
      '﻿t\r\n"a;b"\r\n"diz ""oi"""\r\n"linha\nnova"\r\n',
    )
  })
})

describe('downloadCsv', () => {
  it('offers the content as a file with the given name', () => {
    const created: Blob[] = []
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        created.push(blob)
        return 'blob:test'
      },
      revokeObjectURL: vi.fn(),
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadCsv('historico.csv', 'a;b')

    expect(click).toHaveBeenCalledTimes(1)
    expect(created[0]?.type).toBe('text/csv;charset=utf-8')
    expect(document.querySelector('a[download]')).toBeNull()
    vi.unstubAllGlobals()
  })
})
