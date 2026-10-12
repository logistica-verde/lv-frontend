import { Link } from 'react-router'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import Table, { SortableTh, Td, Th } from '@/components/Table/Table'
import { formatShortDateTime } from '@/lib/format'
import styles from '@/pages/HistoryPage/HistoryTable.module.css'
import {
  CRITERION_LABELS,
  formatOperationDistance,
  formatOperationEmission,
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
  onSort: (field: OperationSortField) => void
}

export default function HistoryTable({ items, sort, direction, onSort }: HistoryTableProps) {
  const directionOf = (field: OperationSortField) => (sort === field ? direction : null)

  return (
    <Table dense caption="Operações calculadas">
      <thead>
        <tr>
          <Th numeric>ID</Th>
          <SortableTh direction={directionOf('createdAt')} onSort={() => onSort('createdAt')}>
            Data
          </SortableTh>
          <Th>Veículo</Th>
          <Th>Critério</Th>
          <SortableTh
            numeric
            direction={directionOf('totalEmissionKg')}
            onSort={() => onSort('totalEmissionKg')}
          >
            Emissão (kg CO₂)
          </SortableTh>
          <SortableTh
            numeric
            direction={directionOf('totalDistanceMeters')}
            onSort={() => onSort('totalDistanceMeters')}
          >
            Distância (km)
          </SortableTh>
          <Th>Integridade</Th>
          <Th>
            <span className={styles.hidden}>Verificação</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const status = item.status === 'COMPLETED' ? null : OPERATION_STATUS[item.status]
          return (
            <tr key={item.id} className={styles.row}>
              <Td numeric>{item.id}</Td>
              <Td>{formatShortDateTime(item.createdAt)}</Td>
              <Td>{item.vehiclePlate}</Td>
              <Td>
                {CRITERION_LABELS[item.criterion]}{' '}
                {status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              </Td>
              <Td numeric>{formatOperationEmission(item)}</Td>
              <Td numeric>{formatOperationDistance(item)}</Td>
              <Td>
                <IntegrityBadge status={item.integrityStatus} />
              </Td>
              <Td>
                <Link to={`/verificacao/${item.id}`} aria-label={`Verificar operação ${item.id}`}>
                  Verificar
                </Link>
              </Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
