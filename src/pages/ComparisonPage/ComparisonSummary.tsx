import Card from '@/components/Card/Card'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import {
  describeDistanceComparison,
  describeEmissionComparison,
  emissionSavingPercent,
  extraDistancePercent,
} from '@/lib/comparison'
import { formatKilometers, formatNumber } from '@/lib/format'
import styles from '@/pages/ComparisonPage/ComparisonSummary.module.css'
import type { Route } from '@/services/schemas/route'

type ComparisonSummaryProps = {
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

export default function ComparisonSummary({
  emissionRoute,
  distanceRoute,
}: ComparisonSummaryProps) {
  const emissionText = describeEmissionComparison(
    emissionSavingPercent(emissionRoute, distanceRoute),
  )
  const distanceText = describeDistanceComparison(
    extraDistancePercent(emissionRoute, distanceRoute),
  )

  return (
    <Card title="Comparação">
      <p className={styles.headline}>{emissionText}</p>
      {distanceText && <p className={styles.detail}>{distanceText}</p>}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption>
            <VisuallyHidden>Totais de cada rota</VisuallyHidden>
          </caption>
          <thead>
            <tr>
              <th scope="col">Métrica</th>
              <th scope="col" className={styles.numeric}>
                Menor emissão
              </th>
              <th scope="col" className={styles.numeric}>
                Menor distância
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Emissão total (kg de CO₂)</th>
              <td className={styles.numeric}>{formatEmission(emissionRoute)}</td>
              <td className={styles.numeric}>{formatEmission(distanceRoute)}</td>
            </tr>
            <tr>
              <th scope="row">Distância total (km)</th>
              <td className={styles.numeric}>{formatDistance(emissionRoute)}</td>
              <td className={styles.numeric}>{formatDistance(distanceRoute)}</td>
            </tr>
            <tr>
              <th scope="row">Paradas</th>
              <td className={styles.numeric}>{emissionRoute.points.length}</td>
              <td className={styles.numeric}>{distanceRoute.points.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
