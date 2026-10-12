import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listOperations } from '@/services/operationService'
import type { OperationQuery } from '@/services/operationService'
import { queryKeys } from '@/services/queryKeys'

export function useOperations(query: OperationQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.operations(query),
    queryFn: ({ signal }) => listOperations(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}
