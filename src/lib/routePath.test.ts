import { describe, expect, it } from 'vitest'
import { followsStreets, routePath, secondsPerVertex } from '@/lib/routePath'
import type { Route } from '@/services/schemas/route'
import { completedRouteFixture } from '@/test/fixtures'

const street: [number, number][] = [
  [-23.57, -46.63],
  [-23.565, -46.631],
  [-23.56, -46.629],
  [-23.55, -46.63],
]

function withGeometry(first: [number, number][], second: [number, number][]): Route {
  const [firstSegment, secondSegment] = completedRouteFixture.segments
  return {
    ...completedRouteFixture,
    segments: [
      { ...(firstSegment as Route['segments'][number]), geometry: first },
      { ...(secondSegment as Route['segments'][number]), geometry: second },
    ],
  }
}

describe('routePath', () => {
  it('joins the street geometry of every segment in order', () => {
    const route = withGeometry(street, [
      [-23.55, -46.63],
      [-23.552, -46.625],
      [-23.56, -46.63],
    ])

    expect(followsStreets(route)).toBe(true)
    expect(routePath(route)).toHaveLength(7)
    expect(routePath(route)[0]).toEqual([-23.57, -46.63])
    expect(routePath(route)[6]).toEqual([-23.56, -46.63])
  })

  it('falls back to the stops in visit order when the segments carry no geometry', () => {
    expect(followsStreets(completedRouteFixture)).toBe(false)
    expect(routePath(completedRouteFixture)).toEqual([
      [-23.57, -46.63],
      [-23.55, -46.63],
      [-23.56, -46.63],
    ])
  })

  it('treats a two-point geometry as a straight line', () => {
    const route = withGeometry(
      [
        [-23.57, -46.63],
        [-23.55, -46.63],
      ],
      [
        [-23.55, -46.63],
        [-23.56, -46.63],
      ],
    )

    expect(followsStreets(route)).toBe(false)
    expect(routePath(route)).toHaveLength(3)
  })

  it('falls back when one segment has no geometry', () => {
    const route = withGeometry(street, [])

    expect(routePath(route)).toHaveLength(3)
  })
})

describe('secondsPerVertex', () => {
  it('has one entry per vertex of the path and spreads each segment time over its geometry', () => {
    const route: Route = {
      ...completedRouteFixture,
      segments: [
        {
          ...completedRouteFixture.segments[0]!,
          distanceMeters: 1000,
          averageSpeedKmh: 36,
          geometry: [
            [-23.55, -46.63],
            [-23.545, -46.63],
            [-23.54, -46.63],
          ],
        },
        {
          ...completedRouteFixture.segments[1]!,
          distanceMeters: 500,
          averageSpeedKmh: 18,
          geometry: [
            [-23.54, -46.63],
            [-23.54, -46.625],
          ],
        },
      ],
    }

    const seconds = secondsPerVertex(route)

    expect(seconds).toHaveLength(routePath(route).length)
    expect(seconds[0]).toBe(0)
    expect(seconds[1]! + seconds[2]!).toBeCloseTo(111, -1)
    expect(seconds[3]).toBe(0)
  })

  it('uses one leg per segment when the route has no street geometry', () => {
    const seconds = secondsPerVertex(completedRouteFixture)

    expect(seconds).toHaveLength(completedRouteFixture.points.length)
    expect(seconds[0]).toBe(0)
    expect(seconds[1]).toBeCloseTo(1010 / (40 / 3.6), 3)
  })
})
