import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Mascot from '@/components/Mascot/Mascot'

describe('Mascot', () => {
  it('is decorative and keeps the proportion of its drawing', () => {
    const { container } = render(<Mascot size={120} />)

    const drawing = container.querySelector('svg')
    expect(drawing).toHaveAttribute('aria-hidden', 'true')
    expect(drawing).toHaveAttribute('width', '120')
    expect(Number(drawing?.getAttribute('height'))).toBeCloseTo(115, 0)
  })

  it('draws the shell with one highlighted block among the hexagons', () => {
    const { container } = render(<Mascot />)

    expect(container.querySelectorAll('polygon')).toHaveLength(7)
    expect(container.querySelectorAll('polygon[class*="core"]')).toHaveLength(1)
  })

  it('has a dark tone for dark backgrounds', () => {
    const { container } = render(<Mascot tone="dark" />)

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('dark')
  })
})
