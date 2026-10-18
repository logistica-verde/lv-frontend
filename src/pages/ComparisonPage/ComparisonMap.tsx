import Card from '@/components/Card/Card'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import RoutePolyline from '@/components/Map/RoutePolyline'
import { toLatLng } from '@/lib/geo'
import { followsStreets, routePath } from '@/lib/routePath'
import styles from '@/pages/ComparisonPage/ComparisonMap.module.css'
import type { Route, RoutePoint } from '@/services/schemas/route'

type ComparisonMapProps = {
  emissionRoute: Route
  distanceRoute: Route
}

type RouteMapProps = {
  route: Route
  tone: 'emission' | 'distance'
  title: string
  legend: string
  label: string
}

function inVisitOrder(route: Route): RoutePoint[] {
  return [...route.points].sort((first, second) => first.visitOrder - second.visitOrder)
}

function RouteMap({ route, tone, title, legend, label }: RouteMapProps) {
  const stops = inVisitOrder(route)

  return (
    <Card title={title}>
      <div className={styles.map}>
        <MapView label={label} fitTo={stops.map(toLatLng)}>
          <RoutePolyline tone={tone} positions={routePath(route)} />
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
      </div>
      <p className={styles.legend}>
        <svg width="32" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="32"
            y2="4"
            className={tone === 'emission' ? styles.emissionLine : styles.distanceLine}
          />
        </svg>
        {legend}
      </p>
    </Card>
  )
}

export default function ComparisonMap({ emissionRoute, distanceRoute }: ComparisonMapProps) {
  return (
    <div className={styles.maps}>
      <RouteMap
        route={emissionRoute}
        tone="emission"
        title="Menor emissão"
        legend="Linha contínua"
        label="Mapa da rota de menor emissão"
      />
      <RouteMap
        route={distanceRoute}
        tone="distance"
        title="Menor distância"
        legend="Linha tracejada"
        label="Mapa da rota de menor distância"
      />
      <p className={styles.note}>
        Os números mostram a ordem de visita em cada rota.
        {followsStreets(emissionRoute) && followsStreets(distanceRoute)
          ? ' As linhas seguem o traçado das ruas.'
          : ' Linhas retas, sem o traçado das ruas.'}
      </p>
    </div>
  )
}
