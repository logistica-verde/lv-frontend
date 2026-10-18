export type LocationFix = {
  latitude: number
  longitude: number
  accuracyMeters: number
}

export type LocationFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported'

export class LocationError extends Error {
  readonly reason: LocationFailure

  constructor(reason: LocationFailure) {
    super(`Could not get the location: ${reason}`)
    this.name = 'LocationError'
    this.reason = reason
  }
}

const TIMEOUT_MS = 10_000
const MAX_AGE_MS = 60_000
const PERMISSION_DENIED = 1
const TIMED_OUT = 3

export function getCurrentFix(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new LocationError('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        }),
      (failure) => {
        if (failure.code === PERMISSION_DENIED) {
          reject(new LocationError('denied'))
        } else if (failure.code === TIMED_OUT) {
          reject(new LocationError('timeout'))
        } else {
          reject(new LocationError('unavailable'))
        }
      },
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS },
    )
  })
}

export function describeLocationFailure(reason: LocationFailure): string {
  switch (reason) {
    case 'denied':
      return 'A permissão de localização foi negada. Libere o acesso no navegador ou escolha a saída pelo primeiro ponto da lista.'
    case 'timeout':
      return 'Demorou demais para obter a sua localização. Tente de novo.'
    case 'unsupported':
      return 'Este navegador não permite obter a localização.'
    default:
      return 'Não foi possível obter a sua localização agora. Tente de novo.'
  }
}
