import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
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
    http.post(apiUrl('/api/executions/:id/cancel'), () => {
      calls.push('cancel')
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

describe('ExecutionPage', () => {
  it('shows the navigation map without the application menu while the route is in progress', async () => {
    serve(executionFixture)

    open()

    expect(await screen.findByRole('region', { name: 'Mapa de navegação' })).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simular percurso' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Finalizar rota' })).toBeVisible()
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
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Finalizar rota' }))

    expect(await screen.findByText('Rota finalizada.')).toBeVisible()
    expect(calls).toEqual(['finish'])
    await waitFor(() => expect(document.title).toBe('Nova rota · Lastro'))
  })

  it('cancels the route only after the confirmation', async () => {
    const calls = serve(executionFixture)
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: 'Cancelar rota' }))
    expect(calls).toEqual([])
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar a rota' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Cancelar rota' }),
    )

    expect(await screen.findByText('Rota cancelada.')).toBeVisible()
    expect(calls).toEqual(['cancel'])
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
