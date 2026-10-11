import { describe, expect, it, vi } from 'vitest'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { seedDeliveryPoints, seedVehicles } from '@/mocks/seed'
import { createDeliveryPoint, listDeliveryPoints } from '@/services/deliveryPointService'
import { ApiError } from '@/services/errors'
import { getIntegrity } from '@/services/integrityService'
import { calculateRoute, getRoute } from '@/services/routeService'
import { createVehicle, listVehicles } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'

function useMockApi() {
  const db = createDb({ vehicles: seedVehicles, deliveryPoints: seedDeliveryPoints })
  server.use(...createHandlers(db, { latencyMs: 0, completionDelayMs: 30, anchoringDelayMs: 30 }))
  return db
}

const WAIT = { timeout: 3000, interval: 20 }

describe('mock vehicles', () => {
  it('lists the seeded vehicles', async () => {
    useMockApi()

    expect(await listVehicles()).toEqual(seedVehicles)
  })

  it('creates a vehicle that then shows up in the list', async () => {
    useMockApi()

    const created = await createVehicle({ placa: 'NEW1A11', massaKg: 3000, tipoCombustivel: 'gnv' })

    expect(created).toMatchObject({ placa: 'NEW1A11', ativo: true })
    expect(await listVehicles()).toContainEqual(created)
  })

  it('rejects an invalid vehicle with a 400 problem detail', async () => {
    useMockApi()

    const failure = createVehicle({ placa: '  ', massaKg: 3000, tipoCombustivel: 'gnv' })

    await expect(failure).rejects.toMatchObject({
      status: 400,
      message: 'Invalid request content.',
    })
  })
})

describe('mock delivery points', () => {
  it('creates a point that then shows up in the list', async () => {
    useMockApi()

    const created = await createDeliveryPoint({ nome: 'Novo', latitude: -23.5, longitude: -46.6 })

    expect(created).toMatchObject({ nome: 'Novo', endereco: null, ativo: true })
    expect(await listDeliveryPoints()).toContainEqual(created)
  })

  it('rejects coordinates out of range', async () => {
    useMockApi()

    const failure = createDeliveryPoint({ nome: 'Longe', latitude: 123, longitude: -46.6 })

    await expect(failure).rejects.toMatchObject({ status: 400 })
  })
})

describe('mock route calculation', () => {
  it('accepts the request, then completes it in the background', async () => {
    useMockApi()

    const accepted = await calculateRoute({
      vehicleId: 1,
      deliveryPointIds: [1, 2, 3, 4],
      criterion: 'EMISSION',
    })
    expect(accepted.status).toBe('PENDING')

    const pending = await getRoute(accepted.id)
    expect(pending).toMatchObject({
      status: 'PENDING',
      totalEmissionKg: null,
      segments: [],
    })
    expect(pending.points.map((point) => point.visitOrder)).toEqual([1, 2, 3, 4])

    await vi.waitFor(async () => {
      expect((await getRoute(accepted.id)).status).toBe('COMPLETED')
    }, WAIT)

    const completed = await getRoute(accepted.id)
    expect(completed.totalEmissionKg).toBeGreaterThan(0)
    expect(completed.totalDistanceMeters).toBeGreaterThan(0)
    expect(completed.segments).toHaveLength(3)
    expect(completed.points.map((point) => point.visitOrder)).toEqual([1, 2, 3, 4])
    expect(completed.points.map((point) => point.pointId).sort()).toEqual([1, 2, 3, 4])
  })

  it('answers 202 with a Location header like the real API', async () => {
    useMockApi()

    const response = await fetch(apiUrl('/api/routes/calculate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: 1, deliveryPointIds: [1, 2], criterion: 'DISTANCE' }),
    })

    expect(response.status).toBe(202)
    expect(response.headers.get('Location')).toMatch(/^\/api\/routes\/\d+$/)
  })

  it('rejects an unknown vehicle with 404', async () => {
    useMockApi()

    const failure = calculateRoute({
      vehicleId: 99,
      deliveryPointIds: [1, 2],
      criterion: 'EMISSION',
    })

    await expect(failure).rejects.toMatchObject({ status: 404, message: 'Vehicle 99 not found' })
  })

  it('rejects an unknown delivery point with 404', async () => {
    useMockApi()

    const failure = calculateRoute({
      vehicleId: 1,
      deliveryPointIds: [1, 99],
      criterion: 'EMISSION',
    })

    await expect(failure).rejects.toMatchObject({
      status: 404,
      message: 'Delivery point 99 not found',
    })
  })

  it('rejects duplicated points with 400', async () => {
    useMockApi()

    const failure = calculateRoute({
      vehicleId: 1,
      deliveryPointIds: [1, 1],
      criterion: 'EMISSION',
    })

    await expect(failure).rejects.toMatchObject({
      status: 400,
      message: 'deliveryPointIds must not contain duplicates',
    })
  })

  it('rejects an inactive vehicle with 400', async () => {
    const db = useMockApi()
    const first = db.vehicles[0]
    if (first) {
      first.ativo = false
    }

    const failure = calculateRoute({
      vehicleId: 1,
      deliveryPointIds: [1, 2],
      criterion: 'EMISSION',
    })

    await expect(failure).rejects.toMatchObject({ status: 400, message: 'Vehicle 1 is inactive' })
  })

  it('answers 404 for an unknown route', async () => {
    useMockApi()

    const failure = getRoute(999)

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ status: 404 })
  })
})

describe('mock integrity', () => {
  it('is not anchored right after the calculation and valid once anchored', async () => {
    useMockApi()
    const accepted = await calculateRoute({
      vehicleId: 1,
      deliveryPointIds: [1, 2, 3],
      criterion: 'DISTANCE',
    })

    const early = await getIntegrity(accepted.id)
    expect(early).toMatchObject({ status: 'NOT_ANCHORED', ledgerHash: null, txHash: null })
    expect(early.databaseHash).toHaveLength(64)

    await vi.waitFor(async () => {
      expect((await getIntegrity(accepted.id)).status).toBe('VALID')
    }, WAIT)

    const anchored = await getIntegrity(accepted.id)
    expect(anchored.ledgerHash).toBe(anchored.databaseHash)
    expect(anchored.txHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(anchored.blockNumber).toBeGreaterThanOrEqual(100)
    expect(anchored.anchoredAt).not.toBeNull()
  })

  it('answers 404 for an unknown route', async () => {
    useMockApi()

    await expect(getIntegrity(999)).rejects.toMatchObject({ status: 404 })
  })
})
