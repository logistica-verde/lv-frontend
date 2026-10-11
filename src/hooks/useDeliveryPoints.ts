import { useQuery } from '@tanstack/react-query'
import { listDeliveryPoints } from '@/services/deliveryPointService'
import { queryKeys } from '@/services/queryKeys'

export function useDeliveryPoints() {
  return useQuery({
    queryKey: queryKeys.deliveryPoints,
    queryFn: ({ signal }) => listDeliveryPoints(signal),
  })
}
