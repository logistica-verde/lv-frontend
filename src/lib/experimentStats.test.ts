import { describe, expect, it } from 'vitest'
import {
  averageByInstance,
  convergenceSeries,
  convergenceUnit,
  describeConvergence,
  emissionSavingPercent,
  runKey,
} from '@/lib/experimentStats'
import { experimentRun } from '@/test/fakeApi'

describe('runKey', () => {
  it('identifies a run by instance size and seed', () => {
    expect(runKey({ instanceSize: 20, seed: 3 })).toBe('20-3')
  })
})

describe('emissionSavingPercent', () => {
  it('is how much less the emission route emits than the distance route', () => {
    expect(emissionSavingPercent(experimentRun(10, 1))).toBeCloseTo(10, 6)
  })

  it('is unknown when the distance route emitted nothing', () => {
    const run = experimentRun(10, 1)

    expect(
      emissionSavingPercent({ ...run, distance: { ...run.distance, emissionKg: 0 } }),
    ).toBeNull()
  })
})

describe('averageByInstance', () => {
  it('averages the emission of every seed for each instance, sorted by size', () => {
    const slim = experimentRun(20, 1)
    const heavy = experimentRun(20, 2, {
      distance: { ...slim.distance, emissionKg: 120 },
      emission: { ...slim.emission, emissionKg: 100 },
    })
    const result = averageByInstance([heavy, experimentRun(10, 1), slim])

    expect(result.map((item) => item.instanceSize)).toEqual([10, 20])
    expect(result[1]).toEqual({
      instanceSize: 20,
      runs: 2,
      distanceRoute: 110,
      emissionRoute: 95,
    })
  })

  it('returns nothing for no runs', () => {
    expect(averageByInstance([])).toEqual([])
  })
})

describe('convergenceSeries', () => {
  it('numbers the generations from one and keeps emission in kilograms', () => {
    const series = convergenceSeries(experimentRun(10, 1), 'emission')

    expect(series[0]).toEqual({ generation: 1, fitness: 120 })
    expect(series[series.length - 1]).toEqual({ generation: 6, fitness: 90 })
  })

  it('shows the distance fitness in kilometers', () => {
    const series = convergenceSeries(experimentRun(10, 1), 'distance')

    expect(series[0]).toEqual({ generation: 1, fitness: 26 })
    expect(series[series.length - 1]?.fitness).toBe(20)
  })
})

describe('convergenceUnit', () => {
  it('names the unit of each criterion', () => {
    expect(convergenceUnit('emission')).toBe('kg CO₂')
    expect(convergenceUnit('distance')).toBe('km')
  })
})

describe('describeConvergence', () => {
  it('summarises the start and the end of the curve in words', () => {
    const series = convergenceSeries(experimentRun(10, 1), 'emission')

    expect(describeConvergence(series, 'kg CO₂')).toBe(
      'A melhor aptidão vai de 120 kg CO₂ na geração 1 a 90 kg CO₂ na geração 6.',
    )
  })

  it('says so when there is no data', () => {
    expect(describeConvergence([], 'km')).toBe('Sem dados de convergência.')
  })
})
