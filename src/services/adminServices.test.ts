import { http, HttpResponse } from 'msw'
import type { DefaultBodyType } from 'msw'
import { describe, expect, it } from 'vitest'
import { getGaSettings, saveGaSettings } from '@/services/gaSettingsService'
import { DEFAULT_GA_SETTINGS } from '@/services/schemas/gaSettings'
import { listUsers, updateUser } from '@/services/userService'
import { listAllVehicles, setVehicleActive } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import { vehicleFixture } from '@/test/fixtures'
import { server } from '@/test/server'

const user = {
  id: 7,
  nome: 'Carlos Menezes',
  email: 'carlos@example.test',
  perfil: 'OPERATOR',
  ativo: true,
}

describe('vehicleService administration', () => {
  it('asks for inactive vehicles too', async () => {
    let query = ''
    server.use(
      http.get(apiUrl('/api/vehicles'), ({ request }) => {
        query = new URL(request.url).search
        return HttpResponse.json([vehicleFixture])
      }),
    )

    expect(await listAllVehicles()).toEqual([vehicleFixture])
    expect(query).toBe('?includeInactive=true')
  })

  it('changes the status with a PATCH carrying only the new status', async () => {
    let received: { method: string; body: DefaultBodyType; path: string } | null = null
    server.use(
      http.patch(apiUrl('/api/vehicles/:id'), async ({ request }) => {
        received = {
          method: request.method,
          body: await request.json(),
          path: new URL(request.url).pathname,
        }
        return HttpResponse.json({ ...vehicleFixture, ativo: false })
      }),
    )

    const updated = await setVehicleActive(4, false)

    expect(received).toEqual({ method: 'PATCH', body: { ativo: false }, path: '/api/vehicles/4' })
    expect(updated.ativo).toBe(false)
  })
})

describe('userService', () => {
  it('lists users', async () => {
    server.use(http.get(apiUrl('/api/users'), () => HttpResponse.json([user])))

    expect(await listUsers()).toEqual([user])
  })

  it('updates a user with a PATCH carrying only the changed fields', async () => {
    let body: DefaultBodyType = null
    server.use(
      http.patch(apiUrl('/api/users/7'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...user, perfil: 'AUDITOR' })
      }),
    )

    const updated = await updateUser(7, { perfil: 'AUDITOR' })

    expect(body).toEqual({ perfil: 'AUDITOR' })
    expect(updated.perfil).toBe('AUDITOR')
  })

  it('rejects a user with an unknown profile', async () => {
    server.use(
      http.get(apiUrl('/api/users'), () => HttpResponse.json([{ ...user, perfil: 'ROOT' }])),
    )

    await expect(listUsers()).rejects.toMatchObject({ name: 'ResponseFormatError' })
  })
})

describe('gaSettingsService', () => {
  it('reads the current parameters', async () => {
    server.use(http.get(apiUrl('/api/settings/ga'), () => HttpResponse.json(DEFAULT_GA_SETTINGS)))

    expect(await getGaSettings()).toEqual(DEFAULT_GA_SETTINGS)
  })

  it('saves the parameters with a PUT', async () => {
    let received: { method: string; body: DefaultBodyType } | null = null
    server.use(
      http.put(apiUrl('/api/settings/ga'), async ({ request }) => {
        received = { method: request.method, body: await request.json() }
        return HttpResponse.json(DEFAULT_GA_SETTINGS)
      }),
    )

    await saveGaSettings(DEFAULT_GA_SETTINGS)

    expect(received).toEqual({ method: 'PUT', body: DEFAULT_GA_SETTINGS })
  })
})
