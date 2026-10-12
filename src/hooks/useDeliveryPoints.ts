import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDeliveryPoint, listDeliveryPoints } from '@/services/deliveryPointService'
import { queryKeys } from '@/services/queryKeys'
import type { DeliveryPoint, DeliveryPointInput } from '@/services/schemas/deliveryPoint'

export type CreationFailure = {
  input: DeliveryPointInput
  error: Error
}

export type CreationResult = {
  created: DeliveryPoint[]
  failures: CreationFailure[]
}

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

export function useCreateDeliveryPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inputs: DeliveryPointInput[]): Promise<CreationResult> => {
      const result: CreationResult = { created: [], failures: [] }
      for (const input of inputs) {
        try {
          result.created.push(await createDeliveryPoint(input))
        } catch (error) {
          result.failures.push({
            input,
            error: error instanceof Error ? error : new Error('Falha ao criar o ponto'),
          })
        }
      }
      return result
    },
    onSuccess: ({ created }) =>
      queryClient.setQueryData<DeliveryPoint[]>(queryKeys.deliveryPoints, (current) => [
        ...(current ?? []),
        ...created,
      ]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPoints }),
  })
}
