import type { LatLngTuple } from 'leaflet'
import { Polyline } from 'react-leaflet'
import styles from '@/components/Map/RoutePolyline.module.css'
import { classNames } from '@/lib/classNames'

const LINE_WEIGHTS = { emission: 4, distance: 7 }

type RoutePolylineProps = {
  positions: LatLngTuple[]
  tone: 'emission' | 'distance'
}

export default function RoutePolyline({ positions, tone }: RoutePolylineProps) {
  return (
    <Polyline
      positions={positions}
      pathOptions={{ className: classNames(styles.line, styles[tone]), weight: LINE_WEIGHTS[tone] }}
    />
  )
}
