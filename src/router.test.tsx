import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '@/components/AppLayout/AppLayout'
import RouteErrorPage from '@/pages/RouteErrorPage/RouteErrorPage'
import { routes } from '@/router'
import { apiUrl } from '@/test/api'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'

describe('app routes', () => {
  beforeEach(() => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([])),
      http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
    )
  })

  it('shows the planning page at the root', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('heading', { level: 1, name: 'Nova rota' })).toBeVisible()
    expect(document.title).toBe('Nova rota · Logística Verde')
  })

  it('wraps pages in the layout with a labelled main navigation', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    expect(screen.getByRole('main')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Logística Verde' })).toHaveAttribute('href', '/')
  })

  it('marks the current section in the navigation', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('link', { name: 'Nova rota' })).toHaveAttribute('aria-current', 'page')
  })

  it('offers a skip link to the main content', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
  })

  it('opens the vehicles page from the navigation', async () => {
    server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])))
    const router = renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('link', { name: 'Veículos' }))

    expect(router.state.location.pathname).toBe('/veiculos')
    expect(screen.getByRole('heading', { level: 1, name: 'Veículos' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Veículos' })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('Veículos · Logística Verde')
  })

  it('opens the history page from the navigation', async () => {
    server.use(
      http.get(apiUrl('/api/routes'), () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 10 }),
      ),
    )
    const router = renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('link', { name: 'Histórico' }))

    expect(router.state.location.pathname).toBe('/historico')
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico de operações' })).toBeVisible()
    expect(document.title).toBe('Histórico de operações · Logística Verde')
  })

  it('opens the experiments page from the navigation', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = () => undefined
        unobserve = () => undefined
        disconnect = () => undefined
      },
    )
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () =>
        HttpResponse.json({ status: 404, detail: 'none' }, { status: 404 }),
      ),
    )
    const router = renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('link', { name: 'Experimentos' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Experimentos' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/experimentos')
    expect(document.title).toBe('Experimentos · Logística Verde')
    vi.unstubAllGlobals()
  })

  it('shows a not found page for unknown addresses and a way back', async () => {
    const router = renderRoutes(routes, '/rota-que-nao-existe')

    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
    expect(document.title).toBe('Página não encontrada · Logística Verde')

    await userEvent.click(screen.getByRole('link', { name: 'Voltar ao planejamento' }))

    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Nova rota' })).toBeVisible()
  })
})

describe('route error handling', () => {
  function BrokenPage(): never {
    throw new Error('page exploded')
  }

  const brokenRoutes = [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { errorElement: <RouteErrorPage />, children: [{ index: true, element: <BrokenPage /> }] },
      ],
    },
  ]

  it('replaces only the broken page with a friendly message and keeps the layout', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderRoutes(brokenRoutes, '/')

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado')
    expect(screen.getByRole('alert')).not.toHaveTextContent('page exploded')
    expect(screen.getByRole('button', { name: 'Recarregar a página' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    consoleError.mockRestore()
  })
})
