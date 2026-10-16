import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import AdminPage from '@/pages/AdminPage/AdminPage'
import { DEFAULT_GA_SETTINGS, gaSettingsSchema } from '@/services/schemas/gaSettings'
import type { GaSettings } from '@/services/schemas/gaSettings'
import { roleSchema, userUpdateSchema } from '@/services/schemas/user'
import type { User, UserUpdate } from '@/services/schemas/user'
import { vehicleImageSchema } from '@/services/schemas/vehicle'
import type { Vehicle } from '@/services/schemas/vehicle'
import { apiUrl } from '@/test/api'
import { vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const postedVehicleSchema = z.object({
  placa: z.string(),
  massaKg: z.number(),
  tipoCombustivel: z.string(),
  imagem: vehicleImageSchema,
})

const vehicleStatusSchema = z.object({ ativo: z.boolean() })

const activeVehicle: Vehicle = { ...vehicleFixture, id: 1, placa: 'ABC1D23' }
const inactiveVehicle: Vehicle = { ...vehicleFixture, id: 2, placa: 'OLD0A00', ativo: false }

const admin: User = {
  id: 1,
  nome: 'Marina Duarte',
  email: 'marina@example.test',
  perfil: 'ADMIN',
  ativo: true,
}
const operator: User = {
  id: 2,
  nome: 'Carlos Menezes',
  email: 'carlos@example.test',
  perfil: 'OPERATOR',
  ativo: true,
}
const former: User = {
  id: 3,
  nome: 'Beatriz Nogueira',
  email: 'beatriz@example.test',
  perfil: 'OPERATOR',
  ativo: false,
}

type AdminApi = {
  vehicles: Vehicle[]
  users: User[]
  settings: GaSettings
  postedVehicles: z.infer<typeof postedVehicleSchema>[]
  vehicleChanges: { id: number; ativo: boolean }[]
  userChanges: { id: number; update: UserUpdate }[]
  savedSettings: GaSettings[]
}

function useAdminApi(initial: Partial<Pick<AdminApi, 'vehicles' | 'users'>> = {}): AdminApi {
  const api: AdminApi = {
    vehicles: [activeVehicle, inactiveVehicle],
    users: [admin, operator, former],
    settings: { ...DEFAULT_GA_SETTINGS },
    postedVehicles: [],
    vehicleChanges: [],
    userChanges: [],
    savedSettings: [],
    ...initial,
  }
  server.use(
    http.get(apiUrl('/api/vehicles'), () => HttpResponse.json(api.vehicles)),
    http.post(apiUrl('/api/vehicles'), async ({ request }) => {
      const body = postedVehicleSchema.parse(await request.json())
      api.postedVehicles.push(body)
      const created: Vehicle = { ...vehicleFixture, ...body, id: api.vehicles.length + 10 }
      api.vehicles.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(apiUrl('/api/vehicles/:id'), async ({ params, request }) => {
      const { ativo } = vehicleStatusSchema.parse(await request.json())
      const id = Number(params['id'])
      api.vehicleChanges.push({ id, ativo })
      api.vehicles = api.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ativo } : vehicle,
      )
      return HttpResponse.json(api.vehicles.find((vehicle) => vehicle.id === id))
    }),
    http.get(apiUrl('/api/users'), () => HttpResponse.json(api.users)),
    http.patch(apiUrl('/api/users/:id'), async ({ params, request }) => {
      const update = userUpdateSchema.parse(await request.json())
      const id = Number(params['id'])
      api.userChanges.push({ id, update })
      api.users = api.users.map((user) => (user.id === id ? { ...user, ...update } : user))
      return HttpResponse.json(api.users.find((user) => user.id === id))
    }),
    http.get(apiUrl('/api/settings/ga'), () => HttpResponse.json(api.settings)),
    http.put(apiUrl('/api/settings/ga'), async ({ request }) => {
      const body = gaSettingsSchema.parse(await request.json())
      api.savedSettings.push(body)
      api.settings = body
      return HttpResponse.json(body)
    }),
  )
  return api
}

async function openTab(name: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('tab', { name }))
  return user
}

describe('AdminPage', () => {
  it('has a tab for vehicles, users and algorithm parameters, starting on vehicles', async () => {
    useAdminApi()

    renderWithProviders(<AdminPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Administração' })).toBeVisible()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Veículos',
      'Usuários e perfis',
      'Parâmetros do AG',
    ])
    expect(screen.getByRole('tab', { name: 'Veículos' })).toHaveAttribute('aria-selected', 'true')
    expect(document.title).toBe('Administração · Lastro')
  })
})

