import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelExecution,
  createExecution,
  finishExecution,
  getExecution,
  listExecutions,
  rescheduleExecution,
  startExecution,
} from '@/services/executionService'
import { queryKeys } from '@/services/queryKeys'
import type { Execution, ExecutionStatus } from '@/services/schemas/execution'

const SCHEDULED_REFRESH_MS = 30_000

export function useScheduledExecutions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.executions('SCHEDULED'),
    queryFn: ({ signal }) => listExecutions('SCHEDULED', signal),
    refetchInterval: SCHEDULED_REFRESH_MS,
    enabled,
  })
}

export function useExecutionsByStatus(status: ExecutionStatus) {
  return useQuery({
    queryKey: queryKeys.executions(status),
    queryFn: ({ signal }) => listExecutions(status, signal),
  })
}

export function useExecution(id: number) {
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: ({ signal }) => getExecution(id, signal),
    enabled: id > 0,
  })
}

function useExecutionMutation<Variables>(action: (variables: Variables) => Promise<Execution>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: action,
    onSuccess: (execution) => {
      queryClient.setQueryData(queryKeys.execution(execution.id), execution)
      void queryClient.invalidateQueries({ queryKey: ['executions'] })
    },
  })
}

export function useCreateExecution() {
  return useExecutionMutation(createExecution)
}

export function useStartExecution() {
  return useExecutionMutation(startExecution)
}

export function useRescheduleExecution() {
  return useExecutionMutation(
    ({ id, scheduledAt }: { id: number; scheduledAt: string }) =>
      rescheduleExecution(id, scheduledAt),
  )
}

export function useFinishExecution() {
  return useExecutionMutation(finishExecution)
}

export function useCancelExecution() {
  return useExecutionMutation(cancelExecution)
}
