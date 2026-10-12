import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { getSession } from '@/lib/session'
import {
  AddressSearchUnavailableError,
  ApiError,
  NetworkError,
  ResponseFormatError,
} from '@/services/errors'
import { searchAddress } from '@/services/geocodeService'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

const GEOCODER = apiUrl('/api/geocode')

describe('searchAddress', () => {
  it('turns the answer into labelled coordinates', async () => {
    server.use(
      http.get(GEOCODER, () =>
        HttpResponse.json([
          { display_name: 'Praça da Sé, São Paulo', lat: '-23.5505', lon: '-46.6333' },
        ]),
      ),
    )

    expect(await searchAddress('praça da sé')).toEqual([
      { label: 'Praça da Sé, São Paulo', latitude: -23.5505, longitude: -46.6333 },
    ])
  })

  it('asks our API with the text, and nothing else, as the query', async () => {
    let requested = new URL('http://localhost')
    server.use(
      http.get(GEOCODER, ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json([])
      }),
    )

    await searchAddress('Av. Paulista, 1578 & Cia')

    expect([...requested.searchParams.keys()]).toEqual(['q'])
    expect(requested.searchParams.get('q')).toBe('Av. Paulista, 1578 & Cia')
  })

  it('sends the token of the signed-in user', async () => {
    signInAs('OPERATOR')
    let authorization: string | null = null
    server.use(
      http.get(GEOCODER, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await searchAddress('Avenida Paulista')

    expect(authorization).toBe('Bearer test-token-OPERATOR')
  })

  it('ends the session when the token is no longer valid', async () => {
    signInAs('OPERATOR')
    server.use(
      http.get(GEOCODER, () =>
        HttpResponse.json({ status: 401, detail: 'expired' }, { status: 401 }),
      ),
    )

    await expect(searchAddress('Avenida Paulista')).rejects.toMatchObject({ status: 401 })

    expect(getSession()).toBeNull()
  })

  it('returns an empty list when nothing matches', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json([])))

    expect(await searchAddress('xyzxyz')).toEqual([])
  })

  it('drops results whose coordinates are not numbers', async () => {
    server.use(
      http.get(GEOCODER, () =>
        HttpResponse.json([
          { display_name: 'Bom', lat: '-23.5', lon: '-46.6' },
          { display_name: 'Ruim', lat: 'abc', lon: '-46.6' },
        ]),
      ),
    )

    expect((await searchAddress('xyz')).map((match) => match.label)).toEqual(['Bom'])
  })

  it('reports an HTTP failure', async () => {
    server.use(http.get(GEOCODER, () => new HttpResponse(null, { status: 429 })))

    await expect(searchAddress('xyz')).rejects.toMatchObject({ status: 429 })
    await expect(searchAddress('xyz')).rejects.toBeInstanceOf(ApiError)
  })

  it('tells apart an unavailable address search from other 5xx errors', async () => {
    server.use(
      http.get(GEOCODER, () =>
        HttpResponse.json(
          { status: 503, detail: 'The address search service is unavailable.' },
          { status: 503 },
        ),
      ),
    )

    await expect(searchAddress('xyz')).rejects.toBeInstanceOf(AddressSearchUnavailableError)
  })

  it('keeps an internal error as an API error', async () => {
    server.use(http.get(GEOCODER, () => new HttpResponse(null, { status: 500 })))

    await expect(searchAddress('xyz')).rejects.toBeInstanceOf(ApiError)
  })

  it('reports an answer in an unexpected format', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json({ results: [] })))

    await expect(searchAddress('xyz')).rejects.toBeInstanceOf(ResponseFormatError)
  })

  it('reports an unreachable service', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.error()))

    await expect(searchAddress('xyz')).rejects.toBeInstanceOf(NetworkError)
  })
})
