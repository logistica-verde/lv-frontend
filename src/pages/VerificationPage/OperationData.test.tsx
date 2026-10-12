import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import OperationData from '@/pages/VerificationPage/OperationData'
import type { Route } from '@/services/schemas/route'
import { apiUrl } from '@/test/api'
import { completedRouteFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

function useRouteApi(route: Route) {
  server.use(http.get(apiUrl('/api/routes/7'), () => HttpResponse.json(route)))
}

describe('OperationData', () => {
  it('shows a loading state while the operation loads', async () => {
    server.use(
      http.get(apiUrl('/api/routes/7'), async () => {
        await delay(30)
        return HttpResponse.json(completedRouteFixture)
      }),
    )

    renderWithProviders(<OperationData routeId={7} />)

    expect(screen.getByText('Carregando dados da operação')).toBeInTheDocument()
    expect(await screen.findByText('Operação')).toBeVisible()
  })

  it('shows the fields that go into the hash', async () => {
    useRouteApi(completedRouteFixture)

    renderWithProviders(<OperationData routeId={7} />)

    expect(await screen.findByText('Operação')).toBeVisible()
    expect(screen.getByText('Operação').nextElementSibling).toHaveTextContent('7')
    expect(screen.getByText('Veículo (ID)').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Critério').nextElementSibling).toHaveTextContent('Menor emissão')
    expect(screen.getByText('Criada em').nextElementSibling).toHaveTextContent(
      /05\/10\/2026.*09:00:00/,
    )
    expect(screen.getByText('Emissão total (kg CO₂)').nextElementSibling).toHaveTextContent('5,5')
    expect(screen.getByText(/JSON canônico, SHA-256/)).toBeVisible()
  })

  it('lists the stops in visit order', async () => {
    useRouteApi(completedRouteFixture)
    renderWithProviders(<OperationData routeId={7} />)

    const table = await screen.findByRole('table', { name: 'Paradas da operação' })

    const rows = within(table).getAllByRole('row').slice(1)
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ),
    ).toEqual([
      ['1', '12', 'C'],
      ['2', '10', 'A'],
      ['3', '11', 'B'],
    ])
  })

  it('switches to the segments, with the IDs the hash uses', async () => {
    useRouteApi(completedRouteFixture)
    renderWithProviders(<OperationData routeId={7} />)
    await screen.findByRole('table', { name: 'Paradas da operação' })

    await userEvent.click(screen.getByRole('radio', { name: 'Trechos' }))

    const table = screen.getByRole('table', { name: 'Trechos da operação' })
    const firstRow = within(table).getAllByRole('row')[1] as HTMLElement
    expect(
      within(firstRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1', '12 → 10', '1.010', '40', '2', '2'])
  })

  it('paginates long lists', async () => {
    const points = Array.from({ length: 8 }, (_, index) => ({
      pointId: index + 1,
      name: `P${index + 1}`,
      latitude: -23.5,
      longitude: -46.6,
      visitOrder: index + 1,
    }))
    useRouteApi({ ...completedRouteFixture, points })
    renderWithProviders(<OperationData routeId={7} />)
    const table = await screen.findByRole('table', { name: 'Paradas da operação' })

    expect(within(table).getAllByRole('row')).toHaveLength(7)
    expect(screen.getByText('Página 1 de 2')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(within(table).getAllByRole('row')).toHaveLength(3)
  })

  it('explains a failure and lets the user retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/routes/7'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json(completedRouteFixture)
      }),
    )
    renderWithProviders(<OperationData routeId={7} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Operação')).toBeVisible()
  })
})
