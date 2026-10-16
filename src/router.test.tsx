import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '@/components/AppLayout/AppLayout'
import RouteErrorPage from '@/pages/RouteErrorPage/RouteErrorPage'
import { routes } from '@/router'
import { apiUrl } from '@/test/api'
import { renderRoutes } from '@/test/renderRoutes'
import { signInAs } from '@/test/session'
import { server } from '@/test/server'

describe('app routes', () => {
  beforeAll(async () => {
    await import('@/pages/ExperimentsPage/ExperimentsPage')
  }, 120000)

  beforeEach(() => {
    signInAs('ADMIN')
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([])),
      http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
    )
  })

  it('shows the planning page at the root', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('heading', { level: 1, name: 'Nova rota' })).toBeVisible()
    expect(document.title).toBe('Nova rota · Lastro')
  })

  it('wraps pages in the layout with a labelled main navigation', () => {
    renderRoutes(routes, '/')

    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    expect(screen.getByRole('main')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Lastro' })).toHaveAttribute('href', '/')
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

  it('opens the administration page from the navigation', async () => {
    server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])))
    const router = renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('link', { name: 'Administração' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Administração' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/administracao')
    expect(screen.getByRole('link', { name: 'Administração' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(document.title).toBe('Administração · Lastro')
  })

  it('keeps the old vehicles address working by redirecting to the administration', async () => {
    const router = renderRoutes(routes, '/veiculos')

    expect(await screen.findByRole('heading', { level: 1, name: 'Administração' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/administracao')
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
    expect(document.title).toBe('Histórico de operações · Lastro')
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
    expect(document.title).toBe('Experimentos · Lastro')
    vi.unstubAllGlobals()
  })

  it('shows a not found page for unknown addresses and a way back', async () => {
    const router = renderRoutes(routes, '/rota-que-nao-existe')

    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
    expect(document.title).toBe('Página não encontrada · Lastro')

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

describe('route protection', () => {
  beforeEach(() => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([])),
      http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
      http.get(apiUrl('/api/routes'), () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 10 }),
      ),
    )
  })

  it('sends visitors without a session to the login page', async () => {
    const router = renderRoutes(routes, '/historico')

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar no Lastro' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('returns to the page that was asked for after signing in', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json({
          token: 't',
          usuario: { id: 1, nome: 'Marina Duarte', email: 'm@example.test', perfil: 'ADMIN' },
        }),
      ),
    )
    const router = renderRoutes(routes, '/historico')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('E-mail'), 'm@example.test')
    await user.type(screen.getByLabelText('Senha'), 'qualquer')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Histórico de operações' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/historico')
  })

  it('takes an auditor from the planning screen to the history', async () => {
    signInAs('AUDITOR')

    const router = renderRoutes(routes, '/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Histórico de operações' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/historico')
  })

  it('explains when a profile has no access to a page', async () => {
    signInAs('OPERATOR')

    renderRoutes(routes, '/administracao')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Sem permissão para acessar esta página',
      }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/')
    expect(document.title).toBe('Sem permissão · Lastro')
  })

  it('keeps the verification screen away from operators', async () => {
    signInAs('OPERATOR')

    renderRoutes(routes, '/verificacao')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Sem permissão para acessar esta página',
      }),
    ).toBeVisible()
  })

  it('lets an auditor open the verification screen', async () => {
    signInAs('AUDITOR')

    renderRoutes(routes, '/verificacao')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verificação de integridade' }),
    ).toBeVisible()
  })

  it('shows only the sections the profile can open', () => {
    signInAs('OPERATOR')

    renderRoutes(routes, '/')

    const links = within(screen.getByRole('navigation', { name: 'Principal' }))
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(links).toEqual(['Nova rota', 'Histórico', 'Experimentos'])
  })

  it('signs out from the header and goes back to the login page', async () => {
    signInAs('ADMIN')
    const router = renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar no Lastro' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/login')
  })
})