describe('AdminPage vehicles', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('lists active and inactive vehicles with their status', async () => {
    useAdminApi()

    renderWithProviders(<AdminPage />)

    const table = await screen.findByRole('table', { name: 'Veículos cadastrados' })
    const rows = within(table).getAllByRole('row')
    expect(within(rows[1] as HTMLElement).getByText('Ativo')).toBeVisible()
    expect(within(rows[2] as HTMLElement).getByText('Inativo')).toBeVisible()
    expect(within(table).getByRole('rowheader', { name: 'OLD0A00' })).toBeVisible()
  })

  it('shows the picture, type, gross mass and fuel of each vehicle', async () => {
    useAdminApi()

    renderWithProviders(<AdminPage />)

    const table = await screen.findByRole('table', { name: 'Veículos cadastrados' })
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Imagem', 'Placa', 'Tipo', 'Massa bruta (kg)', 'Combustível', 'Situação', 'Ação'])
    const row = within(table).getAllByRole('row')[1] as HTMLElement
    expect(within(row).getByRole('rowheader', { name: 'ABC1D23' })).toBeVisible()
    expect(
      within(row)
        .getAllByRole('cell')
        .slice(0, 4)
        .map((cell) => cell.textContent),
    ).toEqual(['', 'Caminhão', '7.500', 'Diesel'])
  })

  it('counts the vehicles and how many are active', async () => {
    useAdminApi()

    renderWithProviders(<AdminPage />)

    expect(await screen.findByText('2 veículos · 1 ativo')).toBeVisible()
  })

  it('says what the page is for', async () => {
    useAdminApi()

    renderWithProviders(<AdminPage />)

    expect(
      await screen.findByText(
        'Veículos usados nos cálculos, perfis de acesso e parâmetros do algoritmo genético.',
      ),
    ).toBeVisible()
  })

  it('shows an empty state when there is no vehicle', async () => {
    useAdminApi({ vehicles: [] })

    renderWithProviders(<AdminPage />)

    expect(await screen.findByRole('heading', { name: 'Nenhum veículo cadastrado' })).toBeVisible()
  })

  it('explains a failure to load and recovers on retry', async () => {
    let calls = 0
    useAdminApi()
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([activeVehicle])
      }),
    )
    renderWithProviders(<AdminPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('table')).toBeVisible()
  })

  it('asks for every required field and sends nothing when the form is empty', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar veículo' })
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await within(dialog).findByText('Informe a placa')).toBeVisible()
    expect(within(dialog).getByText('Informe a massa')).toBeVisible()
    expect(within(dialog).getByText('Informe o tipo de combustível')).toBeVisible()
    expect(api.postedVehicles).toHaveLength(0)
  })

  it('registers a vehicle from the dialog, closes it and refreshes the list', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar veículo' })
    await user.type(within(dialog).getByLabelText('Placa'), '  NEW1A11  ')
    await user.type(within(dialog).getByLabelText('Massa (kg)'), '3000')
    await user.type(within(dialog).getByLabelText('Tipo de combustível'), 'gnv')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Veículo NEW1A11 cadastrado.')).toBeVisible()
    expect(api.postedVehicles).toEqual([
      { placa: 'NEW1A11', massaKg: 3000, tipoCombustivel: 'gnv', imagem: 'truck' },
    ])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('rowheader', { name: 'NEW1A11' })).toBeVisible()
  })

  it('lets the user choose the vehicle image, starting with the truck selected', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar veículo' })
    const group = within(dialog).getByRole('group', { name: 'Imagem do veículo' })
    expect(within(group).getAllByRole('radio')).toHaveLength(6)
    expect(within(group).getByRole('radio', { name: 'Caminhão' })).toBeChecked()
    await user.click(within(group).getByRole('radio', { name: 'Van' }))
    await user.type(within(dialog).getByLabelText('Placa'), 'VAN1A11')
    await user.type(within(dialog).getByLabelText('Massa (kg)'), '1800')
    await user.type(within(dialog).getByLabelText('Tipo de combustível'), 'etanol')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Veículo VAN1A11 cadastrado.')).toBeVisible()
    expect(api.postedVehicles).toEqual([
      { placa: 'VAN1A11', massaKg: 1800, tipoCombustivel: 'etanol', imagem: 'van' },
    ])
  })

  it('keeps the dialog open and shows the API message when registering fails', async () => {
    useAdminApi()
    server.use(
      http.post(apiUrl('/api/vehicles'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
    const dialog = screen.getByRole('dialog', { name: 'Cadastrar veículo' })
    await user.type(within(dialog).getByLabelText('Placa'), 'ABC1D23')
    await user.type(within(dialog).getByLabelText('Massa (kg)'), '3000')
    await user.type(within(dialog).getByLabelText('Tipo de combustível'), 'diesel')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
    expect(screen.getByRole('dialog', { name: 'Cadastrar veículo' })).toBeVisible()
  })

  it('suggests common fuel types without restricting the field', async () => {
    useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    const input = screen.getByLabelText('Tipo de combustível')
    const options = document
      .getElementById(input.getAttribute('list') ?? '')
      ?.querySelectorAll('option')
    expect(Array.from(options ?? []).map((option) => option.value)).toEqual([
      'diesel',
      'gasolina',
      'etanol',
      'gnv',
    ])
  })

  it('asks for confirmation before deactivating and then deactivates', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Desativar veículo ABC1D23' }))
    const dialog = screen.getByRole('dialog', { name: 'Desativar veículo' })
    expect(dialog).toHaveTextContent('ABC1D23')
    expect(api.vehicleChanges).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Desativar veículo' }))

    expect(await screen.findByText('Veículo ABC1D23 desativado.')).toBeVisible()
    expect(api.vehicleChanges).toEqual([{ id: 1, ativo: false }])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does nothing when the user cancels the deactivation', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Desativar veículo ABC1D23' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.vehicleChanges).toHaveLength(0)
  })

  it('reactivates an inactive vehicle without asking', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Reativar veículo OLD0A00' }))

    expect(await screen.findByText('Veículo OLD0A00 reativado.')).toBeVisible()
    expect(api.vehicleChanges).toEqual([{ id: 2, ativo: true }])
  })
})

