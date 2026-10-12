import { describe, expect, it } from 'vitest'
import {
  isValidCoordinate,
  parsePositionsKey,
  positionsKey,
  roundCoordinate,
  SAO_PAULO_CENTER,
  toLatLng,
} from '@/lib/geo'

describe('isValidCoordinate', () => {
  it('accepts a point inside the valid ranges', () => {
    expect(isValidCoordinate(-23.55, -46.63)).toBe(true)
  })

  it('accepts the extremes', () => {
    expect(isValidCoordinate(90, 180)).toBe(true)
    expect(isValidCoordinate(-90, -180)).toBe(true)
  })

  it.each([
    [91, 0],
    [0, 181],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])('rejects (%s, %s)', (latitude, longitude) => {
    expect(isValidCoordinate(latitude, longitude)).toBe(false)
  })
})

describe('roundCoordinate', () => {
  it('keeps six decimal places', () => {
    expect(roundCoordinate(-23.550519876543)).toBe(-23.55052)
    expect(roundCoordinate(-46.6333123456)).toBe(-46.633312)
  })
})

describe('toLatLng', () => {
  it('orders latitude before longitude, as Leaflet expects', () => {
    expect(toLatLng({ latitude: -23.55, longitude: -46.63 })).toEqual([-23.55, -46.63])
  })
})

describe('SAO_PAULO_CENTER', () => {
  it('is inside the city', () => {
    const [latitude, longitude] = SAO_PAULO_CENTER
    expect(latitude).toBeGreaterThan(-24)
    expect(latitude).toBeLessThan(-23)
    expect(longitude).toBeGreaterThan(-47)
    expect(longitude).toBeLessThan(-46)
  })
})

describe('positionsKey', () => {
  it('is empty for no positions', () => {
    expect(positionsKey([])).toBe('')
  })

  it('differs when any coordinate changes', () => {
    const base = positionsKey([
      [-23.55, -46.63],
      [-23.56, -46.64],
    ])

    expect(
      positionsKey([
        [-23.55, -46.63],
        [-23.56, -46.641],
      ]),
    ).not.toBe(base)
  })

  it('is the same for equal positions held in different arrays', () => {
    expect(positionsKey([[-23.55, -46.63]])).toBe(positionsKey([[-23.55, -46.63]]))
  })
})

describe('parsePositionsKey', () => {
  it('gives back exactly the positions that built the key', () => {
    const positions: [number, number][] = [
      [-23.55052, -46.63331],
      [-23.5614, -46.6559],
    ]

    expect(parsePositionsKey(positionsKey(positions))).toEqual(positions)
  })

  it('returns no positions for an empty key', () => {
    expect(parsePositionsKey('')).toEqual([])
  })
})
