import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { Experiment, ExperimentRun } from '@/services/schemas/experiment'
import type { OperationPage, OperationSummary } from '@/services/schemas/operation'
import type { Route } from '@/services/schemas/route'
import type { Vehicle } from '@/services/schemas/vehicle'
import { apiUrl } from '@/test/api'
import { completedRouteFixture, deliveryPointFixture } from '@/test/fixtures'
import { server } from '@/test/server'

const postedPointSchema = z.object({
  nome: z.string(),
  endereco: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
})

const calculationSchema = z.object({
  vehicleId: z.number(),
  deliveryPointIds: z.array(z.number()),
  criterion: z.enum(['EMISSION', 'DISTANCE']),
})

export type PostedPoint = z.infer<typeof postedPointSchema>
export type CalculationRequest = z.infer<typeof calculationSchema>

export type PointsApi = {
  points: DeliveryPoint[]
  posted: PostedPoint[]
}

export function useVehiclesApi(vehicles: Vehicle[]) {
  server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json(vehicles)))
}

export function useDeliveryPointsApi(initial: DeliveryPoint[]): PointsApi {
  const api: PointsApi = { points: [...initial], posted: [] }
  server.use(
    http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json(api.points)),
    http.post(apiUrl('/api/delivery-points'), async ({ request }) => {
      const body = postedPointSchema.parse(await request.json())
      api.posted.push(body)
      const created: DeliveryPoint = {
        ...deliveryPointFixture,
        ...body,
        endereco: body.endereco ?? null,
        id: 100 + api.points.length,
      }
      api.points.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
  )
  return api
}

type RoutesOptions = {
  failing?: CalculationRequest['criterion']
  pendingPolls?: number
}

export type RoutesApi = {
  requests: CalculationRequest[]
}

const pendingRoute: Route = {
  ...completedRouteFixture,
  status: 'PENDING',
  totalEmissionKg: null,
  totalDistanceMeters: null,
  points: [],
  segments: [],
}

export function useRoutesApi(options: RoutesOptions = {}): RoutesApi {
  const api: RoutesApi = { requests: [] }
  const polls = new Map<number, number>()
  const criteria = new Map<number, CalculationRequest['criterion']>()
  const pendingPolls = options.pendingPolls ?? 2

  server.use(
    http.post(apiUrl('/api/routes/calculate'), async ({ request }) => {
      const body = calculationSchema.parse(await request.json())
      api.requests.push(body)
      const id = 500 + api.requests.length
      criteria.set(id, body.criterion)
      return HttpResponse.json({ id, status: 'PENDING' }, { status: 202 })
    }),
    http.get(apiUrl('/api/routes/:id'), ({ params }) => {
      const id = Number(params.id)
      const criterion = criteria.get(id) ?? (id % 2 === 1 ? 'EMISSION' : 'DISTANCE')
      const count = (polls.get(id) ?? 0) + 1
      polls.set(id, count)
      if (count <= pendingPolls) {
        return HttpResponse.json({ ...pendingRoute, id, criterion })
      }
      if (options.failing === criterion) {
        return HttpResponse.json({
          ...pendingRoute,
          id,
          criterion,
          status: 'FAILED',
          errorMessage: 'Otimizador indisponível',
        })
      }
      return HttpResponse.json({ ...completedRouteFixture, id, criterion })
    }),
  )
  return api
}

export const operationFixture: OperationSummary = {
  id: 7,
  createdAt: '2026-10-05T12:00:00.000Z',
  vehicleId: 1,
  vehiclePlate: 'ABC1D23',
  criterion: 'EMISSION',
  status: 'COMPLETED',
  totalEmissionKg: 5.5,
  totalDistanceMeters: 2022.5,
  integrityStatus: 'VALID',
}

export function useOperationsApi(respond: (params: URLSearchParams) => OperationPage) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(apiUrl('/api/routes'), ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      return HttpResponse.json(respond(params))
    }),
  )
  return requests
}

export function pageOf(items: OperationSummary[], total = items.length, page = 1): OperationPage {
  return { items, total, page, size: items.length || 10 }
}

function curve(start: number, final: number): number[] {
  return Array.from({ length: 6 }, (_, index) => start - ((start - final) * index) / 5)
}

export function experimentRun(
  instanceSize: number,
  seed: number,
  overrides: Partial<ExperimentRun> = {},
): ExperimentRun {
  return {
    instanceSize,
    seed,
    distance: {
      emissionKg: 100,
      distanceMeters: 20000,
      executionMs: 1000,
      convergence: curve(26000, 20000),
    },
    emission: {
      emissionKg: 90,
      distanceMeters: 20800,
      executionMs: 1200,
      convergence: curve(120, 90),
    },
    ...overrides,
  }
}

export const experimentFixture: Experiment = {
  id: 1,
  status: 'COMPLETED',
  createdAt: '2026-10-05T12:00:00.000Z',
  instances: [10, 20],
  seeds: [1, 2],
  progress: { completed: 4, total: 4 },
  runs: [experimentRun(10, 1), experimentRun(10, 2), experimentRun(20, 1), experimentRun(20, 2)],
  errorMessage: null,
}

export function useExperimentApi(respond: () => Experiment | null) {
  let calls = 0
  server.use(
    http.get(apiUrl('/api/experiments/latest'), () => {
      calls += 1
      const experiment = respond()
      return experiment
        ? HttpResponse.json(experiment)
        : HttpResponse.json({ status: 404, detail: 'none' }, { status: 404 })
    }),
  )
  return () => calls
}
