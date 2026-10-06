import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VehicleTable from '@/pages/VehiclesPage/VehicleTable'
import { vehicleFixture } from '@/test/fixtures'

describe('VehicleTable', () => {
  it('is a table named after the vehicles it lists', () => {
    render(<VehicleTable vehicles={[vehicleFixture]} />)

    expect(screen.getByRole('table', { name: 'Veículos cadastrados' })).toBeInTheDocument()
  })

  it('has labelled columns', () => {
    render(<VehicleTable vehicles={[vehicleFixture]} />)

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Placa',
      'Massa (kg)',
      'Combustível',
    ])
  })

  it('shows one row per vehicle with the mass in the Brazilian format', () => {
    render(
      <VehicleTable
        vehicles={[vehicleFixture, { ...vehicleFixture, id: 2, placa: 'XYZ9K88', massaKg: 12000 }]}
      />,
    )

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('ABC1D23')
    expect(within(rows[0]!).getByRole('cell', { name: '7.500' })).toBeInTheDocument()
    expect(within(rows[1]!).getByRole('cell', { name: '12.000' })).toBeInTheDocument()
  })
})
