const MINUTE_MS = 60_000
const DEFAULT_LEAD_MINUTES = 30
const PAST_TOLERANCE_MS = MINUTE_MS

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function defaultScheduleValue(now: Date): string {
  const next = new Date(now.getTime() + DEFAULT_LEAD_MINUTES * MINUTE_MS)
  next.setSeconds(0, 0)
  const rest = next.getMinutes() % 5
  if (rest !== 0) {
    next.setMinutes(next.getMinutes() + (5 - rest))
  }
  return toLocalInputValue(next)
}

export function parseLocalInput(value: string): Date | null {
  if (value.trim() === '') {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isInThePast(date: Date, now: Date): boolean {
  return date.getTime() < now.getTime() - PAST_TOLERANCE_MS
}

export function minutesUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / MINUTE_MS)
}

export function describeTimeLeft(minutes: number): string {
  if (minutes <= 0) {
    return 'agora'
  }
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) {
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
  }
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 dia' : `${days} dias`
}

export const REMINDER_THRESHOLDS_MINUTES = [60, 30, 15, 5, 1] as const

export function crossedThreshold(minutesLeft: number, already: ReadonlySet<number>): number | null {
  const crossed = REMINDER_THRESHOLDS_MINUTES.filter(
    (threshold) => minutesLeft <= threshold && !already.has(threshold),
  )
  const smallest = Math.min(...crossed)
  return Number.isFinite(smallest) ? smallest : null
}
