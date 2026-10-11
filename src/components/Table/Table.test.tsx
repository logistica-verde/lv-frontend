import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Table, { SortableTh, Td, Th } from '@/components/Table/Table'

function renderTable(maxHeight?: string) {
  return render(
    <Table caption="Veículos cadastrados" maxHeight={maxHeight}>
      <thead>
        <tr>
          <Th>Placa</Th>
          <Th numeric>Massa (kg)</Th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <Th scope="row">ABC1D23</Th>
          <Td numeric>7.500</Td>
        </tr>
      </tbody>
    </Table>,
  )
}

describe('Table', () => {
  it('is named by its caption, which stays out of sight', () => {
    renderTable()

    expect(screen.getByRole('table', { name: 'Veículos cadastrados' })).toBeInTheDocument()
  })

  it('marks header cells as column headers by default and row headers on request', () => {
    renderTable()

    expect(screen.getByRole('columnheader', { name: 'Placa' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('rowheader', { name: 'ABC1D23' })).toHaveAttribute('scope', 'row')
  })

  it('aligns numeric cells apart from text cells', () => {
    renderTable()

    expect(screen.getByRole('columnheader', { name: 'Massa (kg)' })).toHaveClass('numeric')
    expect(screen.getByRole('cell', { name: '7.500' })).toHaveClass('numeric')
    expect(screen.getByRole('columnheader', { name: 'Placa' })).not.toHaveClass('numeric')
  })

  it('limits the height so the header can stay fixed while the body scrolls', () => {
    const { container } = renderTable('24rem')

    expect(container.firstElementChild).toHaveStyle({ maxHeight: '24rem' })
  })

  it('does not limit the height by default', () => {
    const { container } = renderTable()

    expect(container.firstElementChild).not.toHaveAttribute('style')
  })
})

describe('SortableTh', () => {
  function renderSortable(direction: 'asc' | 'desc' | null, onSort = vi.fn()) {
    render(
      <Table caption="Operações">
        <thead>
          <tr>
            <SortableTh direction={direction} onSort={onSort} numeric>
              Emissão
            </SortableTh>
          </tr>
        </thead>
      </Table>,
    )
    return onSort
  }

  it.each([
    ['asc', 'ascending'],
    ['desc', 'descending'],
    [null, 'none'],
  ] as const)('announces the %s sorting as %s', (direction, expected) => {
    renderSortable(direction)

    expect(screen.getByRole('columnheader', { name: 'Emissão' })).toHaveAttribute(
      'aria-sort',
      expected,
    )
  })

  it('is operated with a button named after the column', async () => {
    const onSort = renderSortable(null)

    await userEvent.click(screen.getByRole('button', { name: 'Emissão' }))

    expect(onSort).toHaveBeenCalledTimes(1)
  })

  it('keeps the numeric alignment', () => {
    renderSortable('asc')

    expect(screen.getByRole('columnheader', { name: 'Emissão' })).toHaveClass('numeric')
  })
})
