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
  selected?: boolean
  onClick?: () => void
}

export default function MapMarker({
  position,
  title,
  label,
  tone = 'neutral',
  selected,
  onClick,
}: MapMarkerProps) {
  const markerRef = useRef<LeafletMarker | null>(null)
  const accessibleName = label ? `${label}. ${title}` : title

  const icon = useMemo(
    () =>
      divIcon({
        className: classNames(styles.marker, styles[tone], selected && styles.selected),
        html: label ? `<span>${escapeHtml(label)}</span>` : '',
        iconSize: [MARKER_SIZE, MARKER_SIZE],
        iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
      }),
    [label, tone, selected],
  )

  useEffect(() => {
    const element = markerRef.current?.getElement()
    element?.setAttribute('aria-label', accessibleName)
    if (selected === undefined) {
      element?.removeAttribute('aria-pressed')
    } else {
      element?.setAttribute('aria-pressed', String(selected))
    }
  }, [accessibleName, icon, selected])

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      title={title}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      <Tooltip direction="top" offset={[0, -MARKER_SIZE / 2]}>
        {title}
      </Tooltip>
    </Marker>
  )
}
