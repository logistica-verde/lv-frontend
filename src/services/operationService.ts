import { request } from '@/services/http'
import { operationPageSchema } from '@/services/schemas/operation'
import type { OperationPage, OperationSortField, SortDirection } from '@/services/schemas/operation'
import type { IntegrityStatus } from '@/services/schemas/integrity'
import type { OptimizationCriterion } from '@/services/schemas/route'

export type OperationQuery = {
  from?: string
  to?: string
  vehicleId?: number
  criterion?: OptimizationCriterion
  integrity?: IntegrityStatus
  sort: OperationSortField
  direction: SortDirection
  page: number
  size: number
}

export function listOperations(
  query: OperationQuery,
  signal?: AbortSignal,
): Promise<OperationPage> {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.vehicleId !== undefined) params.set('vehicleId', String(query.vehicleId))
  if (query.criterion) params.set('criterion', query.criterion)
  if (query.integrity) params.set('integrity', query.integrity)
  params.set('sort', query.sort)
  params.set('direction', query.direction)
  params.set('page', String(query.page))
  params.set('size', String(query.size))
  return request(`/api/routes?${params.toString()}`, operationPageSchema, { signal })
}
