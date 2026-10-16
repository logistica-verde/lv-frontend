import { z } from 'zod'
import { integrityStatusSchema } from '@/services/schemas/integrity'

const KEY_PREFIX = 'lv.recentVerifications.'
const MAX_ENTRIES = 5

const recentSchema = z.array(
  z.object({
    operationId: z.number().int().positive(),
    status: integrityStatusSchema,
    checkedAt: z.string(),
  }),
)

export type RecentVerification = z.infer<typeof recentSchema>[number]

const EMPTY: RecentVerification[] = []
const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: RecentVerification[] }>()

function storageKey(userId: number): string {
  return `${KEY_PREFIX}${userId}`
}

function readRaw(userId: number): string | null | undefined {
  try {
    return window.localStorage.getItem(storageKey(userId))
  } catch {
    return undefined
  }
}

export function getRecentVerifications(userId: number): RecentVerification[] {
  const raw = readRaw(userId)
  if (raw === undefined) {
    return EMPTY
  }
  const cached = cache.get(storageKey(userId))
  if (cached && cached.raw === raw) {
    return cached.value
  }
  let value = EMPTY
  if (raw) {
    try {
      const parsed = recentSchema.safeParse(JSON.parse(raw))
      value = parsed.success ? parsed.data : EMPTY
    } catch {
      value = EMPTY
    }
  }
  cache.set(storageKey(userId), { raw, value })
  return value
}

export function recordVerification(userId: number, entry: RecentVerification) {
  const others = getRecentVerifications(userId).filter(
    (item) => item.operationId !== entry.operationId,
  )
  const next = [entry, ...others].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    return
  }
  listeners.forEach((listener) => listener())
}

export function clearRecentVerifications(userId: number) {
  try {
    window.localStorage.removeItem(storageKey(userId))
  } catch {
    return
  }
  listeners.forEach((listener) => listener())
}

export function subscribeRecentVerifications(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
