import { describe, expect, it } from 'vitest'
import { deliveryPointInputSchema, deliveryPointSchema } from '@/services/schemas/deliveryPoint'
import { integrityReportSchema } from '@/services/schemas/integrity'
import { routeInputSchema, routeSchema } from '@/services/schemas/route'
import { vehicleInputSchema, vehicleSchema } from '@/services/schemas/vehicle'
import {
  completedRouteFixture,
  deliveryPointFixture,
  integrityFixture,
  vehicleFixture,
} from '@/test/fixtures'

describe('response schemas', () => {
  it('accept the shapes returned by lv-api', () => {
    expect(vehicleSchema.safeParse(vehicleFixture).success).toBe(true)
    expect(deliveryPointSchema.safeParse(deliveryPointFixture).success).toBe(true)
    expect(routeSchema.safeParse(completedRouteFixture).success).toBe(true)
    expect(integrityReportSchema.safeParse(integrityFixture).success).toBe(true)
  })

  it('accept a pending route, whose results are still null', () => {
    const pending = {
      ...completedRouteFixture,
      status: 'PENDING',
      totalEmissionKg: null,
      totalDistanceMeters: null,
      segments: [],
    }

    expect(routeSchema.safeParse(pending).success).toBe(true)
  })

  it('accept an integrity report that is not anchored yet', () => {
    const notAnchored = {
      ...integrityFixture,
      status: 'NOT_ANCHORED',
      ledgerHash: null,
      txHash: null,
      blockNumber: null,
      anchoredAt: null,
    }

    expect(integrityReportSchema.safeParse(notAnchored).success).toBe(true)
  })

  it('reject an unknown status', () => {
    expect(routeSchema.safeParse({ ...completedRouteFixture, status: 'RUNNING' }).success).toBe(
      false,
    )
  })
})

describe('vehicleInputSchema', () => {
  const valid = { placa: 'ABC1D23', massaKg: 7500, tipoCombustivel: 'diesel' }

  it('accepts a valid vehicle and trims text', () => {
    const parsed = vehicleInputSchema.parse({ ...valid, placa: '  ABC1D23  ' })

    expect(parsed.placa).toBe('ABC1D23')
  })

  it.each([
    ['blank plate', { ...valid, placa: '   ' }],
    ['plate longer than 10 characters', { ...valid, placa: 'ABCDEFGHIJK' }],
    ['zero mass', { ...valid, massaKg: 0 }],
    ['negative mass', { ...valid, massaKg: -5 }],
    ['blank fuel type', { ...valid, tipoCombustivel: '' }],
  ])('rejects %s', (_name, input) => {
    expect(vehicleInputSchema.safeParse(input).success).toBe(false)
  })
})

describe('deliveryPointInputSchema', () => {
  const valid = { nome: 'Centro', latitude: -23.55, longitude: -46.63 }

  it('accepts a valid point without address', () => {
    expect(deliveryPointInputSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['blank name', { ...valid, nome: ' ' }],
    ['latitude above 90', { ...valid, latitude: 90.1 }],
    ['latitude below -90', { ...valid, latitude: -90.1 }],
    ['longitude above 180', { ...valid, longitude: 181 }],
    ['longitude below -180', { ...valid, longitude: -181 }],
  ])('rejects %s', (_name, input) => {
    expect(deliveryPointInputSchema.safeParse(input).success).toBe(false)
  })

  it('accepts the coordinate limits', () => {
    expect(
      deliveryPointInputSchema.safeParse({ nome: 'Polo', latitude: -90, longitude: 180 }).success,
    ).toBe(true)
  })
})

describe('routeInputSchema', () => {
  const valid = { vehicleId: 1, deliveryPointIds: [1, 2], criterion: 'EMISSION' }

  it('accepts between 2 and 30 points', () => {
    expect(routeInputSchema.safeParse(valid).success).toBe(true)
    const thirty = { ...valid, deliveryPointIds: Array.from({ length: 30 }, (_, i) => i + 1) }
    expect(routeInputSchema.safeParse(thirty).success).toBe(true)
  })

  it('rejects fewer than 2 or more than 30 points', () => {
    expect(routeInputSchema.safeParse({ ...valid, deliveryPointIds: [1] }).success).toBe(false)
    const thirtyOne = { ...valid, deliveryPointIds: Array.from({ length: 31 }, (_, i) => i + 1) }
    expect(routeInputSchema.safeParse(thirtyOne).success).toBe(false)
  })

  it('rejects an unknown criterion', () => {
    expect(routeInputSchema.safeParse({ ...valid, criterion: 'CHEAPEST' }).success).toBe(false)
  })
})
