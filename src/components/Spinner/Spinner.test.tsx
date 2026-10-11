import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Spinner from '@/components/Spinner/Spinner'

describe('Spinner', () => {
  it('announces itself as a status with the default label', () => {
    render(<Spinner />)

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })

  it('uses a custom label', () => {
    render(<Spinner label="Calculando rota" />)

    expect(screen.getByRole('status', { name: 'Calculando rota' })).toBeInTheDocument()
  })
})
