import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TextField from '@/components/TextField/TextField'

describe('TextField', () => {
  it('associates the visible label with the input', () => {
    render(<TextField label="Placa" />)

    expect(screen.getByLabelText('Placa')).toBeInstanceOf(HTMLInputElement)
  })

  it('forwards typing to the change handler', async () => {
    const onChange = vi.fn()
    render(<TextField label="Placa" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Placa'), 'ABC')

    expect(onChange).toHaveBeenCalledTimes(3)
    expect(screen.getByLabelText('Placa')).toHaveValue('ABC')
  })

  it('describes the input with its hint', () => {
    render(<TextField label="Massa" hint="Em quilogramas" />)

    expect(screen.getByLabelText('Massa')).toHaveAccessibleDescription('Em quilogramas')
  })

  it('flags the input as invalid and announces the error', () => {
    render(<TextField label="Placa" error="Informe a placa" />)

    const input = screen.getByLabelText('Placa')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Informe a placa')
    expect(screen.getByRole('alert')).toHaveTextContent('Informe a placa')
  })

  it('is valid when there is no error', () => {
    render(<TextField label="Placa" />)

    expect(screen.getByLabelText('Placa')).toBeValid()
  })
})
