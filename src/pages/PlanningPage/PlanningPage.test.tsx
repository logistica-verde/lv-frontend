import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import { apiUrl } from '@/test/api'
import { useDeliveryPointsApi, useRoutesApi, useVehiclesApi } from '@/test/fakeApi'
import { deliveryPointFixture, vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

function point(id: number, nome: string): DeliveryPoint {
  return { ...deliveryPointFixture, id, nome, latitude: -23.5 - id / 100 }
}

const sé = point(1, 'Praça da Sé')
const masp = point(2, 'MASP')
const luz = point(3, 'Estação da Luz')

function renderPage() {
  return renderWithProviders(
    <MemoryRouter>
      <PlanningPage />
    </MemoryRouter>,
  )
}

async function addExisting(user: ReturnType<typeof userEvent.setup>, names: string[]) {
  await user.click(await screen.findByRole('button', { name: 'Adicionar ponto' }))
  for (const name of names) {
    await user.click(await screen.findByRole('checkbox', { name: new RegExp(name) }))
  }
  await user.click(screen.getByRole('button', { name: `Adicionar selecionados (${names.length})` }))
}

function listedNames() {
  return within(screen.getByRole('list', { name: 'Pontos da rota' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('[title]')?.textContent)
}

describe('PlanningPage', () => {
  it('opens as the new route screen with the vehicle, an empty point list and the map', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Nova rota' })).toBeVisible()
    expect(document.title).toBe('Nova rota · Lastro')
    expect(await screen.findByRole('combobox', { name: 'Trocar veículo' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Nenhum ponto na rota' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Mapa dos pontos de entrega' })).toBeVisible()
  })

  it('marks every registered point on the map', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])

    renderPage()

    expect(await screen.findByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MASP' })).toBeInTheDocument()
  })

  it('keeps the calculate button disabled until at least two points are in the route', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp, luz])
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('button', { name: 'Calcular rotas' })).toBeDisabled()

    await addExisting(user, ['Praça da Sé'])
    expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeDisabled()
    expect(screen.getByText('1 ponto selecionado. Selecione pelo menos 2.')).toBeVisible()

    await addExisting(user, ['MASP'])
    expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeEnabled()
  })

  it('adds points from the dialog, confirms and numbers them on the map', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp, luz])
    const user = userEvent.setup()
    renderPage()

    await addExisting(user, ['MASP', 'Praça da Sé'])

    expect(await screen.findByText('2 pontos adicionados à rota.')).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listedNames()).toEqual(['MASPSaída', 'Praça da Sé'])
    expect(screen.getByRole('heading', { name: 'Pontos de entrega' })).toBeVisible()
    expect(screen.getByText('2 de 30')).toBeVisible()
    expect(screen.getByRole('button', { name: '1. MASP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2. Praça da Sé' })).toBeInTheDocument()
  })

  it('creates a point from coordinates and puts it in the route', async () => {
    useVehiclesApi([vehicleFixture])
    const api = useDeliveryPointsApi([sé])
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Adicionar ponto' }))
    await user.click(screen.getByRole('tab', { name: 'Coordenadas' }))
    await user.type(screen.getByLabelText('Nome'), 'Vila Mariana')
    await user.type(screen.getByLabelText('Latitude'), '-23.58')
    await user.type(screen.getByLabelText('Longitude'), '-46.63')
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(await screen.findByText('Ponto Vila Mariana adicionado à rota.')).toBeVisible()
    expect(api.posted).toEqual([{ nome: 'Vila Mariana', latitude: -23.58, longitude: -46.63 }])
    expect(listedNames()).toEqual(['Vila MarianaSaída'])
  })

  it('reorders the points and sends them in the new order', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp, luz])
    const routes = useRoutesApi()
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP', 'Estação da Luz'])

    await user.click(screen.getByRole('button', { name: 'Mover Estação da Luz para cima' }))
    await user.click(screen.getByRole('button', { name: 'Mover Estação da Luz para cima' }))
    expect(listedNames()).toEqual(['Estação da LuzSaída', 'Praça da Sé', 'MASP'])

    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))

    await waitFor(() => expect(routes.requests).toHaveLength(2))
    expect(routes.requests.map((request) => request.deliveryPointIds)).toEqual([
      [3, 1, 2],
      [3, 1, 2],
    ])
  })

  it('removes a point from the route without deleting it', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])

    await user.click(screen.getByRole('button', { name: 'Remover Praça da Sé' }))

    expect(listedNames()).toEqual(['MASPSaída'])
    expect(screen.getByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto' }))
    expect(await screen.findByRole('checkbox', { name: /Praça da Sé/ })).toBeVisible()
  })

  it('requests both criteria for the chosen vehicle and shows the progress with the elapsed time', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    const routes = useRoutesApi({ pendingPolls: 100 })
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])

    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))

    await waitFor(() => expect(routes.requests).toHaveLength(2))
    expect(routes.requests).toEqual(
      expect.arrayContaining([
        { vehicleId: 1, deliveryPointIds: [1, 2], criterion: 'EMISSION' },
        { vehicleId: 1, deliveryPointIds: [1, 2], criterion: 'DISTANCE' },
      ]),
    )
    const status = await screen.findByRole('status', { name: 'Andamento do cálculo' })
    expect(status).toHaveTextContent('Tempo decorrido')
  })

  it('lets the user keep working while the routes are being calculated', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp, luz])
    useRoutesApi({ pendingPolls: 100 })
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])
    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))
    await screen.findByRole('status', { name: 'Andamento do cálculo' })

    await user.click(screen.getByRole('button', { name: 'Remover MASP' }))

    expect(listedNames()).toEqual(['Praça da SéSaída'])
    expect(screen.getByRole('status', { name: 'Andamento do cálculo' })).toBeVisible()
  })

  it('finishes with a link to the comparison', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    useRoutesApi()
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])

    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByRole('link', { name: 'Ver comparação das rotas' })).toHaveAttribute(
      'href',
      '/rotas/501/502',
    )
  })

  it('shows the API message when the calculation is refused', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    server.use(
      http.post(apiUrl('/api/routes/calculate'), () =>
        HttpResponse.json({ status: 400, detail: 'Veículo inexistente.' }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])

    await user.click(screen.getByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText('Veículo inexistente.')).toBeVisible()
    expect(screen.queryByRole('status', { name: 'Andamento do cálculo' })).not.toBeInTheDocument()
  })

  it('explains a failure to load the points and recovers on retry', async () => {
    useVehiclesApi([vehicleFixture])
    let calls = 0
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([sé])
      }),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
  })
})

