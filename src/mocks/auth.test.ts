import { describe, expect, it } from 'vitest'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { MOCK_PASSWORD, seedDeliveryPoints, seedUsers, seedVehicles } from '@/mocks/seed'
import { setSession } from '@/lib/session'
import { login } from '@/services/authService'
import { getGaSettings } from '@/services/gaSettingsService'
import { getIntegrity } from '@/services/integrityService'
import { listUsers } from '@/services/userService'
import { createVehicle, listVehicles } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'

function useMockApi(requireAuth: boolean) {
  const db = createDb({
    vehicles: seedVehicles,
    users: seedUsers,
    deliveryPoints: seedDeliveryPoints,
  })
  server.use(
    ...createHandlers(db, {
      latencyMs: 0,
      completionDelayMs: 30,
      anchoringDelayMs: 30,
      requireAuth,
    }),
  )
  return db
}

function signInSeeded(perfil: 'ADMIN' | 'OPERATOR' | 'AUDITOR') {
  const user = seedUsers.find((candidate) => candidate.perfil === perfil && candidate.ativo)
  if (!user) {
    throw new Error(`No active ${perfil} in the seed`)
  }
  setSession({
    token: `mock-token-${user.id}`,
    usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
  })
}

function seeded(perfil: 'ADMIN' | 'OPERATOR' | 'AUDITOR') {
  const user = seedUsers.find((candidate) => candidate.perfil === perfil && candidate.ativo)
  if (!user) {
    throw new Error(`No active ${perfil} in the seed`)
  }
  return user
}

describe('mock login', () => {
  it('signs in a seeded user and returns who they are', async () => {
    useMockApi(false)
    const admin = seeded('ADMIN')

    const session = await login({ email: admin.email, senha: MOCK_PASSWORD })

    expect(session.usuario).toEqual({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      perfil: 'ADMIN',
    })
    expect(session.token).toBeTruthy()
  })

  it('ignores the case of the e-mail', async () => {
    useMockApi(false)
    const admin = seeded('ADMIN')

    const session = await login({ email: admin.email.toUpperCase(), senha: MOCK_PASSWORD })

    expect(session.usuario.id).toBe(admin.id)
  })

  it('answers 401 for a wrong password and for an unknown e-mail alike', async () => {
    useMockApi(false)
    const admin = seeded('ADMIN')

    await expect(login({ email: admin.email, senha: 'errada' })).rejects.toMatchObject({
      status: 401,
    })
    await expect(
      login({ email: 'ninguem@example.test', senha: MOCK_PASSWORD }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('answers 403 for a deactivated user', async () => {
    useMockApi(false)
    const inactive = seedUsers.find((user) => !user.ativo)

    await expect(
      login({ email: inactive?.email ?? '', senha: MOCK_PASSWORD }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('answers 400 for a body that is not a login', async () => {
    useMockApi(false)

    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sem-arroba', senha: '' }),
    })

    expect(response.status).toBe(400)
  })
})

describe('mock access control', () => {
  it('lets everything through when authentication is not required', async () => {
    useMockApi(false)

    expect((await listVehicles()).length).toBeGreaterThan(0)
  })

  it('answers 401 without a token', async () => {
    useMockApi(true)

    await expect(listVehicles()).rejects.toMatchObject({ status: 401 })
  })

  it('answers 401 for a token that is not from the mock', async () => {
    useMockApi(true)
    setSession({
      token: 'forged',
      usuario: { id: 1, nome: 'X', email: 'x@example.test', perfil: 'ADMIN' },
    })

    await expect(listVehicles()).rejects.toMatchObject({ status: 401 })
  })

  it('answers 401 for the token of a deactivated user', async () => {
    useMockApi(true)
    const inactive = seedUsers.find((user) => !user.ativo)
    setSession({
      token: `mock-token-${inactive?.id}`,
      usuario: { id: 5, nome: 'X', email: 'x@example.test', perfil: 'OPERATOR' },
    })

    await expect(listVehicles()).rejects.toMatchObject({ status: 401 })
  })

  it('lets an operator read vehicles but not administer users or settings', async () => {
    useMockApi(true)
    signInSeeded('OPERATOR')

    expect((await listVehicles()).length).toBeGreaterThan(0)
    await expect(listUsers()).rejects.toMatchObject({ status: 403 })
    await expect(getGaSettings()).rejects.toMatchObject({ status: 403 })
    await expect(
      createVehicle({ placa: 'NEW1A11', massaKg: 100, tipoCombustivel: 'gnv', imagem: 'van' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('keeps the integrity report to auditors and administrators', async () => {
    useMockApi(true)

    signInSeeded('OPERATOR')
    await expect(getIntegrity(1)).rejects.toMatchObject({ status: 403 })

    signInSeeded('AUDITOR')
    await expect(getIntegrity(1)).rejects.toMatchObject({ status: 404 })
  })

  it('lets an administrator do the administration', async () => {
    useMockApi(true)
    signInSeeded('ADMIN')

    expect((await listUsers()).length).toBeGreaterThan(0)
    expect((await getGaSettings()).populationSize).toBeGreaterThan(0)
    expect(
      await createVehicle({
        placa: 'NEW1A11',
        massaKg: 100,
        tipoCombustivel: 'gnv',
        imagem: 'van',
      }),
    ).toMatchObject({ placa: 'NEW1A11' })
  })
})
