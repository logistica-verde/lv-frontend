import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Modal from '@/components/Modal/Modal'
import Pagination from '@/components/Pagination/Pagination'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFitRows } from '@/hooks/useFitRows'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOperations } from '@/hooks/useOperations'
import { useVehicles } from '@/hooks/useVehicles'
import {
  nextSort,
  parseHistoryParams,
  toHistoryParams,
  countActiveFilters,
} from '@/lib/historyFilters'
import type { HistoryFilters as Filters, HistoryState } from '@/lib/historyFilters'
import HistoryFilters from '@/pages/HistoryPage/HistoryFilters'
import HistoryList from '@/pages/HistoryPage/HistoryList'
import styles from '@/pages/HistoryPage/HistoryPage.module.css'
import HistoryTable from '@/pages/HistoryPage/HistoryTable'
import { describeError } from '@/services/errors'
import type { OperationSortField } from '@/services/schemas/operation'

const DESKTOP_QUERY = '(min-width: 64rem)'
const TABLE_ROW_PX = 36
const TABLE_HEADER_PX = 40
const LIST_ROW_PX = 76
const FALLBACK_ROWS = 8

function pluralize(count: number): string {
  return count === 1 ? '1 operação' : `${count} operações`
}

export default function HistoryPage() {
  useDocumentTitle('Histórico de operações')
  const [params, setParams] = useSearchParams()
  const state = parseHistoryParams(params)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { ref, rows, ready } = useFitRows(
    isDesktop ? TABLE_ROW_PX : LIST_ROW_PX,
    FALLBACK_ROWS,
    isDesktop ? TABLE_HEADER_PX : 0,
  )
  const vehicles = useVehicles()
  const operations = useOperations(
    {
      from: state.from || undefined,
      to: state.to || undefined,
      vehicleId: state.vehicleId ?? undefined,
      criterion: state.criterion ?? undefined,
      integrity: state.integrity ?? undefined,
      sort: state.sort,
      direction: state.direction,
      page: state.page,
      size: rows,
    },
    ready,
  )

  const update = (next: HistoryState) => setParams(toHistoryParams(next), { replace: true })
  const changeFilters = (patch: Partial<Filters>) => update({ ...state, ...patch, page: 1 })
  const clearFilters = () =>
    update({
      ...state,
      from: '',
      to: '',
      vehicleId: null,
      criterion: null,
      integrity: null,
      page: 1,
    })

  const data = operations.data
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const activeFilters = countActiveFilters(state)

  const outOfRange = data !== undefined && data.items.length === 0 && data.total > 0
  useEffect(() => {
    if (outOfRange && state.page > pageCount) {
      setParams(toHistoryParams({ ...state, page: pageCount }), { replace: true })
    }
  }, [outOfRange, pageCount, setParams, state])

  const filters = (
    <HistoryFilters
      filters={state}
      vehicles={vehicles.data ?? []}
      onChange={changeFilters}
      onClear={clearFilters}
    />
  )

  const isEmpty = data !== undefined && data.total === 0
  const content = (() => {
    if (operations.isError) {
      return (
        <ErrorMessage
          message={describeError(operations.error)}
          onRetry={() => operations.refetch()}
        />
      )
    }
    if (data === undefined) {
      return (
        <div role="status" className={styles.loading}>
          <VisuallyHidden>Carregando operações</VisuallyHidden>
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
          <Skeleton height="1.5rem" />
        </div>
      )
    }
    if (isEmpty && activeFilters > 0) {
      return (
        <EmptyState
          title="Nenhuma operação com esses filtros"
          description="Ajuste ou limpe os filtros para ver outras operações."
          action={<Button onClick={clearFilters}>Limpar filtros</Button>}
        />
      )
    }
    if (isEmpty) {
      return (
        <EmptyState
          title="Nenhuma operação ainda"
          description="Calcule sua primeira rota."
          action={<Link to="/">Calcular rotas</Link>}
        />
      )
    }
    return isDesktop ? (
      <HistoryTable
        items={data.items}
        sort={state.sort}
        direction={state.direction}
        onSort={(field: OperationSortField) =>
          update({ ...state, ...nextSort(state, field), page: 1 })
        }
      />
    ) : (
      <HistoryList items={data.items} />
    )
  })()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>Histórico de operações</h1>
        {data && <span className={styles.total}>{pluralize(data.total)}</span>}
        {!isDesktop && (
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            {activeFilters > 0 ? `Filtros (${activeFilters})` : 'Filtros'}
          </Button>
        )}
      </div>
      {isDesktop && <Card>{filters}</Card>}
      <Card fill>
        <div ref={ref} className={styles.viewport} aria-busy={operations.isFetching}>
          {content}
        </div>
        <Pagination
          page={Math.min(state.page, pageCount)}
          pageCount={pageCount}
          onPageChange={(page) => update({ ...state, page })}
          label="Paginação do histórico"
        />
      </Card>
      <Modal open={filtersOpen} title="Filtros" onClose={() => setFiltersOpen(false)}>
        {filters}
        <div className={styles.modalActions}>
          <Button onClick={() => setFiltersOpen(false)}>Concluir</Button>
        </div>
      </Modal>
    </div>
  )
}
