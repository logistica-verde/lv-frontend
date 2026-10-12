import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '@/lib/session'
import type { Session } from '@/services/schemas/auth'

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession, () => null)
}
