import { request } from '@/services/http'
import { executionListSchema, executionSchema } from '@/services/schemas/execution'
import type { Execution, ExecutionStatus } from '@/services/schemas/execution'

export function createExecution(input: {
  operationId: number
  scheduledAt?: string
}): Promise<Execution> {
  return request('/api/executions', executionSchema, { method: 'POST', body: input })
}

export function listExecutions(status: ExecutionStatus, signal?: AbortSignal): Promise<Execution[]> {
  return request(`/api/executions?status=${status}`, executionListSchema, { signal })
}

export function getExecution(id: number, signal?: AbortSignal): Promise<Execution> {
  return request(`/api/executions/${id}`, executionSchema, { signal })
}

export function startExecution(id: number): Promise<Execution> {
  return request(`/api/executions/${id}/start`, executionSchema, { method: 'POST' })
}

export function rescheduleExecution(id: number, scheduledAt: string): Promise<Execution> {
  return request(`/api/executions/${id}/reschedule`, executionSchema, {
    method: 'POST',
    body: { scheduledAt },
  })
}

export function finishExecution(id: number): Promise<Execution> {
  return request(`/api/executions/${id}/finish`, executionSchema, { method: 'POST' })
}

export function cancelExecution(id: number, reason: string): Promise<Execution> {
  return request(`/api/executions/${id}/cancel`, executionSchema, {
    method: 'POST',
    body: { reason },
  })
}
