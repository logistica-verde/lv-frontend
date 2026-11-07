import { Download, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Mascot from '@/components/Mascot/Mascot'
import Modal from '@/components/Modal/Modal'
import Pagination from '@/components/Pagination/Pagination'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFitRows } from '@/hooks/useFitRows'
import { useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery'
import { useOperations } from '@/hooks/useOperations'
import { useSession } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { useVehicles } from '@/hooks/useVehicles'
import { downloadCsv } from '@/lib/exportCsv'
import {
  nextSort,
  parseHistoryParams,
  toHistoryParams,
  countActiveFilters,
} from '@/lib/historyFilters'
import type { HistoryFilters as Filters, HistoryState } from '@/lib/historyFilters'
import { ACCESS, canAccess } from '@/lib/permissions'
import { fetchAllOperations, operationsCsv } from '@/pages/HistoryPage/exportOperations'
import HistoryFilters from '@/pages/HistoryPage/HistoryFilters'
import HistoryList from '@/pages/HistoryPage/HistoryList'
import styles from '@/pages/HistoryPage/HistoryPage.module.css'
import HistoryTable from '@/pages/HistoryPage/HistoryTable'
import { describeError, failureMessage } from '@/services/errors'
import type { OperationSortField } from '@/services/schemas/operation'
import { VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'

const TABLE_QUERY = '(min-width: 75rem)'
const TABLE_ROW_PX = 48
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
  const isDesktop = useIsDesktop()
  const fitsTable = useMediaQuery(TABLE_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { ref, rows, ready } = useFitRows(
    fitsTable ? TABLE_ROW_PX : LIST_ROW_PX,
    FALLBACK_ROWS,
    fitsTable ? TABLE_HEADER_PX : 0,
  )
  const vehicles = useVehicles()
  const session = useSession()
  const { notify } = useToast()
  const [exporting, setExporting] = useState(false)
  const canOpen = session !== null && canAccess(session.usuario.perfil, ACCESS.verification)
  const vehicleTypes = useMemo(
    () =>
      Object.fromEntries(
        (vehicles.data ?? []).map((vehicle) => [vehicle.id, VEHICLE_IMAGE_LABELS[vehicle.imagem]]),
      ),
    [vehicles.data],
  )
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

  const exportCsv = async () => {
    setExporting(true)
    try {
      const items = await fetchAllOperations({
        from: state.from || undefined,
        to: state.to || undefined,
        vehicleId: state.vehicleId ?? undefined,
        criterion: state.criterion ?? undefined,
        integrity: state.integrity ?? undefined,
        sort: state.sort,
        direction: state.direction,
      })
      downloadCsv('lastro-historico.csv', operationsCsv(items))
      notify(`${pluralize(items.length)} exportadas.`, 'success')
    } catch (error) {
      notify(failureMessage(error), 'danger')
    } finally {
      setExporting(false)
    }
  }

  const data = operations.data
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const activeFilters = countActiveFilters(state)

  const outOfRange = data !== undefined && data.items.length === 0 && data.total > 0
  useEffect(() => {
    if (outOfRange && state.page > pageCount) {
      setParams(toHistoryParams({ ...state, page: pageCount }), { replace: true })
    }
  }, [outOfRange, pageCount, setParams, state])

  const firstShown = data && data.items.length > 0 ? (data.page - 1) * data.size + 1 : 0
  const range =
    data && data.total > 0 ? (
      <span className={styles.range}>
        Mostrando {firstShown}–{firstShown + data.items.length - 1} de {pluralize(data.total)}
      </span>
    ) : undefined

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
          mascot={<Mascot size={96} />}
          title="Nenhuma operação ainda"
          description="Calcule sua primeira rota."
          action={<Link to="/">Calcular rotas</Link>}
        />
      )
    }
    return fitsTable ? (
      <HistoryTable
        items={data.items}
        sort={state.sort}
        direction={state.direction}
        vehicleTypes={vehicleTypes}
        canOpen={canOpen}
        onSort={(field: OperationSortField) =>
          update({ ...state, ...nextSort(state, field), page: 1 })
        }
      />
    ) : (
      <HistoryList items={data.items} canOpen={canOpen} />
    )
  })()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div className={styles.titles}>
          <h1>Histórico de operações</h1>
          <p className={styles.subtitle}>
            Cada cálculo gera duas operações, uma por critério, registradas na blockchain.
          </p>
        </div>
        <Button variant="secondary" loading={exporting} onClick={exportCsv}>
          <Download size={16} aria-hidden="true" />
          Exportar CSV
        </Button>
        {!isDesktop && (
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            {activeFilters > 0 ? `Filtros (${activeFilters})` : 'Filtros'}
          </Button>
        )}
      </div>
      {isDesktop && <Card>{filters}</Card>}
      <Card title="Operações" actions={range} fill>
        <div ref={ref} className={styles.viewport} aria-busy={operations.isFetching}>
          {content}
        </div>
        <Pagination
          page={Math.min(state.page, pageCount)}
          pageCount={pageCount}
          onPageChange={(page) => update({ ...state, page })}
          label="Paginação do histórico"
          numbered={isDesktop}
          summary={
            pageCount > 1 && data
              ? `Página ${Math.min(state.page, pageCount)} de ${pageCount} · ${data.size} por página`
              : undefined
          }
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
