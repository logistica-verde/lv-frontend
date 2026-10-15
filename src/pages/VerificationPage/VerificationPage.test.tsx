import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VerificationPage from '@/pages/VerificationPage/VerificationPage'
import { apiUrl } from '@/test/api'
import { completedRouteFixture, integrityFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'
import { signInAs } from '@/test/session'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

const routes = [
  { path: '/verificacao', element: <VerificationPage /> },
  { path: '/verificacao/:routeId', element: <VerificationPage /> },
]

function useOperationApi() {
  server.use(
    http.get(apiUrl('/api/routes/:id/integrity'), ({ params }) =>
      HttpResponse.json({ ...integrityFixture, operationId: Number(params.id) }),
    ),
    http.get(apiUrl('/api/routes/:id'), ({ params }) =>
      HttpResponse.json({ ...completedRouteFixture, id: Number(params.id) }),
    ),
  )
}

afterEach(() => {
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('VerificationPage', () => {
  it('invites the user to pick an operation when none is selected', () => {
    renderRoutes(routes, '/verificacao')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Verificação de integridade' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Nenhuma operação selecionada' })).toBeVisible()
    expect(document.title).toBe('Verificação de integridade · Lastro')
  })

  it('verifies the operation in the address and fills the search with its ID', async () => {
    useOperationApi()

    renderRoutes(routes, '/verificacao/7')

    expect(await screen.findByText('Íntegra')).toBeVisible()
    expect(screen.getByLabelText('ID da operação')).toHaveValue(7)
    expect(await screen.findByText(/JSON canônico/)).toBeVisible()
  })

  it('searches by operation ID', async () => {
    useOperationApi()
    const router = renderRoutes(routes, '/verificacao')
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('ID da operação'), '12')
    await user.click(screen.getByRole('button', { name: 'Verificar integridade' }))

    expect(router.state.location.pathname).toBe('/verificacao/12')
    expect(await screen.findByText('Íntegra')).toBeVisible()
  })

  it('asks for the ID and sends nothing when the field is empty', async () => {
    const router = renderRoutes(routes, '/verificacao')

    await userEvent.click(screen.getByRole('button', { name: 'Verificar integridade' }))

    expect(await screen.findByText('Informe o ID da operação')).toBeVisible()
    expect(router.state.location.pathname).toBe('/verificacao')
  })

  it.each(['0', '-3', '2.5'])('rejects the ID %s', async (value) => {
    const router = renderRoutes(routes, '/verificacao')
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('ID da operação'), value)
    await user.click(screen.getByRole('button', { name: 'Verificar integridade' }))

    expect(await screen.findByRole('alert')).toBeVisible()
    expect(router.state.location.pathname).toBe('/verificacao')
  })

  it('refuses an invalid ID in the address', () => {
    renderRoutes(routes, '/verificacao/abc')

    expect(screen.getByRole('alert')).toHaveTextContent('O ID informado na URL não é válido')
    expect(screen.queryByText('Íntegra')).not.toBeInTheDocument()
  })

  it('reports an operation that does not exist', async () => {
    server.use(
      http.get(apiUrl('/api/routes/:id/integrity'), () =>
        HttpResponse.json({ status: 404, detail: 'not found' }, { status: 404 }),
      ),
      http.get(apiUrl('/api/routes/:id'), () =>
        HttpResponse.json({ status: 404, detail: 'not found' }, { status: 404 }),
      ),
    )

    renderRoutes(routes, '/verificacao/999')

    await waitFor(() => expect(screen.getAllByText('Recurso não encontrado.')).toHaveLength(2))
  })
})

describe('VerificationPage recent verifications', () => {
  it('says there is nothing yet for a user who has not verified anything', () => {
    signInAs('AUDITOR')

    renderRoutes(routes, '/verificacao')

    expect(screen.getByText('As operações que você verificar aparecem aqui.')).toBeVisible()
  })

  it('remembers the operations the user verified, newest first, with a link to each', async () => {
    signInAs('AUDITOR')
    useOperationApi()
    const router = renderRoutes(routes, '/verificacao/7')
    const user = userEvent.setup()
    await screen.findByRole('list', { name: 'Verificações recentes' })

    await user.clear(screen.getByLabelText('ID da operação'))
    await user.type(screen.getByLabelText('ID da operação'), '8')
    await user.click(screen.getByRole('button', { name: 'Verificar integridade' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/verificacao/8'))
    const list = await screen.findByRole('list', { name: 'Verificações recentes' })
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(2))
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Operação #8', 'Operação #7'])
    expect(links[1]).toHaveAttribute('href', '/verificacao/7')
  })

  it('clears the list', async () => {
    signInAs('AUDITOR')
    useOperationApi()
    renderRoutes(routes, '/verificacao/7')
    await screen.findByRole('list', { name: 'Verificações recentes' })

    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(await screen.findByText('As operações que você verificar aparecem aqui.')).toBeVisible()
  })
})

describe('VerificationPage proof', () => {
  it('downloads the integrity report as a JSON proof', async () => {
    useOperationApi()
    const contents: string[] = []
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: (blob: Blob) => {
          void blob.text().then((text) => contents.push(text))
          return 'blob:json'
        },
        revokeObjectURL: () => undefined,
      }),
    )
    renderRoutes(routes, '/verificacao/7')

    await userEvent.click(await screen.findByRole('button', { name: 'Baixar comprovante (JSON)' }))

    await waitFor(() => expect(contents).toHaveLength(1))
    expect(JSON.parse(contents[0] ?? '{}')).toMatchObject({ operationId: 7, status: 'VALID' })
  })
})
