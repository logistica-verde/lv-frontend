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
  const props = {
    onAdd: vi.fn(),
    onSearchAddress: vi.fn(),
    onMove: vi.fn(),
    onRemove: vi.fn(),
    ...handlers,
  }
  render(<PointsList points={points} {...props} />)
  return props
}

describe('PointsList', () => {
  it('counts the points against the limit and explains the rules', () => {
    renderList(makePoints(3))

    expect(screen.getByRole('heading', { name: 'Pontos de entrega' })).toBeVisible()
    expect(screen.getByText('3 de 30')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('3 pontos selecionados.')
  })

  it('searches an address typed in the list without opening the dialog first', async () => {
    const { onSearchAddress } = renderList([])
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Adicionar endereço'), '  R. Vergueiro, 1200 ')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(onSearchAddress).toHaveBeenCalledWith('R. Vergueiro, 1200')
    expect(screen.getByLabelText('Adicionar endereço')).toHaveValue('')
  })

  it('asks for at least three characters before searching', async () => {
    const { onSearchAddress } = renderList([])
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Adicionar endereço'), 'ab')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Digite ao menos 3 caracteres do endereço.')
    expect(onSearchAddress).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Adicionar endereço'), 'c')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('numbers the points in the order they will be sent', () => {
    renderList(makePoints(3))

    const items = within(screen.getByRole('list', { name: 'Pontos da rota' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1Ponto 1Rua 1',
      '2Ponto 2Rua 2',
      '3Ponto 3Rua 3',
    ])
  })

  it('shows the address of a point under its name', () => {
    renderList(makePoints(1))

    expect(screen.getByText('Rua 1')).toBeVisible()
    expect(screen.getByText('Ponto 1').closest('[title]')).toHaveAttribute('title', 'Rua 1')
  })

  it('offers quick ways to add the first points when the list is empty', async () => {
    const { onAdd } = renderList([])

    await userEvent.click(screen.getByRole('button', { name: 'Buscar endereço' }))
    await userEvent.click(screen.getByRole('button', { name: 'Importar CSV' }))

    expect(onAdd).toHaveBeenNthCalledWith(1, 'address')
    expect(onAdd).toHaveBeenNthCalledWith(2, 'csv')
  })

  it('invites the user to add the first point when the list is empty', async () => {
    const { onAdd } = renderList([])

    expect(screen.getByRole('heading', { name: 'Nenhum ponto na rota' })).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('existing')
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
      <PointsList
        points={points}
        onAdd={vi.fn()}
        onSearchAddress={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    rerender(
      <PointsList
        points={points.slice(0, 3)}
        onAdd={vi.fn()}
        onSearchAddress={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
