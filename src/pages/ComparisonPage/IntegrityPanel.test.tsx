import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import IntegrityPanel from '@/pages/ComparisonPage/IntegrityPanel'
import type { IntegrityReport } from '@/services/schemas/integrity'
import { apiUrl } from '@/test/api'
import { integrityFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

vi.mock('@/config/polling', () => ({
  ROUTE_POLL_INTERVAL_MS: 20,
  ANCHOR_POLL_INTERVAL_MS: 20,
  ANCHOR_MAX_POLLS: 3,
}))

const notAnchored: IntegrityReport = {
  ...integrityFixture,
  status: 'NOT_ANCHORED',
  ledgerHash: null,
  txHash: null,
  blockNumber: null,
  anchoredAt: null,
}

const tampered: IntegrityReport = {
  ...integrityFixture,
  status: 'TAMPERED',
  ledgerHash: 'ef'.repeat(32),
}

function useIntegrityApi(respond: (call: number) => IntegrityReport) {
  let calls = 0
  server.use(
    http.get(apiUrl('/api/routes/7/integrity'), () => {
      calls += 1
      return HttpResponse.json(respond(calls))
    }),
  )
  return () => calls
}

describe('IntegrityPanel', () => {
  it('shows a loading state while the report is fetched', async () => {
    server.use(
      http.get(apiUrl('/api/routes/7/integrity'), async () => {
        await delay(30)
        return HttpResponse.json(integrityFixture)
      }),
    )

    renderWithProviders(<IntegrityPanel routeId={7} />)

    expect(screen.getByText('Verificando integridade')).toBeInTheDocument()
    expect(await screen.findByText('Íntegra')).toBeVisible()
  })

  it('confirms a route whose data matches the blockchain and shows the evidence', async () => {
    useIntegrityApi(() => integrityFixture)

    renderWithProviders(<IntegrityPanel routeId={7} />)

    expect(await screen.findByText('Íntegra')).toBeVisible()
    expect(
      screen.getByText('Os dados da rota conferem com o registro na blockchain.'),
    ).toBeVisible()
    const panel = screen.getByRole('region', { name: 'Integridade na blockchain' })
    expect(within(panel).getByText('Hash no banco').nextElementSibling).toHaveTextContent(
      integrityFixture.databaseHash,
    )
    expect(within(panel).getByText('Hash na blockchain').nextElementSibling).toHaveTextContent(
      integrityFixture.ledgerHash ?? '',
    )
    expect(within(panel).getByText('Transação').nextElementSibling).toHaveTextContent(
      integrityFixture.txHash ?? '',
    )
    expect(within(panel).getByText('Bloco').nextElementSibling).toHaveTextContent('42')
    expect(within(panel).getByText('Registrada em').nextElementSibling).toHaveTextContent(
      /05\/10\/2026.*09:00:05/,
    )
  })

  it('raises an alert when the data was tampered with, showing both hashes', async () => {
    useIntegrityApi(() => tampered)

    renderWithProviders(<IntegrityPanel routeId={7} />)

    expect(await screen.findByText('Adulterada')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Os dados da rota no banco diferem do registro na blockchain.',
    )
    expect(screen.getByText(tampered.databaseHash)).toBeVisible()
    expect(screen.getByText('ef'.repeat(32))).toBeVisible()
  })

  it('does not raise an alert for a valid route', async () => {
    useIntegrityApi(() => integrityFixture)

    renderWithProviders(<IntegrityPanel routeId={7} />)

    await screen.findByText('Íntegra')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('waits for the anchoring and then confirms by itself', async () => {
    useIntegrityApi((call) => (call < 3 ? notAnchored : integrityFixture))

    renderWithProviders(<IntegrityPanel routeId={7} />)

    expect(await screen.findByText('Aguardando registro')).toBeVisible()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(await screen.findByText('Íntegra')).toBeVisible()
  })

  it('gives up polling after the maximum number of attempts', async () => {
    const calls = useIntegrityApi(() => notAnchored)

    renderWithProviders(<IntegrityPanel routeId={7} />)

    await screen.findByText('Aguardando registro')
    await new Promise((resolve) => setTimeout(resolve, 200))
    const settled = calls()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(settled).toBeLessThanOrEqual(4)
    expect(calls()).toBe(settled)
  })

  it('checks again on demand and shows the new result', async () => {
    const calls = useIntegrityApi((call) => (call === 1 ? notAnchored : integrityFixture))
    renderWithProviders(<IntegrityPanel routeId={7} />)
    await screen.findByText('Aguardando registro')

    await userEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }))

    expect(await screen.findByText('Íntegra')).toBeVisible()
    expect(calls()).toBeGreaterThanOrEqual(2)
  })

  it('marks the button as busy while a manual check runs', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/routes/7/integrity'), async () => {
        calls += 1
        if (calls > 1) {
          await delay(80)
        }
        return HttpResponse.json(integrityFixture)
      }),
    )
    renderWithProviders(<IntegrityPanel routeId={7} />)
    await screen.findByText('Íntegra')

    await userEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }))

    const busy = screen.getByRole('button', { name: /Verificar novamente/ })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')
    await vi.waitFor(() => expect(busy).toBeEnabled())
  })

  it('explains that the blockchain is unavailable and lets the user retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/routes/7/integrity'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 503, detail: 'Besu down' }, { status: 503 })
          : HttpResponse.json(integrityFixture)
      }),
    )
    renderWithProviders(<IntegrityPanel routeId={7} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O serviço de auditoria em blockchain está indisponível no momento.',
    )
    expect(screen.queryByText('Besu down')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Íntegra')).toBeVisible()
  })
})
