import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HistoryPage from '@/pages/HistoryPage/HistoryPage'
import type { OperationSummary } from '@/services/schemas/operation'
import { apiUrl } from '@/test/api'
import { operationFixture, pageOf, useOperationsApi, useVehiclesApi } from '@/test/fakeApi'
import { vehicleFixture } from '@/test/fixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { server } from '@/test/server'

const routes = [{ path: '/historico', element: <HistoryPage /> }]

function operation(id: number, overrides: Partial<OperationSummary> = {}): OperationSummary {
  return { ...operationFixture, id, ...overrides }
}

function renderHistory(search = '') {
  return renderRoutes(routes, `/historico${search}`)
}

beforeEach(() => {
  useVehiclesApi([vehicleFixture, { ...vehicleFixture, id: 2, placa: 'XYZ9K88' }])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HistoryPage table', () => {
  it('lists the operations with their data, in the Brazilian format', async () => {
    useOperationsApi(() => pageOf([operation(7), operation(8, { criterion: 'DISTANCE' })]))

    renderHistory()

    const table = await screen.findByRole('table', { name: 'Operações calculadas' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    const cells = within(rows[0] as HTMLElement)
      .getAllByRole('cell')
      .map((cell) => cell.textContent?.trim())
    expect(cells.slice(0, 6)).toEqual([
      '7',
      expect.stringMatching(/^05\/10\/2026.*09:00$/),
      'ABC1D23',
      'Menor emissão',
      '5,5',
      '2,02',
    ])
    expect(within(rows[0] as HTMLElement).getByText('Íntegra')).toBeVisible()
    expect(within(rows[1] as HTMLElement).getByText('Menor distância')).toBeVisible()
  })

  it('links every operation to its verification', async () => {
    useOperationsApi(() => pageOf([operation(7)]))

    renderHistory()

    expect(await screen.findByRole('link', { name: 'Verificar operação 7' })).toHaveAttribute(
      'href',
      '/verificacao/7',
    )
  })

  it('shows the total of operations', async () => {
    useOperationsApi(() => pageOf([operation(7)], 24))

    renderHistory()

    expect(await screen.findByText('24 operações')).toBeVisible()
  })

  it('uses the singular for one operation', async () => {
    useOperationsApi(() => pageOf([operation(7)]))

    renderHistory()

    expect(await screen.findByText('1 operação')).toBeVisible()
  })

  it('shows an operation that is still being calculated or failed, without totals', async () => {
    useOperationsApi(() =>
      pageOf([
        operation(7, {
          status: 'PENDING',
          totalEmissionKg: null,
          totalDistanceMeters: null,
          integrityStatus: 'NOT_ANCHORED',
        }),
        operation(8, { status: 'FAILED', totalEmissionKg: null, totalDistanceMeters: null }),
      ]),
    )

    renderHistory()

    expect(await screen.findByText('Calculando')).toBeVisible()
    expect(screen.getByText('Falhou')).toBeVisible()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
  })

  it('shows every integrity verdict in words', async () => {
    useOperationsApi(() =>
      pageOf([
        operation(1, { integrityStatus: 'VALID' }),
        operation(2, { integrityStatus: 'TAMPERED' }),
        operation(3, { integrityStatus: 'NOT_ANCHORED' }),
      ]),
    )

    renderHistory()

    expect(await screen.findByText('Íntegra')).toBeVisible()
    expect(screen.getByText('Alterada')).toBeVisible()
    expect(screen.getByText('Aguardando registro')).toBeVisible()
  })
})

describe('HistoryPage states', () => {
  it('shows a loading state while the first page loads', async () => {
    server.use(
      http.get(apiUrl('/api/routes'), async () => {
        await delay(40)
        return HttpResponse.json(pageOf([operation(7)]))
      }),
    )

    renderHistory()

    expect(screen.getByText('Carregando operações')).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: 'Operações calculadas' })).toBeVisible()
  })

  it('invites the user to calculate the first route when there is no operation', async () => {
    useOperationsApi(() => pageOf([]))

    renderHistory()

    expect(await screen.findByRole('heading', { name: 'Nenhuma operação ainda' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Calcular rotas' })).toHaveAttribute('href', '/')
  })

  it('says the filters left nothing and clears them with one click', async () => {
    useOperationsApi((params) => (params.has('criterion') ? pageOf([]) : pageOf([operation(7)])))
    const router = renderHistory('?criterio=DISTANCE')
    const empty = await screen.findByRole('heading', { name: 'Nenhuma operação com esses filtros' })
    expect(empty).toBeVisible()

    await userEvent.click(
      within(empty.parentElement as HTMLElement).getByRole('button', { name: 'Limpar filtros' }),
    )

    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findByRole('table', { name: 'Operações calculadas' })).toBeVisible()
  })

  it('explains a failure and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/routes'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json(pageOf([operation(7)]))
      }),
    )
    renderHistory()

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('table', { name: 'Operações calculadas' })).toBeVisible()
  })
})

