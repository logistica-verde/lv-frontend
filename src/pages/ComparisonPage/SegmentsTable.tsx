import { useState } from 'react'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import Pagination from '@/components/Pagination/Pagination'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import Table, { Td, Th } from '@/components/Table/Table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatKilometers, formatNumber } from '@/lib/format'
import SegmentList from '@/pages/ComparisonPage/SegmentList'
import styles from '@/pages/ComparisonPage/SegmentsTable.module.css'
import type { Route } from '@/services/schemas/route'

type SegmentsTableProps = {
  emissionRoute: Route
  distanceRoute: Route
}

type Criterion = 'emission' | 'distance'

const OPTIONS: { value: Criterion; label: string }[] = [
  { value: 'emission', label: 'Menor emissão' },
  { value: 'distance', label: 'Menor distância' },
]

const DESKTOP_PAGE_SIZE = 7
const COMPACT_PAGE_SIZE = 4
const SHORT_PAGE_SIZE = 2
const WIDE_QUERY = '(min-width: 75rem)'
const TALL_QUERY = '(min-height: 42rem)'
const MISSING = '—'

export default function SegmentsTable({ emissionRoute, distanceRoute }: SegmentsTableProps) {
  const [criterion, setCriterion] = useState<Criterion>('emission')
  const [page, setPage] = useState(1)
  const isWide = useMediaQuery(WIDE_QUERY)
  const isTall = useMediaQuery(TALL_QUERY)
  const pageSize = isTall ? (isWide ? DESKTOP_PAGE_SIZE : COMPACT_PAGE_SIZE) : SHORT_PAGE_SIZE
  const route = criterion === 'emission' ? emissionRoute : distanceRoute
  const names = new Map(route.points.map((point) => [point.pointId, point.name]))
  const nameOf = (pointId: number) => names.get(pointId) ?? `Ponto ${pointId}`

  const pageCount = Math.max(1, Math.ceil(route.segments.length / pageSize))
  const firstIndex = (page - 1) * pageSize
  const visible = route.segments.slice(firstIndex, firstIndex + pageSize)

  const changeCriterion = (next: Criterion) => {
    setCriterion(next)
    setPage(1)
  }

  return (
    <Card
      title="Trechos"
      fill
      actions={
        <SegmentedControl
          legend="Rota exibida na tabela de trechos"
          options={OPTIONS}
          value={criterion}
          onChange={changeCriterion}
        />
      }
    >
      {route.segments.length === 0 ? (
        <EmptyState
          title="Sem trechos detalhados"
          description="A API não devolveu os trechos desta rota."
        />
      ) : (
        <>
          <p className={styles.totals}>
            Total da rota:{' '}
            {route.totalDistanceMeters === null
              ? MISSING
              : `${formatKilometers(route.totalDistanceMeters)} km`}{' '}
            ·{' '}
            {route.totalEmissionKg === null
              ? MISSING
              : `${formatNumber(route.totalEmissionKg)} kg CO₂`}
          </p>
          <div className={styles.table}>
            {isWide ? (
              <Table dense caption="Trechos da rota selecionada">
                <thead>
                  <tr>
                    <Th numeric>Nº</Th>
                    <Th>Trecho</Th>
                    <Th numeric>Distância (km)</Th>
                    <Th numeric>Velocidade média (km/h)</Th>
                    <Th numeric>Declividade (%)</Th>
                    <Th numeric>Emissão (kg CO₂)</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((segment, index) => (
                    <tr key={`${segment.fromPointId}-${segment.toPointId}`}>
                      <Td numeric>{firstIndex + index + 1}</Td>
                      <Td>
                        {nameOf(segment.fromPointId)} → {nameOf(segment.toPointId)}
                      </Td>
                      <Td numeric>{formatKilometers(segment.distanceMeters)}</Td>
                      <Td numeric>{formatNumber(segment.averageSpeedKmh)}</Td>
                      <Td numeric>{formatNumber(segment.slopePercent)}</Td>
                      <Td numeric>{formatNumber(segment.emissionKg)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <SegmentList segments={visible} firstIndex={firstIndex} nameOf={nameOf} />
            )}
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            label="Paginação dos trechos"
          />
        </>
      )}
    </Card>
  )
}