type Position = { coords: { latitude: number; longitude: number; accuracy: number } }

function stubLocation(
  behaviour: (
    success: (position: Position) => void,
    failure: (error: { code: number }) => void,
  ) => void,
) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: behaviour },
  })
}

function foundAt(latitude: number, longitude: number) {
  stubLocation((success) => success({ coords: { latitude, longitude, accuracy: 20 } }))
}

describe('PlanningPage starting from the current location', () => {
  it('sends the location as the origin of both routes', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    const routes = useRoutesApi()
    foundAt(-23.5505, -46.6333)
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['MASP'])

    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }))
    await screen.findByRole('button', { name: 'Remover' })
    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    await waitFor(() => expect(routes.requests).toHaveLength(2))
    expect(routes.requests.map((request) => request.origin)).toEqual([
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -23.5505, longitude: -46.6333 },
    ])
    expect(routes.requests.map((request) => request.deliveryPointIds)).toEqual([[2], [2]])
  })

  it('needs a second point only when there is no location', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    foundAt(-23.5505, -46.6333)
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['MASP'])
    expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeEnabled(),
    )
    await user.click(screen.getByRole('button', { name: 'Remover' }))
    expect(screen.getByRole('button', { name: 'Calcular rotas' })).toBeDisabled()
  })

  it('marks the first point as the departure and lets the order change only without the location', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé, masp])
    foundAt(-23.5505, -46.6333)
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['Praça da Sé', 'MASP'])
    const list = screen.getByRole('list', { name: 'Pontos da rota' })
    expect(within(list).getByText('Saída')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Mover MASP para cima' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }))

    await waitFor(() => expect(within(list).queryByText('Saída')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Mover MASP para cima' })).not.toBeInTheDocument()
  })

  it('says why the location is not available and keeps the first point as the departure', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([sé])
    stubLocation((_success, failure) => failure({ code: 1 }))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Usar minha localização' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'permissão de localização foi negada',
    )
    expect(screen.getByText(/sai do primeiro ponto da lista/)).toBeVisible()
  })

  it('explains when the location is outside the area of the map', async () => {
    useVehiclesApi([vehicleFixture])
    useDeliveryPointsApi([masp])
    foundAt(-22.9068, -43.1729)
    server.use(
      http.post(apiUrl('/api/routes/calculate'), () =>
        HttpResponse.json(
          { status: 400, detail: 'The origin is outside the area covered by the road map' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderPage()
    await addExisting(user, ['MASP'])
    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }))

    await user.click(await screen.findByRole('button', { name: 'Calcular rotas' }))

    expect(await screen.findByText(/fora da área coberta pelo mapa/)).toBeVisible()
  })
})
