import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { MockDb } from '@/mocks/db'
import { executionStatusSchema } from '@/services/schemas/execution'
import type { Execution } from '@/services/schemas/execution'

type Problem = (status: number, detail: string) => Response

const SCHEDULE_TOLERANCE_MS = 60_000

const createSchema = z.object({
  operationId: z.number(),
  scheduledAt: z.iso.datetime().optional(),
})

const rescheduleSchema = z.object({ scheduledAt: z.iso.datetime() })

const cancelSchema = z.object({ reason: z.string().trim().min(10).max(500) })

function isPast(isoTime: string): boolean {
  return Date.parse(isoTime) < Date.now() - SCHEDULE_TOLERANCE_MS
}

export function executionHandlers(db: MockDb, latencyMs: number, problem: Problem) {
  const find = (rawId: string | readonly string[] | undefined): Execution | undefined =>
    db.executions.get(Number(rawId))

  const transition = (
    rawId: string | readonly string[] | undefined,
    from: Execution['status'][],
    change: (execution: Execution) => Execution,
    conflict: string,
  ) => {
    const execution = find(rawId)
    if (!execution) {
      return problem(404, `Execution ${String(rawId)} not found`)
    }
    if (!from.includes(execution.status)) {
      return problem(409, conflict)
    }
    const changed = change(execution)
    db.executions.set(changed.id, changed)
    return HttpResponse.json(changed)
  }

  return [
    http.post('*/api/executions', async ({ request }) => {
      await delay(latencyMs)
      const parsed = createSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const { operationId, scheduledAt } = parsed.data
      const route = db.routes.get(operationId)
      if (!route) {
        return problem(404, `Operation ${operationId} not found`)
      }
      if (route.status !== 'COMPLETED') {
        return problem(400, 'Only a completed route can be executed or scheduled')
      }
      if (scheduledAt && isPast(scheduledAt)) {
        return problem(400, 'The scheduled time must not be in the past')
      }
      const now = new Date().toISOString()
      const vehicle = db.vehicles.find((candidate) => candidate.id === route.vehicleId)
      const execution: Execution = {
        id: db.nextExecutionId++,
        status: scheduledAt ? 'SCHEDULED' : 'IN_PROGRESS',
        scheduledAt: scheduledAt ?? null,
        createdAt: now,
        startedAt: scheduledAt ? null : now,
        finishedAt: null,
        operationId,
        criterion: route.criterion,
        vehicleId: route.vehicleId,
        vehiclePlate: vehicle?.placa ?? '',
        pointCount: route.points.length,
        totalEmissionKg: route.totalEmissionKg,
        totalDistanceMeters: route.totalDistanceMeters,
        cargoKg: route.cargoKg ?? null,
      }
      db.executions.set(execution.id, execution)
      return HttpResponse.json(execution, {
        status: 201,
        headers: { Location: `/api/executions/${execution.id}` },
      })
    }),

    http.get('*/api/executions', async ({ request }) => {
      await delay(latencyMs)
      const status = executionStatusSchema
        .catch('SCHEDULED')
        .parse(new URL(request.url).searchParams.get('status') ?? 'SCHEDULED')
      const items = [...db.executions.values()].filter((execution) => execution.status === status)
      items.sort((first, second) =>
        (first.scheduledAt ?? first.createdAt).localeCompare(second.scheduledAt ?? second.createdAt),
      )
      return HttpResponse.json(items)
    }),

    http.get('*/api/executions/:id', async ({ params }) => {
      await delay(latencyMs)
      const execution = find(params['id'])
      return execution ? HttpResponse.json(execution) : problem(404, 'Execution not found')
    }),

    http.post('*/api/executions/:id/start', async ({ params }) => {
      await delay(latencyMs)
      return transition(
        params['id'],
        ['SCHEDULED'],
        (execution) => ({
          ...execution,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString(),
        }),
        'Only a scheduled execution can be started',
      )
    }),

    http.post('*/api/executions/:id/reschedule', async ({ params, request }) => {
      await delay(latencyMs)
      const parsed = rescheduleSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      if (isPast(parsed.data.scheduledAt)) {
        return problem(400, 'The scheduled time must not be in the past')
      }
      return transition(
        params['id'],
        ['SCHEDULED'],
        (execution) => ({ ...execution, scheduledAt: parsed.data.scheduledAt }),
        'Only a scheduled execution can be rescheduled',
      )
    }),

    http.post('*/api/executions/:id/finish', async ({ params }) => {
      await delay(latencyMs)
      return transition(
        params['id'],
        ['IN_PROGRESS'],
        (execution) => ({
          ...execution,
          status: 'FINISHED',
          finishedAt: new Date().toISOString(),
        }),
        'Only an execution in progress can be finished',
      )
    }),

    http.post('*/api/executions/:id/cancel', async ({ params, request }) => {
      await delay(latencyMs)
      const parsed = cancelSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      return transition(
        params['id'],
        ['SCHEDULED', 'IN_PROGRESS'],
        (execution) => ({
          ...execution,
          status: 'CANCELLED',
          finishedAt: new Date().toISOString(),
          cancellationReason: parsed.data.reason,
          cancelledBy: 'mock',
        }),
        'The execution is already closed',
      )
    }),
  ]
}
