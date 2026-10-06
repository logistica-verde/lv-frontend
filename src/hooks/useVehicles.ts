import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/queryKeys'
import { createVehicle, listVehicles } from '@/services/vehicleService'

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: ({ signal }) => listVehicles(signal),
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles }),
  })
}
