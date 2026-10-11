import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Card from '@/components/Card/Card'

describe('Card', () => {
  it('renders its content', () => {
    render(<Card>Conteúdo</Card>)

    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders the title as a heading and the actions beside it', () => {
    render(
      <Card title="Veículos" actions={<button type="button">Novo</button>}>
        Conteúdo
      </Card>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Veículos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument()
  })

  it('omits the header when there is no title or action', () => {
    render(<Card>Conteúdo</Card>)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
