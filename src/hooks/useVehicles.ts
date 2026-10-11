import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { queryKeys } from '@/services/queryKeys'
import type { Vehicle } from '@/services/schemas/vehicle'
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

export function useActiveVehicle() {
  const vehicles = useVehicles()
  const [chosenId, setChosenId] = useState<number | null>(null)

  const active = useMemo<Vehicle[]>(
    () => vehicles.data?.filter((vehicle) => vehicle.ativo) ?? [],
    [vehicles.data],
  )
  const selected = active.find((vehicle) => vehicle.id === chosenId) ?? active[0]

  return { vehicles, active, selected, choose: setChosenId }
}
