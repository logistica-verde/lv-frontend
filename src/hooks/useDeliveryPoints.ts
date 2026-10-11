import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDeliveryPoint, listDeliveryPoints } from '@/services/deliveryPointService'
import { queryKeys } from '@/services/queryKeys'

export function useDeliveryPoints() {
  return useQuery({
    queryKey: queryKeys.deliveryPoints,
    queryFn: ({ signal }) => listDeliveryPoints(signal),
  })
}

export function useCreateDeliveryPoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDeliveryPoint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPoints }),
  })
}
