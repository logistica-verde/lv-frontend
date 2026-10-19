import type { Execution } from '@/services/schemas/execution'

export const executionFixture: Execution = {
  id: 9,
  status: 'IN_PROGRESS',
  scheduledAt: null,
  createdAt: '2026-10-20T12:00:00.000Z',
  startedAt: '2026-10-20T12:00:00.000Z',
  finishedAt: null,
  operationId: 7,
  criterion: 'EMISSION',
  vehicleId: 1,
  vehiclePlate: 'ABC1D23',
  pointCount: 3,
  totalEmissionKg: 5.5,
  totalDistanceMeters: 2022.5,
  cargoKg: null,
}
