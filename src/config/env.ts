const OPENSTREETMAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  tileUrl: import.meta.env.VITE_TILE_URL ?? OPENSTREETMAP_TILES,
  geocoderUrl: import.meta.env.VITE_GEOCODER_URL ?? NOMINATIM_SEARCH,
} as const

export function isMockMode(): boolean {
  return import.meta.env.MODE === 'mock'
}
