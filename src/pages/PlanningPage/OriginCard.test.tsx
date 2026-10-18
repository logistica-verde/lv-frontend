import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import OriginCard from '@/pages/PlanningPage/OriginCard'
import type { CurrentLocation } from '@/hooks/useCurrentLocation'

function renderCard(location: CurrentLocation) {
  const onLocate = vi.fn()
  const onClear = vi.fn()
  render(<OriginCard location={location} onLocate={onLocate} onClear={onClear} />)
  return { onLocate, onClear }
}

describe('OriginCard', () => {
  it('explains that the route leaves from the first point and offers the location', async () => {
    const { onLocate } = renderCard({ status: 'idle' })

    expect(screen.getByText(/sai do primeiro ponto da lista/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }))

    expect(onLocate).toHaveBeenCalledOnce()
  })

  it('shows that it is looking for the position', () => {
    renderCard({ status: 'locating' })

    expect(screen.getByText('Obtendo a sua localização…')).toBeVisible()
    expect(screen.getByRole('button', { name: /Usar minha localização/ })).toBeDisabled()
  })

  it('shows the position, its accuracy and a way to remove it', async () => {
    const { onClear } = renderCard({
      status: 'ready',
      fix: { latitude: -23.5505, longitude: -46.6333, accuracyMeters: 24.6 },
    })

    expect(screen.getByText('Minha localização')).toBeVisible()
    expect(screen.getByText(/-23,55, -46,63 · precisão de cerca de 25 m/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('tells the user what went wrong and keeps the option to try again', () => {
    renderCard({ status: 'failed', reason: 'denied' })

    expect(screen.getByRole('alert')).toHaveTextContent('permissão de localização foi negada')
    expect(screen.getByRole('button', { name: 'Usar minha localização' })).toBeEnabled()
  })
})
