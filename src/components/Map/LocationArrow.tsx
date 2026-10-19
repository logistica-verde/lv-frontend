import { divIcon } from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import styles from '@/components/Map/LocationArrow.module.css'

const SIZE = 44

type LocationArrowProps = {
  position: LatLngTuple
  heading: number
}

export default function LocationArrow({ position, heading }: LocationArrowProps) {
  const icon = useMemo(
    () =>
      divIcon({
        className: styles.arrow,
        html: `<svg viewBox="0 0 44 44" width="${SIZE}" height="${SIZE}" style="transform: rotate(${Math.round(heading)}deg)" aria-hidden="true"><circle cx="22" cy="22" r="20" class="${styles.halo}" /><path d="M22 6 L34 36 L22 30 L10 36 Z" class="${styles.body}" /></svg>`,
        iconSize: [SIZE, SIZE],
        iconAnchor: [SIZE / 2, SIZE / 2],
      }),
    [heading],
  )

  return <Marker position={position} icon={icon} interactive={false} keyboard={false} zIndexOffset={1000} />
}
