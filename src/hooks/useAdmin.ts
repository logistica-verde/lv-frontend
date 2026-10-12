import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGaSettings, saveGaSettings } from '@/services/gaSettingsService'
import { queryKeys } from '@/services/queryKeys'
import type { UserUpdate } from '@/services/schemas/user'
import { listUsers, updateUser } from '@/services/userService'
import { listAllVehicles, setVehicleActive } from '@/services/vehicleService'

export function useAllVehicles() {
  return useQuery({
    queryKey: queryKeys.allVehicles,
    queryFn: ({ signal }) => listAllVehicles(signal),
  })
}

export function useSetVehicleActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => setVehicleActive(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles }),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: ({ signal }) => listUsers(signal),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: UserUpdate }) => updateUser(id, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  })
}

export function useGaSettings() {
  return useQuery({
    queryKey: queryKeys.gaSettings,
    queryFn: ({ signal }) => getGaSettings(signal),
  })
}

export function useSaveGaSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveGaSettings,
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.gaSettings, settings),
  })
}