describe('HistoryPage sorting', () => {
  it('starts with the newest operation first and says so', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)]))

    renderHistory()

    await screen.findByRole('table', { name: 'Operações calculadas' })
    expect(requests[0]?.get('sort')).toBe('createdAt')
    expect(requests[0]?.get('direction')).toBe('desc')
    expect(screen.getByRole('columnheader', { name: 'Data' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('sorts by emission and flips the direction on the second click, keeping it in the address', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)]))
    const router = renderHistory()
    const user = userEvent.setup()
    await screen.findByRole('table', { name: 'Operações calculadas' })

    await user.click(screen.getByRole('button', { name: 'Emissão (kg CO₂)' }))

    await waitFor(() => expect(requests.at(-1)?.get('sort')).toBe('totalEmissionKg'))
    expect(requests.at(-1)?.get('direction')).toBe('asc')
    expect(router.state.location.search).toBe('?ordem=totalEmissionKg&direcao=asc')
    expect(screen.getByRole('columnheader', { name: 'Emissão (kg CO₂)' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    await user.click(screen.getByRole('button', { name: 'Emissão (kg CO₂)' }))

    await waitFor(() => expect(requests.at(-1)?.get('direction')).toBe('desc'))
  })

  it('goes back to the first page when the sorting changes', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)], 30))
    renderHistory('?pagina=2')
    await screen.findByRole('table', { name: 'Operações calculadas' })

    await userEvent.click(screen.getByRole('button', { name: 'Distância (km)' }))

    await waitFor(() => expect(requests.at(-1)?.get('page')).toBe('1'))
    expect(requests.at(-1)?.get('sort')).toBe('totalDistanceMeters')
  })
})

describe('HistoryPage filters', () => {
  it('filters by vehicle, criterion and integrity, and starts again from the first page', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)], 30))
    const router = renderHistory('?pagina=2')
    const user = userEvent.setup()
    await screen.findByRole('table', { name: 'Operações calculadas' })
    await screen.findByRole('option', { name: 'XYZ9K88' })

    await user.selectOptions(screen.getByLabelText('Veículo'), '2')
    await user.selectOptions(screen.getByLabelText('Critério'), 'DISTANCE')
    await user.selectOptions(screen.getByLabelText('Integridade'), 'TAMPERED')

    await waitFor(() => expect(requests.at(-1)?.get('integrity')).toBe('TAMPERED'))
    const last = requests.at(-1)
    expect(last?.get('vehicleId')).toBe('2')
    expect(last?.get('criterion')).toBe('DISTANCE')
    expect(last?.get('page')).toBe('1')
    expect(router.state.location.search).toBe('?veiculo=2&criterio=DISTANCE&integridade=TAMPERED')
  })

  it('filters by date', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)]))
    renderHistory()
    await screen.findByRole('table', { name: 'Operações calculadas' })

    await userEvent.type(screen.getByLabelText('De'), '2026-10-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-31')

    await waitFor(() => expect(requests.at(-1)?.get('to')).toBe('2026-10-31'))
    expect(requests.at(-1)?.get('from')).toBe('2026-10-01')
  })

  it('warns when the initial date is after the final date', async () => {
    useOperationsApi(() => pageOf([operation(7)]))
    renderHistory('?de=2026-10-10&ate=2026-10-01')

    expect(await screen.findByText('A data inicial é maior que a final.')).toBeVisible()
  })

  it('reads the filters from the address and shows them in the controls', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)]))
    renderHistory('?veiculo=2&criterio=EMISSION&integridade=VALID&de=2026-10-01')

    await screen.findByRole('table', { name: 'Operações calculadas' })
    await screen.findByRole('option', { name: 'XYZ9K88' })

    expect(screen.getByLabelText('Veículo')).toHaveValue('2')
    expect(screen.getByLabelText('Critério')).toHaveValue('EMISSION')
    expect(screen.getByLabelText('Integridade')).toHaveValue('VALID')
    expect(screen.getByLabelText('De')).toHaveValue('2026-10-01')
    expect(requests[0]?.get('vehicleId')).toBe('2')
  })

  it('clears every filter but keeps the sorting', async () => {
    const requests = useOperationsApi(() => pageOf([operation(7)]))
    const router = renderHistory('?criterio=EMISSION&ordem=totalEmissionKg&direcao=asc')
    await screen.findByRole('table', { name: 'Operações calculadas' })

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() => expect(requests.at(-1)?.has('criterion')).toBe(false))
    expect(router.state.location.search).toBe('?ordem=totalEmissionKg&direcao=asc')
  })

  it('disables clearing when there is nothing to clear', async () => {
    useOperationsApi(() => pageOf([operation(7)]))
    renderHistory()
    await screen.findByRole('table', { name: 'Operações calculadas' })

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled()
  })
})

