import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import VehicleImagePicker from '@/components/VehicleImagePicker/VehicleImagePicker'
import { VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'

function Harness() {
  const [chosen, setChosen] = useState('truck')

  return (
    <>
      <VehicleImagePicker
        legend="Imagem do veículo"
        name="imagem"
        onChange={(event) => setChosen(event.target.value)}
      />
      <p>Escolhida: {chosen}</p>
    </>
  )
}

describe('VehicleImagePicker', () => {
  it('groups one radio per vehicle type under the legend', () => {
    render(<Harness />)

    const group = screen.getByRole('group', { name: 'Imagem do veículo' })
    expect(group).toBeVisible()
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'van',
      'pickup',
      'vuc',
      'truck',
      'semi',
      'motorcycle',
    ])
  })

  it('names every option with its label', () => {
    render(<Harness />)

    Object.values(VEHICLE_IMAGE_LABELS).forEach((label) => {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument()
    })
  })

  it('reports the chosen image', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('radio', { name: 'Carreta' }))

    expect(screen.getByText('Escolhida: semi')).toBeVisible()
    expect(screen.getByRole('radio', { name: 'Carreta' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Moto' })).not.toBeChecked()
  })

  it('can be operated with the arrow keys', async () => {
    render(<Harness />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('radio', { name: 'Van' }))
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Picape' })).toBeChecked()
  })
})