describe('AdminPage users', () => {
  it('lists every user with their profile and status', async () => {
    useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    const table = await screen.findByRole('table', { name: 'Usuários e seus perfis' })

    expect(within(table).getByRole('rowheader', { name: 'Marina Duarte' })).toBeVisible()
    expect(within(table).getByText('carlos@example.test')).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Perfil de Marina Duarte' })).toHaveValue('ADMIN')
    expect(screen.getByRole('combobox', { name: 'Perfil de Carlos Menezes' })).toHaveValue(
      'OPERATOR',
    )
    expect(within(table).getByText('Inativo')).toBeVisible()
    expect(user).toBeDefined()
  })

  it('offers the three profiles', async () => {
    useAdminApi()
    renderWithProviders(<AdminPage />)
    await openTab('Usuários e perfis')

    const select = await screen.findByRole('combobox', { name: 'Perfil de Carlos Menezes' })

    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Operador', 'Auditor', 'Administrador'])
    expect(roleSchema.options).toEqual(['OPERATOR', 'AUDITOR', 'ADMIN'])
  })

  it('confirms a profile change before sending it', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Perfil de Carlos Menezes' }),
      'AUDITOR',
    )
    const dialog = screen.getByRole('dialog', { name: 'Alterar perfil' })
    expect(dialog).toHaveTextContent('Carlos Menezes')
    expect(dialog).toHaveTextContent('Auditor')
    expect(api.userChanges).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Alterar perfil' }))

    expect(await screen.findByText('Perfil de Carlos Menezes alterado para Auditor.')).toBeVisible()
    expect(api.userChanges).toEqual([{ id: 2, update: { perfil: 'AUDITOR' } }])
    expect(screen.getByRole('combobox', { name: 'Perfil de Carlos Menezes' })).toHaveValue(
      'AUDITOR',
    )
  })

  it('keeps the profile when the change is cancelled', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Perfil de Carlos Menezes' }),
      'ADMIN',
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(api.userChanges).toHaveLength(0)
    expect(screen.getByRole('combobox', { name: 'Perfil de Carlos Menezes' })).toHaveValue(
      'OPERATOR',
    )
  })

  it('asks before deactivating a user and then deactivates', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    await user.click(
      await screen.findByRole('button', { name: 'Desativar usuário Carlos Menezes' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Desativar usuário' })
    await user.click(within(dialog).getByRole('button', { name: 'Desativar usuário' }))

    expect(await screen.findByText('Carlos Menezes foi desativado.')).toBeVisible()
    expect(api.userChanges).toEqual([{ id: 2, update: { ativo: false } }])
  })

  it('reactivates a user without asking', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    await user.click(
      await screen.findByRole('button', { name: 'Reativar usuário Beatriz Nogueira' }),
    )

    expect(await screen.findByText('Beatriz Nogueira foi reativado.')).toBeVisible()
    expect(api.userChanges).toEqual([{ id: 3, update: { ativo: true } }])
  })

  it('explains that the last administrator cannot be removed', async () => {
    useAdminApi()
    server.use(
      http.patch(apiUrl('/api/users/:id'), () =>
        HttpResponse.json({ status: 409, detail: 'last admin' }, { status: 409 }),
      ),
    )
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    await user.click(await screen.findByRole('button', { name: 'Desativar usuário Marina Duarte' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Desativar usuário' })).getByRole('button', {
        name: 'Desativar usuário',
      }),
    )

    expect(
      await screen.findByText('Não é possível remover o último administrador ativo.'),
    ).toBeVisible()
  })

  it('explains a failure to load and recovers on retry', async () => {
    let calls = 0
    useAdminApi()
    server.use(
      http.get(apiUrl('/api/users'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([admin])
      }),
    )
    renderWithProviders(<AdminPage />)
    const user = await openTab('Usuários e perfis')

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('table')).toBeVisible()
  })
})

