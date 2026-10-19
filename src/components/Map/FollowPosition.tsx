import type { LatLngTuple } from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

const FOLLOW_ZOOM = 17

type FollowPositionProps = {
  position: LatLngTuple | null
  following: boolean
  onUserMoved: () => void
}

export default function FollowPosition({ position, following, onUserMoved }: FollowPositionProps) {
  const map = useMap()

  useEffect(() => {
    map.on('dragstart', onUserMoved)
    return () => {
      map.off('dragstart', onUserMoved)
    }
  }, [map, onUserMoved])

  useEffect(() => {
    if (!position || !following) {
      return
    }
    const size = map.getSize()
    if (size.x === 0 || size.y === 0) {
      return
    }
    map.setView(position, Math.max(map.getZoom(), FOLLOW_ZOOM), { animate: true, duration: 0.4 })
  }, [map, position, following])

  return null
}
