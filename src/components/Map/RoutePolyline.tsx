import type { LatLngTuple } from 'leaflet'
import { Polyline } from 'react-leaflet'
import styles from '@/components/Map/RoutePolyline.module.css'
import { classNames } from '@/lib/classNames'

const LINE_WEIGHT = 5

type RoutePolylineProps = {
  positions: LatLngTuple[]
  tone: 'emission' | 'distance'
}

export default function RoutePolyline({ positions, tone }: RoutePolylineProps) {
  return (
    <Polyline
      positions={positions}
      pathOptions={{ className: classNames(styles.line, styles[tone]), weight: LINE_WEIGHT }}
    />
  )
}
