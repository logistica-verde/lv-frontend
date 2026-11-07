import { screen } from '@testing-library/react'
import { http, HttpResponse, ws } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import CalculatingDialog from '@/pages/PlanningPage/Calculation/CalculatingDialog'
import { calculationSocketUrl } from '@/services/calculationSocket'
import type { CalculationProgress } from '@/services/schemas/calculationProgress'
import { apiUrl } from '@/test/api'
import { completedRouteFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

const calculations = ws.link(calculationSocketUrl())

const calculation = {
  emission: { id: 11, status: 'PENDING' as const },
  distance: { id: 12, status: 'PENDING' as const },
}

function useCalculationApi(messages: string[]) {
  const subscriptions: string[] = []
  server.use(
    http.get(apiUrl('/api/routes/:id'), ({ params }) =>
      HttpResponse.json({ ...completedRouteFixture, id: Number(params['id']), status: 'PENDING' }),
    ),
    calculations.addEventListener('connection', ({ client }) => {
      client.addEventListener('message', (event) => {
        subscriptions.push(String(event.data))
        messages.forEach((message) => client.send(message))
      })
    }),
  )
  return subscriptions
}

function progress(update: CalculationProgress): string {
  return JSON.stringify(update)
}

function renderDialog() {
  renderWithProviders(
    <CalculatingDialog
      calculation={calculation}
      startedAt={Date.now()}
      onFinished={vi.fn()}
      onClose={vi.fn()}
    />,
  )
}

describe('CalculatingDialog', () => {
  it('fills the bar with the progress the server reports for each route', async () => {
    signInAs('OPERATOR')
    useCalculationApi([
      progress({ operationId: 11, stage: 'OPTIMIZING', percent: 60, done: 250, total: 500 }),
      progress({ operationId: 12, stage: 'PREPARING', percent: 10, done: 4, total: 10 }),
    ])

    renderDialog()

    expect(await screen.findByText('Otimizando · geração 250 de 500')).toBeVisible()
    expect(await screen.findByText('Traçando as ruas · 4 de 10')).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Progresso do cálculo' })).toHaveAttribute(
      'aria-valuenow',
      '35',
    )
  })

  it('subscribes with the session token and the two routes being calculated', async () => {
    signInAs('OPERATOR')
    const subscriptions = useCalculationApi([
      progress({ operationId: 11, stage: 'QUEUED', percent: 0, done: null, total: null }),
    ])

    renderDialog()

    expect(await screen.findByText('Na fila')).toBeVisible()
    expect(JSON.parse(subscriptions[0] ?? '{}')).toEqual({
      token: 'test-token-OPERATOR',
      operationIds: [11, 12],
    })
  })

  it('ignores messages that are not progress of these routes', async () => {
    signInAs('OPERATOR')
    useCalculationApi([
      'not json',
      progress({ operationId: 99, stage: 'OPTIMIZING', percent: 80, done: 400, total: 500 }),
      progress({ operationId: 11, stage: 'SAVING', percent: 95, done: null, total: null }),
    ])

    renderDialog()

    expect(await screen.findByText('Salvando a rota')).toBeVisible()
    expect(screen.queryByText(/geração 400/)).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progresso do cálculo' })).toHaveAttribute(
      'aria-valuenow',
      '48',
    )
  })
})
