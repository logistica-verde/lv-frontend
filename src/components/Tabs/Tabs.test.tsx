import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Tabs from '@/components/Tabs/Tabs'

const items = [
  { id: 'points', label: 'Pontos', content: <p>Lista de pontos</p> },
  { id: 'map', label: 'Mapa', content: <p>Mapa das rotas</p> },
  { id: 'segments', label: 'Trechos', content: <p>Tabela de trechos</p> },
]

describe('Tabs', () => {
  it('is a labelled tab list with the first tab selected', () => {
    render(<Tabs label="Seções" items={items} />)

    expect(screen.getByRole('tablist', { name: 'Seções' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'Pontos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Mapa' })).toHaveAttribute('aria-selected', 'false')
  })

  it('shows only the panel of the selected tab', () => {
    render(<Tabs label="Seções" items={items} />)

    expect(screen.getByRole('tabpanel', { name: 'Pontos' })).toBeVisible()
    expect(screen.queryByRole('tabpanel', { name: 'Mapa' })).not.toBeInTheDocument()
  })

  it('opens the initial tab when one is given', () => {
    render(<Tabs label="Seções" items={items} initialId="map" />)

    expect(screen.getByRole('tab', { name: 'Mapa' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Mapa das rotas')).toBeVisible()
  })

  it('switches panels on click and keeps the hidden ones mounted', async () => {
    const { container } = render(<Tabs label="Seções" items={items} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Trechos' }))

    expect(screen.getByRole('tabpanel', { name: 'Trechos' })).toBeVisible()
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3)
    expect(screen.getByText('Lista de pontos')).not.toBeVisible()
  })

  it('links each tab to its panel', () => {
    render(<Tabs label="Seções" items={items} />)

    const tab = screen.getByRole('tab', { name: 'Pontos' })
    const panelId = tab.getAttribute('aria-controls') ?? ''
    expect(document.getElementById(panelId)).toHaveAttribute('aria-labelledby', tab.id)
  })

  it('only puts the selected tab in the tab order', () => {
    render(<Tabs label="Seções" items={items} />)

    expect(screen.getByRole('tab', { name: 'Pontos' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Mapa' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves between tabs with the arrow keys, wrapping around', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Seções" items={items} />)

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Mapa' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Mapa' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Trechos' })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the first and last tabs with Home and End', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Seções" items={items} initialId="map" />)

    await user.tab()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Trechos' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Pontos' })).toHaveAttribute('aria-selected', 'true')
  })
})
