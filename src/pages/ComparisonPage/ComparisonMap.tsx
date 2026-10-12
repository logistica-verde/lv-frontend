import Card from '@/components/Card/Card'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import RoutePolyline from '@/components/Map/RoutePolyline'
import { toLatLng } from '@/lib/geo'
import styles from '@/pages/ComparisonPage/ComparisonMap.module.css'
import type { Route, RoutePoint } from '@/services/schemas/route'

type ComparisonMapProps = {
  emissionRoute: Route
  distanceRoute: Route
}

function inVisitOrder(route: Route): RoutePoint[] {
  return [...route.points].sort((first, second) => first.visitOrder - second.visitOrder)
}

export default function ComparisonMap({ emissionRoute, distanceRoute }: ComparisonMapProps) {
  const emissionStops = inVisitOrder(emissionRoute)
  const distanceStops = inVisitOrder(distanceRoute)
  const distanceOrder = new Map(distanceStops.map((stop) => [stop.pointId, stop.visitOrder]))
  const fitTo = [...emissionStops, ...distanceStops].map(toLatLng)

  return (
    <Card title="Rotas no mapa" fill>
      <div className={styles.map}>
        <MapView label="Mapa comparativo das duas rotas" fitTo={fitTo}>
          <RoutePolyline tone="distance" positions={distanceStops.map(toLatLng)} />
          <RoutePolyline tone="emission" positions={emissionStops.map(toLatLng)} />
          {emissionStops.map((stop) => (
            <MapMarker
              key={stop.pointId}
              position={toLatLng(stop)}
              title={`${stop.name} (menor distância: ${distanceOrder.get(stop.pointId) ?? '—'}º)`}
              label={String(stop.visitOrder)}
              tone="emission"
            />
          ))}
        </MapView>
      </div>
      <ul aria-label="Legenda do mapa" className={styles.legend}>
        <li className={styles.item}>
          <svg width="32" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="32" y2="4" className={styles.emissionLine} />
          </svg>
          Menor emissão (linha contínua)
        </li>
        <li className={styles.item}>
          <svg width="32" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="32" y2="4" className={styles.distanceLine} />
          </svg>
          Menor distância (linha tracejada)
        </li>
        <li className={styles.note}>
          Números: ordem da menor emissão. Linhas retas, sem o traçado das ruas.
        </li>
      </ul>
    </Card>
  )
}
