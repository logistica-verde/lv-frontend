import { request } from '@/services/http'
import { gaSettingsSchema } from '@/services/schemas/gaSettings'
import type { GaSettings } from '@/services/schemas/gaSettings'

export function getGaSettings(signal?: AbortSignal): Promise<GaSettings> {
  return request('/api/settings/ga', gaSettingsSchema, { signal })
}

export function saveGaSettings(settings: GaSettings): Promise<GaSettings> {
  return request('/api/settings/ga', gaSettingsSchema, { method: 'PUT', body: settings })
}
