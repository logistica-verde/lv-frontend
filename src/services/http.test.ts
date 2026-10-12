import { http, HttpResponse } from 'msw'
import type { DefaultBodyType } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError, NetworkError, ResponseFormatError } from '@/services/errors'
import { request } from '@/services/http'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'

const itemSchema = z.object({ id: z.number(), name: z.string() })

describe('request', () => {
  it('returns the response parsed with the schema', async () => {
    server.use(http.get(apiUrl('/api/items'), () => HttpResponse.json({ id: 1, name: 'a' })))

    const item = await request('/api/items', itemSchema)

    expect(item).toEqual({ id: 1, name: 'a' })
  })

  it('sends the body as JSON with the right headers', async () => {
    let contentType: string | null = null
    let received: DefaultBodyType
    server.use(
      http.post(apiUrl('/api/items'), async ({ request: incoming }) => {
        contentType = incoming.headers.get('content-type')
        received = await incoming.json()
        return HttpResponse.json({ id: 2, name: 'b' }, { status: 201 })
      }),
    )

    await request('/api/items', itemSchema, { method: 'POST', body: { name: 'b' } })

    expect(contentType).toBe('application/json')
    expect(received).toEqual({ name: 'b' })
  })

  it('turns a problem detail into an ApiError carrying status and detail', async () => {
    server.use(
      http.get(apiUrl('/api/items'), () =>
        HttpResponse.json({ status: 400, detail: 'Vehicle 1 is inactive' }, { status: 400 }),
      ),
    )

    const failure = request('/api/items', itemSchema)

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ status: 400, message: 'Vehicle 1 is inactive' })
  })

  it('falls back to the status text when the error body is not JSON', async () => {
    server.use(
      http.get(apiUrl('/api/items'), () =>
        HttpResponse.text('boom', { status: 500, statusText: 'Internal Server Error' }),
      ),
    )

    await expect(request('/api/items', itemSchema)).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })

  it('reports a NetworkError when the API cannot be reached', async () => {
    server.use(http.get(apiUrl('/api/items'), () => HttpResponse.error()))

    await expect(request('/api/items', itemSchema)).rejects.toBeInstanceOf(NetworkError)
  })

  it('reports a ResponseFormatError when the payload does not match the schema', async () => {
    server.use(http.get(apiUrl('/api/items'), () => HttpResponse.json({ id: 'not-a-number' })))

    await expect(request('/api/items', itemSchema)).rejects.toBeInstanceOf(ResponseFormatError)
  })

  it('reports a ResponseFormatError when a successful response has no JSON body', async () => {
    server.use(http.get(apiUrl('/api/items'), () => new HttpResponse(null, { status: 200 })))

    await expect(request('/api/items', itemSchema)).rejects.toBeInstanceOf(ResponseFormatError)
  })

  it('lets an aborted request surface as an AbortError', async () => {
    server.use(http.get(apiUrl('/api/items'), () => HttpResponse.json({ id: 1, name: 'a' })))
    const controller = new AbortController()
    controller.abort()

    await expect(
      request('/api/items', itemSchema, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
