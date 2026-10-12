import { formatKilometers, formatNumber } from '@/lib/format'
import styles from '@/pages/ComparisonPage/SegmentList.module.css'
import type { RouteSegment } from '@/services/schemas/route'

type SegmentListProps = {
  segments: RouteSegment[]
  firstIndex: number
  nameOf: (pointId: number) => string
}

export default function SegmentList({ segments, firstIndex, nameOf }: SegmentListProps) {
  return (
    <ol aria-label="Trechos da rota selecionada" className={styles.list} start={firstIndex + 1}>
      {segments.map((segment, index) => (
        <li key={`${segment.fromPointId}-${segment.toPointId}`} className={styles.item}>
          <p className={styles.name}>
            <span className={styles.index}>{firstIndex + index + 1}</span>
            {nameOf(segment.fromPointId)} → {nameOf(segment.toPointId)}
          </p>
          <dl className={styles.stats}>
            <div>
              <dt>Distância</dt>
              <dd>{formatKilometers(segment.distanceMeters)} km</dd>
            </div>
            <div>
              <dt>Velocidade</dt>
              <dd>{formatNumber(segment.averageSpeedKmh)} km/h</dd>
            </div>
            <div>
              <dt>Declividade</dt>
              <dd>{formatNumber(segment.slopePercent)}%</dd>
            </div>
            <div>
              <dt>Emissão</dt>
              <dd>{formatNumber(segment.emissionKg)} kg CO₂</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  )
}
