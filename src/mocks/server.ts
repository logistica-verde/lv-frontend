import { createServer } from '@mswjs/http-middleware'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { seedHistory } from '@/mocks/history'
import { seedDeliveryPoints, seedUsers, seedVehicles } from '@/mocks/seed'

const PORT = 8081

const db = createDb({
  vehicles: seedVehicles,
  users: seedUsers,
  deliveryPoints: seedDeliveryPoints,
})
seedHistory(db)

const app = createServer(
  ...createHandlers(db, {
    latencyMs: 250,
    completionDelayMs: 2500,
    anchoringDelayMs: 1500,
    requireAuth: true,
  }),
)

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`)
})
