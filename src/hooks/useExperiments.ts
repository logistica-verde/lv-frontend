import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ROUTE_POLL_INTERVAL_MS } from '@/config/polling'
import { getLatestExperiment, startExperiment } from '@/services/experimentService'
import { queryKeys } from '@/services/queryKeys'

export function useLatestExperiment() {
  return useQuery({
    queryKey: queryKeys.latestExperiment,
    queryFn: ({ signal }) => getLatestExperiment(signal),
    refetchInterval: (query) =>
      query.state.status !== 'error' && query.state.data?.status === 'PENDING'
        ? ROUTE_POLL_INTERVAL_MS
        : false,
  })
}

export function useStartExperiment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startExperiment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.latestExperiment }),
  })
}
