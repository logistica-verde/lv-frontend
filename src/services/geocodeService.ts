import { z } from 'zod'
import { env } from '@/config/env'
import { ApiError, NetworkError, ResponseFormatError } from '@/services/errors'

const MAX_RESULTS = 5

const searchResponseSchema = z.array(
  z.object({
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
  }),
)

export type AddressMatch = {
  label: string
  latitude: number
  longitude: number
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressMatch[]> {
  const url = new URL(env.geocoderUrl, window.location.origin)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', String(MAX_RESULTS))
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('accept-language', 'pt-BR')

  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    throw new NetworkError()
  }
  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  const parsed = searchResponseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    throw new ResponseFormatError(url.pathname)
  }
  return parsed.data
    .map((item) => ({
      label: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }))
    .filter((match) => Number.isFinite(match.latitude) && Number.isFinite(match.longitude))
}
