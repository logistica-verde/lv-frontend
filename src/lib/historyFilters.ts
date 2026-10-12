import { integrityStatusSchema } from '@/services/schemas/integrity'
import { operationSortFieldSchema, sortDirectionSchema } from '@/services/schemas/operation'
import type { IntegrityStatus } from '@/services/schemas/integrity'
import type { OperationSortField, SortDirection } from '@/services/schemas/operation'
import { optimizationCriterionSchema } from '@/services/schemas/route'
import type { OptimizationCriterion } from '@/services/schemas/route'

export type HistoryFilters = {
  from: string
  to: string
  vehicleId: number | null
  criterion: OptimizationCriterion | null
  integrity: IntegrityStatus | null
}

export type HistoryState = HistoryFilters & {
  sort: OperationSortField
  direction: SortDirection
  page: number
}

export const DEFAULT_HISTORY_STATE: HistoryState = {
  from: '',
  to: '',
  vehicleId: null,
  criterion: null,
  integrity: null,
  sort: 'createdAt',
  direction: 'desc',
  page: 1,
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function readDate(value: string | null): string {
  return value !== null && DATE_PATTERN.test(value) ? value : ''
}

function readPositiveInteger(value: string | null): number | null {
  const parsed = Number(value)
  return value !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function parseHistoryParams(params: URLSearchParams): HistoryState {
  const criterion = optimizationCriterionSchema.safeParse(params.get('criterio'))
  const integrity = integrityStatusSchema.safeParse(params.get('integridade'))
  const sort = operationSortFieldSchema.safeParse(params.get('ordem'))
  const direction = sortDirectionSchema.safeParse(params.get('direcao'))

  return {
    from: readDate(params.get('de')),
    to: readDate(params.get('ate')),
    vehicleId: readPositiveInteger(params.get('veiculo')),
    criterion: criterion.success ? criterion.data : null,
    integrity: integrity.success ? integrity.data : null,
    sort: sort.success ? sort.data : DEFAULT_HISTORY_STATE.sort,
    direction: direction.success ? direction.data : DEFAULT_HISTORY_STATE.direction,
    page: readPositiveInteger(params.get('pagina')) ?? 1,
  }
}

export function toHistoryParams(state: HistoryState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.from) params.set('de', state.from)
  if (state.to) params.set('ate', state.to)
  if (state.vehicleId !== null) params.set('veiculo', String(state.vehicleId))
  if (state.criterion) params.set('criterio', state.criterion)
  if (state.integrity) params.set('integridade', state.integrity)
  if (state.sort !== DEFAULT_HISTORY_STATE.sort) params.set('ordem', state.sort)
  if (state.direction !== DEFAULT_HISTORY_STATE.direction) params.set('direcao', state.direction)
  if (state.page > 1) params.set('pagina', String(state.page))
  return params
}

export function countActiveFilters(state: HistoryFilters): number {
  return [
    state.from !== '',
    state.to !== '',
    state.vehicleId !== null,
    state.criterion !== null,
    state.integrity !== null,
  ].filter(Boolean).length
}

export function isDateRangeInverted(state: HistoryFilters): boolean {
  return state.from !== '' && state.to !== '' && state.from > state.to
}

export function nextSort(
  current: Pick<HistoryState, 'sort' | 'direction'>,
  field: OperationSortField,
): Pick<HistoryState, 'sort' | 'direction'> {
  if (current.sort !== field) {
    return { sort: field, direction: field === 'createdAt' ? 'desc' : 'asc' }
  }
  return { sort: field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}
