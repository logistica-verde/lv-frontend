import { createServer } from '@mswjs/http-middleware'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { seedHistory } from '@/mocks/history'
import { attachProgressSocket } from '@/mocks/progressSocket'
import { seedBases, seedDeliveryPoints, seedUsers, seedVehicles } from '@/mocks/seed'

const PORT = 8081
const COMPLETION_DELAY_MS = 2500

const db = createDb({
  vehicles: seedVehicles,
  bases: seedBases,
  users: seedUsers,
  deliveryPoints: seedDeliveryPoints,
})
seedHistory(db)

const app = createServer(
  ...createHandlers(db, {
    latencyMs: 250,
    completionDelayMs: COMPLETION_DELAY_MS,
    anchoringDelayMs: 1500,
    requireAuth: true,
  }),
)

const httpServer = app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`)
})
attachProgressSocket(httpServer, db, COMPLETION_DELAY_MS)
