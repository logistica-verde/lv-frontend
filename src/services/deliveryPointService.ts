import { request } from '@/services/http'
import { deliveryPointListSchema, deliveryPointSchema } from '@/services/schemas/deliveryPoint'
import type { DeliveryPoint, DeliveryPointInput } from '@/services/schemas/deliveryPoint'

export function listDeliveryPoints(signal?: AbortSignal): Promise<DeliveryPoint[]> {
  return request('/api/delivery-points', deliveryPointListSchema, { signal })
}

export function createDeliveryPoint(input: DeliveryPointInput): Promise<DeliveryPoint> {
  return request('/api/delivery-points', deliveryPointSchema, { method: 'POST', body: input })
}
