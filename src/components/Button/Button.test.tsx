import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Button from '@/components/Button/Button'

describe('Button', () => {
  it('does not submit forms unless asked to', () => {
    render(<Button>Salvar</Button>)

    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('ignores clicks while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Calcular
      </Button>,
    )
    const button = screen.getByRole('button', { name: /Calcular/ })

    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Aguarde' })).toBeInTheDocument()
  })

  it('applies the requested variant and size', () => {
    render(
      <Button variant="danger" size="sm">
        Excluir
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveClass('danger', 'sm')
  })
})
