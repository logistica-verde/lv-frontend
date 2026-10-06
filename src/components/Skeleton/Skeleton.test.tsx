import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Skeleton from '@/components/Skeleton/Skeleton'

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies the requested size', () => {
    const { container } = render(<Skeleton width="8rem" height="2rem" />)

    expect(container.firstElementChild).toHaveStyle({ width: '8rem', height: '2rem' })
  })
})
