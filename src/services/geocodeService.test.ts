import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { ApiError, NetworkError, ResponseFormatError } from '@/services/errors'
import { searchAddress } from '@/services/geocodeService'
import { server } from '@/test/server'

const GEOCODER = env.geocoderUrl

describe('searchAddress', () => {
  it('turns the geocoder answer into labelled coordinates', async () => {
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

  it('asks for Brazilian results in Portuguese, at most five', async () => {
    let requested = new URL('http://localhost')
    server.use(
      http.get(GEOCODER, ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json([])
      }),
    )

    await searchAddress('Av. Paulista, 1578')

    expect(requested.searchParams.get('q')).toBe('Av. Paulista, 1578')
    expect(requested.searchParams.get('countrycodes')).toBe('br')
    expect(requested.searchParams.get('accept-language')).toBe('pt-BR')
    expect(requested.searchParams.get('limit')).toBe('5')
    expect(requested.searchParams.get('format')).toBe('jsonv2')
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

    expect((await searchAddress('x')).map((match) => match.label)).toEqual(['Bom'])
  })

  it('reports an HTTP failure', async () => {
    server.use(http.get(GEOCODER, () => new HttpResponse(null, { status: 429 })))

    await expect(searchAddress('x')).rejects.toMatchObject({ status: 429 })
    await expect(searchAddress('x')).rejects.toBeInstanceOf(ApiError)
  })

  it('reports an answer in an unexpected format', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json({ results: [] })))

    await expect(searchAddress('x')).rejects.toBeInstanceOf(ResponseFormatError)
  })

  it('reports an unreachable service', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.error()))

    await expect(searchAddress('x')).rejects.toBeInstanceOf(NetworkError)
  })
})
