import type { LatLngTuple } from 'leaflet'
import { toLatLng } from '@/lib/geo'
import type { Route } from '@/services/schemas/route'

const STRAIGHT_LINE_POINTS = 2

function inVisitOrder(route: Route): LatLngTuple[] {
  return [...route.points]
    .sort((first, second) => first.visitOrder - second.visitOrder)
    .map(toLatLng)
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
