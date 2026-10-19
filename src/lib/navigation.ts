import type { LatLngTuple } from 'leaflet'

const EARTH_RADIUS_M = 6_371_000
const MIN_MOVE_FOR_HEADING_M = 3
const STOP_REACHED_M = 25

export type Track = {
  points: LatLngTuple[]
  cumulative: number[]
  total: number
}

export type TrackPosition = {
  position: LatLngTuple
  heading: number
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

export function distanceMeters(from: LatLngTuple, to: LatLngTuple): number {
  const deltaLat = toRadians(to[0] - from[0])
  const deltaLng = toRadians(to[1] - from[1])
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from[0])) * Math.cos(toRadians(to[0])) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

export function bearingDegrees(from: LatLngTuple, to: LatLngTuple): number {
  const fromLat = toRadians(from[0])
  const toLat = toRadians(to[0])
  const deltaLng = toRadians(to[1] - from[1])
  const y = Math.sin(deltaLng) * Math.cos(toLat)
  const x =
    Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

export function movedEnoughForHeading(from: LatLngTuple, to: LatLngTuple): boolean {
  return distanceMeters(from, to) >= MIN_MOVE_FOR_HEADING_M
}

export function buildTrack(path: LatLngTuple[]): Track {
  const cumulative: number[] = []
  let total = 0
  path.forEach((point, index) => {
    const previous = path[index - 1]
    if (previous) {
      total += distanceMeters(previous, point)
    }
    cumulative.push(total)
  })
  return { points: path, cumulative, total }
}

export function pointAt(track: Track, along: number): TrackPosition | null {
  const [first] = track.points
  if (!first) {
    return null
  }
  const clamped = Math.min(Math.max(along, 0), track.total)
  let index = track.cumulative.findIndex((value) => value >= clamped)
  if (index === -1) {
    index = track.points.length - 1
  }
  if (index === 0) {
    const next = track.points.find((point) => distanceMeters(first, point) > 0)
    return { position: first, heading: next ? bearingDegrees(first, next) : 0 }
  }
  const start = track.points[index - 1] ?? first
  const end = track.points[index] ?? first
  const before = track.cumulative[index - 1] ?? 0
  const span = (track.cumulative[index] ?? before) - before
  const ratio = span === 0 ? 0 : (clamped - before) / span
  return {
    position: [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio],
    heading: bearingDegrees(start, end),
  }
}

export function alongTrack(track: Track, position: LatLngTuple, from = 0): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  track.points.forEach((point, index) => {
    const along = track.cumulative[index] ?? 0
    if (along < from) {
      return
    }
    const distance = distanceMeters(point, position)
    if (distance < bestDistance) {
      bestDistance = distance
      best = along
    }
  })
  return best
}

export function stopOffsets(track: Track, stops: LatLngTuple[]): number[] {
  let from = 0
  return stops.map((stop) => {
    const along = alongTrack(track, stop, from)
    from = along
    return along
  })
}

export function nextStopIndex(offsets: number[], along: number): number {
  const index = offsets.findIndex((offset) => offset - along > STOP_REACHED_M)
  return index === -1 ? offsets.length : index
}

export function describeDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(0, Math.round(meters / 10) * 10)} m`
  }
  return `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
}
