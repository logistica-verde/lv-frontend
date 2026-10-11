import { describe, expect, it } from 'vitest'
import { generateRun } from '@/mocks/experiments'

describe('generateRun', () => {
  it('is deterministic for the same instance and seed', () => {
    expect(generateRun(20, 2)).toEqual(generateRun(20, 2))
  })

  it('differs between seeds and between instance sizes', () => {
    expect(generateRun(20, 1)).not.toEqual(generateRun(20, 2))
    expect(generateRun(10, 1).distance.distanceMeters).not.toBe(
      generateRun(20, 1).distance.distanceMeters,
    )
  })

  it('reports the instance size and the seed it was asked for', () => {
    const run = generateRun(25, 3)

    expect(run.instanceSize).toBe(25)
    expect(run.seed).toBe(3)
  })

  it.each([10, 15, 20, 25, 30])(
    'makes the emission route emit 3 to 15 percent less than the distance route for %i points',
    (size) => {
      for (const seed of [1, 2, 3]) {
        const run = generateRun(size, seed)
        const saving = 1 - run.emission.emissionKg / run.distance.emissionKg

        expect(saving).toBeGreaterThanOrEqual(0.029)
        expect(saving).toBeLessThanOrEqual(0.151)
      }
    },
  )

  it('lets the emission route go a little farther than the distance route', () => {
    for (const seed of [1, 2, 3]) {
      const run = generateRun(20, seed)

      expect(run.emission.distanceMeters).toBeGreaterThanOrEqual(run.distance.distanceMeters)
      expect(run.emission.distanceMeters).toBeLessThanOrEqual(run.distance.distanceMeters * 1.061)
    }
  })

  it('grows the distance and the execution time with the number of points', () => {
    const small = generateRun(10, 1)
    const large = generateRun(30, 1)

    expect(large.distance.distanceMeters).toBeGreaterThan(small.distance.distanceMeters)
    expect(large.distance.executionMs).toBeGreaterThan(small.distance.executionMs)
  })

  it.each(['emission', 'distance'] as const)(
    'has a %s convergence curve that never gets worse and ends at the result',
    (criterion) => {
      const run = generateRun(20, 1)
      const curve = run[criterion].convergence

      expect(curve.length).toBeGreaterThan(10)
      curve.slice(1).forEach((value, index) => {
        expect(value).toBeLessThanOrEqual(curve[index] ?? Number.POSITIVE_INFINITY)
      })
      expect(curve[0]).toBeGreaterThan(curve[curve.length - 1] ?? 0)
      const final = criterion === 'emission' ? run.emission.emissionKg : run.distance.distanceMeters
      expect(curve[curve.length - 1]).toBeCloseTo(final, 1)
    },
  )
})
