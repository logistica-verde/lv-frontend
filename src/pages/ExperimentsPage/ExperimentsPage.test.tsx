import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExperimentsPage from '@/pages/ExperimentsPage/ExperimentsPage'
import type { Experiment } from '@/services/schemas/experiment'
import { experimentInputSchema } from '@/services/schemas/experiment'
import type { ExperimentInput } from '@/services/schemas/experiment'
import { apiUrl } from '@/test/api'
import { experimentFixture, experimentRun, useExperimentApi } from '@/test/fakeApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

class StubResizeObserver {
  observe = () => undefined
  unobserve = () => undefined
  disconnect = () => undefined
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function pending(completed: number): Experiment {
  return {
    ...experimentFixture,
    status: 'PENDING',
    progress: { completed, total: 4 },
    runs: experimentFixture.runs.slice(0, completed),
  }
}

describe('ExperimentsPage states', () => {
  it('shows a loading state, then invites the user to run the first experiment', async () => {
    server.use(
      http.get(apiUrl('/api/experiments/latest'), async () => {
        await delay(30)
        return HttpResponse.json({ status: 404, detail: 'none' }, { status: 404 })
      }),
    )

    renderWithProviders(<ExperimentsPage />)

    expect(screen.getByText('Carregando experimentos')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Nenhum experimento executado' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Executar experimentos' })).toBeEnabled()
    expect(document.title).toBe('Experimentos · Lastro')
  })

  it('describes the setup that will run when there is no experiment yet', async () => {
    useExperimentApi(() => null)

    renderWithProviders(<ExperimentsPage />)

    expect(
      await screen.findByText('Instâncias de 10, 15, 20, 25, 30 pontos, com 3 sementes cada.'),
    ).toBeVisible()
  })

  it('explains a failure to load and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json(experimentFixture)
      }),
    )
    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      await screen.findByRole('table', {
        name: 'Resultados de cada execução por instância e semente',
      }),
    ).toBeVisible()
  })

  it('shows the progress while the experiment runs and keeps the results so far', async () => {
    useExperimentApi(() => pending(2))

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByText('Executando 2 de 4 execuções…')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '2')
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '4')
    expect(
      within(
        await screen.findByRole('table', {
          name: 'Resultados de cada execução por instância e semente',
        }),
      ).getAllByRole('row'),
    ).toHaveLength(4)
    expect(screen.getByRole('button', { name: /Executar experimentos/ })).toBeDisabled()
  })

  it('updates by itself until the experiment finishes', async () => {
    let step = 0
    useExperimentApi(() => {
      step += 1
      return step < 3 ? pending(1) : experimentFixture
    })

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByText('Executando 1 de 4 execuções…')).toBeVisible()
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
    expect(
      within(
        screen.getByRole('table', { name: 'Resultados de cada execução por instância e semente' }),
      ).getAllByRole('row'),
    ).toHaveLength(6)
  })

  it('reports an experiment that failed', async () => {
    useExperimentApi(() => ({
      ...experimentFixture,
      status: 'FAILED',
      errorMessage: 'Otimizador indisponível',
    }))

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Otimizador indisponível')
  })

  it('warns that the numbers are simulated when running against the mock API', async () => {
    vi.stubEnv('MODE', 'mock')
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByRole('note')).toHaveTextContent('Dados simulados')
  })

  it('does not show that warning with the real API', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    await screen.findByRole('table', {
      name: 'Resultados de cada execução por instância e semente',
    })
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})

