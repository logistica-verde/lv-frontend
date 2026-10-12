import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { MockDb } from '@/mocks/db'
import { seedAddresses } from '@/mocks/addresses'
import { generateRun } from '@/mocks/experiments'
import { fakeHash } from '@/mocks/fakeHash'
import { optimizeFake } from '@/mocks/fakeOptimizer'
import type { FakePoint } from '@/mocks/fakeOptimizer'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { IntegrityReport } from '@/services/schemas/integrity'
import type { OptimizationCriterion, Route } from '@/services/schemas/route'
import { gaSettingsSchema } from '@/services/schemas/gaSettings'
import { userUpdateSchema } from '@/services/schemas/user'
import type { Vehicle } from '@/services/schemas/vehicle'

export type MockOptions = {
  latencyMs: number
  completionDelayMs: number
  anchoringDelayMs: number
  experimentRunDelayMs?: number
}

const vehicleRequestSchema = z.object({
  placa: z.string().trim().min(1),
  massaKg: z.number().positive(),
  tipoCombustivel: z.string().trim().min(1),
})

const vehicleStatusRequestSchema = z.object({ ativo: z.boolean() })

const deliveryPointRequestSchema = z.object({
  nome: z.string().trim().min(1),
  endereco: z.string().nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

const routeRequestSchema = z.object({
  vehicleId: z.number(),
  deliveryPointIds: z.array(z.number()).min(2).max(30),
  criterion: z.enum(['EMISSION', 'DISTANCE']),
})

const experimentRequestSchema = z.object({
  instances: z.array(z.number().int().positive()).min(1).max(10),
  seeds: z.array(z.number().int().positive()).min(1).max(10),
})

const DEFAULT_EXPERIMENT_RUN_DELAY_MS = 400

const listQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  vehicleId: z.coerce.number().int().positive().optional(),
  criterion: z.enum(['EMISSION', 'DISTANCE']).optional(),
  integrity: z.enum(['VALID', 'TAMPERED', 'NOT_ANCHORED']).optional(),
  sort: z.enum(['createdAt', 'totalEmissionKg', 'totalDistanceMeters']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(200).default(10),
})

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
}

