import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import ComparisonPage from '@/pages/ComparisonPage/ComparisonPage'
import type { Route } from '@/services/schemas/route'
import { apiUrl } from '@/test/api'
import { completedRouteFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({ ROUTE_POLL_INTERVAL_MS: 20 }))

const emissionRoute: Route = { ...completedRouteFixture, id: 7, criterion: 'EMISSION' }

const distanceRoute: Route = {
  ...completedRouteFixture,
  id: 8,
  criterion: 'DISTANCE',
  totalEmissionKg: 8,
  totalDistanceMeters: 1800,
  points: [
    { pointId: 10, name: 'A', latitude: -23.55, longitude: -46.63, visitOrder: 1 },
    { pointId: 11, name: 'B', latitude: -23.56, longitude: -46.63, visitOrder: 2 },
    { pointId: 12, name: 'C', latitude: -23.57, longitude: -46.63, visitOrder: 3 },
  ],
}

const routes = [{ path: '/rotas/:emissionId/:distanceId', element: <ComparisonPage /> }]

function useRoutesApi(byId: Record<number, Route | (() => Route)>) {
  server.use(
    http.get(apiUrl('/api/routes/:id'), ({ params }) => {
      const entry = byId[Number(params.id)]
      if (!entry) {
        return HttpResponse.json({ status: 404, detail: 'Rota não encontrada.' }, { status: 404 })
      }
      return HttpResponse.json(typeof entry === 'function' ? entry() : entry)
    }),
  )
}

describe('ComparisonPage result', () => {
  it('states how much less the emission route emits', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })

    renderRoutes(routes, '/rotas/7/8')

    expect(
      await screen.findByText(
        'A rota de menor emissão emite 31,25% menos CO₂ que a rota de menor distância.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText('Em troca, a rota de menor emissão percorre 12,36% mais distância.'),
    ).toBeVisible()
    expect(document.title).toBe('Comparação de rotas · Logística Verde')
  })

  it('tabulates the totals of each route', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    const table = await screen.findByRole('table', { name: 'Totais de cada rota' })

    const emissionRow = within(table).getByRole('row', { name: /Emissão total/ })
    expect(
      within(emissionRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['5,5', '8'])
    const distanceRow = within(table).getByRole('row', { name: /Distância total/ })
    expect(
      within(distanceRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['2,02', '1,8'])
    const stopsRow = within(table).getByRole('row', { name: /Paradas/ })
    expect(
      within(stopsRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['3', '3'])
  })

  it('shows one map per route with the stops in visit order', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByRole('region', { name: 'Mapa da rota: Menor emissão' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Mapa da rota: Menor distância' })).toBeVisible()
    const lists = screen.getAllByRole('list')
    expect(
      within(lists[0]!)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['C', 'A', 'B'])
    expect(
      within(lists[1]!)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['A', 'B', 'C'])
  })

  it('numbers the markers by visit order', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    const emissionMap = await screen.findByRole('region', { name: 'Mapa da rota: Menor emissão' })

    expect(within(emissionMap).getByRole('button', { name: '1. C' })).toBeInTheDocument()
    expect(within(emissionMap).getByRole('button', { name: '3. B' })).toBeInTheDocument()
  })

  it('warns that the lines are not the street layout', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByText(/não representam o traçado das ruas/)).toBeVisible()
  })

  it('admits when the distance route is the one that emits less', async () => {
    useRoutesApi({ 7: { ...emissionRoute, totalEmissionKg: 10 }, 8: distanceRoute })

    renderRoutes(routes, '/rotas/7/8')

    expect(
      await screen.findByText(
        'Neste cenário, a rota de menor distância emite 20% menos CO₂ que a rota de menor emissão.',
      ),
    ).toBeVisible()
  })

  it('links back to the planning page', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByRole('link', { name: 'Voltar ao planejamento' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('ComparisonPage states', () => {
  it('shows a loading state while the routes load', async () => {
    server.use(
      http.get(apiUrl('/api/routes/:id'), async ({ params }) => {
        await delay(40)
        return HttpResponse.json(Number(params.id) === 7 ? emissionRoute : distanceRoute)
      }),
    )

    renderRoutes(routes, '/rotas/7/8')

    expect(screen.getByText('Carregando rotas')).toBeInTheDocument()
    expect(await screen.findByText(/menos CO₂/)).toBeVisible()
  })

  it('waits for routes that are still being calculated and then shows them', async () => {
    let polls = 0
    useRoutesApi({
      7: () => {
        polls += 1
        return polls < 3 ? { ...emissionRoute, status: 'PENDING', points: [] } : emissionRoute
      },
      8: distanceRoute,
    })

    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByText('Calculando as rotas…')).toBeVisible()
    expect(await screen.findByText(/menos CO₂/)).toBeVisible()
  })

  it('reports a route that failed', async () => {
    useRoutesApi({
      7: { ...emissionRoute, status: 'FAILED', errorMessage: 'Otimizador indisponível' },
      8: distanceRoute,
    })

    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByRole('alert')).toHaveTextContent('Otimizador indisponível')
    expect(screen.getByRole('link', { name: 'Voltar ao planejamento' })).toBeVisible()
  })

  it('explains a request failure and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/routes/:id'), ({ params }) => {
        calls += 1
        return calls <= 2
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json(Number(params.id) === 7 ? emissionRoute : distanceRoute)
      }),
    )
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText(/menos CO₂/)).toBeVisible()
  })

  it('shows the API message when a route does not exist', async () => {
    useRoutesApi({ 7: emissionRoute })

    renderRoutes(routes, '/rotas/7/99')

    expect(await screen.findByRole('alert')).toHaveTextContent('Uma das rotas não foi encontrada.')
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })

  it('refuses addresses whose routes are not an emission and a distance pair', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })

    renderRoutes(routes, '/rotas/8/7')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'não corresponde a uma comparação válida',
    )
  })

  it('shows the not found page for ids that are not positive integers', () => {
    renderRoutes(routes, '/rotas/abc/8')

    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
  })
})
