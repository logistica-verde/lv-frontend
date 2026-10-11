import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { useActiveVehicle } from '@/hooks/useVehicles'
import VehicleCard from '@/pages/PlanningPage/VehicleCard'
import type { Vehicle } from '@/services/schemas/vehicle'
import { apiUrl } from '@/test/api'
import { useVehiclesApi } from '@/test/fakeApi'
import { vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const secondVehicle: Vehicle = {
  ...vehicleFixture,
  id: 2,
  placa: 'XYZ9K88',
  massaKg: 12000,
  tipoCombustivel: 'gnv',
}

function Harness({ onSelected }: { onSelected?: (vehicle: Vehicle | undefined) => void }) {
  const { vehicles, active, selected, choose } = useActiveVehicle()
  onSelected?.(selected)
  return <VehicleCard query={vehicles} active={active} selected={selected} onChange={choose} />
}

function renderCard(onSelected?: (vehicle: Vehicle | undefined) => void) {
  return renderWithProviders(
    <MemoryRouter>
      <Harness onSelected={onSelected} />
    </MemoryRouter>,
  )
}

describe('VehicleCard', () => {
  it('shows a loading state while the vehicles load', async () => {
    server.use(
      http.get(apiUrl('/api/vehicles'), async () => {
        await delay(30)
        return HttpResponse.json([vehicleFixture])
      }),
    )

    renderCard()

    expect(screen.getByText('Carregando veículos')).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: 'Placa' })).toBeVisible()
  })

  it('preselects the first active vehicle and shows its mass and fuel', async () => {
    useVehiclesApi([vehicleFixture, secondVehicle])

    renderCard()

    expect(await screen.findByRole('combobox', { name: 'Placa' })).toHaveValue('1')
    expect(screen.getByText('Massa').nextElementSibling).toHaveTextContent('7.500 kg')
    expect(screen.getByText('Combustível').nextElementSibling).toHaveTextContent('diesel')
  })

  it('shows the data of the vehicle the user picks and reports the choice', async () => {
    useVehiclesApi([vehicleFixture, secondVehicle])
    const onSelected = vi.fn()
    renderCard(onSelected)

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Placa' }), '2')

    expect(screen.getByText('Massa').nextElementSibling).toHaveTextContent('12.000 kg')
    expect(screen.getByText('Combustível').nextElementSibling).toHaveTextContent('gnv')
    expect(onSelected).toHaveBeenLastCalledWith(expect.objectContaining({ id: 2 }))
  })

  it('does not offer inactive vehicles', async () => {
    useVehiclesApi([{ ...vehicleFixture, ativo: false }, secondVehicle])

    renderCard()

    const select = await screen.findByRole('combobox', { name: 'Placa' })
    expect(select).toHaveValue('2')
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('sends the user to register a vehicle when there is none', async () => {
    useVehiclesApi([])

    renderCard()

    expect(await screen.findByText(/Nenhum veículo ativo/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Cadastrar veículo' })).toHaveAttribute(
      'href',
      '/veiculos',
    )
  })

  it('explains a failure and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([vehicleFixture])
      }),
    )
    renderCard()

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('combobox', { name: 'Placa' })).toBeVisible()
  })
})