describe('HistoryPage pagination', () => {
  it('moves between pages and keeps the page in the address', async () => {
    const requests = useOperationsApi((params) =>
      params.get('page') === '2'
        ? { items: [operation(2)], total: 20, page: 2, size: 10 }
        : { items: [operation(1)], total: 20, page: 1, size: 10 },
    )
    const router = renderHistory()
    await screen.findByRole('table', { name: 'Operações calculadas' })
    expect(screen.getByText('Página 1 de 2')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => expect(requests.at(-1)?.get('page')).toBe('2'))
    expect(router.state.location.search).toBe('?pagina=2')
    expect(await screen.findByText('Página 2 de 2')).toBeVisible()
  })

  it('goes back to the last page when the address points past the end', async () => {
    const requests = useOperationsApi((params) =>
      params.get('page') === '2'
        ? { items: [operation(2)], total: 20, page: 2, size: 10 }
        : { items: [], total: 20, page: Number(params.get('page')), size: 10 },
    )
    const router = renderHistory('?pagina=9')

    await waitFor(() => expect(router.state.location.search).toBe('?pagina=2'))
    await waitFor(() => expect(requests.at(-1)?.get('page')).toBe('2'))
  })

  it('has no pagination when everything fits on one page', async () => {
    useOperationsApi(() => pageOf([operation(7)]))
    renderHistory()
    await screen.findByRole('table', { name: 'Operações calculadas' })

    expect(
      screen.queryByRole('navigation', { name: 'Paginação do histórico' }),
    ).not.toBeInTheDocument()
  })
})

describe('HistoryPage on narrow screens', () => {
  function stubNarrow() {
    vi.stubGlobal('matchMedia', (query: string) => ({
      media: query,
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
  }

  it('shows the operations as a list instead of a wide table', async () => {
    stubNarrow()
    useOperationsApi(() => pageOf([operation(7), operation(8)]))

    renderHistory()

    const list = await screen.findByRole('list', { name: 'Operações calculadas' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('Operação 7')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('moves the filters into a dialog and counts the active ones', async () => {
    stubNarrow()
    const requests = useOperationsApi(() => pageOf([operation(7)]))
    renderHistory('?criterio=EMISSION')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Filtros (1)' }))

    const dialog = screen.getByRole('dialog', { name: 'Filtros' })
    expect(within(dialog).getByLabelText('Critério')).toHaveValue('EMISSION')
    await user.selectOptions(within(dialog).getByLabelText('Integridade'), 'VALID')
    await waitFor(() => expect(requests.at(-1)?.get('integrity')).toBe('VALID'))
    await user.click(within(dialog).getByRole('button', { name: 'Concluir' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
