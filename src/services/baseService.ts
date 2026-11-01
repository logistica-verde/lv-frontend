import { request } from '@/services/http'
import { baseListSchema, baseSchema } from '@/services/schemas/base'
import type { Base, BaseInput } from '@/services/schemas/base'

export function listBases(signal?: AbortSignal): Promise<Base[]> {
  return request('/api/bases', baseListSchema, { signal })
}

export function listAllBases(signal?: AbortSignal): Promise<Base[]> {
  return request('/api/bases?includeInactive=true', baseListSchema, { signal })
}

export function createBase(input: BaseInput): Promise<Base> {
  return request('/api/bases', baseSchema, { method: 'POST', body: input })
}

export function setBaseActive(id: number, ativo: boolean): Promise<Base> {
  return request(`/api/bases/${id}`, baseSchema, { method: 'PATCH', body: { ativo } })
}
