import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '@/components/AppLayout/AppLayout'
import { getSession } from '@/lib/session'
import { renderWithProviders } from '@/test/renderWithProviders'
import { sessionFor, signInAs } from '@/test/session'
import AccountBar from '@/components/AppLayout/AccountBar'

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
          { path: 'verificacao', element: <p>Verificação</p> },
          { path: 'historico', element: <p>Histórico</p> },
        ],
      },
    ],
    { initialEntries: ['/'] },
  )
  renderWithProviders(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AccountBar', () => {
  it('shows who is signed in and their profile', () => {
    renderWithProviders(<AccountBar session={sessionFor('AUDITOR')} variant="sidebar" />)

    expect(screen.getByText('Rafael Tonelli')).toBeVisible()
    expect(screen.getByText('Auditor')).toBeVisible()
  })

  it('signs out and discards the session', async () => {
    signInAs('ADMIN')
    renderWithProviders(<AccountBar session={sessionFor('ADMIN')} variant="sidebar" />)

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(getSession()).toBeNull()
  })

  it('offers a labelled sign-out button inside the menu variant', async () => {
    signInAs('OPERATOR')
    renderWithProviders(<AccountBar session={sessionFor('OPERATOR')} variant="menu" />)

    expect(screen.getByText('Operador')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(getSession()).toBeNull()
  })
})

describe('AppLayout with a session', () => {
  it('shows the account at the end of the header on wide screens', () => {
    stubViewport(true)
    signInAs('ADMIN')

    renderLayout()

    const links = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Nova rota',
      'Histórico',
      'Experimentos',
      'Verificação',
      'Administração',
    ])
    expect(screen.getByText('Marina Duarte')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  it('hides the sections that the profile cannot open', () => {
    stubViewport(true)
    signInAs('AUDITOR')

    renderLayout()

    const links = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Histórico',
      'Experimentos',
      'Verificação',
    ])
  })

  it('puts the account inside the menu on narrow screens', async () => {
    stubViewport(false)
    signInAs('OPERATOR')
    renderLayout()
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(menu).getByText('Carlos Menezes')).toBeVisible()
    expect(within(menu).getByRole('button', { name: 'Sair' })).toBeVisible()
  })
})
