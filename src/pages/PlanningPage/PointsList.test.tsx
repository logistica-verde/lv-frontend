import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PointsList from '@/pages/PlanningPage/PointsList'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import { deliveryPointFixture } from '@/test/fixtures'

function makePoints(count: number): DeliveryPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    ...deliveryPointFixture,
    id: index + 1,
    nome: `Ponto ${index + 1}`,
    endereco: `Rua ${index + 1}`,
  }))
}

function renderList(
  points: DeliveryPoint[],
  handlers: Partial<Parameters<typeof PointsList>[0]> = {},
) {
  const props = { onAdd: vi.fn(), onMove: vi.fn(), onRemove: vi.fn(), ...handlers }
  render(<PointsList points={points} {...props} />)
  return props
}

describe('PointsList', () => {
  it('counts the points in its title and explains the limits', () => {
    renderList(makePoints(3))

    expect(screen.getByRole('heading', { name: 'Pontos de entrega (3)' })).toBeVisible()
    expect(screen.getByText('3 pontos selecionados.')).toBeVisible()
  })

  it('numbers the points in the order they will be sent', () => {
    renderList(makePoints(3))

    const items = within(screen.getByRole('list', { name: 'Pontos da rota' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1Ponto 1',
      '2Ponto 2',
      '3Ponto 3',
    ])
  })

  it('shows the address of a point as a tooltip', () => {
    renderList(makePoints(1))

    expect(screen.getByText('Ponto 1')).toHaveAttribute('title', 'Rua 1')
  })

  it('invites the user to add the first point when the list is empty', async () => {
    const { onAdd } = renderList([])

    expect(screen.getByRole('heading', { name: 'Nenhum ponto na rota' })).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('asks to move a point up or down by name', async () => {
    const { onMove } = renderList(makePoints(3))

    await userEvent.click(screen.getByRole('button', { name: 'Mover Ponto 2 para cima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mover Ponto 2 para baixo' }))

    expect(onMove).toHaveBeenNthCalledWith(1, 2, -1)
    expect(onMove).toHaveBeenNthCalledWith(2, 2, 1)
  })

  it('does not offer to move the first point up or the last point down', () => {
    renderList(makePoints(3))

    expect(screen.getByRole('button', { name: 'Mover Ponto 1 para cima' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mover Ponto 3 para baixo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mover Ponto 2 para cima' })).toBeEnabled()
  })

  it('asks to remove a point by name', async () => {
    const { onRemove } = renderList(makePoints(2))

    await userEvent.click(screen.getByRole('button', { name: 'Remover Ponto 2' }))

    expect(onRemove).toHaveBeenCalledWith(2)
  })

  it('paginates long lists instead of scrolling', async () => {
    renderList(makePoints(8))

    const list = screen.getByRole('list', { name: 'Pontos da rota' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('Página 1 de 2')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Ponto 8')).toBeVisible()
    expect(within(list).getByText('6')).toBeVisible()
  })

  it('has no pagination when everything fits', () => {
    renderList(makePoints(4))

    expect(
      screen.queryByRole('navigation', { name: 'Paginação dos pontos' }),
    ).not.toBeInTheDocument()
  })

  it('goes back to a valid page when points are removed', () => {
    const points = makePoints(8)
    const { rerender } = render(
      <PointsList points={points} onAdd={vi.fn()} onMove={vi.fn()} onRemove={vi.fn()} />,
    )

    rerender(
      <PointsList
        points={points.slice(0, 3)}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
