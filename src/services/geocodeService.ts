import { z } from 'zod'
import { AddressSearchUnavailableError, ApiError } from '@/services/errors'
import { request } from '@/services/http'

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
  let matches: z.infer<typeof searchResponseSchema>
  try {
    matches = await request(`/api/geocode?q=${encodeURIComponent(query)}`, searchResponseSchema, {
      signal,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      throw new AddressSearchUnavailableError()
    }
    throw error
  }
  return matches
    .map((item) => ({
      label: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }))
    .filter((match) => Number.isFinite(match.latitude) && Number.isFinite(match.longitude))
}
