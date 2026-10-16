import { sessionSchema } from '@/services/schemas/auth'
import type { Session } from '@/services/schemas/auth'

const STORAGE_KEY = 'lv.session'

function readFrom(storage: () => Storage): Session | null {
  try {
    const raw = storage().getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function readStored(): Session | null {
  return readFrom(() => window.localStorage) ?? readFrom(() => window.sessionStorage)
}

function writeStored(session: Session | null, remember: boolean) {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    if (session) {
      const target = remember ? window.localStorage : window.sessionStorage
      target.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    return
  }
}

let current: Session | null = readStored()
const listeners = new Set<() => void>()

function publish(next: Session | null, remember: boolean) {
  current = next
  writeStored(next, remember)
  listeners.forEach((listener) => listener())
}

export function getSession(): Session | null {
  return current
}

export function setSession(session: Session, remember = false) {
  publish(session, remember)
}

export function clearSession() {
  publish(null, false)
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
