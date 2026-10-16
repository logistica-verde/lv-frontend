import { Link } from 'react-router'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import Table, { SortableTh, Td, Th } from '@/components/Table/Table'
import { formatShortDateTime } from '@/lib/format'
import { classNames } from '@/lib/classNames'
import styles from '@/pages/HistoryPage/HistoryTable.module.css'
import {
  CRITERION_LABELS,
  formatOperationDistance,
  formatOperationEmission,
  formatPointCount,
  OPERATION_STATUS,
} from '@/pages/HistoryPage/operationFormat'
import type {
  OperationSortField,
  OperationSummary,
  SortDirection,
} from '@/services/schemas/operation'

type HistoryTableProps = {
  items: OperationSummary[]
  sort: OperationSortField
  direction: SortDirection
  vehicleTypes: Record<number, string>
  canOpen: boolean
  onSort: (field: OperationSortField) => void
}

export default function HistoryTable({
  items,
  sort,
  direction,
  vehicleTypes,
  canOpen,
  onSort,
}: HistoryTableProps) {
  const directionOf = (field: OperationSortField) => (sort === field ? direction : null)

  return (
    <Table dense caption="Operações calculadas">
      <thead>
        <tr>
          <Th>Operação</Th>
          <SortableTh direction={directionOf('createdAt')} onSort={() => onSort('createdAt')}>
            Data e hora
          </SortableTh>
          <Th>Veículo</Th>
          <Th>Critério</Th>
          <Th numeric>Pontos</Th>
          <SortableTh
            numeric
            direction={directionOf('totalDistanceMeters')}
            onSort={() => onSort('totalDistanceMeters')}
          >
            Distância (km)
          </SortableTh>
          <SortableTh
            numeric
            direction={directionOf('totalEmissionKg')}
            onSort={() => onSort('totalEmissionKg')}
          >
            Emissão (kg CO₂)
          </SortableTh>
          <Th>Integridade</Th>
          <Th>
            <span className={styles.hidden}>Ações</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const status = item.status === 'COMPLETED' ? null : OPERATION_STATUS[item.status]
          const vehicleType = vehicleTypes[item.vehicleId]
          return (
            <tr key={item.id} className={styles.row}>
              <Td className={styles.mono}>#{item.id}</Td>
              <Td>{formatShortDateTime(item.createdAt)}</Td>
              <Td>
                <span className={styles.vehicle}>
                  <span className={styles.mono}>{item.vehiclePlate}</span>
                  {vehicleType && <span className={styles.muted}>{vehicleType}</span>}
                </span>
              </Td>
              <Td>
                <span className={styles.criterion}>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      styles.sample,
                      item.criterion === 'EMISSION' ? styles.emission : styles.distance,
                    )}
                  />
                  {CRITERION_LABELS[item.criterion]}
                  {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
                </span>
              </Td>
              <Td numeric>{formatPointCount(item)}</Td>
              <Td numeric>{formatOperationDistance(item)}</Td>
              <Td numeric>{formatOperationEmission(item)}</Td>
              <Td>
                <IntegrityBadge status={item.integrityStatus} />
              </Td>
              <Td numeric>
                {canOpen && (
                  <Link to={`/verificacao/${item.id}`} aria-label={`Abrir operação ${item.id}`}>
                    Abrir
                  </Link>
                )}
              </Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
