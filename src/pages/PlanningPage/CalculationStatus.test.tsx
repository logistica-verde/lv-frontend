import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import CalculationStatus from '@/pages/PlanningPage/CalculationStatus'
import { useRoutesApi } from '@/test/fakeApi'
import { renderWithProviders } from '@/test/renderWithProviders'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

const calculation = {
  emission: { id: 501, status: 'PENDING' as const },
  distance: { id: 502, status: 'PENDING' as const },
}

function renderStatus(startedAt = Date.now()) {
  return renderWithProviders(
    <MemoryRouter>
      <CalculationStatus calculation={calculation} startedAt={startedAt} />
    </MemoryRouter>,
  )
}

describe('CalculationStatus', () => {
  it('shows both criteria as calculating, with the time elapsed so far', async () => {
    useRoutesApi({ pendingPolls: 50 })

    renderStatus()

    const status = screen.getByRole('status', { name: 'Andamento do cálculo' })
    expect(status).toHaveTextContent('Calculando rotas')
    expect(status).toHaveTextContent('Tempo decorrido: 0 s')
    expect(await screen.findAllByText('Calculando…')).toHaveLength(2)
  })

  it('counts from the moment the calculation was requested', () => {
    useRoutesApi({ pendingPolls: 50 })

    renderStatus(Date.now() - 65_000)

    expect(screen.getByText(/Tempo decorrido: 1 min 05 s/)).toBeVisible()
  })

  it('announces the end, shows the total time and links to the comparison', async () => {
    useRoutesApi()

    renderStatus()

    expect(await screen.findAllByText('Concluída')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Cálculo encerrado' })).toBeVisible()
    expect(screen.getByText(/Tempo total:/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver comparação das rotas' })).toHaveAttribute(
      'href',
      '/rotas/501/502',
    )
    expect(await screen.findByText('Rotas calculadas.')).toBeVisible()
  })

  it('reports a route that failed with the reason, and offers no comparison', async () => {
    useRoutesApi({ failing: 'DISTANCE' })

    renderStatus()

    expect(await screen.findByText('Falhou')).toBeVisible()
    expect(screen.getByText('Otimizador indisponível')).toBeVisible()
    expect(await screen.findByText('O cálculo de uma das rotas falhou.')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Ver comparação das rotas' })).not.toBeInTheDocument()
  })
})
