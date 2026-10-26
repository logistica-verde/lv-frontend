import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBase, listAllBases, listBases, setBaseActive } from '@/services/baseService'
import { queryKeys } from '@/services/queryKeys'

export function useBases() {
  return useQuery({
    queryKey: queryKeys.bases,
    queryFn: ({ signal }) => listBases(signal),
  })
}

export function useAllBases() {
  return useQuery({
    queryKey: queryKeys.allBases,
    queryFn: ({ signal }) => listAllBases(signal),
  })
}

export function useCreateBase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bases'] }),
  })
}

export function useSetBaseActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => setBaseActive(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bases'] }),
  })
}
