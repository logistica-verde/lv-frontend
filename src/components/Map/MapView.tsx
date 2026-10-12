import 'leaflet/dist/leaflet.css'
import type { LatLngTuple } from 'leaflet'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MapClickHandler from '@/components/Map/MapClickHandler'
import styles from '@/components/Map/MapView.module.css'
import { env } from '@/config/env'
import { classNames } from '@/lib/classNames'
import { DEFAULT_ZOOM, parsePositionsKey, positionsKey, SAO_PAULO_CENTER } from '@/lib/geo'

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const FIT_PADDING = 40
const MAX_FIT_ZOOM = 15
const SINGLE_POINT_ZOOM = 15
const NO_POSITIONS: LatLngTuple[] = []

type FitBoundsProps = {
  positions: LatLngTuple[]
  insetRight: number
}

function FitBounds({ positions, insetRight }: FitBoundsProps) {
  const map = useMap()
  const key = positionsKey(positions)
  const target = useMemo(() => parsePositionsKey(key), [key])
  const [resizes, setResizes] = useState(0)

  const handleResize = useCallback(() => setResizes((count) => count + 1), [])

  useEffect(() => {
    map.on('resize', handleResize)
    return () => {
      map.off('resize', handleResize)
    }
  }, [map, handleResize])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])

  useEffect(() => {
    const size = map.getSize()
    if (target.length === 0 || size.x === 0 || size.y === 0) {
      return
    }
    const [only] = target
    if (target.length === 1 && only) {
      map.setView(only, SINGLE_POINT_ZOOM)
      return
    }
    map.fitBounds(target, {
      paddingTopLeft: [FIT_PADDING, FIT_PADDING],
      paddingBottomRight: [FIT_PADDING + insetRight, FIT_PADDING],
      maxZoom: MAX_FIT_ZOOM,
    })
  }, [map, target, resizes, insetRight])

  return null
}

type MapViewProps = {
  label: string
  fitTo?: LatLngTuple[]
  onMapClick?: (position: LatLngTuple) => void
  overlay?: ReactNode
  legend?: ReactNode
  flush?: boolean
  fitInsetRight?: number
  children?: ReactNode
}

export default function MapView({
  label,
  fitTo = NO_POSITIONS,
  onMapClick,
  overlay,
  legend,
  flush = false,
  fitInsetRight = 0,
  children,
}: MapViewProps) {
  return (
    <div
      role="region"
      aria-label={label}
      className={classNames(styles.wrapper, flush && styles.flush)}
    >
      <MapContainer
        center={SAO_PAULO_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className={styles.map}
      >
        <TileLayer attribution={ATTRIBUTION} url={env.tileUrl} />
        <FitBounds positions={fitTo} insetRight={fitInsetRight} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {children}
      </MapContainer>
      {legend && <div className={styles.legend}>{legend}</div>}
      {overlay && <div className={styles.overlay}>{overlay}</div>}
    </div>
  )
}
