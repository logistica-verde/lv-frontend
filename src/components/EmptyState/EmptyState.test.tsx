import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EmptyState from '@/components/EmptyState/EmptyState'

describe('EmptyState', () => {
  it('shows the title', () => {
    render(<EmptyState title="Nenhum veículo cadastrado" />)

    expect(screen.getByRole('heading', { name: 'Nenhum veículo cadastrado' })).toBeInTheDocument()
  })

  it('shows the description and the action when provided', () => {
    render(
      <EmptyState
        title="Nenhum veículo cadastrado"
        description="Cadastre o primeiro para calcular rotas."
        action={<button type="button">Cadastrar veículo</button>}
      />,
    )

    expect(screen.getByText('Cadastre o primeiro para calcular rotas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar veículo' })).toBeInTheDocument()
  })
})
