import { describe, expect, it, vi } from 'vitest'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { seedDeliveryPoints, seedVehicles } from '@/mocks/seed'
import { seedHistory } from '@/mocks/history'
import { createDeliveryPoint, listDeliveryPoints } from '@/services/deliveryPointService'
import { listOperations } from '@/services/operationService'
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

describe('mock geocoder', () => {
  async function geocode(query: string) {
    const response = await fetch(apiUrl(`/geocode?q=${encodeURIComponent(query)}`))
    return { status: response.status, body: await response.json() }
  }

  it('finds seeded addresses ignoring case and accents', async () => {
    useMockApi()

    const { status, body } = await geocode('PRACA DA SE')

    expect(status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ lat: '-23.5505', lon: '-46.6333' })
    expect(body[0].display_name).toContain('Praça da Sé')
  })

  it('requires every word of the query to match', async () => {
    useMockApi()

    expect((await geocode('paulista 1578')).body).toHaveLength(1)
    expect((await geocode('paulista 9999')).body).toEqual([])
  })

  it('answers with an empty list for an empty query', async () => {
    useMockApi()

    expect((await geocode('   ')).body).toEqual([])
  })

  it('returns at most five matches', async () => {
    useMockApi()

    expect((await geocode('sao paulo')).body.length).toBeLessThanOrEqual(5)
  })
})

describe('mock operations list', () => {
  const NOW = new Date('2026-10-11T15:00:00.000Z')

  function useHistory() {
    const db = useMockApi()
    seedHistory(db, NOW)
    return db
  }

  const base = { sort: 'createdAt', direction: 'desc', page: 1, size: 50 } as const

  it('lists every seeded operation, newest first, with the vehicle plate', async () => {
    useHistory()

    const result = await listOperations(base)

    expect(result.total).toBe(24)
    const dates = result.items.map((item) => item.createdAt)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(new Set(result.items.map((item) => item.vehiclePlate))).toEqual(
      new Set(['ABC1D23', 'XYZ9K88']),
    )
  })

  it('pages the results and reports the total', async () => {
    useHistory()

    const first = await listOperations({ ...base, size: 10, page: 1 })
    const last = await listOperations({ ...base, size: 10, page: 3 })

    expect(first.items).toHaveLength(10)
    expect(last.items).toHaveLength(4)
    expect(first.total).toBe(24)
    expect(last.page).toBe(3)
  })

  it('filters by vehicle and by criterion', async () => {
    useHistory()

    const byVehicle = await listOperations({ ...base, vehicleId: 1 })
    const byCriterion = await listOperations({ ...base, criterion: 'EMISSION' })

    expect(byVehicle.items.every((item) => item.vehicleId === 1)).toBe(true)
    expect(byVehicle.total).toBe(12)
    expect(byCriterion.items.every((item) => item.criterion === 'EMISSION')).toBe(true)
    expect(byCriterion.total).toBe(12)
  })

  it('filters by integrity status', async () => {
    useHistory()

    const tampered = await listOperations({ ...base, integrity: 'TAMPERED' })
    const waiting = await listOperations({ ...base, integrity: 'NOT_ANCHORED' })
    const valid = await listOperations({ ...base, integrity: 'VALID' })

    expect(tampered.total).toBe(1)
    expect(waiting.total).toBe(2)
    expect(valid.total).toBe(21)
  })

  it('filters by date, including both ends', async () => {
    useHistory()
    const all = await listOperations(base)
    const day = all.items[0]?.createdAt.slice(0, 10) ?? ''

    const result = await listOperations({ ...base, from: day, to: day })

    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((item) => item.createdAt.startsWith(day))).toBe(true)
    expect(result.total).toBeLessThan(all.total)
  })

  it('sorts by emission in both directions', async () => {
    useHistory()

    const ascending = await listOperations({ ...base, sort: 'totalEmissionKg', direction: 'asc' })
    const descending = await listOperations({ ...base, sort: 'totalEmissionKg', direction: 'desc' })

    const values = ascending.items.map((item) => item.totalEmissionKg ?? 0)
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(descending.items[0]?.totalEmissionKg).toBe(values[values.length - 1])
  })

  it('shows an operation that is still being calculated, with no totals yet', async () => {
    const db = useMockApi()
    await calculateRoute({ vehicleId: 1, deliveryPointIds: [1, 2], criterion: 'EMISSION' })

    const result = await listOperations(base)

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ status: 'PENDING', totalEmissionKg: null })
    expect(db.routes.size).toBe(1)
  })

  it('rejects invalid query parameters with a 400', async () => {
    useHistory()

    const response = await fetch(apiUrl('/api/routes?sort=nome&page=0'))

    expect(response.status).toBe(400)
  })
})

describe('seedHistory', () => {
  it('creates both criteria for every calculation and anchors all but the most recent', () => {
    const db = createDb({ vehicles: seedVehicles, deliveryPoints: seedDeliveryPoints })

    seedHistory(db, new Date('2026-10-11T15:00:00.000Z'))

    expect(db.routes.size).toBe(24)
    expect(db.anchors.size).toBe(22)
    expect(db.tampered.size).toBe(1)
    expect(Array.from(db.routes.values()).every((route) => route.status === 'COMPLETED')).toBe(true)
  })

  it('does nothing without vehicles or enough points', () => {
    const db = createDb({ vehicles: [], deliveryPoints: seedDeliveryPoints })

    seedHistory(db)

    expect(db.routes.size).toBe(0)
  })
})
