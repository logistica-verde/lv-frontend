import { Link } from 'react-router'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { formatShortDateTime } from '@/lib/format'
import styles from '@/pages/HistoryPage/HistoryList.module.css'
import {
  CRITERION_LABELS,
  formatOperationDistance,
  formatOperationEmission,
  OPERATION_STATUS,
} from '@/pages/HistoryPage/operationFormat'
import type { OperationSummary } from '@/services/schemas/operation'

type HistoryListProps = {
  items: OperationSummary[]
}

export default function HistoryList({ items }: HistoryListProps) {
  return (
    <ol aria-label="Operações calculadas" className={styles.list}>
      {items.map((item) => {
        const status = item.status === 'COMPLETED' ? null : OPERATION_STATUS[item.status]
        return (
          <li key={item.id} className={styles.item}>
            <p className={styles.title}>
              <span>Operação {item.id}</span>
              <span className={styles.muted}>
                {formatShortDateTime(item.createdAt)} · {item.vehiclePlate}
              </span>
            </p>
            <p className={styles.line}>
              {CRITERION_LABELS[item.criterion]}
              {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              <span className={styles.muted}>
                {formatOperationEmission(item)} kg CO₂ · {formatOperationDistance(item)} km
              </span>
            </p>
            <div className={styles.footer}>
              <IntegrityBadge status={item.integrityStatus} />
              <Link to={`/verificacao/${item.id}`} aria-label={`Verificar operação ${item.id}`}>
                Verificar
              </Link>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
