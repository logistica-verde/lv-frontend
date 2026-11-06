import { describe, expect, it } from 'vitest'
import { mockProgress } from '@/mocks/progressSocket'
import { completedRouteFixture } from '@/test/fixtures'

const DELAY_MS = 2000
const createdAt = Date.parse('2026-11-06T12:00:00.000Z')
const pending = { ...completedRouteFixture, status: 'PENDING' as const, createdAt: new Date(createdAt).toISOString() }

describe('mockProgress', () => {
  it('traces the roads first, counting every ordered pair and the elevation lookup', () => {
    const progress = mockProgress(pending, createdAt + DELAY_MS * 0.125, DELAY_MS)

    expect(progress.stage).toBe('PREPARING')
    expect(progress.total).toBe(7)
    expect(progress.percent).toBeGreaterThan(0)
    expect(progress.percent).toBeLessThan(25)
  })

  it('then optimizes, counting the generations up to the end', () => {
    const halfway = mockProgress(pending, createdAt + DELAY_MS * 0.625, DELAY_MS)
    const end = mockProgress(pending, createdAt + DELAY_MS, DELAY_MS)

    expect(halfway).toMatchObject({ stage: 'OPTIMIZING', done: 250, total: 500, percent: 60 })
    expect(end).toMatchObject({ stage: 'OPTIMIZING', done: 500, percent: 95 })
  })

  it('reports the end once the route is settled', () => {
    expect(mockProgress(completedRouteFixture, createdAt, DELAY_MS)).toMatchObject({
      stage: 'COMPLETED',
      percent: 100,
    })
    expect(
      mockProgress({ ...completedRouteFixture, status: 'FAILED' }, createdAt, DELAY_MS).stage,
    ).toBe('FAILED')
  })
})
