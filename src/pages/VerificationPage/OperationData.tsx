import { useState } from 'react'
import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Pagination from '@/components/Pagination/Pagination'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import Skeleton from '@/components/Skeleton/Skeleton'
import Table, { Td, Th } from '@/components/Table/Table'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery'
import { useRoute } from '@/hooks/useRoutes'
import { formatDateTime, formatNumber } from '@/lib/format'
import styles from '@/pages/VerificationPage/OperationData.module.css'
import { describeError } from '@/services/errors'

type OperationDataProps = {
  routeId: number
}

type Listing = 'points' | 'segments'

const OPTIONS: { value: Listing; label: string }[] = [
  { value: 'points', label: 'Paradas' },
  { value: 'segments', label: 'Trechos' },
]

const CRITERIA = { EMISSION: 'Menor emissão', DISTANCE: 'Menor distância' }
const DESKTOP_PAGE_SIZE = 6
const COMPACT_PAGE_SIZE = 3
const TALL_QUERY = '(min-height: 42rem)'
const MISSING = '—'

export default function OperationData({ routeId }: OperationDataProps) {
  const route = useRoute(routeId)
  const [listing, setListing] = useState<Listing>('points')
  const [page, setPage] = useState(1)
  const isDesktop = useIsDesktop()
  const isTall = useMediaQuery(TALL_QUERY)
  const pageSize = isDesktop && isTall ? DESKTOP_PAGE_SIZE : COMPACT_PAGE_SIZE

  const changeListing = (next: Listing) => {
    setListing(next)
    setPage(1)
  }

  if (route.isPending) {
    return (
      <Card title="Dados da operação">
        <div role="status">
          <VisuallyHidden>Carregando dados da operação</VisuallyHidden>
          <Skeleton height="12rem" />
        </div>
      </Card>
    )
  }

  if (route.isError) {
    return (
      <Card title="Dados da operação">
        <ErrorMessage message={describeError(route.error)} onRetry={() => route.refetch()} />
      </Card>
    )
  }

  const operation = route.data
  const points = [...operation.points].sort((first, second) => first.visitOrder - second.visitOrder)
  const rows = listing === 'points' ? points : operation.segments
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const firstIndex = (page - 1) * pageSize

  return (
    <Card title="Dados da operação">
      <p className={styles.help}>
        Campos usados no cálculo do hash (JSON canônico, SHA-256). Qualquer alteração em um deles
        muda o hash.
      </p>
      <dl className={styles.fields}>
        <div>
          <dt>Operação</dt>
          <dd>{operation.id}</dd>
        </div>
        <div>
          <dt>Veículo (ID)</dt>
          <dd>{operation.vehicleId}</dd>
        </div>
        <div>
          <dt>Critério</dt>
          <dd>{CRITERIA[operation.criterion]}</dd>
        </div>
        <div>
          <dt>Criada em</dt>
          <dd>{formatDateTime(operation.createdAt)}</dd>
        </div>
        <div>
          <dt>Emissão total (kg CO₂)</dt>
          <dd>
            {operation.totalEmissionKg === null ? MISSING : formatNumber(operation.totalEmissionKg)}
          </dd>
        </div>
      </dl>
      <div className={styles.switch}>
        <SegmentedControl
          legend="Lista exibida"
          options={OPTIONS}
          value={listing}
          onChange={changeListing}
        />
      </div>
      <div className={styles.table}>
        {listing === 'points' ? (
          <Table dense caption="Paradas da operação">
            <thead>
              <tr>
                <Th numeric>Ordem</Th>
                <Th numeric>ID do ponto</Th>
                <Th>Nome</Th>
              </tr>
            </thead>
            <tbody>
              {points.slice(firstIndex, firstIndex + pageSize).map((point) => (
                <tr key={point.pointId}>
                  <Td numeric>{point.visitOrder}</Td>
                  <Td numeric>{point.pointId}</Td>
                  <Td>{point.name}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table dense caption="Trechos da operação">
            <thead>
              <tr>
                <Th numeric>Ordem</Th>
                <Th numeric>De → para (IDs)</Th>
                <Th numeric>Distância (m)</Th>
                <Th numeric>Veloc. (km/h)</Th>
                <Th numeric>Decl. (%)</Th>
                <Th numeric>Emissão (kg CO₂)</Th>
              </tr>
            </thead>
            <tbody>
              {operation.segments.slice(firstIndex, firstIndex + pageSize).map((segment, index) => (
                <tr key={`${segment.fromPointId}-${segment.toPointId}`}>
                  <Td numeric>{firstIndex + index + 1}</Td>
                  <Td numeric>
                    {segment.fromPointId} → {segment.toPointId}
                  </Td>
                  <Td numeric>{formatNumber(segment.distanceMeters)}</Td>
                  <Td numeric>{formatNumber(segment.averageSpeedKmh)}</Td>
                  <Td numeric>{formatNumber(segment.slopePercent)}</Td>
                  <Td numeric>{formatNumber(segment.emissionKg)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        label="Paginação dos dados da operação"
      />
    </Card>
  )
}
