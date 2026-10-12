import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '@/components/AppLayout/AppLayout'

function stubViewport(isWide: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: isWide,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

function renderLayout() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <p>Início</p> },
          { path: 'administracao', element: <p>Administração</p> },
        ],
      },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('AppLayout on wide screens', () => {
  it('shows the navigation in the header, without a menu button', () => {
    stubViewport(true)

    renderLayout()

    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Nova rota' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument()
  })
})

describe('AppLayout full-bleed pages', () => {
  function renderWith(handle: { fullBleed: boolean } | undefined) {
    stubViewport(true)
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppLayout />,
          children: [{ index: true, element: <p>Início</p>, handle }],
        },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)
  }

  it('removes the page padding when the route asks for the full area', () => {
    renderWith({ fullBleed: true })

    expect(screen.getByRole('main')).toHaveClass('bleed')
  })

  it('keeps the padding for ordinary pages', () => {
    renderWith(undefined)

    expect(screen.getByRole('main')).not.toHaveClass('bleed')
  })
})

describe('AppLayout on narrow screens', () => {
  it('hides the navigation behind a menu button', () => {
    stubViewport(false)

    renderLayout()

    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('opens the menu with every destination and says it is open', async () => {
    stubViewport(false)
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(menu).toBeVisible()
    expect(screen.getByRole('link', { name: 'Administração' })).toBeVisible()
  })

  it('closes the menu with the button', async () => {
    stubViewport(false)
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }))

    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('closes the menu with Escape and gives the focus back to the button', async () => {
    stubViewport(false)
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus()
  })

  it('goes to the chosen page and closes the menu', async () => {
    stubViewport(false)
    const router = renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    await userEvent.click(screen.getByRole('link', { name: 'Administração' }))

    expect(router.state.location.pathname).toBe('/administracao')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })
})

describe('AppLayout simulated data notice', () => {
  it('is not shown with the real API', () => {
    stubViewport(true)

    renderLayout()

    expect(screen.queryByText('Dados simulados')).not.toBeInTheDocument()
  })

  it('warns that the data is simulated when running against the mock API', () => {
    stubViewport(true)
    vi.stubEnv('MODE', 'mock')

    renderLayout()

    expect(screen.getByText('Dados simulados')).toBeVisible()
  })
})

describe('AppLayout skip link', () => {
  it('lets keyboard users jump to the content', () => {
    stubViewport(true)

    renderLayout()

    expect(screen.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
  })
})
