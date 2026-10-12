import { describe, expect, it } from 'vitest'
import {
  countActiveFilters,
  DEFAULT_HISTORY_STATE,
  isDateRangeInverted,
  nextSort,
  parseHistoryParams,
  toHistoryParams,
} from '@/lib/historyFilters'

describe('parseHistoryParams', () => {
  it('uses the defaults for an empty address', () => {
    expect(parseHistoryParams(new URLSearchParams())).toEqual(DEFAULT_HISTORY_STATE)
  })

  it('reads every filter, the sorting and the page', () => {
    const state = parseHistoryParams(
      new URLSearchParams(
        'de=2026-10-01&ate=2026-10-31&veiculo=2&criterio=DISTANCE&integridade=TAMPERED&ordem=totalEmissionKg&direcao=asc&pagina=3',
      ),
    )

    expect(state).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      vehicleId: 2,
      criterion: 'DISTANCE',
      integrity: 'TAMPERED',
      sort: 'totalEmissionKg',
      direction: 'asc',
      page: 3,
    })
  })

  it('ignores values that are not valid instead of failing', () => {
    const state = parseHistoryParams(
      new URLSearchParams(
        'de=ontem&veiculo=abc&criterio=OUTRO&integridade=x&ordem=nome&direcao=cima&pagina=-2',
      ),
    )

    expect(state).toEqual(DEFAULT_HISTORY_STATE)
  })

  it('does not accept a fractional or zero vehicle or page', () => {
    expect(parseHistoryParams(new URLSearchParams('veiculo=1.5&pagina=0'))).toMatchObject({
      vehicleId: null,
      page: 1,
    })
  })
})

describe('toHistoryParams', () => {
  it('writes nothing for the default state, keeping the address clean', () => {
    expect(toHistoryParams(DEFAULT_HISTORY_STATE).toString()).toBe('')
  })

  it('writes only what differs from the defaults', () => {
    const params = toHistoryParams({
      ...DEFAULT_HISTORY_STATE,
      vehicleId: 2,
      sort: 'totalDistanceMeters',
      page: 2,
    })

    expect(Object.fromEntries(params)).toEqual({
      veiculo: '2',
      ordem: 'totalDistanceMeters',
      pagina: '2',
    })
  })

  it('round-trips with the parser', () => {
    const state = {
      from: '2026-10-01',
      to: '2026-10-31',
      vehicleId: 1,
      criterion: 'EMISSION',
      integrity: 'VALID',
      sort: 'totalEmissionKg',
      direction: 'asc',
      page: 4,
    } as const

    expect(parseHistoryParams(toHistoryParams(state))).toEqual(state)
  })
})

describe('countActiveFilters', () => {
  it('counts only filters, not sorting or paging', () => {
    const state = {
      ...DEFAULT_HISTORY_STATE,
      from: '2026-10-01',
      criterion: 'EMISSION' as const,
      page: 5,
      sort: 'totalEmissionKg' as const,
    }

    expect(countActiveFilters(DEFAULT_HISTORY_STATE)).toBe(0)
    expect(countActiveFilters(state)).toBe(2)
  })
})

describe('isDateRangeInverted', () => {
  it('detects an initial date after the final date', () => {
    expect(
      isDateRangeInverted({ ...DEFAULT_HISTORY_STATE, from: '2026-10-10', to: '2026-10-01' }),
    ).toBe(true)
  })

  it('accepts equal dates and open ranges', () => {
    expect(
      isDateRangeInverted({ ...DEFAULT_HISTORY_STATE, from: '2026-10-01', to: '2026-10-01' }),
    ).toBe(false)
    expect(isDateRangeInverted({ ...DEFAULT_HISTORY_STATE, from: '2026-10-01' })).toBe(false)
  })
})

describe('nextSort', () => {
  it('starts a new column ascending, except the date which starts with the newest', () => {
    const current = { sort: 'createdAt', direction: 'desc' } as const

    expect(nextSort(current, 'totalEmissionKg')).toEqual({
      sort: 'totalEmissionKg',
      direction: 'asc',
    })
    expect(nextSort({ sort: 'totalEmissionKg', direction: 'asc' }, 'createdAt')).toEqual({
      sort: 'createdAt',
      direction: 'desc',
    })
  })

  it('flips the direction when the same column is chosen again', () => {
    expect(nextSort({ sort: 'totalEmissionKg', direction: 'asc' }, 'totalEmissionKg')).toEqual({
      sort: 'totalEmissionKg',
      direction: 'desc',
    })
    expect(nextSort({ sort: 'createdAt', direction: 'desc' }, 'createdAt')).toEqual({
      sort: 'createdAt',
      direction: 'asc',
    })
  })
})
