import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'

type Criterion = 'emission' | 'distance'

const options: { value: Criterion; label: string }[] = [
  { value: 'emission', label: 'Menor emissão' },
  { value: 'distance', label: 'Menor distância' },
]

function renderControl(value: Criterion = 'emission', onChange = vi.fn()) {
  render(
    <SegmentedControl legend="Rota exibida" options={options} value={value} onChange={onChange} />,
  )
  return onChange
}

describe('SegmentedControl', () => {
  it('is a labelled group of radio buttons', () => {
    renderControl()

    expect(screen.getByRole('group', { name: 'Rota exibida' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('checks the current value only', () => {
    renderControl('distance')

    expect(screen.getByRole('radio', { name: 'Menor distância' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Menor emissão' })).not.toBeChecked()
  })

  it('reports the chosen value', async () => {
    const onChange = renderControl('emission')

    await userEvent.click(screen.getByRole('radio', { name: 'Menor distância' }))

    expect(onChange).toHaveBeenCalledWith('distance')
  })

  it('can be operated with the arrow keys', async () => {
    const user = userEvent.setup()
    const onChange = renderControl('emission')

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith('distance')
  })
})
