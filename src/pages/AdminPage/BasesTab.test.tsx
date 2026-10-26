import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import AdminPage from '@/pages/AdminPage/AdminPage'
import type { Base } from '@/services/schemas/base'
import { DEFAULT_GA_SETTINGS } from '@/services/schemas/gaSettings'
import { apiUrl } from '@/test/api'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

type PostedBase = { nome: string; endereco?: string; latitude: number; longitude: number }

const central: Base = {
  id: 1,
  nome: 'Base Central',
  endereco: 'Praça da Sé',
  latitude: -23.5505,
  longitude: -46.6333,
  ativo: true,
}
const old: Base = { ...central, id: 2, nome: 'Base Antiga', endereco: null, ativo: false }

function useBasesApi(initial: Base[] = [central, old]) {
  const state = { bases: initial, posted: [] as PostedBase[], changes: [] as { id: number; ativo: boolean }[] }
  server.use(
    http.get(apiUrl('/api/bases'), () => HttpResponse.json(state.bases)),
    http.post(apiUrl('/api/bases'), async ({ request }) => {
      const body = (await request.json()) as PostedBase
      state.posted.push(body)
      const created: Base = {
        id: 10 + state.bases.length,
        nome: body.nome,
        endereco: body.endereco ?? null,
        latitude: body.latitude,
        longitude: body.longitude,
        ativo: true,
      }
      state.bases = [...state.bases, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(apiUrl('/api/bases/:id'), async ({ params, request }) => {
      const { ativo } = (await request.json()) as { ativo: boolean }
      const id = Number(params['id'])
      state.changes.push({ id, ativo })
      state.bases = state.bases.map((base) => (base.id === id ? { ...base, ativo } : base))
      return HttpResponse.json(state.bases.find((base) => base.id === id))
    }),
    http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
    http.get(apiUrl('/api/users'), () => HttpResponse.json([])),
    http.get(apiUrl('/api/settings/ga'), () => HttpResponse.json(DEFAULT_GA_SETTINGS)),
  )
  return state
}

async function openBases() {
  renderWithProviders(<AdminPage />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('tab', { name: 'Bases' }))
  return user
}

describe('Bases tab', () => {
  it('lists the registered bases with their situation', async () => {
    useBasesApi()

    await openBases()

    const table = await screen.findByRole('table', { name: 'Bases cadastradas' })
    expect(within(table).getByRole('rowheader', { name: 'Base Central' })).toBeVisible()
    expect(within(table).getByText('Praça da Sé')).toBeVisible()
    expect(within(table).getByText('Ativa')).toBeVisible()
    expect(within(table).getByText('Inativa')).toBeVisible()
  })

  it('shows an empty state when no base exists', async () => {
    useBasesApi([])

    await openBases()

    expect(await screen.findByText('Nenhuma base cadastrada')).toBeVisible()
  })

  it('registers a base with numeric coordinates only', async () => {
    const api = useBasesApi([])
    const user = await openBases()

    await user.click(await screen.findByRole('button', { name: 'Cadastrar base' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar base' })
    await user.type(within(dialog).getByLabelText('Nome'), 'Base Norte')
    await user.type(within(dialog).getByLabelText('Latitude'), '-23.5x')
    await user.type(within(dialog).getByLabelText('Longitude'), '-46.6')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar base' }))

    expect(await screen.findByText('Base Base Norte cadastrada.')).toBeVisible()
    expect(api.posted).toEqual([{ nome: 'Base Norte', latitude: -23.5, longitude: -46.6 }])
  })

  it('asks for the name and the coordinates', async () => {
    const api = useBasesApi([])
    const user = await openBases()

    await user.click(await screen.findByRole('button', { name: 'Cadastrar base' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar base' })
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar base' }))

    expect(await within(dialog).findByText('Informe o nome')).toBeVisible()
    expect(within(dialog).getByText('Informe a latitude')).toBeVisible()
    expect(within(dialog).getByText('Informe a longitude')).toBeVisible()
    expect(api.posted).toHaveLength(0)
  })

  it('deactivates and reactivates a base', async () => {
    const api = useBasesApi()
    const user = await openBases()

    await user.click(await screen.findByRole('button', { name: /Desativar.*Base Central/ }))
    await waitFor(() => expect(api.changes).toEqual([{ id: 1, ativo: false }]))
    await user.click(await screen.findByRole('button', { name: /Reativar.*Base Antiga/ }))

    await waitFor(() => expect(api.changes).toHaveLength(2))
    expect(api.changes[1]).toEqual({ id: 2, ativo: true })
  })
})