describe('ExperimentsPage running an experiment', () => {
  it('starts the default instances and seeds, then follows the experiment', async () => {
    let body: ExperimentInput | null = null
    let started = false
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () =>
        started
          ? HttpResponse.json(pending(0))
          : HttpResponse.json({ status: 404, detail: 'none' }, { status: 404 }),
      ),
      http.post(apiUrl('/api/experiments'), async ({ request }) => {
        body = experimentInputSchema.parse(await request.json())
        started = true
        return HttpResponse.json({ id: 1, status: 'PENDING' }, { status: 202 })
      }),
    )
    renderWithProviders(<ExperimentsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Executar experimentos' }))

    expect(await screen.findByText('Executando 0 de 4 execuções…')).toBeVisible()
    expect(body).toEqual({ instances: [10, 15, 20, 25, 30], seeds: [1, 2, 3] })
  })

  it('shows the API message when starting fails', async () => {
    useExperimentApi(() => null)
    server.use(
      http.post(apiUrl('/api/experiments'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    renderWithProviders(<ExperimentsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Executar experimentos' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
  })
})

describe('ExperimentsPage results table', () => {
  it('lists each run with its distance, emission, time and the emission difference', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    const table = await screen.findByRole('table', {
      name: 'Resultados de cada execução por instância e semente',
    })
    const firstRow = within(table).getAllByRole('row')[2] as HTMLElement
    expect(
      within(firstRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['10', '1', '20', '100', '1.000', '20,8', '90', '1.200', '−10%'])
  })

  it('groups the columns by criterion', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    const table = await screen.findByRole('table', {
      name: 'Resultados de cada execução por instância e semente',
    })
    expect(within(table).getByRole('columnheader', { name: 'Menor distância' })).toHaveAttribute(
      'colspan',
      '3',
    )
    expect(within(table).getByRole('columnheader', { name: 'Menor emissão' })).toHaveAttribute(
      'colspan',
      '3',
    )
    expect(within(table).getByRole('columnheader', { name: 'Δ emissão' })).toBeVisible()
  })

  it('paginates the runs instead of scrolling', async () => {
    const runs = Array.from({ length: 9 }, (_, index) => experimentRun(10 + index, 1))
    useExperimentApi(() => ({ ...experimentFixture, runs, progress: { completed: 9, total: 9 } }))

    renderWithProviders(<ExperimentsPage />)

    const table = await screen.findByRole('table', {
      name: 'Resultados de cada execução por instância e semente',
    })
    expect(within(table).getAllByRole('row')).toHaveLength(9)
    expect(screen.getByText('Página 1 de 2')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(within(table).getAllByRole('row')).toHaveLength(4)
  })
})

describe('ExperimentsPage charts', () => {
  it('has a convergence chart and an emissions chart, each with a text summary', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    expect(
      await screen.findByRole('img', {
        name: 'Gráfico de convergência: melhor aptidão (kg CO₂) por geração',
      }),
    ).toBeVisible()
    expect(screen.getByRole('img', { name: /Gráfico de barras/ })).toBeVisible()
    expect(
      screen.getByRole('img', { name: /Gráfico de convergência/ }),
    ).toHaveAccessibleDescription(
      'A melhor aptidão vai de 120 kg CO₂ na geração 1 a 90 kg CO₂ na geração 6.',
    )
  })

  it('summarises the average emission of both criteria for every instance', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    const chart = await screen.findByRole('img', { name: /Gráfico de barras/ })
    expect(chart).toHaveAccessibleDescription(
      '10 pontos: 100 kg CO₂ na menor distância e 90 kg CO₂ na menor emissão; 20 pontos: 100 kg CO₂ na menor distância e 90 kg CO₂ na menor emissão',
    )
  })

  it('lets the user pick the run and the criterion of the convergence curve', async () => {
    useExperimentApi(() => experimentFixture)
    renderWithProviders(<ExperimentsPage />)
    const user = userEvent.setup()
    await screen.findByRole('img', { name: /Gráfico de convergência/ })

    await user.selectOptions(screen.getByLabelText('Execução'), '20-2')
    await user.click(screen.getByRole('radio', { name: 'Menor distância' }))

    const chart = screen.getByRole('img', { name: /Gráfico de convergência/ })
    expect(chart).toHaveAttribute(
      'aria-label',
      'Gráfico de convergência: melhor aptidão (km) por geração',
    )
    expect(chart).toHaveAccessibleDescription(
      'A melhor aptidão vai de 26 km na geração 1 a 20 km na geração 6.',
    )
  })

  it('lists every run in the picker', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    await screen.findByRole('img', { name: /Gráfico de convergência/ })
    expect(
      within(screen.getByLabelText('Execução'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      '10 pontos · semente 1',
      '10 pontos · semente 2',
      '20 pontos · semente 1',
      '20 pontos · semente 2',
    ])
  })

  it('says there is nothing to plot before the first run finishes', async () => {
    useExperimentApi(() => ({ ...pending(0) }))

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findAllByRole('heading', { name: 'Sem execuções' })).toHaveLength(3)
  })
})

