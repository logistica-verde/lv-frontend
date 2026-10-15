import Card from '@/components/Card/Card'
import Table, { Td, Th } from '@/components/Table/Table'
import { classNames } from '@/lib/classNames'
import {
  averageSpeedKmh,
  emissionPerKm,
  emissionSavingPercent,
  extraDistancePercent,
  percentChange,
  travelTimeHours,
} from '@/lib/comparison'
import { formatDuration, formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import styles from '@/pages/ComparisonPage/MetricsTable.module.css'
import type { Route } from '@/services/schemas/route'

type MetricsTableProps = {
  emissionRoute: Route
  distanceRoute: Route
}

const MISSING = '—'

function formatEmission(route: Route): string {
  return route.totalEmissionKg === null ? MISSING : formatNumber(route.totalEmissionKg)
}

function formatDistance(route: Route): string {
  return route.totalDistanceMeters === null ? MISSING : formatKilometers(route.totalDistanceMeters)
}

function change(base: number | null, value: number | null): number | null {
  return base === null || value === null ? null : percentChange(base, value)
}

function formatOptional(value: number | null, format: (input: number) => string): string {
  return value === null ? MISSING : format(value)
}

export default function MetricsTable({ emissionRoute, distanceRoute }: MetricsTableProps) {
  const saving = emissionSavingPercent(emissionRoute, distanceRoute)
  const emissionDelta = saving === null ? null : -saving
  const distanceDelta = extraDistancePercent(emissionRoute, distanceRoute)
  const perKm = { emission: emissionPerKm(emissionRoute), distance: emissionPerKm(distanceRoute) }
  const hours = {
    emission: travelTimeHours(emissionRoute),
    distance: travelTimeHours(distanceRoute),
  }
  const speed = {
    emission: averageSpeedKmh(emissionRoute),
    distance: averageSpeedKmh(distanceRoute),
  }

  return (
    <Card title="Métricas">
      <Table dense caption="Totais de cada rota e diferença entre elas">
        <thead>
          <tr>
            <Th>Métrica</Th>
            <Th numeric>Menor emissão</Th>
            <Th numeric>Menor distância</Th>
            <Th numeric>Diferença (Δ)</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Th scope="row">Emissão estimada (kg CO₂)</Th>
            <Td numeric>{formatEmission(emissionRoute)}</Td>
            <Td numeric>{formatEmission(distanceRoute)}</Td>
            <Td
              numeric
              className={classNames(
                styles.delta,
                emissionDelta !== null && emissionDelta < 0 && styles.better,
                emissionDelta !== null && emissionDelta > 0 && styles.worse,
              )}
            >
              {formatSignedPercent(emissionDelta)}
            </Td>
          </tr>
          <tr>
            <Th scope="row">Distância (km)</Th>
            <Td numeric>{formatDistance(emissionRoute)}</Td>
            <Td numeric>{formatDistance(distanceRoute)}</Td>
            <Td numeric className={styles.delta}>
              {formatSignedPercent(distanceDelta)}
            </Td>
          </tr>
          <tr>
            <Th scope="row">Emissão por km (kg CO₂/km)</Th>
            <Td numeric>{formatOptional(perKm.emission, formatNumber)}</Td>
            <Td numeric>{formatOptional(perKm.distance, formatNumber)}</Td>
            <Td numeric className={styles.delta}>
              {formatSignedPercent(change(perKm.distance, perKm.emission))}
            </Td>
          </tr>
          <tr>
            <Th scope="row">Tempo estimado de viagem</Th>
            <Td numeric>{formatOptional(hours.emission, formatDuration)}</Td>
            <Td numeric>{formatOptional(hours.distance, formatDuration)}</Td>
            <Td numeric className={styles.delta}>
              {formatSignedPercent(change(hours.distance, hours.emission))}
            </Td>
          </tr>
          <tr>
            <Th scope="row">Velocidade média (km/h)</Th>
            <Td numeric>{formatOptional(speed.emission, formatNumber)}</Td>
            <Td numeric>{formatOptional(speed.distance, formatNumber)}</Td>
            <Td numeric className={styles.delta}>
              {formatSignedPercent(change(speed.distance, speed.emission))}
            </Td>
          </tr>
          <tr>
            <Th scope="row">Paradas</Th>
            <Td numeric>{emissionRoute.points.length}</Td>
            <Td numeric>{distanceRoute.points.length}</Td>
            <Td numeric>{MISSING}</Td>
          </tr>
        </tbody>
      </Table>
    </Card>
  )
}
