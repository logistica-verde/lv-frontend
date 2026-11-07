import type { Server } from 'node:http'
import { WebSocketServer } from 'ws'
import { z } from 'zod'
import type { MockDb } from '@/mocks/db'
import type { CalculationProgress } from '@/services/schemas/calculationProgress'
import type { Route } from '@/services/schemas/route'

const SOCKET_PATH = '/ws/calculations'
const TICK_MS = 200
const GENERATIONS = 500
const PREPARING_SHARE = 25
const OPTIMIZING_SHARE = 70
const PREPARING_FRACTION = 0.25

const subscriptionSchema = z.object({
  token: z.string().min(1),
  operationIds: z.array(z.number().int().positive()).min(1).max(10),
})

export function mockProgress(route: Route, now: number, completionDelayMs: number): CalculationProgress {
  const base = { operationId: route.id, done: null, total: null }
  if (route.status === 'COMPLETED') {
    return { ...base, stage: 'COMPLETED', percent: 100 }
  }
  if (route.status === 'FAILED') {
    return { ...base, stage: 'FAILED', percent: 100 }
  }
  const fraction = Math.min(1, Math.max(0, (now - Date.parse(route.createdAt)) / completionDelayMs))
  if (fraction < PREPARING_FRACTION) {
    const legs = route.points.length * (route.points.length - 1) + 1
    const done = Math.round((fraction / PREPARING_FRACTION) * legs)
    return { ...base, stage: 'PREPARING', percent: (PREPARING_SHARE * done) / legs, done, total: legs }
  }
  const generation = Math.round(((fraction - PREPARING_FRACTION) / (1 - PREPARING_FRACTION)) * GENERATIONS)
  return {
    ...base,
    stage: 'OPTIMIZING',
    percent: PREPARING_SHARE + (OPTIMIZING_SHARE * generation) / GENERATIONS,
    done: generation,
    total: GENERATIONS,
  }
}

function parseSubscription(raw: string): z.infer<typeof subscriptionSchema> | null {
  try {
    const parsed = subscriptionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function attachProgressSocket(server: Server, db: MockDb, completionDelayMs: number) {
  const sockets = new WebSocketServer({ server, path: SOCKET_PATH })
  sockets.on('connection', (socket) => {
    socket.once('message', (data) => {
      const subscription = parseSubscription(data.toString())
      if (!subscription) {
        socket.close(1008, 'Invalid subscription')
        return
      }
      const sent = new Map<number, string>()
      const timer = setInterval(() => {
        for (const id of subscription.operationIds) {
          const route = db.routes.get(id)
          if (!route) {
            continue
          }
          const message = JSON.stringify(mockProgress(route, Date.now(), completionDelayMs))
          if (sent.get(id) !== message) {
            sent.set(id, message)
            socket.send(message)
          }
        }
      }, TICK_MS)
      socket.on('close', () => clearInterval(timer))
    })
  })
}
