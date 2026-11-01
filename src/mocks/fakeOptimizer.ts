import type { OptimizationCriterion } from '@/services/schemas/route'

export type FakePoint = {
  id: number
  name: string
  latitude: number
  longitude: number
}

export type FakeLeg = {
  fromPointId: number
  toPointId: number
  distanceMeters: number
  averageSpeedKmh: number
  slopePercent: number
  emissionKg: number
}

export type FakeOptimization = {
  orderedPoints: FakePoint[]
  legs: FakeLeg[]
  totalEmissionKg: number
  totalDistanceMeters: number
}

const EARTH_RADIUS_METERS = 6_371_008.8

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function haversineMeters(a: FakePoint, b: FakePoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

function pairHash(fromId: number, toId: number): number {
  const low = Math.min(fromId, toId)
  const high = Math.max(fromId, toId)
  return Math.abs(((low * 73_856_093) ^ (high * 19_349_663)) % 1000) / 1000
}

function legBetween(from: FakePoint, to: FakePoint): FakeLeg {
  const hash = pairHash(from.id, to.id)
  const direction = from.id < to.id ? 1 : -1
  const distanceMeters = haversineMeters(from, to)
  const averageSpeedKmh = 20 + hash * 40
  const slopePercent = (hash * 7 - 3) * direction
  const speedPenalty = 1 + Math.abs(averageSpeedKmh - 45) / 50
  const congestion = 0.5 + pairHash(from.id + 101, to.id + 211) * 2.5
  const emissionKg =
    (distanceMeters / 1000) * 0.9 * (1 + 0.2 * slopePercent) * speedPenalty * congestion

  return {
    fromPointId: from.id,
    toPointId: to.id,
    distanceMeters: round(distanceMeters, 1),
    averageSpeedKmh: round(averageSpeedKmh, 1),
    slopePercent: round(slopePercent, 2),
    emissionKg: round(emissionKg, 3),
  }
}

function costOf(leg: FakeLeg, criterion: OptimizationCriterion): number {
  return criterion === 'EMISSION' ? leg.emissionKg : leg.distanceMeters
}

const EXACT_SEARCH_LIMIT = 9

function assemble(orderedPoints: FakePoint[], closed: boolean): FakeOptimization {
  const [depot] = orderedPoints
  const walked = closed && depot ? [...orderedPoints, depot] : orderedPoints
  const legs = walked.slice(1).map((point, index) => {
    const previous = walked[index]
    return previous ? legBetween(previous, point) : legBetween(point, point)
  })
  return {
    orderedPoints,
    legs,
    totalEmissionKg: round(
      legs.reduce((sum, leg) => sum + leg.emissionKg, 0),
      3,
    ),
    totalDistanceMeters: round(
      legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
      1,
    ),
  }
}

function greedyOrder(points: FakePoint[], criterion: OptimizationCriterion): FakePoint[] {
  const [first, ...rest] = points
  if (!first) {
    return []
  }

  const order: FakePoint[] = [first]
  let remaining = rest
  let current = first

  while (remaining.length > 0) {
    const candidates = remaining.map((candidate) => legBetween(current, candidate))
    const best = candidates.reduce((winner, leg) =>
      costOf(leg, criterion) < costOf(winner, criterion) ? leg : winner,
    )
    const next = remaining.find((candidate) => candidate.id === best.toPointId)
    if (!next) {
      break
    }
    order.push(next)
    remaining = remaining.filter((candidate) => candidate.id !== next.id)
    current = next
  }

  return order
}

function exactOrder(
  points: FakePoint[],
  criterion: OptimizationCriterion,
  closed: boolean,
): FakePoint[] {
  const [first, ...rest] = points
  if (!first) {
    return []
  }

  let bestCost = Number.POSITIVE_INFINITY
  let bestOrder: FakePoint[] = points

  const visit = (current: FakePoint, remaining: FakePoint[], order: FakePoint[], cost: number) => {
    if (cost >= bestCost) {
      return
    }
    if (remaining.length === 0) {
      const total = closed ? cost + costOf(legBetween(current, first), criterion) : cost
      if (total < bestCost) {
        bestCost = total
        bestOrder = order
      }
      return
    }
    remaining.forEach((candidate) => {
      const legCost = costOf(legBetween(current, candidate), criterion)
      visit(
        candidate,
        remaining.filter((other) => other.id !== candidate.id),
        [...order, candidate],
        cost + legCost,
      )
    })
  }

  visit(first, rest, [first], 0)
  return bestOrder
}

export function optimizeFake(
  points: FakePoint[],
  criterion: OptimizationCriterion,
  closed = false,
): FakeOptimization {
  if (points.length <= EXACT_SEARCH_LIMIT) {
    return assemble(exactOrder(points, criterion, closed), closed)
  }
  return assemble(greedyOrder(points, criterion), closed)
}
