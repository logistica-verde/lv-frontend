import { describe, expect, it } from 'vitest'
import { optimizeFake } from '@/mocks/fakeOptimizer'
import type { FakePoint } from '@/mocks/fakeOptimizer'
import { seedDeliveryPoints } from '@/mocks/seed'

const seedPoints: FakePoint[] = seedDeliveryPoints.map((point) => ({
  id: point.id,
  name: point.nome,
  latitude: point.latitude,
  longitude: point.longitude,
}))

describe('optimizeFake', () => {
  it('returns nothing for an empty request', () => {
    expect(optimizeFake([], 'EMISSION')).toEqual({
      orderedPoints: [],
      legs: [],
      totalEmissionKg: 0,
      totalDistanceMeters: 0,
    })
  })

  it('has no legs for a single point', () => {
    const [only] = seedPoints
    if (!only) {
      throw new Error('seed has no points')
    }

    const result = optimizeFake([only], 'DISTANCE')

    expect(result.orderedPoints).toEqual([only])
    expect(result.legs).toEqual([])
  })

  it.each(['EMISSION', 'DISTANCE'] as const)(
    'visits every point exactly once for the %s criterion',
    (criterion) => {
      const result = optimizeFake(seedPoints, criterion)

      expect(result.orderedPoints.map((point) => point.id).sort()).toEqual(
        seedPoints.map((point) => point.id).sort(),
      )
      expect(result.legs).toHaveLength(seedPoints.length - 1)
    },
  )

  it('chains the legs along the visiting order', () => {
    const result = optimizeFake(seedPoints, 'EMISSION')

    result.legs.forEach((leg, index) => {
      expect(leg.fromPointId).toBe(result.orderedPoints[index]?.id)
      expect(leg.toPointId).toBe(result.orderedPoints[index + 1]?.id)
    })
  })

  it('reports totals that match the sum of the legs', () => {
    const result = optimizeFake(seedPoints, 'DISTANCE')

    const distance = result.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)
    const emission = result.legs.reduce((sum, leg) => sum + leg.emissionKg, 0)
    expect(result.totalDistanceMeters).toBeCloseTo(distance, 0)
    expect(result.totalEmissionKg).toBeCloseTo(emission, 2)
  })

  it('starts at the first point and walks to the nearest one when minimizing distance', () => {
    const line: FakePoint[] = [
      { id: 1, name: 'A', latitude: 0, longitude: 0 },
      { id: 3, name: 'C', latitude: 0, longitude: 0.02 },
      { id: 2, name: 'B', latitude: 0, longitude: 0.01 },
    ]

    const result = optimizeFake(line, 'DISTANCE')

    expect(result.orderedPoints.map((point) => point.name)).toEqual(['A', 'B', 'C'])
  })

  it('is deterministic', () => {
    expect(optimizeFake(seedPoints, 'EMISSION')).toEqual(optimizeFake(seedPoints, 'EMISSION'))
  })

  it('produces different results for the two criteria on the seed points, so comparisons have a gap', () => {
    const byEmission = optimizeFake(seedPoints, 'EMISSION')
    const byDistance = optimizeFake(seedPoints, 'DISTANCE')

    expect(byEmission.totalEmissionKg).not.toBe(byDistance.totalEmissionKg)
  })
})