describe('ExperimentsPage on narrow screens', () => {
  function stubNarrow() {
    vi.stubGlobal('matchMedia', (query: string) => ({
      media: query,
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
  }

  it('splits the content into tabs and shows the runs as a list', async () => {
    stubNarrow()
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByRole('tab', { name: 'Resultados' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const list = screen.getByRole('list', { name: 'Resultados de cada execução' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)
    expect(within(list).getByText('10 pontos · semente 1')).toBeVisible()
    expect(
      screen.queryByRole('table', { name: 'Resultados de cada execução por instância e semente' }),
    ).not.toBeInTheDocument()
  })

  it('opens the charts from their tabs', async () => {
    stubNarrow()
    useExperimentApi(() => experimentFixture)
    renderWithProviders(<ExperimentsPage />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('tab', { name: 'Convergência' }))
    expect(screen.getByRole('img', { name: /Gráfico de convergência/ })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Emissões' }))
    expect(screen.getByRole('img', { name: /Gráfico de barras/ })).toBeVisible()
  })
})

describe('ExperimentsPage summary', () => {
  it('checks the goals of the work against the results', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    const saving = (await screen.findByText('Redução média de emissão'))
      .parentElement as HTMLElement
    expect(within(saving).getByText('10%')).toBeVisible()
    expect(within(saving).getByText(/Meta: ≥ 5% · meta atingida/)).toBeVisible()
    const time = screen.getByText('Maior tempo de execução').parentElement as HTMLElement
    expect(within(time).getByText('1,2 s')).toBeVisible()
    expect(within(time).getByText(/Meta: < 60 s · meta atingida/)).toBeVisible()
  })

  it('says when a goal is missed', async () => {
    const runs = experimentFixture.runs.map((run) => ({
      ...run,
      emission: { ...run.emission, emissionKg: 99, executionMs: 61000 },
    }))
    useExperimentApi(() => ({ ...experimentFixture, runs }))

    renderWithProviders(<ExperimentsPage />)

    expect(await screen.findByText(/Meta: ≥ 5% · meta não atingida/)).toBeVisible()
    expect(screen.getByText(/Meta: < 60 s · meta não atingida/)).toBeVisible()
  })

  it('averages every instance with the emission difference', async () => {
    useExperimentApi(() => experimentFixture)

    renderWithProviders(<ExperimentsPage />)

    const table = await screen.findByRole('table', {
      name: 'Média das execuções de cada instância, por critério',
    })
    const rows = within(table).getAllByRole('row')
    expect(
      within(rows[2] as HTMLElement)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['10', '20', '100', '20,8', '90', '1,2', '−10%'])
    expect(rows).toHaveLength(4)
  })

  it('downloads the results as a CSV once there are runs', async () => {
    useExperimentApi(() => experimentFixture)
    const contents: string[] = []
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: (blob: Blob) => {
          void blob.text().then((text) => contents.push(text))
          return 'blob:csv'
        },
        revokeObjectURL: () => undefined,
      }),
    )
    renderWithProviders(<ExperimentsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar resultados' }))

    await waitFor(() => expect(contents).toHaveLength(1))
    expect(contents[0]).toContain('Redução de emissão (%)')
  })

  it('has nothing to export before the first experiment', async () => {
    useExperimentApi(() => null)

    renderWithProviders(<ExperimentsPage />)

    await screen.findByRole('heading', { name: 'Nenhum experimento executado' })
    expect(screen.getByRole('button', { name: 'Exportar resultados' })).toBeDisabled()
  })
})
