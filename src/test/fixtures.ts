import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { IntegrityReport } from '@/services/schemas/integrity'
import type { Route } from '@/services/schemas/route'
import type { Vehicle } from '@/services/schemas/vehicle'

export const vehicleFixture: Vehicle = {
  id: 1,
  placa: 'ABC1D23',
  massaKg: 7500,
  tipoCombustivel: 'diesel',
  imagem: 'truck',
  ativo: true,
}

export const deliveryPointFixture: DeliveryPoint = {
  id: 10,
  nome: 'Praça da Sé',
  endereco: null,
  latitude: -23.55052,
  longitude: -46.63331,
  ativo: true,
}

export const completedRouteFixture: Route = {
  id: 7,
  vehicleId: 1,
  criterion: 'EMISSION',
  status: 'COMPLETED',
  createdAt: '2026-10-05T12:00:00.123Z',
  totalEmissionKg: 5.5,
  totalDistanceMeters: 2022.5,
  errorMessage: null,
  points: [
    { pointId: 12, name: 'C', latitude: -23.57, longitude: -46.63, visitOrder: 1 },
    { pointId: 10, name: 'A', latitude: -23.55, longitude: -46.63, visitOrder: 2 },
    { pointId: 11, name: 'B', latitude: -23.56, longitude: -46.63, visitOrder: 3 },
  ],
  segments: [
    {
      fromPointId: 12,
      toPointId: 10,
      distanceMeters: 1010,
      averageSpeedKmh: 40,
      slopePercent: 2,
      emissionKg: 2,
    },
    {
      fromPointId: 10,
      toPointId: 11,
      distanceMeters: 1012.5,
      averageSpeedKmh: 40,
      slopePercent: 2,
      emissionKg: 3.5,
    },
  ],
}

export const integrityFixture: IntegrityReport = {
  operationId: 7,
  status: 'VALID',
  databaseHash: 'ab'.repeat(32),
  ledgerHash: 'ab'.repeat(32),
  txHash: `0x${'cd'.repeat(32)}`,
  blockNumber: 42,
  anchoredAt: '2026-10-05T12:00:05Z',
}
