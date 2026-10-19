import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProgressBar from '@/components/ProgressBar/ProgressBar'

describe('ProgressBar', () => {
  it('exposes the progress to assistive technology', () => {
    render(<ProgressBar label="Andamento" value={42.4} />)

    expect(screen.getByRole('progressbar', { name: 'Andamento' })).toHaveAttribute(
      'aria-valuenow',
      '42',
    )
  })

  it('keeps the value between 0 and 100', () => {
    const { rerender } = render(<ProgressBar label="Andamento" value={180} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')

    rerender(<ProgressBar label="Andamento" value={-5} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})