describe('AdminPage algorithm parameters', () => {
  it('shows the current parameters and keeps saving disabled until something changes', async () => {
    useAdminApi()
    renderWithProviders(<AdminPage />)
    await openTab('Parâmetros do AG')

    expect(await screen.findByLabelText('Tamanho da população')).toHaveValue(100)
    expect(screen.getByLabelText('Gerações')).toHaveValue(200)
    expect(screen.getByLabelText('Taxa de cruzamento')).toHaveValue(0.8)
    expect(screen.getByLabelText('Taxa de mutação')).toHaveValue(0.05)
    expect(screen.getByRole('button', { name: 'Salvar parâmetros' })).toBeDisabled()
  })

  it('saves the changed parameters and confirms', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Parâmetros do AG')

    const population = await screen.findByLabelText('Tamanho da população')
    await user.clear(population)
    await user.type(population, '150')
    await user.click(screen.getByRole('button', { name: 'Salvar parâmetros' }))

    expect(await screen.findByText('Parâmetros do algoritmo genético salvos.')).toBeVisible()
    expect(api.savedSettings).toEqual([{ ...DEFAULT_GA_SETTINGS, populationSize: 150 }])
  })

  it('rejects values outside the allowed range and sends nothing', async () => {
    const api = useAdminApi()
    renderWithProviders(<AdminPage />)
    const user = await openTab('Parâmetros do AG')

    const mutation = await screen.findByLabelText('Taxa de mutação')
    await user.clear(mutation)
    await user.type(mutation, '1.5')
    const population = screen.getByLabelText('Tamanho da população')
    await user.clear(population)
    await user.type(population, '5')
    await user.click(screen.getByRole('button', { name: 'Salvar parâmetros' }))

    expect(await screen.findByText('Use um valor entre 0 e 1')).toBeVisible()
    expect(screen.getByText('Use ao menos 10 indivíduos')).toBeVisible()
    expect(mutation).toBeInvalid()
    expect(api.savedSettings).toHaveLength(0)
  })

  it('restores the default values in the form without saving them', async () => {
    const api = useAdminApi()
    api.settings = { populationSize: 300, generations: 50, crossoverRate: 0.5, mutationRate: 0.2 }
    renderWithProviders(<AdminPage />)
    const user = await openTab('Parâmetros do AG')
    expect(await screen.findByLabelText('Tamanho da população')).toHaveValue(300)

    await user.click(screen.getByRole('button', { name: 'Restaurar padrões' }))

    expect(screen.getByLabelText('Tamanho da população')).toHaveValue(100)
    expect(screen.getByLabelText('Gerações')).toHaveValue(200)
    expect(screen.getByLabelText('Taxa de cruzamento')).toHaveValue(0.8)
    expect(screen.getByLabelText('Taxa de mutação')).toHaveValue(0.05)
    expect(api.savedSettings).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Salvar parâmetros' })).toBeEnabled()
  })

  it('shows the API message when saving fails', async () => {
    useAdminApi()
    server.use(
      http.put(apiUrl('/api/settings/ga'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    renderWithProviders(<AdminPage />)
    const user = await openTab('Parâmetros do AG')

    const generations = await screen.findByLabelText('Gerações')
    await user.clear(generations)
    await user.type(generations, '300')
    await user.click(screen.getByRole('button', { name: 'Salvar parâmetros' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
  })
})
