import { env } from '@/config/env'
import { getSession } from '@/lib/session'
import { calculationProgressSchema } from '@/services/schemas/calculationProgress'
import type { CalculationProgress } from '@/services/schemas/calculationProgress'

export const CALCULATION_SOCKET_PATH = '/ws/calculations'

export function calculationSocketUrl(): string {
  const url = new URL(env.apiUrl || window.location.origin, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = CALCULATION_SOCKET_PATH
  url.search = ''
  return url.toString()
}

function parseProgress(raw: string): CalculationProgress | null {
  try {
    const parsed = calculationProgressSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function watchCalculations(
  operationIds: number[],
  onProgress: (progress: CalculationProgress) => void,
): () => void {
  const token = getSession()?.token
  if (!token || operationIds.length === 0 || typeof WebSocket === 'undefined') {
    return () => {}
  }
  const socket = new WebSocket(calculationSocketUrl())
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ token, operationIds }))
  })
  socket.addEventListener('message', (event: MessageEvent<string>) => {
    const progress = parseProgress(event.data)
    if (progress && operationIds.includes(progress.operationId)) {
      onProgress(progress)
    }
  })
  return () => socket.close()
}
