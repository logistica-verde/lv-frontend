import type { LatLngTuple } from 'leaflet'
import { describe, expect, it } from 'vitest'
import {
  alongTrack,
  bearingDegrees,
  buildTrack,
  describeDistance,
  distanceMeters,
  nextStopIndex,
  pointAt,
  stopOffsets,
} from '@/lib/navigation'

const NORTH_PATH: LatLngTuple[] = [
  [-23.55, -46.63],
  [-23.54, -46.63],
  [-23.54, -46.62],
]

describe('navigation helpers', () => {
  it('measures the distance between two coordinates', () => {
    expect(distanceMeters([-23.55, -46.63], [-23.54, -46.63])).toBeCloseTo(1112, -1)
    expect(distanceMeters([-23.55, -46.63], [-23.55, -46.63])).toBe(0)
  })

  it('gives the bearing between two coordinates', () => {
    expect(bearingDegrees([-23.55, -46.63], [-23.54, -46.63])).toBeCloseTo(0, 5)
    expect(bearingDegrees([-23.54, -46.63], [-23.54, -46.62])).toBeCloseTo(90, 0)
    expect(bearingDegrees([-23.54, -46.63], [-23.55, -46.63])).toBeCloseTo(180, 5)
  })

  it('accumulates the length of the track', () => {
    const track = buildTrack(NORTH_PATH)

    expect(track.cumulative).toHaveLength(3)
    expect(track.cumulative[0]).toBe(0)
    expect(track.total).toBeGreaterThan(2000)
  })

  it('finds the position and heading at a distance along the track', () => {
    const track = buildTrack(NORTH_PATH)
    const half = pointAt(track, (track.cumulative[1] ?? 0) / 2)
    const end = pointAt(track, track.total + 500)

    expect(half?.position[0]).toBeCloseTo(-23.545, 4)
    expect(half?.heading).toBeCloseTo(0, 5)
    expect(end?.position).toEqual([-23.54, -46.62])
    expect(pointAt(buildTrack([]), 10)).toBeNull()
  })

  it('projects a position onto the track without going back', () => {
    const track = buildTrack(NORTH_PATH)

    expect(alongTrack(track, [-23.5401, -46.6299])).toBeCloseTo(track.cumulative[1] ?? 0, -1)
    expect(alongTrack(track, [-23.55, -46.63], 100)).toBeGreaterThanOrEqual(100)
  })

  it('knows which stop comes next', () => {
    const track = buildTrack(NORTH_PATH)
    const offsets = stopOffsets(track, [
      [-23.54, -46.63],
      [-23.54, -46.62],
    ])

    expect(nextStopIndex(offsets, 0)).toBe(0)
    expect(nextStopIndex(offsets, offsets[0] ?? 0)).toBe(1)
    expect(nextStopIndex(offsets, track.total)).toBe(2)
  })

  it('writes short distances in meters and long ones in kilometers', () => {
    expect(describeDistance(347)).toBe('350 m')
    expect(describeDistance(2450)).toBe('2,5 km')
  })
})
