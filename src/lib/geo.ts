import type { LatLngTuple } from 'leaflet'

export type Coordinates = {
  latitude: number
  longitude: number
}

export const SAO_PAULO_CENTER: LatLngTuple = [-23.5505, -46.6333]

export const DEFAULT_ZOOM = 12

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 1e6) / 1e6
}

export function toLatLng(point: Coordinates): LatLngTuple {
  return [point.latitude, point.longitude]
}

export function positionsKey(positions: LatLngTuple[]): string {
  return positions.map(([latitude, longitude]) => `${latitude},${longitude}`).join('|')
}

export function parsePositionsKey(key: string): LatLngTuple[] {
  if (key === '') {
    return []
  }
  return key.split('|').map((pair): LatLngTuple => {
    const [latitude = '0', longitude = '0'] = pair.split(',')
    return [Number(latitude), Number(longitude)]
  })
}
