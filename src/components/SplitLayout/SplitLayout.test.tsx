import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SplitLayout from '@/components/SplitLayout/SplitLayout'

function stubViewport(isDesktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: isDesktop,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

function renderSplit() {
  return render(
    <SplitLayout
      panelLabel="Pontos"
      mapLabel="Mapa"
      panel={<p>Painel de pontos</p>}
      map={<p>Mapa das rotas</p>}
    />,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SplitLayout', () => {
  it('shows the panel and the map together on wide screens', () => {
    stubViewport(true)

    renderSplit()

    expect(screen.getByText('Painel de pontos')).toBeVisible()
    expect(screen.getByText('Mapa das rotas')).toBeVisible()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('turns the panel into a tab over the map on narrow screens', () => {
    stubViewport(false)

    renderSplit()

    expect(screen.getByRole('tablist', { name: 'Painel ou mapa' })).toBeInTheDocument()
    expect(screen.getByText('Painel de pontos')).toBeVisible()
    expect(screen.getByText('Mapa das rotas')).not.toBeVisible()
  })

  it('lets the user switch to the map on narrow screens', async () => {
    stubViewport(false)
    renderSplit()

    await userEvent.click(screen.getByRole('tab', { name: 'Mapa' }))

    expect(screen.getByText('Mapa das rotas')).toBeVisible()
    expect(screen.getByText('Painel de pontos')).not.toBeVisible()
  })
})
