import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { Experiment } from '@/services/schemas/experiment'
import type { GaSettings } from '@/services/schemas/gaSettings'
import { DEFAULT_GA_SETTINGS } from '@/services/schemas/gaSettings'
import type { Route } from '@/services/schemas/route'
import type { User } from '@/services/schemas/user'
import type { Vehicle } from '@/services/schemas/vehicle'

export type AnchorInfo = {
  blockNumber: number
  anchoredAt: string
}

export type MockDb = {
  vehicles: Vehicle[]
  users: User[]
  gaSettings: GaSettings
  deliveryPoints: DeliveryPoint[]
  routes: Map<number, Route>
  anchors: Map<number, AnchorInfo>
  tampered: Set<number>
  experiments: Experiment[]
  nextExperimentId: number
  nextVehicleId: number
  nextDeliveryPointId: number
  nextRouteId: number
  nextBlock: number
}

type Seed = {
  vehicles: Vehicle[]
  users?: User[]
  deliveryPoints: DeliveryPoint[]
}

const FIRST_BLOCK = 100

export function createDb(seed: Seed): MockDb {
  return {
    vehicles: seed.vehicles.map((vehicle) => ({ ...vehicle })),
    users: (seed.users ?? []).map((user) => ({ ...user })),
    gaSettings: { ...DEFAULT_GA_SETTINGS },
    deliveryPoints: seed.deliveryPoints.map((point) => ({ ...point })),
    routes: new Map(),
    anchors: new Map(),
    tampered: new Set(),
    experiments: [],
    nextExperimentId: 1,
    nextVehicleId: Math.max(0, ...seed.vehicles.map((vehicle) => vehicle.id)) + 1,
    nextDeliveryPointId: Math.max(0, ...seed.deliveryPoints.map((point) => point.id)) + 1,
    nextRouteId: 1,
    nextBlock: FIRST_BLOCK,
  }
}
