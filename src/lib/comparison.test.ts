import { describe, expect, it } from 'vitest'
import {
  describeDistanceComparison,
  describeEmissionComparison,
  emissionSavingPercent,
  extraDistancePercent,
  percentChange,
} from '@/lib/comparison'

const emissionRoute = { totalEmissionKg: 5.5, totalDistanceMeters: 2022.5 }
const distanceRoute = { totalEmissionKg: 8, totalDistanceMeters: 1800 }

describe('percentChange', () => {
  it('is positive when the value grew', () => {
    expect(percentChange(100, 125)).toBe(25)
  })

  it('is negative when the value shrank', () => {
    expect(percentChange(200, 150)).toBe(-25)
  })

  it('is undefined when the base is zero', () => {
    expect(percentChange(0, 10)).toBeNull()
  })
})

describe('emissionSavingPercent', () => {
  it('is how much less the emission route emits than the distance route', () => {
    expect(emissionSavingPercent(emissionRoute, distanceRoute)).toBeCloseTo(31.25, 6)
  })

  it('is negative when the emission route emits more', () => {
    expect(
      emissionSavingPercent({ ...emissionRoute, totalEmissionKg: 10 }, distanceRoute),
    ).toBeCloseTo(-25, 6)
  })

  it('is zero for equal emissions', () => {
    expect(emissionSavingPercent(distanceRoute, distanceRoute)).toBeCloseTo(0, 6)
  })

  it('is unknown when a total is missing', () => {
    expect(
      emissionSavingPercent({ ...emissionRoute, totalEmissionKg: null }, distanceRoute),
    ).toBeNull()
    expect(
      emissionSavingPercent(emissionRoute, { ...distanceRoute, totalEmissionKg: null }),
    ).toBeNull()
  })

  it('is unknown when the distance route emits nothing', () => {
    expect(
      emissionSavingPercent(emissionRoute, { ...distanceRoute, totalEmissionKg: 0 }),
    ).toBeNull()
  })
})

describe('extraDistancePercent', () => {
  it('is how much farther the emission route goes', () => {
    expect(extraDistancePercent(emissionRoute, distanceRoute)).toBeCloseTo(12.361, 3)
  })

  it('is unknown when a total is missing', () => {
    expect(
      extraDistancePercent({ ...emissionRoute, totalDistanceMeters: null }, distanceRoute),
    ).toBeNull()
  })
})

describe('describeEmissionComparison', () => {
  it('states the saving in Brazilian format', () => {
    expect(describeEmissionComparison(31.25)).toBe(
      'A rota de menor emissão emite 31,25% menos CO₂ que a rota de menor distância.',
    )
  })

  it('rounds to two decimal places', () => {
    expect(describeEmissionComparison(12.3456)).toContain('12,35%')
  })

  it('says so when the emissions are equal', () => {
    expect(describeEmissionComparison(0)).toBe('As duas rotas têm a mesma emissão de CO₂.')
    expect(describeEmissionComparison(0.001)).toBe('As duas rotas têm a mesma emissão de CO₂.')
  })

  it('says so honestly when the distance route emits less, relative to the emission route', () => {
    expect(describeEmissionComparison(-25)).toBe(
      'Neste cenário, a rota de menor distância emite 20% menos CO₂ que a rota de menor emissão.',
    )
  })

  it('admits when the difference cannot be calculated', () => {
    expect(describeEmissionComparison(null)).toBe(
      'Não foi possível calcular a diferença de emissão entre as rotas.',
    )
  })
})

describe('describeDistanceComparison', () => {
  it('mentions the trade-off when the emission route is longer', () => {
    expect(describeDistanceComparison(12.36)).toBe(
      'Em troca, a rota de menor emissão percorre 12,36% mais distância.',
    )
  })

  it('mentions when the emission route is also shorter', () => {
    expect(describeDistanceComparison(-4)).toBe(
      'Além disso, a rota de menor emissão percorre 4% menos distância.',
    )
  })

  it('says so when the distances are equal', () => {
    expect(describeDistanceComparison(0)).toBe('As duas rotas percorrem a mesma distância.')
  })

  it('says nothing when it cannot be calculated', () => {
    expect(describeDistanceComparison(null)).toBeNull()
  })
})
