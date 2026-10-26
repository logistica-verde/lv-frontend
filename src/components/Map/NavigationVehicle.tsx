import { divIcon, marker } from 'leaflet'
import type { LatLngTuple, Marker } from 'leaflet'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import styles from '@/components/Map/LocationArrow.module.css'
import { lerpAngle, smoothingRatio } from '@/lib/navigation'

const SIZE = 44
const FOLLOW_ZOOM = 17
const POSITION_TIME_CONSTANT_MS = 380
const HEADING_TIME_CONSTANT_MS = 450
const MAX_FRAME_MS = 250

const ARROW_HTML = `<svg viewBox="0 0 44 44" width="${SIZE}" height="${SIZE}" aria-hidden="true"><circle cx="22" cy="22" r="20" class="${styles.halo}" /><path d="M22 6 L34 36 L22 30 L10 36 Z" class="${styles.body}" /></svg>`

type Pose = {
  position: LatLngTuple
  heading: number
}

type NavigationVehicleProps = {
  position: LatLngTuple | null
  heading: number
  following: boolean
  rotateMap: boolean
  onUserMoved: () => void
}

export default function NavigationVehicle({
  position,
  heading,
  following,
  rotateMap,
  onUserMoved,
}: NavigationVehicleProps) {
  const map = useMap()
  const goal = useRef<Pose | null>(null)
  const shown = useRef<Pose | null>(null)
  const followingRef = useRef(following)
  const rotateRef = useRef(rotateMap)
  const zoomed = useRef(false)

  useEffect(() => {
    goal.current = position ? { position, heading } : null
  }, [position, heading])

  useEffect(() => {
    followingRef.current = following
    rotateRef.current = rotateMap
    if (following) {
      zoomed.current = false
    }
  }, [following, rotateMap])

  useEffect(() => {
    map.on('dragstart', onUserMoved)
    return () => {
      map.off('dragstart', onUserMoved)
    }
  }, [map, onUserMoved])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let vehicle: Marker | null = null

    const tick = (now: number) => {
      const target = goal.current
      if (target) {
        const elapsed = Math.min(now - last, MAX_FRAME_MS)
        const current = shown.current ?? target
        const move = smoothingRatio(elapsed, POSITION_TIME_CONSTANT_MS)
        const turn = smoothingRatio(elapsed, HEADING_TIME_CONSTANT_MS)
        const next: Pose = {
          position: [
            current.position[0] + (target.position[0] - current.position[0]) * move,
            current.position[1] + (target.position[1] - current.position[1]) * move,
          ],
          heading: lerpAngle(current.heading, target.heading, turn),
        }
        shown.current = next

        if (!vehicle) {
          vehicle = marker(next.position, {
            icon: divIcon({ className: styles.arrow, html: ARROW_HTML, iconSize: [SIZE, SIZE], iconAnchor: [SIZE / 2, SIZE / 2] }),
            interactive: false,
            keyboard: false,
            zIndexOffset: 1000,
          }).addTo(map)
        } else {
          vehicle.setLatLng(next.position)
        }
        const arrow = vehicle.getElement()?.querySelector('svg')
        if (arrow) {
          arrow.style.transform = `rotate(${rotateRef.current ? 0 : Math.round(next.heading)}deg)`
        }

        const size = map.getSize()
        if (followingRef.current && size.x > 0 && size.y > 0) {
          const zoom = zoomed.current ? map.getZoom() : Math.max(map.getZoom(), FOLLOW_ZOOM)
          zoomed.current = true
          map.setView(next.position, zoom, { animate: false })
          if (map.options.rotate) {
            map.setBearing(rotateRef.current ? next.heading : 0)
          }
        }
      }
      last = now
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      vehicle?.remove()
    }
  }, [map])

  return null
}
