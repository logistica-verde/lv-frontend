import { Link } from 'react-router'
import Card from '@/components/Card/Card'
import Table, { Td, Th } from '@/components/Table/Table'
import { classNames } from '@/lib/classNames'
import { emissionSavingPercent, extraDistancePercent } from '@/lib/comparison'
import { formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import IntegritySeal from '@/pages/ComparisonPage/IntegritySeal'
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

export default function MetricsTable({ emissionRoute, distanceRoute }: MetricsTableProps) {
  const saving = emissionSavingPercent(emissionRoute, distanceRoute)
  const emissionDelta = saving === null ? null : -saving
  const distanceDelta = extraDistancePercent(emissionRoute, distanceRoute)

  return (
    <Card>
      <div className={styles.layout}>
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
              <Th scope="row">Paradas</Th>
              <Td numeric>{emissionRoute.points.length}</Td>
              <Td numeric>{distanceRoute.points.length}</Td>
              <Td numeric>{MISSING}</Td>
            </tr>
          </tbody>
        </Table>
        <div className={styles.seals}>
          <div className={styles.sealItem}>
            <div className={styles.sealHeader}>
              <span className={styles.sealLabel}>Integridade: menor emissão</span>
              <Link to={`/verificacao/${emissionRoute.id}`}>Ver verificação</Link>
            </div>
            <IntegritySeal routeId={emissionRoute.id} criterion="menor emissão" />
          </div>
          <div className={styles.sealItem}>
            <div className={styles.sealHeader}>
              <span className={styles.sealLabel}>Integridade: menor distância</span>
              <Link to={`/verificacao/${distanceRoute.id}`}>Ver verificação</Link>
            </div>
            <IntegritySeal routeId={distanceRoute.id} criterion="menor distância" />
          </div>
        </div>
      </div>
    </Card>
  )
}
