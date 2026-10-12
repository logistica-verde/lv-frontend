import { request } from '@/services/http'
import { sessionSchema } from '@/services/schemas/auth'
import type { LoginInput, Session } from '@/services/schemas/auth'

export function login(input: LoginInput): Promise<Session> {
  return request('/api/auth/login', sessionSchema, {
    method: 'POST',
    body: input,
    authenticated: false,
  })
}
