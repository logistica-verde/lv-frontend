import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ResponseFormatError } from '@/services/errors'
import { listOperations } from '@/services/operationService'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'

const page = {
  items: [
    {
      id: 7,
      createdAt: '2026-10-05T12:00:00.000Z',
      vehicleId: 1,
      vehiclePlate: 'ABC1D23',
      criterion: 'EMISSION',
      status: 'COMPLETED',
      totalEmissionKg: 5.5,
      totalDistanceMeters: 2022.5,
      integrityStatus: 'VALID',
    },
  ],
  total: 1,
  page: 1,
  size: 10,
}

function captureRequest() {
  const captured = { url: new URL('http://localhost') }
  server.use(
    http.get(apiUrl('/api/routes'), ({ request }) => {
      captured.url = new URL(request.url)
      return HttpResponse.json(page)
    }),
  )
  return captured
}

describe('listOperations', () => {
  it('parses a page of operations', async () => {
    captureRequest()

    expect(
      await listOperations({ sort: 'createdAt', direction: 'desc', page: 1, size: 10 }),
    ).toEqual(page)
  })

  it('always sends the sorting and the paging', async () => {
    const captured = captureRequest()

    await listOperations({ sort: 'totalEmissionKg', direction: 'asc', page: 3, size: 8 })

    expect(Object.fromEntries(captured.url.searchParams)).toEqual({
      sort: 'totalEmissionKg',
      direction: 'asc',
      page: '3',
      size: '8',
    })
  })

  it('sends only the filters that were set', async () => {
    const captured = captureRequest()

    await listOperations({
      from: '2026-10-01',
      to: '2026-10-31',
      vehicleId: 2,
      criterion: 'DISTANCE',
      integrity: 'TAMPERED',
      sort: 'createdAt',
      direction: 'desc',
      page: 1,
      size: 10,
    })

    expect(Object.fromEntries(captured.url.searchParams)).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-31',
      vehicleId: '2',
      criterion: 'DISTANCE',
      integrity: 'TAMPERED',
    })
  })

  it('leaves unset filters out of the address', async () => {
    const captured = captureRequest()

    await listOperations({ sort: 'createdAt', direction: 'desc', page: 1, size: 10 })

    expect(captured.url.searchParams.has('from')).toBe(false)
    expect(captured.url.searchParams.has('vehicleId')).toBe(false)
    expect(captured.url.searchParams.has('criterion')).toBe(false)
    expect(captured.url.searchParams.has('integrity')).toBe(false)
  })

  it('rejects an answer in an unexpected format', async () => {
    server.use(http.get(apiUrl('/api/routes'), () => HttpResponse.json({ items: 'x' })))

    await expect(
      listOperations({ sort: 'createdAt', direction: 'desc', page: 1, size: 10 }),
    ).rejects.toBeInstanceOf(ResponseFormatError)
  })
})
