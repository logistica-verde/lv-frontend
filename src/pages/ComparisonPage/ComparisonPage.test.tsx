import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import ComparisonPage from '@/pages/ComparisonPage/ComparisonPage'
import type { Route } from '@/services/schemas/route'
import { apiUrl } from '@/test/api'
import { completedRouteFixture, integrityFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 40,
}))

const emissionRoute: Route = { ...completedRouteFixture, id: 7, criterion: 'EMISSION' }

const distanceRoute: Route = {
  ...completedRouteFixture,
  id: 8,
  criterion: 'DISTANCE',
  totalEmissionKg: 8,
  totalDistanceMeters: 1800,
  segments: [
    {
      fromPointId: 10,
      toPointId: 11,
      distanceMeters: 900,
      averageSpeedKmh: 35,
      slopePercent: 1.5,
      emissionKg: 3.2,
    },
    {
      fromPointId: 11,
      toPointId: 12,
      distanceMeters: 900,
      averageSpeedKmh: 35,
      slopePercent: 1.5,
      emissionKg: 4.8,
    },
  ],
  points: [
    { pointId: 10, name: 'A', latitude: -23.55, longitude: -46.63, visitOrder: 1 },
    { pointId: 11, name: 'B', latitude: -23.56, longitude: -46.63, visitOrder: 2 },
    { pointId: 12, name: 'C', latitude: -23.57, longitude: -46.63, visitOrder: 3 },
  ],
}

const routes = [{ path: '/rotas/:emissionId/:distanceId', element: <ComparisonPage /> }]

function useRoutesApi(byId: Record<number, Route | (() => Route)>) {
  server.use(
    http.get(apiUrl('/api/routes/:id/integrity'), ({ params }) =>
      HttpResponse.json({ ...integrityFixture, operationId: Number(params.id) }),
    ),
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
        /A rota de menor emissão emite 31,25% menos CO₂ que a rota de menor distância\. Em troca, a rota de menor emissão percorre 12,36% mais distância\./,
      ),
    ).toBeVisible()
    expect(document.title).toBe('Comparação de rotas · Lastro')
  })

  it('tabulates the totals of each route with the difference between them', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    const table = await screen.findByRole('table', {
      name: 'Totais de cada rota e diferença entre elas',
    })

    const cellsOf = (row: HTMLElement) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    expect(cellsOf(within(table).getByRole('row', { name: /Emissão estimada/ }))).toEqual([
      '5,5',
      '8',
      '−31,25%',
    ])
    expect(cellsOf(within(table).getByRole('row', { name: /Distância \(km\)/ }))).toEqual([
      '2,02',
      '1,8',
      '+12,36%',
    ])
    expect(cellsOf(within(table).getByRole('row', { name: /Paradas/ }))).toEqual(['3', '3', '—'])
  })

  it('shows the integrity seal of each route with its transaction hash and a link to its verification', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByText('Integridade: menor emissão')).toBeVisible()
    expect(screen.getByText('Integridade: menor distância')).toBeVisible()
    await waitFor(() => expect(screen.getAllByText('0xcdcd…cdcd')).toHaveLength(2))
    expect(screen.getAllByText('Íntegra')).toHaveLength(2)
    expect(
      screen
        .getAllByRole('link', { name: 'Ver verificação' })
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/verificacao/7', '/verificacao/8'])
  })

  it('draws both routes on a single map with a legend that does not rely on color', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(
      await screen.findByRole('region', { name: 'Mapa comparativo das duas rotas' }),
    ).toBeVisible()
    const legend = screen.getByRole('list', { name: 'Legenda do mapa' })
    expect(within(legend).getByText('Menor emissão (linha contínua)')).toBeVisible()
    expect(within(legend).getByText('Menor distância (linha tracejada)')).toBeVisible()
  })

  it('numbers the markers by the emission route and mentions the distance route order', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    const map = await screen.findByRole('region', { name: 'Mapa comparativo das duas rotas' })

    expect(within(map).getByRole('button', { name: '1. C (menor distância: 3º)' })).toBeVisible()
    expect(within(map).getByRole('button', { name: '2. A (menor distância: 1º)' })).toBeVisible()
    expect(within(map).getByRole('button', { name: '3. B (menor distância: 2º)' })).toBeVisible()
  })

  it('warns that the lines are not the street layout', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    expect(await screen.findByText(/Linhas retas, sem o traçado das ruas/)).toBeVisible()
  })

  it('lists the segments of the emission route first, with units and a total', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')

    const table = await screen.findByRole('table', { name: 'Trechos da rota selecionada' })

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual([
      'Nº',
      'Trecho',
      'Distância (km)',
      'Velocidade média (km/h)',
      'Declividade (%)',
      'Emissão (kg CO₂)',
    ])
    const rows = within(table).getAllByRole('row')
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1', 'C → A', '1,01', '40', '2', '2'])
    expect(screen.getByText('Total da rota: 2,02 km · 5,5 kg CO₂')).toBeVisible()
  })

  it('paginates long routes so the table never needs to scroll', async () => {
    const segments = Array.from({ length: 9 }, (_, index) => ({
      fromPointId: 10,
      toPointId: 11,
      distanceMeters: 1000 + index,
      averageSpeedKmh: 40,
      slopePercent: 1,
      emissionKg: 1,
    }))
    useRoutesApi({ 7: { ...emissionRoute, segments }, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')
    const table = await screen.findByRole('table', { name: 'Trechos da rota selecionada' })

    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(screen.getByText('Página 1 de 2')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText('Página 2 de 2')).toBeVisible()
    expect(within(table).getByRole('cell', { name: '8' })).toBeVisible()

    await userEvent.click(screen.getByRole('radio', { name: 'Menor distância' }))

    expect(screen.queryByText(/Página/)).not.toBeInTheDocument()
  })

  it('switches the segments table to the distance route', async () => {
    useRoutesApi({ 7: emissionRoute, 8: distanceRoute })
    renderRoutes(routes, '/rotas/7/8')
    await screen.findByRole('table', { name: 'Trechos da rota selecionada' })

    await userEvent.click(screen.getByRole('radio', { name: 'Menor distância' }))

    const table = screen.getByRole('table', { name: 'Trechos da rota selecionada' })
    expect(within(table).getByText('A → B')).toBeVisible()
    expect(within(table).getByText('B → C')).toBeVisible()
    expect(within(table).queryByText('C → A')).not.toBeInTheDocument()
  })

  it('admits when the distance route is the one that emits less', async () => {
    useRoutesApi({ 7: { ...emissionRoute, totalEmissionKg: 10 }, 8: distanceRoute })

    renderRoutes(routes, '/rotas/7/8')

    expect(
      await screen.findByText(
        /Neste cenário, a rota de menor distância emite 20% menos CO₂ que a rota de menor emissão\./,
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
