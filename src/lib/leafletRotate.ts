import L from 'leaflet'

let loading: Promise<void> | null = null

export function loadLeafletRotate(): Promise<void> {
  if (!loading) {
    Object.assign(globalThis, { L })
    loading = import('leaflet-rotate').then(() => undefined)
  }
  return loading
}
