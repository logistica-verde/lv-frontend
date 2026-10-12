import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { getSession } from '@/lib/session'
import { login } from '@/services/authService'
import { listVehicles } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import { vehicleFixture } from '@/test/fixtures'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

const sessionPayload = {
  token: 'jwt',
  usuario: { id: 1, nome: 'Marina Duarte', email: 'm@example.test', perfil: 'ADMIN' },
}

describe('authService', () => {
  it('posts the credentials and returns the session', async () => {
    let received: { method: string; authorization: string | null } | null = null
    server.use(
      http.post(apiUrl('/api/auth/login'), ({ request }) => {
        received = { method: request.method, authorization: request.headers.get('Authorization') }
        return HttpResponse.json(sessionPayload)
      }),
    )

    const session = await login({ email: 'm@example.test', senha: 'segredo' })

    expect(session).toEqual(sessionPayload)
    expect(received).toEqual({ method: 'POST', authorization: null })
  })

  it('does not send a stale token when signing in again', async () => {
    signInAs('OPERATOR')
    let authorization: string | null = 'unset'
    server.use(
      http.post(apiUrl('/api/auth/login'), ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json(sessionPayload)
      }),
    )

    await login({ email: 'm@example.test', senha: 'segredo' })

    expect(authorization).toBeNull()
  })

  it('rejects a session with an unknown profile', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json({
          ...sessionPayload,
          usuario: { ...sessionPayload.usuario, perfil: 'ROOT' },
        }),
      ),
    )

    await expect(login({ email: 'm@example.test', senha: 'x' })).rejects.toMatchObject({
      name: 'ResponseFormatError',
    })
  })
})

describe('authenticated requests', () => {
  it('send the bearer token of the current session', async () => {
    signInAs('ADMIN')
    let authorization: string | null = null
    server.use(
      http.get(apiUrl('/api/vehicles'), ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json([vehicleFixture])
      }),
    )

    await listVehicles()

    expect(authorization).toBe('Bearer test-token-ADMIN')
  })

  it('send no authorization header without a session', async () => {
    let authorization: string | null = 'unset'
    server.use(
      http.get(apiUrl('/api/vehicles'), ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json([vehicleFixture])
      }),
    )

    await listVehicles()

    expect(authorization).toBeNull()
  })

  it('end the session when the API says the token is no longer valid', async () => {
    signInAs('ADMIN')
    server.use(
      http.get(apiUrl('/api/vehicles'), () =>
        HttpResponse.json({ status: 401, detail: 'expired' }, { status: 401 }),
      ),
    )

    await expect(listVehicles()).rejects.toMatchObject({ status: 401 })

    expect(getSession()).toBeNull()
  })

  it('keep the session when the API refuses with 403', async () => {
    signInAs('OPERATOR')
    server.use(
      http.get(apiUrl('/api/vehicles'), () =>
        HttpResponse.json({ status: 403, detail: 'denied' }, { status: 403 }),
      ),
    )

    await expect(listVehicles()).rejects.toMatchObject({ status: 403 })

    expect(getSession()).not.toBeNull()
  })
})
