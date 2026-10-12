import { sessionSchema } from '@/services/schemas/auth'
import type { Session } from '@/services/schemas/auth'

const STORAGE_KEY = 'lv.session'

function readStored(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeStored(session: Session | null) {
  try {
    if (session) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    return
  }
}

let current: Session | null = readStored()
const listeners = new Set<() => void>()

function publish(next: Session | null) {
  current = next
  writeStored(next)
  listeners.forEach((listener) => listener())
}

export function getSession(): Session | null {
  return current
}

export function setSession(session: Session) {
  publish(session)
}

export function clearSession() {
  publish(null)
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
