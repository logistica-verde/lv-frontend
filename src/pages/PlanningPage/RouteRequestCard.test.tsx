import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import RouteRequestCard from '@/pages/PlanningPage/RouteRequestCard'
import type { Route } from '@/services/schemas/route'
import type { Vehicle } from '@/services/schemas/vehicle'
import { apiUrl } from '@/test/api'
import { completedRouteFixture, vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({ ROUTE_POLL_INTERVAL_MS: 20 }))

const secondVehicle: Vehicle = {
  ...vehicleFixture,
  id: 2,
  placa: 'XYZ9K88',
  massaKg: 12000,
  tipoCombustivel: 'gnv',
}

const pendingRoute: Route = {
  ...completedRouteFixture,
  status: 'PENDING',
  totalEmissionKg: null,
  totalDistanceMeters: null,
  points: [],
  segments: [],
}

const requestSchema = z.object({
  vehicleId: z.number(),
  deliveryPointIds: z.array(z.number()),
  criterion: z.enum(['EMISSION', 'DISTANCE']),
})

type Request = z.infer<typeof requestSchema>

type RoutesApi = {
  requests: Request[]
}

function useVehiclesApi(vehicles: Vehicle[]) {
  server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json(vehicles)))
}

function useRoutesApi(options: { failing?: 'EMISSION' | 'DISTANCE'; pendingPolls?: number } = {}) {
  const api: RoutesApi = { requests: [] }
  const polls = new Map<number, number>()
  const criteria = new Map<number, Request['criterion']>()
  const pendingPolls = options.pendingPolls ?? 2

  server.use(
    http.post(apiUrl('/api/routes/calculate'), async ({ request }) => {
      const body = requestSchema.parse(await request.json())
      api.requests.push(body)
      const id = 500 + api.requests.length
      criteria.set(id, body.criterion)
      return HttpResponse.json({ id, status: 'PENDING' }, { status: 202 })
    }),
    http.get(apiUrl('/api/routes/:id'), ({ params }) => {
      const id = Number(params.id)
      const criterion = criteria.get(id) ?? 'EMISSION'
      const count = (polls.get(id) ?? 0) + 1
      polls.set(id, count)
      if (count <= pendingPolls) {
        return HttpResponse.json({ ...pendingRoute, id, criterion })
      }
      if (options.failing === criterion) {
        return HttpResponse.json({
          ...pendingRoute,
          id,
          criterion,
          status: 'FAILED',
          errorMessage: 'Otimizador indisponível',
        })
      }
      return HttpResponse.json({ ...completedRouteFixture, id, criterion })
    }),
  )
  return api
}

function renderCard(selectedIds: number[]) {
  return renderWithProviders(
    <MemoryRouter>
      <RouteRequestCard selectedIds={selectedIds} />
    </MemoryRouter>,
  )
}

describe('RouteRequestCard vehicles', () => {
  it('shows a loading message while the vehicles load', async () => {
    server.use(
      http.get(apiUrl('/api/vehicles'), async () => {
        await delay(30)
        return HttpResponse.json([vehicleFixture])
      }),
    )

    renderCard([1, 2])

    expect(screen.getByText('Carregando veículos…')).toBeVisible()
    expect(await screen.findByRole('combobox', { name: 'Veículo' })).toBeVisible()
  })

  it('preselects the first vehicle and describes each option', async () => {
    useVehiclesApi([vehicleFixture, secondVehicle])

    renderCard([1, 2])

    const select = await screen.findByRole('combobox', { name: 'Veículo' })
    expect(select).toHaveValue('1')
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['ABC1D23 · 7.500 kg · diesel', 'XYZ9K88 · 12.000 kg · gnv'])
  })

  it('does not offer inactive vehicles', async () => {
    useVehiclesApi([{ ...vehicleFixture, ativo: false }, secondVehicle])

    renderCard([1, 2])

    const select = await screen.findByRole('combobox', { name: 'Veículo' })
    expect(within(select).getAllByRole('option')).toHaveLength(1)
    expect(select).toHaveValue('2')
  })

  it('sends the user to register a vehicle when there is none', async () => {
    useVehiclesApi([])

    renderCard([1, 2])

    expect(await screen.findByRole('heading', { name: 'Nenhum veículo ativo' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Cadastrar veículo' })).toHaveAttribute(
      'href',
      '/veiculos',
    )
    expect(screen.queryByRole('button', { name: 'Calcular rotas' })).not.toBeInTheDocument()
  })

  it('explains a failure to load vehicles and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([vehicleFixture])
      }),
    )
    renderCard([1, 2])

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('combobox', { name: 'Veículo' })).toBeVisible()
  })
})

