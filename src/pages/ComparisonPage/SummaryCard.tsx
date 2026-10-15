import Card from '@/components/Card/Card'
import {
  describeDistanceComparison,
  describeEmissionComparison,
  emissionSavingPercent,
  extraDistancePercent,
} from '@/lib/comparison'
import { formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import styles from '@/pages/ComparisonPage/SummaryCard.module.css'
import type { Route } from '@/services/schemas/route'

type SummaryCardProps = {
  emissionRoute: Route
  distanceRoute: Route
}

function difference(emissionValue: number | null, distanceValue: number | null): number | null {
  return emissionValue === null || distanceValue === null ? null : emissionValue - distanceValue
}

export default function SummaryCard({ emissionRoute, distanceRoute }: SummaryCardProps) {
  const saving = emissionSavingPercent(emissionRoute, distanceRoute)
  const extra = extraDistancePercent(emissionRoute, distanceRoute)
  const emissionGap = difference(emissionRoute.totalEmissionKg, distanceRoute.totalEmissionKg)
  const distanceGap = difference(
    emissionRoute.totalDistanceMeters,
    distanceRoute.totalDistanceMeters,
  )
  const lessEmission = saving === null || saving >= 0
  const moreDistance = extra === null || extra >= 0

  return (
    <Card>
      <div className={styles.summary}>
        <p className={styles.lead}>
          {describeEmissionComparison(saving)} {describeDistanceComparison(extra)}
        </p>
        <dl className={styles.kpis}>
          <div className={styles.kpi}>
            <dt>{lessEmission ? 'Redução de CO₂' : 'Aumento de CO₂'}</dt>
            <dd className={styles.value}>
              {formatSignedPercent(saving === null ? null : -saving)}
            </dd>
            <dd className={styles.detail}>
              {emissionGap === null ? '—' : `${formatNumber(Math.abs(emissionGap))} kg CO₂`}
            </dd>
          </div>
          <div className={styles.kpi}>
            <dt>{moreDistance ? 'Distância adicional' : 'Distância a menos'}</dt>
            <dd className={styles.value}>{formatSignedPercent(extra)}</dd>
            <dd className={styles.detail}>
              {distanceGap === null ? '—' : `${formatKilometers(Math.abs(distanceGap))} km`}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}
