import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Pagination from '@/components/Pagination/Pagination'

describe('Pagination', () => {
  it('shows nothing when everything fits on one page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('tells where the user is', () => {
    render(<Pagination page={2} pageCount={4} onPageChange={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 4')).toBeVisible()
  })

  it('goes to the next and previous pages', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageCount={4} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('does not go before the first page', () => {
    render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled()
  })

  it('does not go past the last page', () => {
    render(<Pagination page={3} pageCount={3} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('accepts a custom accessible name', () => {
    render(<Pagination page={1} pageCount={2} onPageChange={vi.fn()} label="Trechos" />)

    expect(screen.getByRole('navigation', { name: 'Trechos' })).toBeInTheDocument()
  })
})
