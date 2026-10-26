import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import type { Execution } from '@/services/schemas/execution'
import { routes } from '@/router'
import { apiUrl } from '@/test/api'
import { executionFixture } from '@/test/executionFixtures'
import { completedRouteFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

function serve(execution: Execution) {
  const calls: string[] = []
  let current = execution
  server.use(
    http.get(apiUrl('/api/executions/:id'), () => HttpResponse.json(current)),
    http.get(apiUrl('/api/routes/:id'), () => HttpResponse.json(completedRouteFixture)),
    http.post(apiUrl('/api/executions/:id/start'), () => {
      calls.push('start')
      current = { ...current, status: 'IN_PROGRESS', startedAt: '2026-10-20T15:00:00.000Z' }
      return HttpResponse.json(current)
    }),
    http.post(apiUrl('/api/executions/:id/finish'), () => {
      calls.push('finish')
      current = { ...current, status: 'FINISHED' }
      return HttpResponse.json(current)
    }),
    http.post(apiUrl('/api/executions/:id/cancel'), async ({ request }) => {
      const body = (await request.json()) as { reason: string }
      calls.push(`cancel: ${body.reason}`)
      current = { ...current, status: 'CANCELLED' }
      return HttpResponse.json(current)
    }),
  )
  return calls
}

function open(id = 9) {
  signInAs('OPERATOR')
  return renderRoutes(routes, `/execucao/${id}`)
}

function standAt(latitude: number, longitude: number) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: (success: (position: object) => void) => {
        success({ coords: { latitude, longitude, heading: null, speed: null, accuracy: 5 } })
        return 1
      },
      clearWatch: () => undefined,
    },
  })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation')
})

describe('ExecutionPage', () => {
  it('shows the navigation map without the application menu while the route is in progress', async () => {
    serve(executionFixture)

    open()

    expect(await screen.findByRole('region', { name: 'Mapa de navegação' })).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simular percurso' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Finalizar rota' })).not.toBeInTheDocument()
  })

  it('shows the time left, the estimated arrival and the time to the next stop', async () => {
    serve(executionFixture)

    open()

    expect(await screen.findByText('Tempo restante')).toBeVisible()
    expect(screen.getByText('Chegada prevista')).toBeVisible()
    expect(screen.getByText('Próxima parada')).toBeVisible()
    expect(screen.getByText('Restante')).toBeVisible()
  })

  it('only offers to finish the route after reaching the last stop', async () => {
    serve(executionFixture)
    standAt(-23.56, -46.63)

    open()

    expect(await screen.findByRole('button', { name: 'Finalizar rota' })).toBeVisible()
    expect(screen.getByText('Você chegou ao destino final')).toBeVisible()
  })

  it('announces the next stop while the simulated trip advances', async () => {
    serve(executionFixture)
    open()
    await screen.findByRole('region', { name: 'Mapa de navegação' })

    expect(screen.getByRole('button', { name: 'Simular percurso' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await waitFor(() => expect(screen.getByText(/Em .*: A/)).toBeVisible(), { timeout: 4000 })
    expect(screen.getByRole('group', { name: 'Velocidade da simulação' })).toBeVisible()
  })

  it('finishes the route and goes back to the planning page', async () => {
    const calls = serve(executionFixture)
    standAt(-23.56, -46.63)
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Finalizar rota' }))

    expect(await screen.findByText('Rota finalizada.')).toBeVisible()
    expect(calls).toEqual(['finish'])
    await waitFor(() => expect(document.title).toBe('Nova rota · Lastro'))
  })

  it('asks for a justification before cancelling and sends it with the quick reason', async () => {
    const calls = serve(executionFixture)
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Cancelar rota' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar a rota' })
    expect(calls).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar rota' }))
    expect(await within(dialog).findByText(/pelo menos 10 caracteres/)).toBeVisible()
    expect(calls).toEqual([])

    await user.selectOptions(within(dialog).getByLabelText('Motivo'), 'Problema no veículo')
    await user.type(within(dialog).getByLabelText('Justificativa'), 'Pneu furado na Marginal')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar rota' }))

    expect(await screen.findByText('Rota cancelada.')).toBeVisible()
    expect(calls).toEqual(['cancel: Problema no veículo. Pneu furado na Marginal'])
  })

  it('sends only the written text when the reason is "Outro motivo"', async () => {
    const calls = serve(executionFixture)
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Cancelar rota' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar a rota' })
    await user.type(within(dialog).getByLabelText('Justificativa'), '  Operação suspensa pela gerência  ')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar rota' }))

    await waitFor(() => expect(calls).toEqual(['cancel: Operação suspensa pela gerência']))
  })

  it('lets the user go back from the cancellation without cancelling', async () => {
    const calls = serve(executionFixture)
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Cancelar rota' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar a rota' })
    await user.click(within(dialog).getByRole('button', { name: 'Voltar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls).toEqual([])
  })

  it('cancels a scheduled route with a justification', async () => {
    const calls = serve({
      ...executionFixture,
      status: 'SCHEDULED',
      startedAt: null,
      scheduledAt: '2026-10-20T15:00:00.000Z',
    })
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Cancelar agendamento' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar o agendamento' })
    await user.type(within(dialog).getByLabelText('Justificativa'), 'Cliente remarcou para a semana seguinte')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar agendamento' }))

    expect(await screen.findByText('Agendamento cancelado.')).toBeVisible()
    expect(calls).toEqual(['cancel: Cliente remarcou para a semana seguinte'])
  })

  it('offers to start a scheduled route now', async () => {
    const calls = serve({
      ...executionFixture,
      status: 'SCHEDULED',
      startedAt: null,
      scheduledAt: '2026-10-20T15:00:00.000Z',
    })
    const user = userEvent.setup()
    open()

    expect(await screen.findByRole('heading', { name: 'Esta rota está agendada' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Iniciar agora' }))

    expect(await screen.findByRole('region', { name: 'Mapa de navegação' })).toBeVisible()
    expect(calls).toEqual(['start'])
  })

  it.each([
    ['FINISHED', 'Esta rota já foi finalizada'],
    ['CANCELLED', 'Esta rota foi cancelada'],
  ] as const)('says when the route is %s', async (status, title) => {
    serve({ ...executionFixture, status })

    open()

    expect(await screen.findByRole('heading', { name: title })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar ao planejamento' })).toBeVisible()
  })

  it('shows why a route was cancelled', async () => {
    serve({ ...executionFixture, status: 'CANCELLED', cancellationReason: 'Cliente ausente. Portão fechado.' })

    open()

    expect(await screen.findByText('Motivo: Cliente ausente. Portão fechado.')).toBeVisible()
  })

  it('explains when the execution does not exist', async () => {
    server.use(
      http.get(apiUrl('/api/executions/:id'), () =>
        HttpResponse.json({ status: 404, detail: 'Execution 9 not found' }, { status: 404 }),
      ),
    )

    open()

    expect(await screen.findByRole('alert')).toBeVisible()
  })

  it('treats an invalid id as a page that does not exist', async () => {
    open(0)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
