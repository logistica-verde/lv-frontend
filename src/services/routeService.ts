import { request } from '@/services/http'
import { routeAcceptedSchema, routeSchema } from '@/services/schemas/route'
import type { Route, RouteAccepted, RouteInput } from '@/services/schemas/route'

export function calculateRoute(input: RouteInput): Promise<RouteAccepted> {
  return request('/api/routes/calculate', routeAcceptedSchema, { method: 'POST', body: input })
}

export function getRoute(id: number, signal?: AbortSignal): Promise<Route> {
  return request(`/api/routes/${id}`, routeSchema, { signal })
}
