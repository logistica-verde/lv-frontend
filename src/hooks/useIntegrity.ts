import { useQuery } from '@tanstack/react-query'
import { ANCHOR_MAX_POLLS, ANCHOR_POLL_INTERVAL_MS } from '@/config/polling'
import { getIntegrity } from '@/services/integrityService'
import { queryKeys } from '@/services/queryKeys'

export function useIntegrity(routeId: number) {
  return useQuery({
    queryKey: queryKeys.integrity(routeId),
    queryFn: ({ signal }) => getIntegrity(routeId, signal),
    refetchInterval: (query) => {
      const stillWaiting = query.state.data?.status === 'NOT_ANCHORED'
      return stillWaiting && query.state.dataUpdateCount < ANCHOR_MAX_POLLS
        ? ANCHOR_POLL_INTERVAL_MS
        : false
    },
  })
}
