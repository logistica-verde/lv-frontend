import { useMutation, useQuery } from '@tanstack/react-query'
import { ROUTE_POLL_INTERVAL_MS } from '@/config/polling'
import { queryKeys } from '@/services/queryKeys'
import { calculateRoute, getRoute } from '@/services/routeService'
import type { RouteAccepted } from '@/services/schemas/route'

type CalculationRequest = {
  vehicleId: number
  deliveryPointIds: number[]
}

export type CalculationIds = {
  emission: RouteAccepted
  distance: RouteAccepted
}

export function useCalculateRoutes() {
  return useMutation({
    mutationFn: async ({
      vehicleId,
      deliveryPointIds,
    }: CalculationRequest): Promise<CalculationIds> => {
      const [emission, distance] = await Promise.all([
        calculateRoute({ vehicleId, deliveryPointIds, criterion: 'EMISSION' }),
        calculateRoute({ vehicleId, deliveryPointIds, criterion: 'DISTANCE' }),
      ])
      return { emission, distance }
    },
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: queryKeys.route(id),
    queryFn: ({ signal }) => getRoute(id, signal),
    refetchInterval: (query) => {
      if (query.state.status === 'error') {
        return false
      }
      return query.state.data?.status === 'PENDING' || query.state.data === undefined
        ? ROUTE_POLL_INTERVAL_MS
        : false
    },
  })
}
