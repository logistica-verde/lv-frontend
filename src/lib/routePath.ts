import type { LatLngTuple } from 'leaflet'
import { toLatLng } from '@/lib/geo'
import { distanceMeters } from '@/lib/navigation'
import type { Route } from '@/services/schemas/route'

const STRAIGHT_LINE_POINTS = 2

function inVisitOrder(route: Route): LatLngTuple[] {
  const path = [...route.points]
    .sort((first, second) => first.visitOrder - second.visitOrder)
    .map(toLatLng)
  const [start] = path
  return route.returnsToBase === true && start ? [...path, start] : path
}

export function followsStreets(route: Route): boolean {
  return route.segments.some((segment) => (segment.geometry?.length ?? 0) > STRAIGHT_LINE_POINTS)
}

export function routePath(route: Route): LatLngTuple[] {
  if (!followsStreets(route) || route.segments.some((segment) => !segment.geometry?.length)) {
    return inVisitOrder(route)
  }
  return route.segments.flatMap((segment) => segment.geometry ?? [])
}

const KMH_TO_MS = 1 / 3.6
const MIN_SPEED_KMH = 1

function speedMs(segment: Route['segments'][number]): number {
  return Math.max(segment.averageSpeedKmh, MIN_SPEED_KMH) * KMH_TO_MS
}

export function secondsPerVertex(route: Route): number[] {
  const streets = followsStreets(route) && route.segments.every((segment) => segment.geometry?.length)
  if (!streets) {
    return [0, ...route.segments.map((segment) => segment.distanceMeters / speedMs(segment))]
  }
  return route.segments.flatMap((segment) => {
    const geometry = segment.geometry ?? []
    return geometry.map((point, index) => {
      const previous = geometry[index - 1]
      return previous ? distanceMeters(previous, point) / speedMs(segment) : 0
    })
  })
}
