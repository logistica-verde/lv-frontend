import { describe, expect, it } from 'vitest'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import { seedDeliveryPoints, seedUsers, seedVehicles } from '@/mocks/seed'
import { getGaSettings, saveGaSettings } from '@/services/gaSettingsService'
import { DEFAULT_GA_SETTINGS } from '@/services/schemas/gaSettings'
import { listUsers, updateUser } from '@/services/userService'
import { listAllVehicles, listVehicles, setVehicleActive } from '@/services/vehicleService'
import { apiUrl } from '@/test/api'
import { server } from '@/test/server'

function useMockApi() {
  const db = createDb({
    vehicles: seedVehicles,
    users: seedUsers,
    deliveryPoints: seedDeliveryPoints,
  })
  server.use(...createHandlers(db, { latencyMs: 0, completionDelayMs: 30, anchoringDelayMs: 30 }))
  return db
}

describe('mock vehicle administration', () => {
  it('includes inactive vehicles only when asked to', async () => {
    useMockApi()

    const all = await listAllVehicles()
    const active = await listVehicles()

    expect(all.some((vehicle) => !vehicle.ativo)).toBe(true)
    expect(active.every((vehicle) => vehicle.ativo)).toBe(true)
    expect(all.length).toBeGreaterThan(active.length)
  })

  it('deactivates a vehicle so it leaves the active list, and reactivates it', async () => {
    useMockApi()
    const [first] = await listVehicles()

    const deactivated = await setVehicleActive(first?.id ?? 0, false)

    expect(deactivated.ativo).toBe(false)
    expect((await listVehicles()).map((vehicle) => vehicle.id)).not.toContain(first?.id)

    await setVehicleActive(first?.id ?? 0, true)

    expect((await listVehicles()).map((vehicle) => vehicle.id)).toContain(first?.id)
  })

  it('answers 404 for an unknown vehicle and 400 for a bad body', async () => {
    useMockApi()

    await expect(setVehicleActive(999, false)).rejects.toMatchObject({ status: 404 })
    const bad = await fetch(apiUrl('/api/vehicles/1'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: 'sim' }),
    })
    expect(bad.status).toBe(400)
  })
})

describe('mock users', () => {
  it('lists the seeded users with at least one of each profile', async () => {
    useMockApi()

    const users = await listUsers()

    expect(new Set(users.map((user) => user.perfil))).toEqual(
      new Set(['ADMIN', 'OPERATOR', 'AUDITOR']),
    )
  })

  it('changes the profile and the status of a user', async () => {
    useMockApi()
    const operator = (await listUsers()).find((user) => user.perfil === 'OPERATOR')

    const promoted = await updateUser(operator?.id ?? 0, { perfil: 'AUDITOR' })
    const deactivated = await updateUser(operator?.id ?? 0, { ativo: false })

    expect(promoted.perfil).toBe('AUDITOR')
    expect(deactivated).toMatchObject({ perfil: 'AUDITOR', ativo: false })
  })

  it('refuses to demote or deactivate the last active administrator', async () => {
    const db = useMockApi()
    const admins = db.users.filter((user) => user.perfil === 'ADMIN' && user.ativo)
    expect(admins).toHaveLength(1)
    const [only] = admins

    await expect(updateUser(only?.id ?? 0, { perfil: 'OPERATOR' })).rejects.toMatchObject({
      status: 409,
    })
    await expect(updateUser(only?.id ?? 0, { ativo: false })).rejects.toMatchObject({
      status: 409,
    })
  })

  it('allows demoting an administrator when another one remains', async () => {
    const db = useMockApi()
    const operator = db.users.find((user) => user.perfil === 'OPERATOR' && user.ativo)
    await updateUser(operator?.id ?? 0, { perfil: 'ADMIN' })
    const [first] = db.users.filter((user) => user.perfil === 'ADMIN')

    const demoted = await updateUser(first?.id ?? 0, { perfil: 'OPERATOR' })

    expect(demoted.perfil).toBe('OPERATOR')
  })

  it('answers 404 for an unknown user and 400 for an empty update', async () => {
    useMockApi()

    await expect(updateUser(999, { ativo: false })).rejects.toMatchObject({ status: 404 })
    const empty = await fetch(apiUrl('/api/users/1'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(empty.status).toBe(400)
  })
})

describe('mock algorithm settings', () => {
  it('starts with the default parameters', async () => {
    useMockApi()

    expect(await getGaSettings()).toEqual(DEFAULT_GA_SETTINGS)
  })

  it('stores the saved parameters', async () => {
    useMockApi()
    const settings = {
      populationSize: 250,
      generations: 400,
      crossoverRate: 0.9,
      mutationRate: 0.1,
    }

    expect(await saveGaSettings(settings)).toEqual(settings)
    expect(await getGaSettings()).toEqual(settings)
  })

  it('rejects out-of-range parameters with a 400', async () => {
    useMockApi()

    await expect(saveGaSettings({ ...DEFAULT_GA_SETTINGS, mutationRate: 2 })).rejects.toMatchObject(
      { status: 400 },
    )
    expect(await getGaSettings()).toEqual(DEFAULT_GA_SETTINGS)
  })
})
