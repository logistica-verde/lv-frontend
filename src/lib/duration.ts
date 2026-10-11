const SECONDS_PER_MINUTE = 60

export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  if (seconds < SECONDS_PER_MINUTE) {
    return `${seconds} s`
  }
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, '0')
  return `${minutes} min ${rest} s`
}
