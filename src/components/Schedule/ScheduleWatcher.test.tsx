import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '@/router'
import type { Execution } from '@/services/schemas/execution'
import { apiUrl } from '@/test/api'
import { executionFixture } from '@/test/executionFixtures'
import { pageOf, useOperationsApi, useVehiclesApi } from '@/test/fakeApi'
import { completedRouteFixture, vehicleFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

const MINUTE_MS = 60_000

type RescheduleBody = { scheduledAt: string }

function scheduledIn(minutes: number, id = 3): Execution {
  return {
    ...executionFixture,
    id,
    status: 'SCHEDULED',
    startedAt: null,
    scheduledAt: new Date(Date.now() + minutes * MINUTE_MS).toISOString(),
  }
}

function useExecutionsApi(list: Execution[]) {
  const calls: { path: string; body: RescheduleBody | null }[] = []
  useVehiclesApi([vehicleFixture])
  server.use(
    http.get(apiUrl('/api/executions'), () => HttpResponse.json(list)),
    http.post(apiUrl('/api/executions/:id/start'), ({ params }) => {
      calls.push({ path: `start ${String(params['id'])}`, body: null })
      return HttpResponse.json({ ...executionFixture, id: Number(params['id']) })
    }),
    http.post(apiUrl('/api/executions/:id/reschedule'), async ({ params, request }) => {
      calls.push({ path: `reschedule ${String(params['id'])}`, body: (await request.json()) as RescheduleBody })
      return HttpResponse.json({
        ...scheduledIn(120, Number(params['id'])),
      })
    }),
    http.get(apiUrl('/api/routes/:id'), () => HttpResponse.json(completedRouteFixture)),
    http.get(apiUrl('/api/executions/:id'), ({ params }) =>
      HttpResponse.json({ ...executionFixture, id: Number(params['id']) }),
    ),
  )
  return calls
}

afterEach(() => {
  window.localStorage.clear()
})

describe('schedule reminders', () => {
  it('shows how long is left for the next scheduled route and warns about it once', async () => {
    useExecutionsApi([scheduledIn(12)])
    signInAs('OPERATOR')

    renderRoutes(routes, '/historico')

    expect(await screen.findByText('Próxima rota em 12 min')).toBeVisible()
    expect(await screen.findByText(/A rota de ABC1D23 .* começa em 12 min\./)).toBeVisible()
    expect(screen.getAllByText(/começa em/)).toHaveLength(1)
  })

  it('stays quiet when the next route is still far away', async () => {
    useExecutionsApi([scheduledIn(300)])
    signInAs('OPERATOR')

    renderRoutes(routes, '/historico')

    expect(await screen.findByText('Próxima rota em 5 h')).toBeVisible()
    expect(screen.queryByText(/começa em/)).not.toBeInTheDocument()
  })

  it('opens the dialog when the time arrives and starts the route now', async () => {
    const calls = useExecutionsApi([scheduledIn(-2)])
    signInAs('OPERATOR')
    const user = userEvent.setup()

    renderRoutes(routes, '/historico')

    const dialog = await screen.findByRole('dialog', { name: 'Chegou a hora da rota' })
    expect(within(dialog).getByText('ABC1D23')).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Ir agora' }))

    await waitFor(() => expect(calls).toEqual([{ path: 'start 3', body: null }]))
    expect(await screen.findByRole('region', { name: 'Mapa de navegação' })).toBeVisible()
  })

  it('reschedules from the dialog after validating the new time', async () => {
    const calls = useExecutionsApi([scheduledIn(-2)])
    signInAs('ADMIN')
    const user = userEvent.setup()

    renderRoutes(routes, '/historico')

    const dialog = await screen.findByRole('dialog', { name: 'Chegou a hora da rota' })
    await user.click(within(dialog).getByRole('button', { name: 'Reagendar' }))
    const field = within(dialog).getByLabelText('Nova data e hora')
    await user.clear(field)
    await user.type(field, '2020-01-01T08:00')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar novo horário' }))
    expect(await within(dialog).findByText('Escolha um horário no futuro.')).toBeVisible()
    expect(calls).toEqual([])

    await user.clear(field)
    await user.type(field, '2099-01-01T08:00')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar novo horário' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]?.path).toBe('reschedule 3')
    expect(await screen.findByText(/Rota reagendada para/)).toBeVisible()
  })

  it('lets the user close the dialog and keeps showing the route as due', async () => {
    useExecutionsApi([scheduledIn(-2)])
    signInAs('OPERATOR')
    const user = userEvent.setup()

    renderRoutes(routes, '/historico')

    const dialog = await screen.findByRole('dialog', { name: 'Chegou a hora da rota' })
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Rota agendada: agora')).toBeVisible()
  })

  it('does not look for scheduled routes for a profile that cannot plan', async () => {
    let requests = 0
    useVehiclesApi([vehicleFixture])
    server.use(
      http.get(apiUrl('/api/executions'), () => {
        requests += 1
        return HttpResponse.json([scheduledIn(-2)])
      }),
    )
    signInAs('AUDITOR')
    useOperationsApi(() => pageOf([]))

    renderRoutes(routes, '/historico')

    expect(await screen.findByRole('navigation', { name: 'Principal' })).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(requests).toBe(0)
  })
})
