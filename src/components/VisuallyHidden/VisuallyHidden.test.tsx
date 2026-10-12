import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'

describe('VisuallyHidden', () => {
  it('keeps the text available to assistive technology', () => {
    render(<VisuallyHidden>Carregando veículos</VisuallyHidden>)

    expect(screen.getByText('Carregando veículos')).toBeInTheDocument()
  })

  it('applies the hiding class', () => {
    render(<VisuallyHidden>texto</VisuallyHidden>)

    expect(screen.getByText('texto')).toHaveClass('hidden')
  })
})
