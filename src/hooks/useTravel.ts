import type { LatLngTuple } from 'leaflet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { alongTrack, movedEnoughForHeading, bearingDegrees, pointAt } from '@/lib/navigation'
import type { Track } from '@/lib/navigation'

export type TravelMode = 'gps' | 'simulated'

export type TravelState = {
  position: LatLngTuple | null
  heading: number
  along: number
  speedKmh: number
  mode: TravelMode
  gpsProblem: string | null
  finished: boolean
}

const TICK_MS = 200
const BASE_SPEED_KMH = 40
const KMH_TO_MS = 1 / 3.6
const MS_TO_KMH = 3.6

function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export function useTravel(track: Track, speedMultiplier: number) {
  const [mode, setMode] = useState<TravelMode>(() => (hasGeolocation() ? 'gps' : 'simulated'))
  const [position, setPosition] = useState<LatLngTuple | null>(null)
  const [heading, setHeading] = useState(0)
  const [along, setAlong] = useState(0)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [gpsProblem, setGpsProblem] = useState<string | null>(null)
  const lastGps = useRef<LatLngTuple | null>(null)
  const alongRef = useRef(0)

  const restart = useCallback(() => {
    alongRef.current = 0
    lastGps.current = null
    setAlong(0)
    setPosition(null)
    setSpeedKmh(0)
  }, [])

  useEffect(() => {
    if (mode !== 'simulated') {
      return
    }
    const timer = setInterval(() => {
      const advance = BASE_SPEED_KMH * KMH_TO_MS * speedMultiplier * (TICK_MS / 1000)
      alongRef.current = Math.min(track.total, alongRef.current + advance)
      const point = pointAt(track, alongRef.current)
      setAlong(alongRef.current)
      setSpeedKmh(alongRef.current >= track.total ? 0 : BASE_SPEED_KMH * speedMultiplier)
      if (point) {
        setPosition(point.position)
        setHeading(point.heading)
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [mode, track, speedMultiplier])

  useEffect(() => {
    if (mode !== 'gps') {
      return
    }
    if (!hasGeolocation()) {
      return
    }
    const geolocation = navigator.geolocation
    const watch = geolocation.watchPosition(
      (fix) => {
        const next: LatLngTuple = [fix.coords.latitude, fix.coords.longitude]
        const previous = lastGps.current
        if (typeof fix.coords.heading === 'number' && Number.isFinite(fix.coords.heading)) {
          setHeading(fix.coords.heading)
        } else if (previous && movedEnoughForHeading(previous, next)) {
          setHeading(bearingDegrees(previous, next))
        }
        lastGps.current = next
        alongRef.current = alongTrack(track, next, alongRef.current)
        setAlong(alongRef.current)
        setPosition(next)
        setSpeedKmh(
          typeof fix.coords.speed === 'number' && Number.isFinite(fix.coords.speed)
            ? fix.coords.speed * MS_TO_KMH
            : 0,
        )
        setGpsProblem(null)
      },
      () =>
        setGpsProblem(
          'Não foi possível acompanhar a sua localização. Libere o acesso no navegador ou use o percurso simulado.',
        ),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
    )
    return () => geolocation.clearWatch(watch)
  }, [mode, track])

  const changeMode = useCallback(
    (next: TravelMode) => {
      restart()
      setGpsProblem(
        next === 'gps' && !hasGeolocation()
          ? 'Este navegador não permite obter a localização.'
          : null,
      )
      setMode(next)
    },
    [restart],
  )

  const state: TravelState = {
    position,
    heading,
    along,
    speedKmh,
    mode,
    gpsProblem,
    finished: track.total > 0 && along >= track.total - 1,
  }

  return { ...state, changeMode, restart }
}
