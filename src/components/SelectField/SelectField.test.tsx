import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SelectField from '@/components/SelectField/SelectField'

function renderField(props: Partial<React.ComponentProps<typeof SelectField>> = {}) {
  return render(
    <SelectField label="Veículo" {...props}>
      <option value="1">ABC1D23</option>
      <option value="2">XYZ9K88</option>
    </SelectField>,
  )
}

describe('SelectField', () => {
  it('associates the visible label with the select', () => {
    renderField()

    expect(screen.getByRole('combobox', { name: 'Veículo' })).toBeInstanceOf(HTMLSelectElement)
  })

  it('lists the options it receives', () => {
    renderField()

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'ABC1D23',
      'XYZ9K88',
    ])
  })

  it('reports the chosen option', async () => {
    const onChange = vi.fn()
    renderField({ onChange })

    await userEvent.selectOptions(screen.getByRole('combobox'), '2')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('combobox')).toHaveValue('2')
  })

  it('describes the select with its hint', () => {
    renderField({ hint: 'Escolha o veículo da rota' })

    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Escolha o veículo da rota')
  })

  it('flags the select as invalid and announces the error', () => {
    renderField({ error: 'Escolha um veículo' })

    expect(screen.getByRole('combobox')).toBeInvalid()
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha um veículo')
  })

  it('can be disabled', () => {
    renderField({ disabled: true })

    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
