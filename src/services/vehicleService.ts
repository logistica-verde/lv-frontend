import { request } from '@/services/http'
import { vehicleListSchema, vehicleSchema } from '@/services/schemas/vehicle'
import type { Vehicle, VehicleInput } from '@/services/schemas/vehicle'

export function listVehicles(signal?: AbortSignal): Promise<Vehicle[]> {
  return request('/api/vehicles', vehicleListSchema, { signal })
}

export function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return request('/api/vehicles', vehicleSchema, { method: 'POST', body: input })
}
