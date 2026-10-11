import { http, HttpResponse } from 'msw'
import type { DefaultBodyType } from 'msw'
import { describe, expect, it } from 'vitest'
import { createDeliveryPoint, listDeliveryPoints } from '@/services/deliveryPointService'
import { getIntegrity } from '@/services/integrityService'
import { calculateRoute, getRoute } from '@/services/routeService'
import type { RouteInput } from '@/services/schemas/route'
import { createVehicle, listVehicles } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import {
  completedRouteFixture,
  deliveryPointFixture,
  integrityFixture,
  vehicleFixture,
} from '@/test/fixtures'
import { server } from '@/test/server'

describe('vehicleService', () => {
  it('lists vehicles', async () => {
    server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([vehicleFixture])))

    expect(await listVehicles()).toEqual([vehicleFixture])
  })

  it('creates a vehicle by posting the input', async () => {
    let received: DefaultBodyType
    server.use(
      http.post(apiUrl('/api/vehicles'), async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(vehicleFixture, { status: 201 })
      }),
    )
    const input = { placa: 'ABC1D23', massaKg: 7500, tipoCombustivel: 'diesel' }

    const created = await createVehicle(input)

    expect(received).toEqual(input)
    expect(created).toEqual(vehicleFixture)
  })
})

describe('deliveryPointService', () => {
  it('lists delivery points', async () => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([deliveryPointFixture])),
    )

    expect(await listDeliveryPoints()).toEqual([deliveryPointFixture])
  })

  it('creates a delivery point by posting the input', async () => {
    let received: DefaultBodyType
    server.use(
      http.post(apiUrl('/api/delivery-points'), async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(deliveryPointFixture, { status: 201 })
      }),
    )
    const input = { nome: 'Praça da Sé', latitude: -23.55052, longitude: -46.63331 }

    const created = await createDeliveryPoint(input)

    expect(received).toEqual(input)
    expect(created).toEqual(deliveryPointFixture)
  })
})

describe('routeService', () => {
  it('requests a calculation and receives the accepted operation', async () => {
    let received: DefaultBodyType
    server.use(
      http.post(apiUrl('/api/routes/calculate'), async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ id: 7, status: 'PENDING' }, { status: 202 })
      }),
    )
    const input: RouteInput = {
      vehicleId: 1,
      deliveryPointIds: [10, 11, 12],
      criterion: 'EMISSION',
    }

    const accepted = await calculateRoute(input)

    expect(received).toEqual(input)
    expect(accepted).toEqual({ id: 7, status: 'PENDING' })
  })

  it('fetches a route by id', async () => {
    server.use(http.get(apiUrl('/api/routes/7'), () => HttpResponse.json(completedRouteFixture)))

    expect(await getRoute(7)).toEqual(completedRouteFixture)
  })
})

describe('integrityService', () => {
  it('fetches the integrity report of a route', async () => {
    server.use(
      http.get(apiUrl('/api/routes/7/integrity'), () => HttpResponse.json(integrityFixture)),
    )

    expect(await getIntegrity(7)).toEqual(integrityFixture)
  })
})
