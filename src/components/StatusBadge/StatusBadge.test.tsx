import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from '@/components/StatusBadge/StatusBadge'

describe('StatusBadge', () => {
  it('renders its label', () => {
    render(<StatusBadge tone="neutral">Pendente</StatusBadge>)

    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it.each(['neutral', 'success', 'warning', 'danger', 'info'] as const)(
    'applies the %s tone',
    (tone) => {
      render(<StatusBadge tone={tone}>Estado</StatusBadge>)

      expect(screen.getByText('Estado')).toHaveClass(tone)
    },
  )
})
