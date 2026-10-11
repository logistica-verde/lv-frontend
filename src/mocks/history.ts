import type { MockDb } from '@/mocks/db'
import { optimizeFake } from '@/mocks/fakeOptimizer'
import type { FakePoint } from '@/mocks/fakeOptimizer'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { OptimizationCriterion, Route } from '@/services/schemas/route'

const CALCULATIONS = 12
const HOURS_BETWEEN_CALCULATIONS = 17
const NOT_ANCHORED_RECENT = 1
const TAMPERED_CALCULATION = 7
const CRITERIA: OptimizationCriterion[] = ['EMISSION', 'DISTANCE']

function toFakePoint(point: DeliveryPoint): FakePoint {
  return { id: point.id, name: point.nome, latitude: point.latitude, longitude: point.longitude }
}

function pickPoints(points: DeliveryPoint[], calculation: number): DeliveryPoint[] {
  const size = 3 + (calculation % Math.max(1, points.length - 2))
  const start = calculation % points.length
  return Array.from({ length: Math.min(size, points.length) }, (_, offset) => {
    const picked = points[(start + offset) % points.length]
    return picked ?? points[0]
  }).filter((point): point is DeliveryPoint => point !== undefined)
}

export function seedHistory(db: MockDb, now: Date = new Date()): void {
  const activePoints = db.deliveryPoints.filter((point) => point.ativo)
  const vehicles = db.vehicles.filter((vehicle) => vehicle.ativo)
  if (activePoints.length < 3 || vehicles.length === 0) {
    return
  }

  for (let calculation = 0; calculation < CALCULATIONS; calculation += 1) {
    const vehicle = vehicles[calculation % vehicles.length]
    if (!vehicle) {
      continue
    }
    const points = pickPoints(activePoints, calculation)
    const createdAt = new Date(
      now.getTime() - (CALCULATIONS - calculation) * HOURS_BETWEEN_CALCULATIONS * 3_600_000,
    )

    CRITERIA.forEach((criterion, index) => {
      const result = optimizeFake(points.map(toFakePoint), criterion)
      const route: Route = {
        id: db.nextRouteId++,
        vehicleId: vehicle.id,
        criterion,
        status: 'COMPLETED',
        createdAt: new Date(createdAt.getTime() + index * 400).toISOString(),
        totalEmissionKg: result.totalEmissionKg,
        totalDistanceMeters: result.totalDistanceMeters,
        errorMessage: null,
        points: result.orderedPoints.map((point, order) => ({
          pointId: point.id,
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude,
          visitOrder: order + 1,
        })),
        segments: result.legs,
      }
      db.routes.set(route.id, route)
      const isRecent = calculation >= CALCULATIONS - NOT_ANCHORED_RECENT
      if (!isRecent) {
        db.anchors.set(route.id, {
          blockNumber: db.nextBlock++,
          anchoredAt: new Date(createdAt.getTime() + 5_000 + index * 400).toISOString(),
        })
      }
      if (calculation === TAMPERED_CALCULATION && criterion === 'DISTANCE') {
        db.tampered.add(route.id)
      }
    })
  }
}
