import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import VehiclesPage from '@/pages/VehiclesPage/VehiclesPage'
import type { Vehicle } from '@/services/schemas/vehicle'
import { apiUrl } from '@/test/api'
import { vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const postedVehicleSchema = z.object({
  placa: z.string(),
  massaKg: z.number(),
  tipoCombustivel: z.string(),
})

type FakeApi = {
  vehicles: Vehicle[]
  posted: z.infer<typeof postedVehicleSchema>[]
}

function useVehiclesApi(initial: Vehicle[], createDelayMs = 0): FakeApi {
  const api: FakeApi = { vehicles: [...initial], posted: [] }
  server.use(
    http.get(apiUrl('/api/vehicles'), () => HttpResponse.json(api.vehicles)),
    http.post(apiUrl('/api/vehicles'), async ({ request }) => {
      await delay(createDelayMs)
      const body = postedVehicleSchema.parse(await request.json())
      api.posted.push(body)
      const created = { ...vehicleFixture, ...body, id: api.vehicles.length + 100 }
      api.vehicles.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
  )
  return api
}

async function fillForm(placa: string, massa: string, combustivel: string) {
  const user = userEvent.setup()
  if (placa) await user.type(screen.getByLabelText('Placa'), placa)
  if (massa) await user.type(screen.getByLabelText('Massa (kg)'), massa)
  if (combustivel) await user.type(screen.getByLabelText('Tipo de combustível'), combustivel)
  return user
}

describe('VehiclesPage list', () => {
  it('shows a loading state, then the vehicles in a table', async () => {
    server.use(
      http.get(apiUrl('/api/vehicles'), async () => {
        await delay(30)
        return HttpResponse.json([vehicleFixture])
      }),
    )

    renderWithProviders(<VehiclesPage />)

    expect(screen.getByText('Carregando veículos')).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Veículos cadastrados' })
    expect(within(table).getByRole('rowheader', { name: 'ABC1D23' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '7.500' })).toBeInTheDocument()
    expect(screen.queryByText('Carregando veículos')).not.toBeInTheDocument()
  })

  it('invites the user to register the first vehicle when there is none', async () => {
    useVehiclesApi([])

    renderWithProviders(<VehiclesPage />)

    expect(await screen.findByRole('heading', { name: 'Nenhum veículo cadastrado' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('explains a failure and lets the user try again', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([vehicleFixture])
      }),
    )
    renderWithProviders(<VehiclesPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('erro interno')
    expect(alert).not.toHaveTextContent('boom')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('table')).toBeVisible()
  })
})

describe('VehiclesPage form', () => {
  it('asks for every required field and sends nothing when the form is empty', async () => {
    const api = useVehiclesApi([vehicleFixture])
    renderWithProviders(<VehiclesPage />)
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Informe a placa')).toBeVisible()
    expect(screen.getByText('Informe a massa')).toBeVisible()
    expect(screen.getByText('Informe o tipo de combustível')).toBeVisible()
    expect(screen.getByLabelText('Placa')).toBeInvalid()
    expect(api.posted).toHaveLength(0)
  })

  it('rejects a mass that is not positive', async () => {
    const api = useVehiclesApi([vehicleFixture])
    renderWithProviders(<VehiclesPage />)
    await screen.findByRole('table')
    const user = await fillForm('ABC1D23', '0', 'diesel')

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('A massa deve ser maior que zero')).toBeVisible()
    expect(api.posted).toHaveLength(0)
  })

  it('registers a vehicle, confirms with a notification, clears the form and refreshes the list', async () => {
    const api = useVehiclesApi([vehicleFixture])
    renderWithProviders(<VehiclesPage />)
    await screen.findByRole('table')
    const user = await fillForm('  NEW1A11  ', '3000', 'gnv')

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Veículo NEW1A11 cadastrado.')).toBeVisible()
    expect(api.posted).toEqual([{ placa: 'NEW1A11', massaKg: 3000, tipoCombustivel: 'gnv' }])
    expect(screen.getByLabelText('Placa')).toHaveValue('')
    expect(screen.getByLabelText('Massa (kg)')).toHaveValue(null)
    expect(await screen.findByRole('rowheader', { name: 'NEW1A11' })).toBeVisible()
  })

  it('keeps what was typed and shows the API message when registering fails', async () => {
    server.use(
      http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
      http.post(apiUrl('/api/vehicles'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    renderWithProviders(<VehiclesPage />)
    const user = await fillForm('ABC1D23', '3000', 'diesel')

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
    expect(screen.getByLabelText('Placa')).toHaveValue('ABC1D23')
  })

  it('shows the button as busy and blocks double submissions while saving', async () => {
    const api = useVehiclesApi([], 120)
    renderWithProviders(<VehiclesPage />)
    await screen.findByRole('heading', { name: 'Nenhum veículo cadastrado' })
    const user = await fillForm('ABC1D23', '3000', 'diesel')

    await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    const busyButton = screen.getByRole('button', { name: /Cadastrar veículo/ })
    expect(busyButton).toBeDisabled()
    expect(busyButton).toHaveAttribute('aria-busy', 'true')
    await user.click(busyButton)
    expect(await screen.findByText('Veículo ABC1D23 cadastrado.')).toBeVisible()
    expect(api.posted).toHaveLength(1)
  })

  it('suggests common fuel types without restricting the field', () => {
    useVehiclesApi([])
    renderWithProviders(<VehiclesPage />)

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
})
