import { request } from '@/services/http'
import { userListSchema, userSchema } from '@/services/schemas/user'
import type { User, UserUpdate } from '@/services/schemas/user'

export function listUsers(signal?: AbortSignal): Promise<User[]> {
  return request('/api/users', userListSchema, { signal })
}

export function updateUser(id: number, update: UserUpdate): Promise<User> {
  return request(`/api/users/${id}`, userSchema, { method: 'PATCH', body: update })
}