function problem(status: number, detail: string) {
  return HttpResponse.json(
    { type: 'about:blank', title: STATUS_TITLES[status], status, detail },
    { status },
  )
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function toFakePoint(point: DeliveryPoint): FakePoint {
  return { id: point.id, name: point.nome, latitude: point.latitude, longitude: point.longitude }
}

function createPendingRoute(
  db: MockDb,
  vehicle: Vehicle,
  criterion: OptimizationCriterion,
  points: DeliveryPoint[],
): Route {
  const route: Route = {
    id: db.nextRouteId++,
    vehicleId: vehicle.id,
    criterion,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    totalEmissionKg: null,
    totalDistanceMeters: null,
    errorMessage: null,
    points: points.map((point, index) => ({
      pointId: point.id,
      name: point.nome,
      latitude: point.latitude,
      longitude: point.longitude,
      visitOrder: index + 1,
    })),
    segments: [],
  }
  db.routes.set(route.id, route)
  return route
}

function completeRoute(
  db: MockDb,
  routeId: number,
  points: DeliveryPoint[],
  criterion: OptimizationCriterion,
  options: MockOptions,
): void {
  const current = db.routes.get(routeId)
  if (!current) {
    return
  }
  const result = optimizeFake(points.map(toFakePoint), criterion)
  db.routes.set(routeId, {
    ...current,
    status: 'COMPLETED',
    totalEmissionKg: result.totalEmissionKg,
    totalDistanceMeters: result.totalDistanceMeters,
    points: result.orderedPoints.map((point, index) => ({
      pointId: point.id,
      name: point.name,
      latitude: point.latitude,
      longitude: point.longitude,
      visitOrder: index + 1,
    })),
    segments: result.legs,
  })
  setTimeout(() => {
    db.anchors.set(routeId, { blockNumber: db.nextBlock++, anchoredAt: new Date().toISOString() })
  }, options.anchoringDelayMs)
}

function integrityReportOf(db: MockDb, routeId: number): IntegrityReport {
  const databaseHash = fakeHash(routeId)
  const anchor = db.anchors.get(routeId)
  if (anchor && db.tampered.has(routeId)) {
    return {
      operationId: routeId,
      status: 'TAMPERED',
      databaseHash,
      ledgerHash: fakeHash(routeId + 5000),
      txHash: `0x${fakeHash(routeId + 1000)}`,
      blockNumber: anchor.blockNumber,
      anchoredAt: anchor.anchoredAt,
    }
  }
  if (!anchor) {
    return {
      operationId: routeId,
      status: 'NOT_ANCHORED',
      databaseHash,
      ledgerHash: null,
      txHash: null,
      blockNumber: null,
      anchoredAt: null,
    }
  }
  return {
    operationId: routeId,
    status: 'VALID',
    databaseHash,
    ledgerHash: databaseHash,
    txHash: `0x${fakeHash(routeId + 1000)}`,
    blockNumber: anchor.blockNumber,
    anchoredAt: anchor.anchoredAt,
  }
}

export function createHandlers(db: MockDb, options: MockOptions) {
  return [
    http.get('*/api/vehicles', async ({ request }) => {
      await delay(options.latencyMs)
      const includeInactive = new URL(request.url).searchParams.get('includeInactive') === 'true'
      return HttpResponse.json(
        includeInactive ? db.vehicles : db.vehicles.filter((vehicle) => vehicle.ativo),
      )
    }),

    http.patch('*/api/vehicles/:id', async ({ params, request }) => {
      await delay(options.latencyMs)
      const parsed = vehicleStatusRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const vehicle = db.vehicles.find((candidate) => candidate.id === Number(params['id']))
      if (!vehicle) {
        return problem(404, `Vehicle ${String(params['id'])} not found`)
      }
      vehicle.ativo = parsed.data.ativo
      return HttpResponse.json(vehicle)
    }),

    http.get('*/api/users', async () => {
      await delay(options.latencyMs)
      return HttpResponse.json(db.users)
    }),

    http.patch('*/api/users/:id', async ({ params, request }) => {
      await delay(options.latencyMs)
      const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const user = db.users.find((candidate) => candidate.id === Number(params['id']))
      if (!user) {
        return problem(404, `User ${String(params['id'])} not found`)
      }
      const next = { ...user, ...parsed.data }
      const otherAdmins = db.users.filter(
        (candidate) => candidate.id !== user.id && candidate.perfil === 'ADMIN' && candidate.ativo,
      )
      const losesAdmin =
        user.perfil === 'ADMIN' && user.ativo && !(next.perfil === 'ADMIN' && next.ativo)
      if (losesAdmin && otherAdmins.length === 0) {
        return problem(409, 'The last active administrator cannot be demoted or deactivated.')
      }
      Object.assign(user, next)
      return HttpResponse.json(user)
    }),

    http.get('*/api/settings/ga', async () => {
      await delay(options.latencyMs)
      return HttpResponse.json(db.gaSettings)
    }),

    http.put('*/api/settings/ga', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = gaSettingsSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      db.gaSettings = parsed.data
      return HttpResponse.json(db.gaSettings)
    }),

    http.post('*/api/vehicles', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = vehicleRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const vehicle: Vehicle = { id: db.nextVehicleId++, ...parsed.data, ativo: true }
      db.vehicles.push(vehicle)
      return HttpResponse.json(vehicle, { status: 201 })
    }),

    http.get('*/api/delivery-points', async () => {
      await delay(options.latencyMs)
      return HttpResponse.json(db.deliveryPoints.filter((point) => point.ativo))
    }),

    http.post('*/api/delivery-points', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = deliveryPointRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const point: DeliveryPoint = {
        id: db.nextDeliveryPointId++,
        nome: parsed.data.nome,
        endereco: parsed.data.endereco ?? null,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        ativo: true,
      }
      db.deliveryPoints.push(point)
      return HttpResponse.json(point, { status: 201 })
    }),

    http.post('*/api/routes/calculate', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = routeRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const { vehicleId, deliveryPointIds, criterion } = parsed.data
      if (new Set(deliveryPointIds).size !== deliveryPointIds.length) {
        return problem(400, 'deliveryPointIds must not contain duplicates')
      }
      const vehicle = db.vehicles.find((candidate) => candidate.id === vehicleId)
      if (!vehicle) {
        return problem(404, `Vehicle ${vehicleId} not found`)
      }
      if (!vehicle.ativo) {
        return problem(400, `Vehicle ${vehicleId} is inactive`)
      }
      const points: DeliveryPoint[] = []
      for (const pointId of deliveryPointIds) {
        const point = db.deliveryPoints.find((candidate) => candidate.id === pointId)
        if (!point) {
          return problem(404, `Delivery point ${pointId} not found`)
        }
        if (!point.ativo) {
          return problem(400, `Delivery point ${pointId} is inactive`)
        }
        points.push(point)
      }

      const route = createPendingRoute(db, vehicle, criterion, points)
      setTimeout(
        () => completeRoute(db, route.id, points, criterion, options),
        options.completionDelayMs,
      )
      return HttpResponse.json(
        { id: route.id, status: route.status },
        { status: 202, headers: { Location: `/api/routes/${route.id}` } },
      )
    }),

    http.get('*/api/routes', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = listQuerySchema.safeParse(
        Object.fromEntries(new URL(request.url).searchParams),
      )
      if (!parsed.success) {
        return problem(400, 'Invalid query parameters.')
      }
      const query = parsed.data
      const plates = new Map(db.vehicles.map((vehicle) => [vehicle.id, vehicle.placa]))
      const matching = Array.from(db.routes.values())
        .filter((route) => !query.from || route.createdAt.slice(0, 10) >= query.from)
        .filter((route) => !query.to || route.createdAt.slice(0, 10) <= query.to)
        .filter((route) => query.vehicleId === undefined || route.vehicleId === query.vehicleId)
        .filter((route) => !query.criterion || route.criterion === query.criterion)
        .filter(
          (route) => !query.integrity || integrityReportOf(db, route.id).status === query.integrity,
        )
      const factor = query.direction === 'asc' ? 1 : -1
      matching.sort((first, second) => {
        const left = first[query.sort]
        const right = second[query.sort]
        if (left === right) {
          return second.id - first.id
        }
        if (left === null) {
          return 1
        }
        if (right === null) {
          return -1
        }
        return (left < right ? -1 : 1) * factor
      })
      const start = (query.page - 1) * query.size
      return HttpResponse.json({
        items: matching.slice(start, start + query.size).map((route) => ({
          id: route.id,
          createdAt: route.createdAt,
          vehicleId: route.vehicleId,
          vehiclePlate: plates.get(route.vehicleId) ?? '—',
          criterion: route.criterion,
          status: route.status,
          totalEmissionKg: route.totalEmissionKg,
          totalDistanceMeters: route.totalDistanceMeters,
          integrityStatus: integrityReportOf(db, route.id).status,
        })),
        total: matching.length,
        page: query.page,
        size: query.size,
      })
    }),

    http.post('*/api/experiments', async ({ request }) => {
      await delay(options.latencyMs)
      const parsed = experimentRequestSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const { instances, seeds } = parsed.data
      const id = db.nextExperimentId++
      const total = instances.length * seeds.length
      db.experiments.push({
        id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        instances,
        seeds,
        progress: { completed: 0, total },
        runs: [],
        errorMessage: null,
      })
      const pairs = instances.flatMap((size) => seeds.map((seed) => ({ size, seed })))
      const step = options.experimentRunDelayMs ?? DEFAULT_EXPERIMENT_RUN_DELAY_MS
      pairs.forEach(({ size, seed }, index) => {
        setTimeout(
          () => {
            const current = db.experiments.find((experiment) => experiment.id === id)
            if (!current) {
              return
            }
            const runs = [...current.runs, generateRun(size, seed)]
            Object.assign(current, {
              runs,
              progress: { completed: runs.length, total },
              status: runs.length === total ? 'COMPLETED' : 'PENDING',
            })
          },
          (index + 1) * step,
        )
      })
      return HttpResponse.json({ id, status: 'PENDING' }, { status: 202 })
    }),

    http.get('*/api/experiments/latest', async () => {
      await delay(options.latencyMs)
      const latest = db.experiments.at(-1)
      return latest ? HttpResponse.json(latest) : problem(404, 'No experiment has been run yet.')
    }),

    http.get('*/geocode', async ({ request }) => {
      await delay(options.latencyMs)
      const query = new URL(request.url).searchParams.get('q') ?? ''
      const tokens = normalizeText(query).split(/\s+/).filter(Boolean)
      if (tokens.length === 0) {
        return HttpResponse.json([])
      }
      const matches = seedAddresses
        .filter((address) => {
          const text = normalizeText(address.displayName)
          return tokens.every((token) => text.includes(token))
        })
        .slice(0, 5)
        .map((address) => ({
          display_name: address.displayName,
          lat: String(address.latitude),
          lon: String(address.longitude),
        }))
      return HttpResponse.json(matches)
    }),

    http.get('*/api/routes/:id/integrity', async ({ params }) => {
      await delay(options.latencyMs)
      const routeId = Number(params['id'])
      if (!db.routes.has(routeId)) {
        return problem(404, `Route operation ${routeId} not found`)
      }
      return HttpResponse.json(integrityReportOf(db, routeId))
    }),

    http.get('*/api/routes/:id', async ({ params }) => {
      await delay(options.latencyMs)
      const routeId = Number(params['id'])
      const route = db.routes.get(routeId)
      if (!route) {
        return problem(404, `Route operation ${routeId} not found`)
      }
      return HttpResponse.json(route)
    }),
  ]
}
