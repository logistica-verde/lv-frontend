import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import IconButton from '@/components/IconButton/IconButton'

describe('IconButton', () => {
  it('is named by its label even though it shows only an icon', () => {
    render(
      <IconButton label="Remover ponto">
        <svg aria-hidden="true" />
      </IconButton>,
    )

    expect(screen.getByRole('button', { name: 'Remover ponto' })).toBeInTheDocument()
  })

  it('shows the label as a tooltip', () => {
    render(<IconButton label="Mover para cima">↑</IconButton>)

    expect(screen.getByRole('button', { name: 'Mover para cima' })).toHaveAttribute(
      'title',
      'Mover para cima',
    )
  })

  it('does not submit forms by default', () => {
    render(<IconButton label="Fechar">x</IconButton>)

    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveAttribute('type', 'button')
  })

  it('reports clicks', async () => {
    const onClick = vi.fn()
    render(
      <IconButton label="Fechar" onClick={onClick}>
        x
      </IconButton>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', async () => {
    const onClick = vi.fn()
    render(
      <IconButton label="Fechar" disabled onClick={onClick}>
        x
      </IconButton>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
