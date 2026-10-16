import { useCallback, useSyncExternalStore } from 'react'
import { getRecentVerifications, subscribeRecentVerifications } from '@/lib/recentVerifications'
import type { RecentVerification } from '@/lib/recentVerifications'

const NONE: RecentVerification[] = []

export function useRecentVerifications(userId: number | null): RecentVerification[] {
  const snapshot = useCallback(
    () => (userId === null ? NONE : getRecentVerifications(userId)),
    [userId],
  )
  return useSyncExternalStore(subscribeRecentVerifications, snapshot, snapshot)
}
