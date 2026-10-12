import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { createMemoryRouter } from 'react-router'
import type { Location } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import LoginPage from '@/pages/LoginPage/LoginPage'
import type { Role } from '@/services/schemas/user'
import { apiUrl } from '@/test/api'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

const loginBodySchema = z.object({ email: z.string(), senha: z.string() })

function sessionResponse(perfil: Role) {
  return {
    token: 'jwt-token',
    usuario: { id: 4, nome: 'Rafael Tonelli', email: 'rafael@example.test', perfil },
  }
}

function renderLogin(from?: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/', element: <p>Início</p> },
      { path: '/historico', element: <p>Histórico</p> },
    ],
    { initialEntries: [{ pathname: '/login', state: from ? { from } : null }] },
  )
  renderWithProviders(<RouterProvider router={router} />)
  return router
}

async function fillAndSubmit(email: string, senha: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('E-mail'), email)
  if (senha) await user.type(screen.getByLabelText('Senha'), senha)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  return user
}

function locationOf(router: ReturnType<typeof renderLogin>): Location {
  return router.state.location
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('LoginPage', () => {
  it('shows the sign-in form with labelled fields', () => {
    renderLogin()

    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
    expect(document.title).toBe('Entrar · Logística Verde')
  })

  it('asks for both fields and sends nothing when the form is empty', async () => {
    let calls = 0
    server.use(
      http.post(apiUrl('/api/auth/login'), () => {
        calls += 1
        return HttpResponse.json(sessionResponse('ADMIN'))
      }),
    )
    renderLogin()

    await fillAndSubmit('', '')

    expect(await screen.findByText('Informe o e-mail')).toBeVisible()
    expect(screen.getByText('Informe a senha')).toBeVisible()
    expect(screen.getByLabelText('E-mail')).toBeInvalid()
    expect(calls).toBe(0)
  })

  it('rejects an e-mail that is not an address', async () => {
    renderLogin()

    await fillAndSubmit('rafael', 'segredo')

    expect(await screen.findByText('Informe um e-mail válido')).toBeVisible()
  })

  it('sends the credentials, keeps the session and opens the planning screen for an operator', async () => {
    let received: z.infer<typeof loginBodySchema> | null = null
    server.use(
      http.post(apiUrl('/api/auth/login'), async ({ request }) => {
        received = loginBodySchema.parse(await request.json())
        return HttpResponse.json(sessionResponse('OPERATOR'))
      }),
    )
    const router = renderLogin()

    await fillAndSubmit('  rafael@example.test ', 'segredo')

    expect(await screen.findByText('Início')).toBeVisible()
    expect(received).toEqual({ email: 'rafael@example.test', senha: 'segredo' })
    expect(getSession()?.token).toBe('jwt-token')
    expect(getSession()?.usuario.perfil).toBe('OPERATOR')
    expect(locationOf(router).pathname).toBe('/')
  })

  it('opens the history for an auditor, who has no planning screen', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () => HttpResponse.json(sessionResponse('AUDITOR'))),
    )
    const router = renderLogin()

    await fillAndSubmit('rafael@example.test', 'segredo')

    expect(await screen.findByText('Histórico')).toBeVisible()
    expect(locationOf(router).pathname).toBe('/historico')
  })

  it('goes back to the page the user was trying to open', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () => HttpResponse.json(sessionResponse('OPERATOR'))),
    )
    const router = renderLogin('/historico')
    expect(screen.getByText('Entre para continuar de onde parou.')).toBeVisible()

    await fillAndSubmit('rafael@example.test', 'segredo')

    expect(await screen.findByText('Histórico')).toBeVisible()
    expect(locationOf(router).pathname).toBe('/historico')
  })

  it('explains wrong credentials without saying which field is wrong, and keeps the e-mail', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json({ status: 401, detail: 'Invalid credentials.' }, { status: 401 }),
      ),
    )
    renderLogin()

    await fillAndSubmit('rafael@example.test', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos')
    expect(screen.getByLabelText('E-mail')).toHaveValue('rafael@example.test')
    expect(getSession()).toBeNull()
  })

  it('explains that the account is disabled', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json({ status: 403, detail: 'User is inactive.' }, { status: 403 }),
      ),
    )
    renderLogin()

    await fillAndSubmit('rafael@example.test', 'segredo')

    expect(await screen.findByRole('alert')).toHaveTextContent('Este usuário está desativado')
  })

  it('explains when the API cannot be reached', async () => {
    server.use(http.post(apiUrl('/api/auth/login'), () => HttpResponse.error()))
    renderLogin()

    await fillAndSubmit('rafael@example.test', 'segredo')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API')
  })

  it('shows the button as busy and blocks double submissions while signing in', async () => {
    let calls = 0
    server.use(
      http.post(apiUrl('/api/auth/login'), async () => {
        calls += 1
        await delay(120)
        return HttpResponse.json(sessionResponse('OPERATOR'))
      }),
    )
    renderLogin()

    const user = await fillAndSubmit('rafael@example.test', 'segredo')

    const busy = screen.getByRole('button', { name: /Entrar/ })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')
    await user.click(busy)
    expect(await screen.findByText('Início')).toBeVisible()
    expect(calls).toBe(1)
  })

  it('skips the form when the user is already signed in', async () => {
    signInAs('ADMIN')

    const router = renderLogin()

    expect(await screen.findByText('Início')).toBeVisible()
    expect(locationOf(router).pathname).toBe('/')
  })

  it('mentions the simulated data in mock mode only', () => {
    vi.stubEnv('MODE', 'mock')
    renderLogin()

    expect(screen.getByRole('note')).toHaveTextContent('dados simulados')
  })

  it('has no such note with the real API', () => {
    renderLogin()

    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
