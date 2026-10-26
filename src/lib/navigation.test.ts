import type { LatLngTuple } from 'leaflet'
import { describe, expect, it } from 'vitest'
import {
  alongTrack,
  bearingDegrees,
  buildTimeline,
  buildTrack,
  describeDistance,
  describeDuration,
  distanceMeters,
  hasArrived,
  lerpAngle,
  nextStopIndex,
  pointAt,
  remainingSeconds,
  secondsAt,
  secondsToNextStop,
  smoothingRatio,
  STOP_SERVICE_SECONDS,
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

describe('navigation time helpers', () => {
  const track = buildTrack([
    [-23.55, -46.63],
    [-23.54, -46.63],
    [-23.54, -46.62],
  ])
  const timeline = buildTimeline(track, [0, 60, 120])

  it('accumulates the seconds along the track', () => {
    expect(timeline.seconds).toEqual([0, 60, 180])
  })

  it('interpolates the seconds at a distance along the track', () => {
    expect(secondsAt(timeline, 0)).toBe(0)
    expect(secondsAt(timeline, (track.cumulative[1] ?? 0) / 2)).toBeCloseTo(30, 5)
    expect(secondsAt(timeline, track.total + 100)).toBe(180)
  })

  it('adds a service time for each remaining stop to the remaining drive', () => {
    expect(remainingSeconds(timeline, 0, 2)).toBe(180 + 2 * STOP_SERVICE_SECONDS)
    expect(remainingSeconds(timeline, track.total, 0)).toBe(0)
  })

  it('gives the seconds to the next stop', () => {
    expect(secondsToNextStop(timeline, 0, track.cumulative[1] ?? 0)).toBeCloseTo(60, 5)
    expect(secondsToNextStop(timeline, track.total, 0)).toBe(0)
  })

  it('knows when the destination was reached', () => {
    expect(hasArrived([-23.54, -46.62], [-23.54, -46.62])).toBe(true)
    expect(hasArrived([-23.55, -46.63], [-23.54, -46.62])).toBe(false)
    expect(hasArrived(null, [-23.54, -46.62])).toBe(false)
    expect(hasArrived([-23.54, -46.62], undefined)).toBe(false)
  })

  it('turns through the shortest arc', () => {
    expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0, 5)
    expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0, 5)
    expect(lerpAngle(90, 180, 0.5)).toBeCloseTo(135, 5)
  })

  it('smooths faster with a longer elapsed time', () => {
    expect(smoothingRatio(0, 250)).toBe(0)
    expect(smoothingRatio(250, 250)).toBeCloseTo(0.632, 3)
    expect(smoothingRatio(5000, 250)).toBeGreaterThan(0.99)
  })

  it('describes a duration in minutes and hours', () => {
    expect(describeDuration(20)).toBe('menos de 1 min')
    expect(describeDuration(300)).toBe('5 min')
    expect(describeDuration(3600)).toBe('1 h')
    expect(describeDuration(5400)).toBe('1 h 30 min')
  })
})
