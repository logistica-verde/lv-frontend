import { divIcon } from 'leaflet'
import type { LatLngTuple, Marker as LeafletMarker } from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import styles from '@/components/Map/MapMarker.module.css'
import { classNames } from '@/lib/classNames'
import { escapeHtml } from '@/lib/escapeHtml'

const MARKER_SIZE = 28

type MapMarkerProps = {
  position: LatLngTuple
  title: string
  label?: string
  tone?: 'neutral' | 'emission' | 'distance'
}

export default function MapMarker({ position, title, label, tone = 'neutral' }: MapMarkerProps) {
  const markerRef = useRef<LeafletMarker | null>(null)
  const accessibleName = label ? `${label}. ${title}` : title

  const icon = useMemo(
    () =>
      divIcon({
        className: classNames(styles.marker, styles[tone]),
        html: label ? `<span>${escapeHtml(label)}</span>` : '',
        iconSize: [MARKER_SIZE, MARKER_SIZE],
        iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
      }),
    [label, tone],
  )

  useEffect(() => {
    markerRef.current?.getElement()?.setAttribute('aria-label', accessibleName)
  }, [accessibleName, icon])

  return (
    <Marker ref={markerRef} position={position} icon={icon} title={title}>
      <Tooltip direction="top" offset={[0, -MARKER_SIZE / 2]}>
        {title}
      </Tooltip>
    </Marker>
  )
}