describe('RouteRequestCard calculation', () => {
  it('stays disabled with fewer than two points selected', async () => {
    useVehiclesApi([vehicleFixture])

    renderCard([1])

    expect(await screen.findByRole('button', { name: 'Calcular rotas' })).toBeDisabled()
  })

  it('is enabled once two points are selected', async () => {
    useVehiclesApi([vehicleFixture])

    renderCard([1, 2])

    expect(await screen.findByRole('button', { name: 'Calcular rotas' })).toBeEnabled()
  })

  it('requests both criteria for the chosen vehicle and the selected points', async () => {
    useVehiclesApi([vehicleFixture, secondVehicle])
    const api = useRoutesApi()
    renderCard([10, 11, 12])
    const user = userEvent.setup()
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Veículo' }), '2')

    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText('Andamento do cálculo')).toBeVisible()
    expect(api.requests).toHaveLength(2)
    expect(api.requests).toEqual(
      expect.arrayContaining([
        { vehicleId: 2, deliveryPointIds: [10, 11, 12], criterion: 'EMISSION' },
        { vehicleId: 2, deliveryPointIds: [10, 11, 12], criterion: 'DISTANCE' },
      ]),
    )
  })

  it('shows both routes as calculating, then completed, and confirms with a notification', async () => {
    useVehiclesApi([vehicleFixture])
    useRoutesApi()
    renderCard([10, 11])
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findAllByText('Calculando…')).toHaveLength(2)
    expect(await screen.findAllByText('Concluída')).toHaveLength(2)
    expect(screen.getByText('Menor emissão')).toBeVisible()
    expect(screen.getByText('Menor distância')).toBeVisible()
    expect(await screen.findByText('Rotas calculadas.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver comparação das rotas' })).toHaveAttribute(
      'href',
      '/rotas/501/502',
    )
  })

  it('does not offer the comparison while a route is still calculating or has failed', async () => {
    useVehiclesApi([vehicleFixture])
    useRoutesApi({ failing: 'DISTANCE' })
    renderCard([10, 11])
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText('Falhou')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Ver comparação das rotas' })).not.toBeInTheDocument()
  })

  it('reports a route that failed with the reason', async () => {
    useVehiclesApi([vehicleFixture])
    useRoutesApi({ failing: 'DISTANCE' })
    renderCard([10, 11])
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText('Falhou')).toBeVisible()
    expect(screen.getByText('Otimizador indisponível')).toBeVisible()
    expect(await screen.findByText('O cálculo de uma das rotas falhou.')).toBeVisible()
    expect(await screen.findByText('Concluída')).toBeVisible()
    expect(screen.queryByText('Rotas calculadas.')).not.toBeInTheDocument()
  })

  it('shows the API message and no progress when the request is rejected', async () => {
    useVehiclesApi([vehicleFixture])
    server.use(
      http.post(apiUrl('/api/routes/calculate'), () =>
        HttpResponse.json({ status: 400, detail: 'Veículo inexistente.' }, { status: 400 }),
      ),
    )
    renderCard([10, 11])
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText('Veículo inexistente.')).toBeVisible()
    expect(screen.queryByText('Andamento do cálculo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeEnabled()
  })

  it('blocks a second request while the first one is being sent', async () => {
    useVehiclesApi([vehicleFixture])
    const api = useRoutesApi()
    server.use(
      http.post(apiUrl('/api/routes/calculate'), async ({ request }) => {
        await delay(100)
        const body = requestSchema.parse(await request.json())
        api.requests.push(body)
        return HttpResponse.json(
          { id: 600 + api.requests.length, status: 'PENDING' },
          { status: 202 },
        )
      }),
    )
    renderCard([10, 11])
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    const busy = screen.getByRole('button', { name: /Calcular rotas/ })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')
    await user.click(busy)

    expect(await screen.findByText('Andamento do cálculo')).toBeVisible()
    expect(api.requests).toHaveLength(2)
  })
})
