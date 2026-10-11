import Card from '@/components/Card/Card'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import RoutePolyline from '@/components/Map/RoutePolyline'
import { toLatLng } from '@/lib/geo'
import styles from '@/pages/ComparisonPage/RouteMap.module.css'
import type { Route } from '@/services/schemas/route'

type RouteMapProps = {
  title: string
  route: Route
  tone: 'emission' | 'distance'
}

export default function RouteMap({ title, route, tone }: RouteMapProps) {
  const stops = [...route.points].sort((first, second) => first.visitOrder - second.visitOrder)
  const positions = stops.map(toLatLng)

  return (
    <Card title={title}>
      <MapView label={`Mapa da rota: ${title}`} fitTo={positions}>
        <RoutePolyline tone={tone} positions={positions} />
        {stops.map((stop) => (
          <MapMarker
            key={stop.pointId}
            position={toLatLng(stop)}
            title={stop.name}
            label={String(stop.visitOrder)}
            tone={tone}
          />
        ))}
      </MapView>
      <h3 className={styles.orderTitle}>Ordem de visita</h3>
      <ol className={styles.order}>
        {stops.map((stop) => (
          <li key={stop.pointId}>{stop.name}</li>
        ))}
      </ol>
    </Card>
  )
}
